import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Convert a DB asset path (data\assets\...) to a public URL (/assets/...) */
export function assetUrl(path: string): string {
  return "/" + path.replace(/\\/g, "/").replace(/^data\//, "");
}
