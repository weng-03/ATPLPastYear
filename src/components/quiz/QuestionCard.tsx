"use client";

import { useState } from "react";
import type { ShuffledOption } from "@/types/database";
import { submitQuestionSeenReport } from "@/lib/actions";

interface QuestionCardProps {
  /** The unique ID of the question */
  questionId: number;
  /** The question text */
  questionText: string;
  /** Optional image URL */
  imageUrl?: string | null;
  /** Optional explanation */
  explanation?: string | null;
  /** 1-based question number shown to the user */
  questionNumber: number;
  /** Total questions in the quiz */
  totalQuestions: number;
  /** The shuffled answer options */
  options: ShuffledOption[];
  /** The display label the user selected, or null */
  selectedLabel: "A" | "B" | "C" | "D" | null;
  /** The correct display label (only set after answering) */
  correctLabel: "A" | "B" | "C" | "D" | null;
  /** Whether this question has been answered */
  isAnswered: boolean;
  /** Whether we're in exam mode (hide correct/incorrect feedback) */
  examMode: boolean;
  /** Callback when user clicks an option */
  onSelect: (label: "A" | "B" | "C" | "D") => void;
}



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
}: QuestionCardProps) {
  const [showSeenModal, setShowSeenModal] = useState(false);
  const [seenReportStatus, setSeenReportStatus] = useState<"idle" | "submitting" | "success">("idle");

  const handleSeenReport = async (airline: string) => {
    setSeenReportStatus("submitting");
    const result = await submitQuestionSeenReport(questionId, airline);
    if (result.success) {
      setSeenReportStatus("success");
      setTimeout(() => {
        setShowSeenModal(false);
        setSeenReportStatus("idle");
      }, 2000);
    } else {
      setSeenReportStatus("idle");
      alert("Failed to report: " + (result.message || "Please try again."));
    }
  };

  // In exam mode, options are never truly "locked" — user can always re-select
  const isLocked = isAnswered && !examMode;

  return (
    <div
      className="card rounded-2xl p-6 sm:p-8 animate-slide-up"
    >
      {/* Progress indicator */}
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
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSeenModal(!showSeenModal)}
              className="text-xs font-semibold px-3 py-1 rounded-full transition-colors"
              style={{
                background: "var(--bg-overlay)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              Seen in Exam?
            </button>
            
            {showSeenModal && (
              <div 
                className="absolute right-0 top-full mt-2 w-48 p-2 rounded-xl shadow-xl z-10 flex flex-col gap-1"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", textAlign: "left" }}
              >
                {seenReportStatus === "success" ? (
                  <div className="text-center py-3 text-[var(--correct)]">Thanks for reporting!</div>
                ) : (
                  <>
                    <div className="px-2 py-1 text-[var(--text-muted)] text-[10px] uppercase">Which airline?</div>
                    {["MAS", "AirAsia", "Batik", "Others"].map((airline) => (
                      <button
                        key={airline}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSeenReport(airline);
                        }}
                        disabled={seenReportStatus === "submitting"}
                        className="px-3 py-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors text-left"
                      >
                        {airline}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
          
          {isAnswered && !examMode && (
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{
              background:
                selectedLabel === correctLabel
                  ? "var(--correct-dim)"
                  : "var(--incorrect-dim)",
              color:
                selectedLabel === correctLabel
                  ? "var(--correct)"
                  : "var(--incorrect)",
              border: `1px solid ${
                selectedLabel === correctLabel
                  ? "rgba(16,185,129,0.3)"
                  : "rgba(239,68,68,0.3)"
              }`,
            }}
          >
            {selectedLabel === correctLabel ? "✓ Correct" : "✗ Wrong"}
          </span>
        )}
        </div>
      </div>

      {/* Question text — large, prominent, high contrast */}
      <h2
        className="text-lg sm:text-xl md:text-2xl font-semibold leading-relaxed mb-6"
        style={{ color: "var(--text-primary)" }}
      >
        {questionText}
      </h2>

      {/* Optional Image */}
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

      {/* Answer options */}
      <div className="space-y-3">
        {options.map((opt) => {
          const isSelected = selectedLabel === opt.displayLabel;
          const isCorrect  = correctLabel === opt.displayLabel;

          let bg     = "var(--bg-elevated)";
          let border = "var(--border)";
          let color  = "var(--text-secondary)";

          if (isLocked) {
            // Practice mode: show correct/incorrect feedback
            if (isCorrect) {
              bg     = "var(--correct-dim)";
              border = "var(--correct)";
              color  = "var(--correct)";
            } else if (isSelected) {
              bg     = "var(--incorrect-dim)";
              border = "var(--incorrect)";
              color  = "var(--incorrect)";
            }
          } else if (isSelected) {
            // Selected state (exam mode or pre-lock)
            bg     = "var(--bg-overlay)";
            border = "var(--sky-500)";
            color  = "var(--sky-400)";
          }

          return (
            <button
              key={opt.displayLabel}
              id={`option-${opt.displayLabel}`}
              type="button"
              disabled={isLocked}
              onClick={() => onSelect(opt.displayLabel)}
              className="w-full text-left flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-200 disabled:cursor-default group"
              style={{
                background: bg,
                border: `1px solid ${border}`,
                color,
              }}
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
              {/* Option label badge — larger */}
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
              {/* Option text — readable */}
              <span className="text-base font-medium leading-relaxed flex-1">{opt.text}</span>
              {/* Checkmark or X for answered practice state */}
              {isLocked && (isCorrect || isSelected) && (
                <span className="flex-shrink-0 text-base font-bold">
                  {isCorrect ? "✓" : "✗"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation View */}
      {isLocked && (
        <div 
          className="mt-8 p-5 rounded-xl border animate-slide-up"
          style={{ 
            background: "var(--bg-overlay)", 
            borderColor: "var(--border)",
            animationDelay: "0.1s"
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
