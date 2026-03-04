/** User roles in the Torke platform */
export type UserRole =
  | "customer"
  | "warehouse_staff"
  | "admin"
  | "account_manager";

/** Batch status values */
export type BatchStatus = "pending" | "available" | "quarantined" | "depleted";

/** Category types */
export type CategoryType =
  | "chemical-anchors"
  | "mechanical-anchors"
  | "general-fixings";

/** Product technical specs (JSONB shape) */
export interface TechnicalSpecs {
  [key: string]: string | number | boolean | undefined;
}

/** Supplier contact info (JSONB shape) */
export interface SupplierContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
}

/** Chemical composition data from mill cert */
export interface ChemicalComposition {
  [element: string]: number | undefined;
}

/** Mechanical properties data from mill cert */
export interface MechanicalProperties {
  tensileStrength?: number;
  yieldStrength?: number;
  elongation?: number;
  hardness?: number;
  [key: string]: number | undefined;
}
