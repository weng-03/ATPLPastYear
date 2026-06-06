"use client";

import { useState, useEffect } from "react";
import type { ShuffledOption, QuestionComment } from "@/types/database";
import {
  submitQuestionSeenReport,
  fetchQuestionSeenCounts,
  fetchQuestionComments,
  submitQuestionComment,
  removeQuestionComment,
} from "@/lib/actions";

interface QuestionCardProps {
  questionId: number;
  questionText: string;
  imageUrl?: string | null;
  explanation?: string | null;
  questionNumber: number;
  totalQuestions: number;
  options: ShuffledOption[];
  selectedLabel: "A" | "B" | "C" | "D" | null;
  correctLabel: "A" | "B" | "C" | "D" | null;
  isAnswered: boolean;
  examMode: boolean;
  onSelect: (label: "A" | "B" | "C" | "D") => void;
  currentUserId?: string;
}

type TabKey = "comments" | "exam_seen";

export default function QuestionCard({
  questionId,
  questionText,
  imageUrl,
  explanation,
  questionNumber,
  totalQuestions,
  options,
  selectedLabel,
  correctLabel,
  isAnswered,
  examMode,
  onSelect,
  currentUserId,
}: QuestionCardProps) {
  // ── Seen-in-Exam report dropdown ──
  const [showSeenModal, setShowSeenModal] = useState(false);
  const [selectedAirline, setSelectedAirline] = useState<string | null>(null);
  const [seenReportStatus, setSeenReportStatus] = useState<"idle" | "submitting" | "success">("idle");

  // ── Tabs ──
  const [activeTab, setActiveTab] = useState<TabKey>("comments");

  // ── Comments state ──
  const [comments, setComments] = useState<QuestionComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  // ── Exam Seen state ──
  const [seenCounts, setSeenCounts] = useState<Record<string, number>>({});
  const [seenLoaded, setSeenLoaded] = useState(false);
  const [loadingSeen, setLoadingSeen] = useState(false);

  const isLocked = isAnswered && !examMode;

  // ── Reset all tab data when the question changes ──
  useEffect(() => {
    setComments([]);
    setCommentsLoaded(false);
    setSeenCounts({});
    setSeenLoaded(false);
    setNewComment("");
    setShowSeenModal(false);
    setSelectedAirline(null);
    setSeenReportStatus("idle");
  }, [questionId]);

  // ── Load data for the active tab ──
  useEffect(() => {
    if (activeTab === "comments" && !commentsLoaded) {
      setLoadingComments(true);
      fetchQuestionComments(questionId).then((data) => {
        setComments(data);
        setCommentsLoaded(true);
        setLoadingComments(false);
      });
    }
    if (activeTab === "exam_seen" && !seenLoaded) {
      setLoadingSeen(true);
      fetchQuestionSeenCounts(questionId).then((data) => {
        setSeenCounts(data);
        setSeenLoaded(true);
        setLoadingSeen(false);
      });
    }
  }, [activeTab, commentsLoaded, seenLoaded, questionId]);

  // ── Handlers ──
  const handleSeenReport = async (airline: string) => {
    setSeenReportStatus("submitting");
    const result = await submitQuestionSeenReport(questionId, airline);
    if (result.success) {
      setSeenReportStatus("success");
      // Refresh seen counts
      setSeenLoaded(false);
      setTimeout(() => {
        setShowSeenModal(false);
        setSeenReportStatus("idle");
        setSelectedAirline(null);
      }, 2000);
    } else {
      setSeenReportStatus("idle");
      alert("Failed to report: " + (result.message || "Please try again."));
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setPostingComment(true);
    const ok = await submitQuestionComment(questionId, newComment.trim());
    if (ok) {
      setNewComment("");
      const data = await fetchQuestionComments(questionId);
      setComments(data);
    }
    setPostingComment(false);
  };

  const handleDeleteComment = async (commentId: string | number) => {
    const ok = await removeQuestionComment(commentId);
    if (ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  // ── Airline color map ──
  const airlineColors: Record<string, { bg: string; text: string; solid: string }> = {
    MAS:     { bg: "rgba(59,130,246,0.15)",  text: "rgb(96,165,250)",  solid: "rgb(59,130,246)" },
    AirAsia: { bg: "rgba(239,68,68,0.15)",   text: "rgb(248,113,113)", solid: "rgb(239,68,68)" },
    Batik:   { bg: "rgba(168,85,247,0.15)",  text: "rgb(192,132,252)", solid: "rgb(168,85,247)" },
    Others:  { bg: "rgba(156,163,175,0.15)", text: "rgb(156,163,175)", solid: "rgb(156,163,175)" },
  };

  return (
    <div className="card rounded-2xl p-6 sm:p-8 animate-slide-up">

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── Tabbed Section (ALWAYS visible, at the TOP) ──     */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="mb-6">
        {/* ── Tab Bar ── */}
        <div
          className="flex rounded-t-xl overflow-hidden"
          style={{ borderBottom: "2px solid var(--border)" }}
        >
          {([
            { key: "comments" as TabKey, label: "COMMENTS" },
            { key: "exam_seen" as TabKey, label: "EXAM SEEN" },
          ]).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 text-center"
              style={{
                background: activeTab === tab.key ? "var(--bg-overlay)" : "transparent",
                color: activeTab === tab.key
                  ? (tab.key === "exam_seen" ? "var(--warning)" : "var(--sky-400)")
                  : "var(--text-muted)",
                borderBottom: activeTab === tab.key
                  ? `2px solid ${tab.key === "exam_seen" ? "var(--warning)" : "var(--sky-400)"}`
                  : "2px solid transparent",
                marginBottom: "-2px",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div
          className="rounded-b-xl p-4 sm:p-5 border border-t-0"
          style={{
            background: "var(--bg-overlay)",
            borderColor: "var(--border)",
          }}
        >
          {/* ───── COMMENTS TAB ───── */}
          {activeTab === "comments" && (
            <div>
              {loadingComments ? (
                <div className="flex items-center justify-center py-6">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24" style={{ color: "var(--sky-400)" }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
              ) : (
                <>
                  {comments.length === 0 ? (
                    <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>
                      No comments yet. Be the first to share a tip!
                    </p>
                  ) : (
                    <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                      {comments.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-start gap-3 p-3 rounded-lg"
                          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                            style={{ background: "var(--accent)", color: "white" }}
                          >
                            {(c.user_id ?? "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                              {c.comment_text}
                            </p>
                            <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                              {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                          {currentUserId && c.user_id === currentUserId && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(c.id)}
                              className="text-xs px-2 py-1 rounded hover:bg-[var(--incorrect-dim)] transition-colors flex-shrink-0"
                              style={{ color: "var(--incorrect)" }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New comment input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !postingComment) handlePostComment(); }}
                      placeholder="Share a tip or comment..."
                      className="flex-1 px-3 py-2 rounded-lg text-sm transition-all duration-200"
                      style={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                        outline: "none",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = "var(--border-active)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
                    />
                    <button
                      type="button"
                      onClick={handlePostComment}
                      disabled={postingComment || !newComment.trim()}
                      className="px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 disabled:opacity-40"
                      style={{ background: "var(--sky-600)", color: "white" }}
                    >
                      {postingComment ? "..." : "Post"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ───── EXAM SEEN TAB ───── */}
          {activeTab === "exam_seen" && (
            <div>
              {loadingSeen ? (
                <div className="flex items-center justify-center py-6">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24" style={{ color: "var(--warning)" }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
              ) : Object.keys(seenCounts).length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>
                  No exam sightings reported yet. Use the &quot;Seen in Exam?&quot; button to report.
                </p>
              ) : (
                <>
                  <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                    This question has been reported as appearing in real assessments.
                  </p>
                  <div className="space-y-0">
                    {Object.entries(seenCounts)
                      .sort(([, a], [, b]) => b - a)
                      .map(([airline, count]) => {
                        const colors = airlineColors[airline] ?? airlineColors.Others;
                        return (
                          <div
                            key={airline}
                            className="flex items-center justify-between py-3 px-1"
                            style={{ borderBottom: "1px solid var(--border)" }}
                          >
                            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                              {airline}
                            </span>
                            <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: colors.solid }}>
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                              </svg>
                              {count}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Progress indicator ── */}
      <div className="flex items-center justify-between mb-6">
        <span
          className="text-sm font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
          style={{
            background: "var(--bg-overlay)",
            color: "var(--sky-400)",
            border: "1px solid var(--border-active)",
          }}
        >
          Question {questionNumber} of {totalQuestions}
        </span>
        <div className="flex items-center gap-3">
          {/* Seen in Exam dropdown trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowSeenModal(!showSeenModal);
                setSelectedAirline(null);
              }}
              className="text-xs font-semibold px-3 py-1 rounded-full transition-colors"
              style={{
                background: "var(--bg-overlay)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--warning)";
                (e.currentTarget as HTMLElement).style.color = "var(--warning)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              }}
            >
              Seen in Exam?
            </button>

            {showSeenModal && (
              <div
                className="absolute right-0 top-full mt-2 w-56 p-2 rounded-xl shadow-xl z-10 flex flex-col gap-1"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", textAlign: "left" }}
              >
                {seenReportStatus === "success" ? (
                  <div className="text-center py-3 text-[var(--correct)]">Thanks for reporting!</div>
                ) : selectedAirline ? (
                  <div className="flex flex-col gap-3 p-1">
                    <p className="text-xs text-[var(--text-primary)] text-center leading-relaxed">
                      Confirm this question appears in <strong>{selectedAirline}</strong> assessment?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedAirline(null); }}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] transition-colors"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSeenReport(selectedAirline); }}
                        disabled={seenReportStatus === "submitting"}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-50"
                        style={{ background: "var(--warning)", color: "white" }}
                      >
                        {seenReportStatus === "submitting" ? "..." : "Confirm"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="px-2 py-1 text-[var(--text-muted)] text-[10px] uppercase">Which airline?</div>
                    {["MAS", "AirAsia", "Batik", "Others"].map((airline) => {
                      const colors = airlineColors[airline] ?? airlineColors.Others;
                      return (
                        <button
                          key={airline}
                          onClick={(e) => { e.stopPropagation(); setSelectedAirline(airline); }}
                          className="px-3 py-2 rounded-lg transition-colors text-left text-sm"
                          style={{ color: "var(--text-primary)" }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = colors.bg;
                            (e.currentTarget as HTMLElement).style.color = colors.text;
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                            (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                          }}
                        >
                          {airline}
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>

          {isAnswered && !examMode && (
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{
                background: selectedLabel === correctLabel ? "var(--correct-dim)" : "var(--incorrect-dim)",
                color: selectedLabel === correctLabel ? "var(--correct)" : "var(--incorrect)",
                border: `1px solid ${selectedLabel === correctLabel ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
              }}
            >
              {selectedLabel === correctLabel ? "✓ Correct" : "✗ Wrong"}
            </span>
          )}
        </div>
      </div>

      {/* ── Question text ── */}
      <h2
        className="text-base sm:text-lg md:text-xl font-semibold leading-relaxed mb-6"
        style={{ color: "var(--text-primary)" }}
      >
        {questionText}
      </h2>

      {/* ── Optional Image ── */}
      {imageUrl && (
        <div className="mb-8">
          <img
            src={imageUrl}
            alt="Question reference"
            className="w-full max-w-lg rounded-xl object-contain shadow-sm"
            style={{ border: "1px solid var(--border)" }}
          />
        </div>
      )}

      {/* ── Answer options ── */}
      <div className="space-y-3">
        {options.map((opt) => {
          const isSelected = selectedLabel === opt.displayLabel;
          const isCorrect = correctLabel === opt.displayLabel;

          let bg = "var(--bg-elevated)";
          let border = "var(--border)";
          let color = "var(--text-secondary)";

          if (isLocked) {
            if (isCorrect) {
              bg = "var(--correct-dim)";
              border = "var(--correct)";
              color = "var(--correct)";
            } else if (isSelected) {
              bg = "var(--incorrect-dim)";
              border = "var(--incorrect)";
              color = "var(--incorrect)";
            }
          } else if (isSelected) {
            bg = "var(--bg-overlay)";
            border = "var(--sky-500)";
            color = "var(--sky-400)";
          }

          return (
            <button
              key={opt.displayLabel}
              id={`option-${opt.displayLabel}`}
              type="button"
              disabled={isLocked}
              onClick={() => onSelect(opt.displayLabel)}
              className="w-full text-left flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-200 disabled:cursor-default group"
              style={{ background: bg, border: `1px solid ${border}`, color }}
              onMouseEnter={(e) => {
                if (!isLocked) {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-active)";
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-overlay)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLocked && !isSelected) {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
                }
              }}
            >
              <span
                className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-colors duration-200"
                style={{
                  background: isLocked && isCorrect
                    ? "rgba(16,185,129,0.2)"
                    : isLocked && isSelected && !isCorrect
                    ? "rgba(239,68,68,0.2)"
                    : isSelected
                    ? "rgba(14,165,233,0.15)"
                    : "var(--bg-overlay)",
                  color: isLocked && isCorrect
                    ? "var(--correct)"
                    : isLocked && isSelected && !isCorrect
                    ? "var(--incorrect)"
                    : isSelected
                    ? "var(--sky-400)"
                    : "var(--option-badge-color)",
                }}
              >
                {opt.displayLabel}
              </span>
              <span className="text-base font-medium leading-relaxed flex-1">{opt.text}</span>
              {isLocked && (isCorrect || isSelected) && (
                <span className="flex-shrink-0 text-base font-bold">
                  {isCorrect ? "✓" : "✗"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Explanation (visible after answering in practice mode) ── */}
      {isLocked && (
        <div
          className="mt-8 p-5 rounded-xl border animate-slide-up"
          style={{
            background: "var(--bg-overlay)",
            borderColor: "var(--border)",
            animationDelay: "0.1s",
          }}
        >
          <h3 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>
            Explanation
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
            {explanation || "Explanation placeholder text. Groundschool database entry pending."}
          </p>
        </div>
      )}
    </div>
  );
}
