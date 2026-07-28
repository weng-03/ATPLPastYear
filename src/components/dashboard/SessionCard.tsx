"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { QuizSession } from "@/types/database";
import { removeQuizSession } from "@/lib/actions";

interface SessionCardProps {
  session: QuizSession;
}

function formatDate(isoString?: string): string {
  if (!isoString) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoString));
}

function formatDuration(session: QuizSession): string {
  if (session.time_remaining_seconds !== undefined && session.mode === "exam") {
    const remaining = session.time_remaining_seconds;
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${m}:${s.toString().padStart(2, "0")} remaining`;
  }
  return "";
}

export default function SessionCard({ session }: SessionCardProps) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [removed, setRemoved] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowConfirm(false);
    // Optimistically hide the card instantly
    setRemoved(true);
    startTransition(async () => {
      await removeQuizSession(session.id);
    });
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
  };

  // If deleted, don't render anything
  if (removed) return null;

  const isCompleted = session.status === "completed";
  const answeredCount = Object.keys(session.answers ?? {}).length;
  const progressPct = Math.round((answeredCount / session.total_questions) * 100);
  const scoreLabel =
    isCompleted && session.score !== undefined
      ? `${session.score}%`
      : null;

  const statusColor = isCompleted
    ? "var(--correct)"
    : session.mode === "exam"
    ? "var(--warning)"
    : "var(--sky-400)";

  const statusBg = isCompleted
    ? "var(--correct-dim)"
    : session.mode === "exam"
    ? "var(--warning-dim)"
    : "var(--bg-overlay)";

  return (
    <div
      className="card rounded-xl p-4 transition-all duration-200 hover:translate-y-[-2px] group relative"
      style={{
        borderColor:
          session.mode === "exam"
            ? "rgba(245,158,11,0.2)"
            : "var(--card-border)",
      }}
    >
      {/* ── Custom Confirmation Modal ── */}
      {showConfirm && (
        <div
          className="absolute inset-0 z-20 rounded-xl flex flex-col items-center justify-center gap-4 px-6 animate-fade-in"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            backdropFilter: "blur(4px)",
          }}
        >
          <p className="text-sm font-semibold text-center" style={{ color: "var(--text-primary)" }}>
            Delete this quiz?
          </p>
          <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
            This action cannot be undone.
          </p>
          <div className="flex gap-3 w-full max-w-[240px]">
            <button
              type="button"
              onClick={handleCancelDelete}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="flex-1 py-2 rounded-lg text-sm font-bold text-white transition-all duration-150 hover:opacity-90"
              style={{
                background: "var(--incorrect)",
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Left: mode badge + chapter */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {session.mode === "exam" && (
              <span
                className="px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider"
                style={{
                  background: "var(--warning-dim)",
                  color: "var(--warning)",
                  border: "1px solid rgba(245,158,11,0.3)",
                }}
              >
                ✈ Exam Mode
              </span>
            )}
            <span
              className="px-2 py-0.5 rounded-md text-xs font-medium"
              style={{ background: statusBg, color: statusColor }}
            >
              {isCompleted ? "Completed" : "In Progress"}
            </span>
          </div>
          <p
            className="text-sm font-semibold truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {session.chapter ?? "All Chapters"}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {formatDate(isCompleted ? session.completed_at : session.started_at)}
            {formatDuration(session) && ` · ${formatDuration(session)}`}
          </p>
        </div>

        {/* Right: score or progress count */}
        <div className="text-right flex-shrink-0 flex items-start gap-4">
          <button
            onClick={handleDeleteClick}
            disabled={isPending}
            className="mt-1 text-[var(--text-muted)] hover:text-[var(--incorrect)] transition-colors disabled:opacity-50"
            title="Delete Quiz"
          >
            {isPending ? (
              <span className="text-xs">...</span>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          
          {scoreLabel ? (
            <div>
              <span
                className="text-2xl font-bold"
                style={{
                  color:
                    (session.score ?? 0) >= 70
                      ? "var(--correct)"
                      : "var(--incorrect)",
                }}
              >
                {scoreLabel}
              </span>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Score
              </p>
            </div>
          ) : (
            <div>
              <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                {answeredCount}
                <span
                  className="text-sm font-normal"
                  style={{ color: "var(--text-muted)" }}
                >
                  /{session.total_questions}
                </span>
              </span>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Questions
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {!isCompleted && (
        <div
          className="h-1.5 rounded-full mb-3 overflow-hidden"
          style={{ background: "var(--bg-overlay)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progressPct}%`,
              background:
                session.mode === "exam"
                  ? "linear-gradient(90deg, #f59e0b, #fcd34d)"
                  : "var(--sky-500)",
            }}
          />
        </div>
      )}

      {/* Results breakdown for completed */}
      {isCompleted && session.answers && (
        <div className="flex gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "var(--correct)" }}
            />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {Object.values(session.answers).filter((a) => a.isCorrect).length}{" "}
              Correct
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "var(--incorrect)" }}
            />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {Object.values(session.answers).filter((a) => !a.isCorrect).length}{" "}
              Wrong
            </span>
          </div>
        </div>
      )}

      {/* Action button */}
      <Link
        href={
          isCompleted
            ? `/quiz/${session.id}/results`
            : `/quiz/${session.id}`
        }
        id={`session-${session.id}`}
        className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
        style={{
          background: isCompleted ? "var(--bg-overlay)" : "var(--sky-600)",
          color: isCompleted ? "var(--text-secondary)" : "white",
          border: isCompleted ? "1px solid var(--border)" : "none",
        }}
      >
        {isCompleted ? (
          <>Review Results →</>
        ) : (
          <>Resume Quiz →</>
        )}
      </Link>
    </div>
  );
}
