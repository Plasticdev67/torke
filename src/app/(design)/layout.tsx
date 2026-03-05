import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: {
    template: "%s | Torke TRACE",
    default: "Torke TRACE | EN 1992-4 Anchor Calculator",
  },
  description:
    "Free browser-based EN 1992-4 anchor calculation tool. Calculate failure modes, view 3D models, and export engineering reports.",
};

export default function DesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col bg-[#0A0A0A]">
      <Header />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
