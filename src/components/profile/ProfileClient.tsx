"use client";

import { useState } from "react";
import { saveProfile } from "@/lib/actions";
import Link from "next/link";

interface ProfileClientProps {
  userId: string;
  initialDisplayName: string;
}

export default function ProfileClient({ userId, initialDisplayName }: ProfileClientProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    const ok = await saveProfile(userId, displayName.trim());
    if (ok) {
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } else {
      setStatus("error");
      setErrorMsg("Failed to update profile. Please try again.");
    }
  };

  return (
    <div className="card rounded-2xl p-6 sm:p-8" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label htmlFor="displayName" className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
            Display Username
          </label>
          <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
            This name will be visible to everyone in the community comments section.
          </p>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Aviator99"
            maxLength={30}
            className="w-full px-4 py-3 rounded-xl transition-colors outline-none"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-active)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
          />
        </div>

        {status === "success" && (
          <div className="p-4 rounded-xl text-sm font-medium animate-fade-in" style={{ background: "var(--correct-dim)", color: "var(--correct)", border: "1px solid var(--correct)" }}>
            Profile updated successfully!
          </div>
        )}

        {status === "error" && (
          <div className="p-4 rounded-xl text-sm font-medium animate-fade-in" style={{ background: "var(--incorrect-dim)", color: "var(--incorrect)", border: "1px solid var(--incorrect)" }}>
            {errorMsg}
          </div>
        )}

        <div className="flex gap-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl text-sm font-bold transition-colors text-center"
            style={{ background: "var(--bg-overlay)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
          >
            Back to Dashboard
          </Link>
          <button
            type="submit"
            disabled={status === "saving" || displayName.trim() === initialDisplayName}
            className="flex-1 px-6 py-3 rounded-xl text-sm font-bold transition-opacity disabled:opacity-50 shadow-sm"
            style={{ background: "var(--sky-600)", color: "white" }}
          >
            {status === "saving" ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
