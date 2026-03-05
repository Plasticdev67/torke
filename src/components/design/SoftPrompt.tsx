"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import Link from "next/link";

const CALC_COUNT_KEY = "torke_calc_count";
const DISMISS_KEY = "torke_soft_prompt_dismissed";
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const THRESHOLD = 3;

/**
 * Non-blocking soft prompt that appears after anonymous users perform 3+ calculations.
 * Dismissible with 24-hour cooldown stored in localStorage.
 */
export function SoftPrompt() {
  const [visible, setVisible] = useState(false);
  const [calcCount, setCalcCount] = useState(0);

  useEffect(() => {
    const count = parseInt(localStorage.getItem(CALC_COUNT_KEY) || "0", 10);
    setCalcCount(count);

    // Check dismiss cooldown
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < DISMISS_DURATION_MS) {
        return; // Still within cooldown
      }
      localStorage.removeItem(DISMISS_KEY);
    }

    if (count >= THRESHOLD) {
      setVisible(true);
    }
  }, []);

  // Listen for calc count updates from the design page
  useEffect(() => {
    const handler = () => {
      const count = parseInt(localStorage.getItem(CALC_COUNT_KEY) || "0", 10);
      setCalcCount(count);

      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const elapsed = Date.now() - parseInt(dismissedAt, 10);
        if (elapsed < DISMISS_DURATION_MS) return;
      }

      if (count >= THRESHOLD) {
        setVisible(true);
      }
    };

    window.addEventListener("torke-calc-increment", handler);
    return () => window.removeEventListener("torke-calc-increment", handler);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-lg animate-in slide-in-from-bottom-4 duration-300 lg:left-auto lg:right-6 lg:mx-0 lg:max-w-sm">
      <div className="rounded-lg border border-[#333] bg-[#1A1A1A] p-4 shadow-2xl shadow-black/50">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              You&apos;ve run {calcCount} calculation{calcCount !== 1 ? "s" : ""}
            </p>
            <p className="mt-1 text-xs text-[#888]">
              Create a free account to save your work and export PDF reports.
            </p>
            <Link
              href="/register"
              className="mt-3 inline-block rounded-md bg-[#C41E3A] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#A81830]"
            >
              Create Free Account
            </Link>
          </div>
          <button
            onClick={dismiss}
            className="shrink-0 rounded p-1 text-[#666] transition-colors hover:bg-[#333] hover:text-white"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Increment the anonymous calculation counter in localStorage.
 * Call this from the design page after each calculation completes.
 */
export function incrementCalcCount() {
  const current = parseInt(localStorage.getItem(CALC_COUNT_KEY) || "0", 10);
  const next = current + 1;
  localStorage.setItem(CALC_COUNT_KEY, String(next));
  // Dispatch custom event so SoftPrompt can react
  window.dispatchEvent(new Event("torke-calc-increment"));
}
