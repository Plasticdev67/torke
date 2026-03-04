"use client";

import { useState, useEffect, type ReactNode } from "react";

interface CartProviderProps {
  children: ReactNode;
}

/**
 * Wraps cart-dependent UI to avoid SSR hydration mismatches.
 * During SSR, renders children with a fallback (cart count = 0).
 * After mount, Zustand hydrates from localStorage and children re-render.
 */
export function CartProvider({ children }: CartProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // During SSR, render nothing -- prevents hydration mismatch
    // The parent should show a fallback cart count of 0
    return null;
  }

  return <>{children}</>;
}
