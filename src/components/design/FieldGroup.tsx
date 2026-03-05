"use client";

import { cn } from "@/lib/utils";

interface FieldGroupProps {
  label: string;
  unit?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FieldGroup({
  label,
  unit,
  error,
  children,
  className,
}: FieldGroupProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label className="text-xs font-medium text-[#999]">
        {label}
        {unit && <span className="ml-1 text-[#666]">({unit})</span>}
      </label>
      {children}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
