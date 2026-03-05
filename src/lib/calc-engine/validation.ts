/**
 * @torke/calc-engine - Input Validation
 *
 * Zod schema for validating DesignInputs.
 * Rejects invalid concrete classes, negative loads, zero embedment, etc.
 */

import { z } from "zod";

const concreteClassSchema = z.enum([
  "C20/25",
  "C25/30",
  "C30/37",
  "C35/45",
  "C40/50",
  "C45/55",
  "C50/60",
]);

const steelGradeSchema = z.enum(["5.8", "8.8", "10.9", "A4-70", "A4-80"]);

const groupPatternSchema = z.enum(["single", "2x1", "2x2", "3x2", "custom"]);

const anchorDiameterSchema = z.enum(["8", "10", "12", "16", "20", "24", "30"]).transform(Number) as unknown as z.ZodType<8 | 10 | 12 | 16 | 20 | 24 | 30>;

const edgeDistancesSchema = z.object({
  c1: z.number().min(0, "Edge distance c1 must be non-negative"),
  c2: z.number().min(0, "Edge distance c2 must be non-negative"),
  c3: z.number().min(0, "Edge distance c3 must be non-negative"),
  c4: z.number().min(0, "Edge distance c4 must be non-negative"),
});

const anchorSpacingSchema = z.object({
  s1: z.number().min(0, "Spacing s1 must be non-negative"),
  s2: z.number().min(0, "Spacing s2 must be non-negative"),
});

export const designInputsSchema = z.object({
  // Project info (UI-only, not used in calculations)
  projectName: z.string().optional().default(""),
  engineerName: z.string().optional().default(""),
  projectRef: z.string().optional().default(""),
  date: z.string().optional().default(""),
  anchorType: z.enum(["chemical", "mechanical"]),
  anchorDiameter: z.number().refine(
    (v) => [8, 10, 12, 16, 20, 24, 30].includes(v),
    "Invalid anchor diameter. Must be one of: 8, 10, 12, 16, 20, 24, 30 mm"
  ),
  embedmentDepth: z
    .number()
    .min(40, "Embedment depth must be at least 40mm")
    .max(500, "Embedment depth must not exceed 500mm"),
  concreteClass: concreteClassSchema,
  crackedConcrete: z.boolean(),
  tensionLoad: z.number().min(0, "Tension load must be non-negative"),
  shearLoad: z.number().min(0, "Shear load must be non-negative"),
  edgeDistances: edgeDistancesSchema,
  spacing: anchorSpacingSchema,
  groupPattern: groupPatternSchema,
  steelGrade: steelGradeSchema,
  environment: z.enum(["dry", "humid", "marine"]),
  plateThickness: z.number().min(0, "Plate thickness must be non-negative"),
  plateWidth: z.number().min(0, "Plate width must be non-negative"),
  plateDepth: z.number().min(0, "Plate depth must be non-negative"),
  memberThickness: z.number().min(100, "Member thickness must be at least 100mm"),
});

export type ValidatedDesignInputs = z.infer<typeof designInputsSchema>;
