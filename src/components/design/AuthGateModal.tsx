"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { signUp, signIn } from "@/lib/auth-client";

interface AuthGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthenticated: () => void;
}

export function AuthGateModal({
  open,
  onOpenChange,
  onAuthenticated,
}: AuthGateModalProps) {
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setError(null);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const result = await signUp.email({
          name: name.trim() || email.split("@")[0]!,
          email: email.trim(),
          password,
        });

        if (result.error) {
          setError(result.error.message || "Sign up failed. Please try again.");
          setLoading(false);
          return;
        }
      } else {
        const result = await signIn.email({
          email: email.trim(),
          password,
        });

        if (result.error) {
          setError(
            result.error.message || "Sign in failed. Check your credentials."
          );
          setLoading(false);
          return;
        }
      }

      // Success - close modal and trigger pending action
      resetForm();
      onOpenChange(false);
      onAuthenticated();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="border-[#333] bg-[#1A1A1A] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white">
            {mode === "signup"
              ? "Create a Free Account"
              : "Sign In to Your Account"}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#888]">
            {mode === "signup"
              ? "Save your calculations and export PDF reports with a free Torke account."
              : "Sign in to access your saved calculations and exports."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {mode === "signup" && (
            <div>
              <label
                htmlFor="auth-name"
                className="mb-1 block text-xs font-medium text-[#AAA]"
              >
                Name (optional)
              </label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-white placeholder-[#555] outline-none focus:border-[#C41E3A]"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="mb-1 block text-xs font-medium text-[#AAA]"
            >
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-white placeholder-[#555] outline-none focus:border-[#C41E3A]"
            />
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="mb-1 block text-xs font-medium text-[#AAA]"
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-white placeholder-[#555] outline-none focus:border-[#C41E3A]"
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-900/30 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#C41E3A] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#A81830] disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : mode === "signup"
              ? "Create Account"
              : "Sign In"}
          </button>
        </form>

        <div className="mt-3 text-center text-xs text-[#666]">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
                className="text-[#C41E3A] hover:underline"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className="text-[#C41E3A] hover:underline"
              >
                Create one
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
