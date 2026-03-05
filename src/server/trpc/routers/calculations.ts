/**
 * Calculations tRPC Router
 *
 * Handles save, load, list, export (PDF), and delete for anchor design calculations.
 * All procedures require authentication (DESIGN-18).
 * Server re-runs calculateAnchorDesign before save/export (DESIGN-06).
 */

import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { calculations } from "@/server/db/schema/calculations";
import { calculateAnchorDesign } from "@/lib/calc-engine";
import { designInputsSchema } from "@/lib/calc-engine/validation";
import { generateCalcReport } from "@/server/services/calc-report-service";
import { uploadFile } from "@/server/storage";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import type { DesignInputs } from "@/lib/calc-engine/types";

// --------------------------------------------------------------------------
// R2 client for presigned download URLs
// --------------------------------------------------------------------------

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || "",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET = process.env.R2_BUCKET || "torke-assets";

async function getPresignedDownloadUrl(key: string, expiresInSec = 86400): Promise<string> {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (publicUrl) {
    return `${publicUrl}/${key}`;
  }
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(r2Client, command, { expiresIn: expiresInSec });
}

// --------------------------------------------------------------------------
// Calc reference generation (CALC-YYYY-NNNNNN)
// --------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateCalcReference(db: any): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CALC-${year}-`;

  const result = await db
    .select({ maxRef: sql<string>`MAX(${calculations.calcReference})` })
    .from(calculations)
    .where(sql`${calculations.calcReference} LIKE ${prefix + "%"}`);

  let seq = 1;
  const maxRef = result[0]?.maxRef;
  if (maxRef) {
    const parts = maxRef.split("-");
    const lastSeq = parseInt(parts[parts.length - 1]!, 10);
    if (!isNaN(lastSeq)) {
      seq = lastSeq + 1;
    }
  }

  return `${prefix}${String(seq).padStart(6, "0")}`;
}

// --------------------------------------------------------------------------
// Router
// --------------------------------------------------------------------------

export const calculationsRouter = router({
  /**
   * Save a calculation. Server re-runs the calc engine to validate integrity.
   */
  save: protectedProcedure
    .input(
      designInputsSchema.extend({
        projectName: z.string().max(255).optional(),
        engineerName: z.string().max(255).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Build full DesignInputs with defaults for optional fields
      const designInputs = {
        ...input,
        projectName: input.projectName ?? "",
        engineerName: input.engineerName ?? "",
      } as DesignInputs;

      // Re-run calculation server-side (DESIGN-06)
      const serverResults = calculateAnchorDesign(designInputs);

      // Generate unique reference
      const calcReference = await generateCalcReference(ctx.db);

      // Insert into DB
      const [saved] = await ctx.db
        .insert(calculations)
        .values({
          calcReference,
          userId,
          projectName: input.projectName ?? null,
          engineerName: input.engineerName ?? null,
          inputs: designInputs,
          results: serverResults,
        })
        .returning({ id: calculations.id, calcReference: calculations.calcReference });

      return { id: saved!.id, calcReference: saved!.calcReference };
    }),

  /**
   * Load a single calculation by reference or ID.
   */
  load: protectedProcedure
    .input(
      z.object({
        calcReference: z.string().optional(),
        id: z.string().uuid().optional(),
      }).refine(
        (d) => d.calcReference || d.id,
        "Either calcReference or id is required"
      )
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const conditions = [eq(calculations.userId, userId)];
      if (input.id) {
        conditions.push(eq(calculations.id, input.id));
      } else if (input.calcReference) {
        conditions.push(eq(calculations.calcReference, input.calcReference));
      }

      const [calc] = await ctx.db
        .select()
        .from(calculations)
        .where(and(...conditions));

      if (!calc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Calculation not found" });
      }

      return calc;
    }),

  /**
   * List current user's saved calculations.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const rows = await ctx.db
      .select({
        id: calculations.id,
        calcReference: calculations.calcReference,
        projectName: calculations.projectName,
        engineerName: calculations.engineerName,
        results: calculations.results,
        createdAt: calculations.createdAt,
      })
      .from(calculations)
      .where(eq(calculations.userId, userId))
      .orderBy(desc(calculations.createdAt))
      .limit(50);

    return rows.map((r) => ({
      id: r.id,
      calcReference: r.calcReference,
      projectName: r.projectName,
      engineerName: r.engineerName,
      overallPass: (r.results as Record<string, unknown>)?.overallPass ?? false,
      createdAt: r.createdAt,
    }));
  }),

  /**
   * Export a calculation as a branded PDF report.
   * Re-runs calculation server-side, generates PDF, uploads to R2.
   */
  exportPdf: protectedProcedure
    .input(
      designInputsSchema.extend({
        projectName: z.string().max(255).optional(),
        engineerName: z.string().max(255).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Build full DesignInputs with defaults for optional fields
      const designInputs = {
        ...input,
        projectName: input.projectName ?? "",
        engineerName: input.engineerName ?? "",
      } as DesignInputs;

      // Re-run calculation server-side (DESIGN-06)
      const serverResults = calculateAnchorDesign(designInputs);

      // Generate calc reference
      const calcReference = await generateCalcReference(ctx.db);

      // Generate PDF report
      const pdfBytes = await generateCalcReport(
        designInputs,
        serverResults,
        { name: input.engineerName || ctx.session.user.name || "Engineer", email: ctx.session.user.email || "" },
        calcReference
      );

      // Upload to R2
      const pdfKey = `calc-reports/${calcReference}.pdf`;
      await uploadFile(Buffer.from(pdfBytes), pdfKey, "application/pdf");

      // Save calculation to DB
      await ctx.db
        .insert(calculations)
        .values({
          calcReference,
          userId,
          projectName: input.projectName ?? null,
          engineerName: input.engineerName ?? null,
          inputs: designInputs,
          results: serverResults,
        });

      // Generate presigned download URL (24h expiry)
      const downloadUrl = await getPresignedDownloadUrl(pdfKey, 86400);

      return { downloadUrl, calcReference };
    }),

  /**
   * Delete a calculation (must belong to current user).
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const deleted = await ctx.db
        .delete(calculations)
        .where(and(eq(calculations.id, input.id), eq(calculations.userId, userId)))
        .returning({ id: calculations.id });

      if (deleted.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Calculation not found or not owned by user" });
      }

      return { success: true };
    }),
});
