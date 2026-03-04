import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductSpecsProps {
  technicalSpecs: Record<string, unknown> | null;
  diameter?: string | null;
  material?: string | null;
  lengthMm?: number | null;
  finish?: string | null;
  etaReference?: string | null;
  loadClass?: string | null;
  datasheetUrl?: string | null;
}

export function ProductSpecs({
  technicalSpecs,
  diameter,
  material,
  lengthMm,
  finish,
  etaReference,
  loadClass,
  datasheetUrl,
}: ProductSpecsProps) {
  // Build specs list from structured fields + JSONB
  const specs: Array<{ label: string; value: string }> = [];

  if (diameter) specs.push({ label: "Diameter", value: diameter });
  if (material) specs.push({ label: "Material", value: material });
  if (lengthMm) specs.push({ label: "Length", value: `${lengthMm}mm` });
  if (finish) specs.push({ label: "Finish", value: finish });
  if (loadClass) specs.push({ label: "Load Class", value: loadClass });
  if (etaReference) specs.push({ label: "ETA Reference", value: etaReference });

  // Add JSONB specs
  if (technicalSpecs && typeof technicalSpecs === "object") {
    for (const [key, value] of Object.entries(technicalSpecs)) {
      if (value !== null && value !== undefined && value !== "") {
        specs.push({
          label: key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (s) => s.toUpperCase())
            .trim(),
          value: String(value),
        });
      }
    }
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">
          <span className="inline-block w-1 h-5 bg-[#C41E3A] mr-3 align-middle" />
          Technical Specifications
        </h2>
        {datasheetUrl && (
          <Button
            asChild
            className="bg-[#C41E3A] hover:bg-[#D6354F] text-white"
          >
            <a
              href={datasheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              <FileText className="h-4 w-4 mr-2" />
              Download Datasheet
            </a>
          </Button>
        )}
      </div>

      {/* Specs table */}
      {specs.length > 0 ? (
        <div className="bg-[#1A1A1A] border border-[#333] rounded-lg overflow-hidden">
          <table className="w-full">
            <tbody>
              {specs.map((spec, index) => (
                <tr
                  key={spec.label}
                  className={index % 2 === 0 ? "bg-[#1A1A1A]" : "bg-[#161616]"}
                >
                  <td className="px-5 py-3 text-sm text-[#999] font-medium w-1/3 border-r border-[#2A2A2A]">
                    {spec.label}
                  </td>
                  <td className="px-5 py-3 text-sm text-white font-mono">
                    {spec.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-8 text-center">
          <p className="text-sm text-[#666]">
            No technical specifications available. Download the datasheet for
            full details.
          </p>
        </div>
      )}

      {/* ETA Reference callout */}
      {etaReference && (
        <div className="mt-4 bg-[#C41E3A]/5 border border-[#C41E3A]/20 rounded-lg px-5 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#C41E3A]/10 rounded flex items-center justify-center shrink-0">
            <span className="text-[#C41E3A] text-xs font-bold">ETA</span>
          </div>
          <div>
            <p className="text-xs text-[#999]">European Technical Assessment</p>
            <p className="text-sm text-white font-mono">{etaReference}</p>
          </div>
        </div>
      )}

      {/* Datasheet download - alternate placement for mobile */}
      {datasheetUrl && (
        <div className="mt-4 sm:hidden">
          <Button
            asChild
            className="w-full bg-[#C41E3A] hover:bg-[#D6354F] text-white"
          >
            <a
              href={datasheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              <Download className="h-4 w-4 mr-2" />
              Download Datasheet PDF
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
