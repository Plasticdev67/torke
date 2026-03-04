import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  Truck,
  FileText,
  Calendar,
  User,
  Hash,
  ClipboardList,
} from "lucide-react";

interface BatchDetailProps {
  torkeBatchId: string;
  status: string;
  productName: string;
  productSku: string;
  supplierName: string;
  supplierBatchNumber: string;
  quantity: number;
  quantityAvailable: number;
  quantityReserved: number;
  goodsInDate: string;
  receivedBy?: string;
  certUrl?: string | null;
  expiryDate?: string | null;
  inspectionNotes?: string | null;
  poReference?: string | null;
  heatNumber?: string | null;
  millName?: string | null;
}

const statusColors: Record<string, string> = {
  available: "bg-green-600/20 text-green-400 border-green-600/30",
  pending: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  quarantined: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
  depleted: "bg-zinc-600/20 text-zinc-400 border-zinc-600/30",
};

export function BatchDetail({
  torkeBatchId,
  status,
  productName,
  productSku,
  supplierName,
  supplierBatchNumber,
  quantity,
  quantityAvailable,
  quantityReserved,
  goodsInDate,
  receivedBy,
  certUrl,
  expiryDate,
  inspectionNotes,
  poReference,
  heatNumber,
  millName,
}: BatchDetailProps) {
  const formattedDate = new Date(goodsInDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold font-mono">{torkeBatchId}</h1>
        <Badge variant="outline" className={statusColors[status] || ""}>
          {status}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Product info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Package className="h-4 w-4" />
              Product
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{productName}</p>
            <p className="text-sm text-muted-foreground font-mono">{productSku}</p>
          </CardContent>
        </Card>

        {/* Supplier info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Truck className="h-4 w-4" />
              Supplier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{supplierName}</p>
            <p className="text-sm text-muted-foreground">
              Batch: <span className="font-mono">{supplierBatchNumber}</span>
            </p>
          </CardContent>
        </Card>

        {/* Quantities */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Hash className="h-4 w-4" />
              Quantity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Total</span>
              <span className="font-medium">{quantity}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Available</span>
              <span className="font-medium text-green-400">{quantityAvailable}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Reserved</span>
              <span className="font-medium text-yellow-400">{quantityReserved}</span>
            </div>
          </CardContent>
        </Card>

        {/* Dates & metadata */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Goods-in Date</span>
              <span className="font-medium">{formattedDate}</span>
            </div>
            {receivedBy && (
              <div className="flex justify-between text-sm">
                <span>Received By</span>
                <span className="font-medium">{receivedBy}</span>
              </div>
            )}
            {poReference && (
              <div className="flex justify-between text-sm">
                <span>PO Reference</span>
                <span className="font-mono font-medium">{poReference}</span>
              </div>
            )}
            {expiryDate && (
              <div className="flex justify-between text-sm">
                <span>Expiry Date</span>
                <span className="font-medium text-amber-400">{expiryDate}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Certificate */}
      {certUrl && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="h-4 w-4" />
              EN 10204 3.1 Certificate
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Badge variant="outline" className="bg-green-600/20 text-green-400 border-green-600/30">
              Uploaded
            </Badge>
            <a
              href={certUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Download Certificate
            </a>
            {heatNumber && (
              <span className="text-sm text-muted-foreground">
                Heat: <span className="font-mono">{heatNumber}</span>
                {millName && ` (${millName})`}
              </span>
            )}
          </CardContent>
        </Card>
      )}

      {/* Inspection notes */}
      {inspectionNotes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ClipboardList className="h-4 w-4" />
              Inspection Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{inspectionNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
