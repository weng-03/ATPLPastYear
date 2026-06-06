"use client";

import { useState } from "react";
import { saveProfile, updateUserEmail, updateUserPassword } from "@/lib/actions";
import Link from "next/link";

interface ProfileClientProps {
  userId: string;
  initialDisplayName: string;
  initialEmail: string;
}

export default function ProfileClient({ userId, initialDisplayName, initialEmail }: ProfileClientProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");

  const [nameStatus, setNameStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [emailStatus, setEmailStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameStatus("saving");
    setErrorMsg("");
    setSuccessMsg("");

    const ok = await saveProfile(userId, displayName.trim());
    if (ok) {
      setNameStatus("success");
      setSuccessMsg("Display username updated successfully!");
      setTimeout(() => { setNameStatus("idle"); setSuccessMsg(""); }, 4000);
    } else {
      setNameStatus("error");
      setErrorMsg("Failed to update username. Please try again.");
    }
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || email === initialEmail) return;

    setEmailStatus("saving");
    setErrorMsg("");
    setSuccessMsg("");

    const result = await updateUserEmail(email.trim());
    if (result.success) {
      setEmailStatus("success");
      setSuccessMsg(result.message);
      setTimeout(() => { setEmailStatus("idle"); setSuccessMsg(""); }, 6000);
    } else {
      setEmailStatus("error");
      setErrorMsg(result.message || "Failed to update email.");
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || password.length < 6) {
      setPasswordStatus("error");
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setPasswordStatus("saving");
    setErrorMsg("");
    setSuccessMsg("");

    const result = await updateUserPassword(password);
    if (result.success) {
      setPasswordStatus("success");
      setSuccessMsg(result.message);
      setPassword("");
      setTimeout(() => { setPasswordStatus("idle"); setSuccessMsg(""); }, 4000);
    } else {
      setPasswordStatus("error");
      setErrorMsg(result.message || "Failed to update password.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {successMsg && (
        <div className="p-4 rounded-xl text-sm font-medium animate-fade-in" style={{ background: "var(--correct-dim)", color: "var(--correct)", border: "1px solid var(--correct)" }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl text-sm font-medium animate-fade-in" style={{ background: "var(--incorrect-dim)", color: "var(--incorrect)", border: "1px solid var(--incorrect)" }}>
          {errorMsg}
        </div>
      )}

      {/* Display Username Form */}
      <div className="card rounded-2xl p-6 sm:p-8" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        <form onSubmit={handleSaveName} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Display Username
            </label>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              This name will be visible to everyone in the community comments section.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Aviator99"
                maxLength={30}
                className="flex-1 px-4 py-3 rounded-xl transition-colors outline-none"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-active)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
              />
              <button
                type="submit"
                disabled={nameStatus === "saving" || displayName.trim() === initialDisplayName}
                className="px-6 py-3 rounded-xl text-sm font-bold transition-opacity disabled:opacity-50 shadow-sm whitespace-nowrap"
                style={{ background: "var(--sky-600)", color: "white" }}
              >
                {nameStatus === "saving" ? "Saving..." : "Update Name"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Email Form */}
      <div className="card rounded-2xl p-6 sm:p-8" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        <form onSubmit={handleSaveEmail} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Email Address
            </label>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Change your login email. A confirmation link may be sent to your old and new addresses.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 px-4 py-3 rounded-xl transition-colors outline-none"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-active)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
              />
              <button
                type="submit"
                disabled={emailStatus === "saving" || email.trim() === initialEmail || !email.trim()}
                className="px-6 py-3 rounded-xl text-sm font-bold transition-opacity disabled:opacity-50 shadow-sm whitespace-nowrap"
                style={{ background: "var(--sky-600)", color: "white" }}
              >
                {emailStatus === "saving" ? "Updating..." : "Update Email"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Password Form */}
      <div className="card rounded-2xl p-6 sm:p-8" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        <form onSubmit={handleSavePassword} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              New Password
            </label>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Enter a new password (min. 6 characters) to change it immediately.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 px-4 py-3 rounded-xl transition-colors outline-none"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-active)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
              />
              <button
                type="submit"
                disabled={passwordStatus === "saving" || password.length < 6}
                className="px-6 py-3 rounded-xl text-sm font-bold transition-opacity disabled:opacity-50 shadow-sm whitespace-nowrap"
                style={{ background: "var(--sky-600)", color: "white" }}
              >
                {passwordStatus === "saving" ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="pt-4">
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 rounded-xl text-sm font-bold transition-colors shadow-sm"
          style={{ background: "var(--bg-overlay)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
        >
          &larr; Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
