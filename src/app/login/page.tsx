"use client";

import { useActionState, useState, useTransition } from "react";
import { signIn, signUp, signInAsGuest, type AuthActionState } from "./actions";
import { useTheme } from "@/components/ThemeProvider";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signinState, signinAction, signinPending] = useActionState<AuthActionState, FormData>(signIn, null);
  const [signupState, signupAction, signupPending] = useActionState<AuthActionState, FormData>(signUp, null);
  const [showPassword, setShowPassword] = useState(false);
  const { theme, toggle } = useTheme();

  const isSignIn = mode === "signin";
  const currentState = isSignIn ? signinState : signupState;
  const isPending = isSignIn ? signinPending : signupPending;

  const currentState = isSignIn ? signinState : signupState;
  const isPending = isSignIn ? signinPending : signupPending;

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: "var(--bg-base)" }}>
      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-slide-up">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "var(--accent)" }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-7 h-7 text-white"
              >
                <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
                ATPL Past Year
              </h1>
              <p className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--sky-400)" }}>
                Aviation Exam Prep
              </p>
            </div>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {isSignIn
              ? "Welcome back, pilot. Ready to study?"
              : "Create your account to start studying."}
          </p>
        </div>

        {/* Card */}
        <div className="card rounded-2xl p-8">
          {/* Tab switcher */}
          <div
            className="flex rounded-xl p-1 mb-6"
            style={{ background: "var(--bg-elevated)" }}
          >
            {(["signin", "signup"] as const).map((tab) => (
              <button
                key={tab}
                id={`tab-${tab}`}
                onClick={() => setMode(tab)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: mode === tab ? "var(--bg-overlay)" : "transparent",
                  color: mode === tab ? "var(--sky-400)" : "var(--text-muted)",
                }}
              >
                {tab === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Status messages */}
          {currentState?.error && (
            <div
              className="mb-4 px-4 py-3 rounded-lg text-sm font-medium"
              style={{
                background: "var(--incorrect-dim)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "var(--incorrect)",
              }}
            >
              ⚠ {currentState.error}
            </div>
          )}
          {currentState?.success && (
            <div
              className="mb-4 px-4 py-3 rounded-lg text-sm font-medium"
              style={{
                background: "var(--correct-dim)",
                border: "1px solid rgba(16,185,129,0.3)",
                color: "var(--correct)",
              }}
            >
              ✓ {currentState.success}
            </div>
          )}

          {/* Form */}
          <form action={isSignIn ? signinAction : signupAction} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="pilot@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 focus-ring"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
                onFocus={(e) => { e.target.style.borderColor = "var(--border-active)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignIn ? "current-password" : "new-password"}
                  required
                  placeholder={isSignIn ? "••••••••" : "Min. 8 characters"}
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    outline: "none",
                    paddingRight: "2.5rem"
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--border-active)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-sky-400 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {!isSignIn && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    placeholder="Retype your password"
                    className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                      outline: "none",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "var(--border-active)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
                  />
                </div>
              </div>
            )}

            <button
              id={`btn-${mode}`}
              type="submit"
              disabled={isPending}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "var(--sky-600)",
                color: "white",
              }}
              onMouseEnter={(e) => {
                if (!isPending) {
                  (e.target as HTMLElement).style.background = "var(--sky-500)";
                  (e.target as HTMLElement).style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "var(--sky-600)";
                (e.target as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {isSignIn ? "Signing in…" : "Creating account…"}
                </span>
              ) : isSignIn ? (
                "Sign In →"
              ) : (
                "Create Account →"
              )}
            </button>
          </form>
        </div>


        {/* Footer — theme toggle + tagline */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Study smart. Fly safe. ✈
          </p>
          <button
            type="button"
            onClick={toggle}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-200"
            style={{
              background: "var(--bg-overlay)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            {theme === "dark" ? "☀ Light" : "🌙 Dark"}
          </button>
        </div>
      </div>
    </div>
  );
}
