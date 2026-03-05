/**
 * Torke brand logo components matching packaging identity.
 *
 * TorkeMonogram — Angular T icon with cut corner (clipPath)
 * TorkeWordmark — "TORKE" with registered trademark
 * TorkeLogo — Combined monogram + wordmark
 * TorkeLogoStacked — Stacked version for auth pages
 */

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark" | "red";
}

const sizeMap = {
  sm: { icon: "w-7 h-7", text: "text-sm", tracking: "tracking-[0.2em]" },
  md: { icon: "w-9 h-9", text: "text-lg", tracking: "tracking-[0.15em]" },
  lg: { icon: "w-12 h-12", text: "text-2xl", tracking: "tracking-[0.18em]" },
};

const variantMap = {
  light: { bg: "bg-white", text: "text-white", letter: "text-[#0A0A0A]" },
  dark: { bg: "bg-[#0A0A0A]", text: "text-[#0A0A0A]", letter: "text-white" },
  red: { bg: "bg-[#C41E3A]", text: "text-white", letter: "text-white" },
};

export function TorkeMonogram({ size = "md", variant = "light" }: LogoProps) {
  const s = sizeMap[size];
  const v = variantMap[variant];

  return (
    <div
      className={`${s.icon} ${v.bg} flex items-center justify-center font-black leading-none`}
      style={{
        clipPath: "polygon(0 0, 100% 0, 100% 75%, 75% 100%, 0 100%)",
      }}
    >
      <span className={`${v.letter} ${size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl"}`}>
        T
      </span>
    </div>
  );
}

export function TorkeWordmark({
  size = "md",
  variant = "light",
  className = "",
}: LogoProps) {
  const s = sizeMap[size];
  const v = variantMap[variant];

  return (
    <span
      className={`${v.text} font-bold ${s.text} ${s.tracking} ${className}`}
    >
      TORKE
      <sup className="text-[0.5em] ml-0.5 align-super opacity-60">&reg;</sup>
    </span>
  );
}

export function TorkeLogo({
  size = "md",
  variant = "light",
  className = "",
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <TorkeMonogram size={size} variant={variant} />
      <TorkeWordmark size={size} variant={variant} className="hidden sm:block" />
    </div>
  );
}

export function TorkeLogoStacked({
  size = "lg",
  variant = "light",
  className = "",
}: LogoProps) {
  const v = variantMap[variant];

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <TorkeMonogram size={size} variant={variant} />
      <div className="text-center">
        <TorkeWordmark size={size} variant={variant} />
        <p className={`text-xs ${v.text} opacity-40 tracking-[0.3em] uppercase mt-1`}>
          Construction Fixings
        </p>
      </div>
    </div>
  );
}
