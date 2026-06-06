"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import QuestionCard from "./QuestionCard";

import type {
  QuizSession,
  Question,
  ShuffledOption,
  UserAnswer,
} from "@/types/database";

// ── Helpers ────────────────────────────────────────────────────────────────

function buildShuffledOptions(
  question: Question,
  savedOrder?: Array<"A" | "B" | "C" | "D">
): ShuffledOption[] {
  const keys: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];
  const textMap: Record<string, string> = {
    A: question.option_a,
    B: question.option_b,
    C: question.option_c,
    D: question.option_d,
  };
  const order = savedOrder ?? shuffle([...keys]);
  return order.map((originalKey, idx) => ({
    displayLabel: keys[idx],
    text: textMap[originalKey],
    originalKey,
  }));
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── Server action wrappers ──

async function saveProgress(
  sessionId: string,
  updates: Partial<QuizSession>
): Promise<void> {
  await fetch(`/api/quiz/${sessionId}/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

// ── Component ───────────────────────────────────────────────────────────────

interface QuizEngineProps {
  session: QuizSession;
  questions: Question[];
}

export default function QuizEngine({ session, questions }: QuizEngineProps) {
  const router = useRouter();
  const examMode = session.mode === "exam";

  // ── State ────────────────────────────────────────────────────────────────
  const storageKey = `quiz-view-index-${session.id}`;
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(storageKey);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < questions.length) {
          return parsed;
        }
      }
    }
    return session.current_question_index;
  });
  const [answers, setAnswers] = useState<Record<number, UserAnswer>>(
    session.answers ?? {}
  );
  const [selectedLabel, setSelectedLabel] = useState<
    "A" | "B" | "C" | "D" | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPausing, setIsPausing] = useState(false);

  // Toast / finish warning (Task 3)
  const [showFinishWarning, setShowFinishWarning] = useState(false);
  const [highlightUnanswered, setHighlightUnanswered] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timer for exam mode
  const [timeLeft, setTimeLeft] = useState(
    session.time_remaining_seconds ?? 50 * 60
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Shuffled options
  const [shuffledOptionsMap, setShuffledOptionsMap] = useState<
    Record<number, ShuffledOption[]>
  >({});

  // ── Build shuffled options on mount ─────────────────────────────────────
  useEffect(() => {
    const map: Record<number, ShuffledOption[]> = {};
    for (const q of questions) {
      const existingAnswer = session.answers?.[q.id];
      const savedOrder = existingAnswer?.shuffleOrder;
      map[q.id] = buildShuffledOptions(q, savedOrder);
    }
    setShuffledOptionsMap(map);
  }, [questions, session.answers]);

  // ── Restore selected label for current question on index change ──────────
  useEffect(() => {
    const q = questions[currentIndex];
    if (!q) return;
    const existing = answers[q.id];
    setSelectedLabel(existing?.selectedDisplayLabel ?? null);
  }, [currentIndex, answers, questions]);

  // ── Persist viewing index so refresh stays on same question ──
  useEffect(() => {
    sessionStorage.setItem(storageKey, String(currentIndex));
  }, [currentIndex, storageKey]);

  // ── Exam mode timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!examMode) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleFinish(true); // Auto-submit bypasses unanswered check
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examMode]);

  // ── Keyboard navigation (Task 4) ────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (currentIndex < questions.length - 1) {
          const q = questions[currentIndex];
          const hasAnswer = q && !!answers[q.id];
          // In practice mode, only advance if answered. In exam mode, always allow.
          if (hasAnswer || examMode) {
            setCurrentIndex((i) => Math.min(i + 1, questions.length - 1));
          }
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentIndex((i) => Math.max(0, i - 1));
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, questions, answers, examMode]);

  // ── Derived values ───────────────────────────────────────────────────────
  const currentQuestion = questions[currentIndex];
  const shuffledOptions = currentQuestion
    ? shuffledOptionsMap[currentQuestion.id] ?? []
    : [];
  const existingAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isCurrentAnswered = !!existingAnswer;

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = session.total_questions - answeredCount;
  const progressPct = Math.round((answeredCount / session.total_questions) * 100);
  const isLastQuestion = currentIndex === questions.length - 1;

  // Find correct display label for current question (after answering in practice mode)
  const correctDisplayLabel: "A" | "B" | "C" | "D" | null =
    isCurrentAnswered && currentQuestion && !examMode
      ? (shuffledOptions.find(
          (o) => o.originalKey === currentQuestion.correct_answer
        )?.displayLabel ?? null)
      : null;

  // ── Handle answer selection (Task 5: exam mode allows re-selection) ──────
  const handleSelect = useCallback(
    async (label: "A" | "B" | "C" | "D") => {
      if (!currentQuestion) return;

      // In practice mode, once answered, lock it
      if (isCurrentAnswered && !examMode) return;

      const opts = shuffledOptionsMap[currentQuestion.id] ?? [];
      const chosen = opts.find((o) => o.displayLabel === label);
      if (!chosen) return;

      const isCorrect = chosen.originalKey === currentQuestion.correct_answer;
      const answer: UserAnswer = {
        questionId: currentQuestion.id,
        selectedDisplayLabel: label,
        originalKeySelected: chosen.originalKey,
        isCorrect,
        shuffleOrder: opts.map((o) => o.originalKey),
      };

      const newAnswers = { ...answers, [currentQuestion.id]: answer };
      setSelectedLabel(label);
      setAnswers(newAnswers);

      // Clear any finish warning when user answers a question
      if (highlightUnanswered) {
        setHighlightUnanswered(false);
        setShowFinishWarning(false);
      }

      // Persist to Supabase in the background
      setIsSaving(true);
      try {
        await saveProgress(session.id, {
          answers: newAnswers,
          current_question_index: currentIndex,
        });
      } finally {
        setIsSaving(false);
      }
    },
    [currentQuestion, isCurrentAnswered, examMode, shuffledOptionsMap, answers, session.id, currentIndex, highlightUnanswered]
  );

  // ── Navigate to next question ────────────────────────────────────────────
  const handleNext = useCallback(async () => {
    if (!isLastQuestion) {
      setCurrentIndex((i) => i + 1);
      await saveProgress(session.id, {
        current_question_index: currentIndex + 1,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLastQuestion, currentIndex, session.id]);

  // ── Attempt to finish (Task 3: prevent premature finish) ─────────────────
  const handleAttemptFinish = useCallback(() => {
    const currentAnsweredCount = Object.keys(answers).length;
    if (currentAnsweredCount < session.total_questions) {
      // Show warning toast
      setShowFinishWarning(true);
      setHighlightUnanswered(true);

      // Auto-dismiss after 5 seconds
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setShowFinishWarning(false);
      }, 5000);

      return;
    }

    // All answered, proceed to finish
    handleFinish(false);
  }, [answers, session.total_questions]);

  // ── Finish the quiz ──────────────────────────────────────────────────────
  const handleFinish = useCallback(
    async (timedOut = false) => {
      if (timerRef.current) clearInterval(timerRef.current);

      const finalAnswers = timedOut ? { ...answers } : answers;

      const correctCount = Object.values(finalAnswers).filter(
        (a) => a.isCorrect
      ).length;
      const score = Math.round(
        (correctCount / session.total_questions) * 100
      );

      setIsSaving(true);
      try {
        await saveProgress(session.id, {
          status: "completed",
          score,
          answers: finalAnswers,
          current_question_index: questions.length - 1,
          completed_at: new Date().toISOString(),
          time_remaining_seconds: timedOut ? 0 : timeLeft,
        });
      } finally {
        setIsSaving(false);
      }

      router.push(`/quiz/${session.id}/results`);
    },
    [answers, session.id, session.total_questions, questions.length, timeLeft, router]
  );

  // ── Pause and return to dashboard ────────────────────────────────────────
  const handlePause = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPausing(true);
    try {
      await saveProgress(session.id, {
        status: "paused",
        answers,
        current_question_index: currentIndex,
        time_remaining_seconds: examMode ? timeLeft : undefined,
      });
      router.push("/dashboard");
    } finally {
      setIsPausing(false);
    }
  }, [session.id, answers, currentIndex, examMode, timeLeft, router]);

  // ── Render ───────────────────────────────────────────────────────────────
  if (!currentQuestion || shuffledOptions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p style={{ color: "var(--text-muted)" }}>Loading question…</p>
      </div>
    );
  }

  const timerDanger = examMode && timeLeft < 5 * 60;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-base)" }}
    >
      {/* ── Toast: finish warning (Task 3) ── */}
      {showFinishWarning && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 toast-enter max-w-md w-full mx-4"
        >
          <div
            className="px-5 py-3 rounded-xl text-sm font-medium flex items-center gap-3"
            style={{
              background: "var(--incorrect-dim)",
              border: "1px solid var(--incorrect)",
              color: "var(--incorrect)",
            }}
          >
            <span className="text-lg">⚠</span>
            <div>
              <p className="font-semibold">Cannot submit yet</p>
              <p className="text-xs mt-0.5" style={{ opacity: 0.85 }}>
                You have {unansweredCount} unanswered question{unansweredCount !== 1 ? "s" : ""}. 
                Please answer all questions before finishing.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowFinishWarning(false)}
              className="ml-auto text-base opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Top bar ── */}
      <header
        className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between gap-4"
        style={{
          background: "var(--header-bg)",
          borderBottom: "1px solid var(--card-border)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {/* Left: mode + chapter info */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: examMode
                ? "linear-gradient(135deg,#d97706,#f59e0b)"
                : "var(--accent)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
              <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "var(--text-secondary)" }}>
              {examMode ? "✈ Exam Mode" : "Practice Mode"}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              {session.chapter ?? "All Chapters"}
            </p>
          </div>
        </div>

        {/* Center: timer (exam) or progress count */}
        <div className="text-center flex-shrink-0">
          {examMode ? (
            <div
              className="text-xl font-mono font-bold tabular-nums transition-colors duration-300"
              style={{ color: timerDanger ? "var(--incorrect)" : "var(--warning)" }}
            >
              {formatTime(timeLeft)}
            </div>
          ) : (
            <div className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
              {answeredCount}/{session.total_questions} answered
            </div>
          )}
        </div>

        {/* Right: saving indicator + pause */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isSaving && (
            <span className="text-xs hidden sm:block" style={{ color: "var(--text-muted)" }}>
              Saving…
            </span>
          )}
          <button
            id="btn-pause"
            type="button"
            disabled={isPausing}
            onClick={handlePause}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 disabled:opacity-50"
            style={{
              background: "var(--bg-overlay)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border-active)";
              (e.currentTarget as HTMLElement).style.color = "var(--sky-400)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
            }}
          >
            {isPausing ? "Saving…" : "⏸ Pause"}
          </button>
        </div>
      </header>

      {/* ── Progress bar ── */}
      <div className="h-1" style={{ background: "var(--bg-surface)" }}>
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${progressPct}%`,
            background: examMode
              ? "linear-gradient(90deg,#f59e0b,#fcd34d)"
              : "var(--sky-500)",
          }}
        />
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Main Question & Options */}
          <main className="lg:col-span-3 flex flex-col items-center w-full">
            <div className="w-full max-w-3xl">
              <QuestionCard
          questionId={currentQuestion.id}
          imageUrl={currentQuestion.image_url}
          explanation={currentQuestion.explanation}
          questionText={currentQuestion.question_text}
          questionNumber={currentIndex + 1}
          totalQuestions={session.total_questions}
          options={shuffledOptions}
          selectedLabel={selectedLabel}
          correctLabel={correctDisplayLabel}
          isAnswered={isCurrentAnswered}
          examMode={examMode}
          onSelect={handleSelect}
          currentUserId={session.user_id}
        />

        {/* ── Action area ── */}
        <div className="w-full mt-6 flex items-center justify-between gap-3">
          {/* Previous button */}
          <button
            id="btn-prev"
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            ← Prev
          </button>

          {/* Next button (only if not on last question) */}
          {!isLastQuestion && (
            <button
              id="btn-next"
              type="button"
              disabled={(!isCurrentAnswered && !examMode) || isSaving}
              onClick={handleNext}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: examMode
                  ? "linear-gradient(135deg,#d97706,#f59e0b)"
                  : "var(--sky-600)",
                color: "white",
              }}
            >
              {isSaving ? "Saving…" : "Next Question →"}
            </button>
          )}

          {/* Finish button (always visible, separate from Next) */}
          <button
            id="btn-finish"
            type="button"
            disabled={isSaving}
            onClick={handleAttemptFinish}
            className="py-3 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: isLastQuestion
                ? "var(--correct)"
                : "var(--bg-elevated)",
              color: isLastQuestion ? "white" : "var(--text-secondary)",
              border: isLastQuestion ? "none" : "1px solid var(--border)",
              flex: isLastQuestion ? 1 : "none",
              paddingLeft: isLastQuestion ? undefined : "1rem",
              paddingRight: isLastQuestion ? undefined : "1rem",
            }}
          >
            {isSaving ? "Saving…" : "Finish Quiz ✓"}
          </button>
        </div>


            </div>
          </main>

          {/* Sticky Sidebar: Quiz Progress */}
          <aside className="lg:col-span-1 sticky top-24">
            <div className="card rounded-2xl p-5 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "var(--text-secondary)" }}>
                Quiz Progress
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, i) => {
                  const ans = answers[q.id];
                  const isCurrent = i === currentIndex;
                  const isUnanswered = !ans;
                  let bg = "var(--bg-overlay)";
                  if (isCurrent) bg = "var(--sky-500)";
                  else if (ans?.isCorrect && !examMode) bg = "var(--correct)";
                  else if (ans && !ans.isCorrect && !examMode) bg = "var(--incorrect)";
                  else if (ans && examMode) bg = "var(--warning)";

                  const shouldPulse = highlightUnanswered && isUnanswered && !isCurrent;

                  return (
                    <button
                      key={q.id}
                      id={`nav-q${i + 1}`}
                      type="button"
                      onClick={() => setCurrentIndex(i)}
                      className={`w-full aspect-square rounded-md text-xs font-bold transition-all duration-150 flex items-center justify-center ${shouldPulse ? "pulse-unanswered" : ""}`}
                      style={{
                        background: bg,
                        color: isCurrent || ans ? "white" : "var(--text-muted)",
                        transform: isCurrent ? "scale(1.1)" : "scale(1)",
                      }}
                      title={`Question ${i + 1}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
