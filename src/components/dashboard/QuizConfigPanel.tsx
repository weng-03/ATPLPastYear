"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface QuizConfigPanelProps {
  chapters: string[];
  questionCounts: Record<string, number>; // chapter → count ('' = all chapters)
}

export default function QuizConfigPanel({
  chapters,
  questionCounts,
}: QuizConfigPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [sliderValue, setSliderValue] = useState<number>(20);
  const [useAll, setUseAll] = useState(true);
  const [randomize, setRandomize] = useState(true);
  const [examMode, setExamMode] = useState(false);
  const [seenInExam, setSeenInExam] = useState(false);

  const availableCount = questionCounts[selectedChapter] ?? questionCounts[""] ?? 0;

  // Clamp slider value to available count
  const clampedSlider = Math.min(sliderValue, availableCount);

  const effectiveCount = examMode
    ? 50
    : useAll
    ? availableCount
    : Math.max(1, clampedSlider);

  async function handleStart() {
    startTransition(async () => {
      const params = new URLSearchParams({
        chapter: examMode ? "" : selectedChapter,
        count: examMode ? "50" : String(effectiveCount),
        randomize: examMode ? "true" : String(randomize),
        mode: examMode ? "exam" : "practice",
        seenInExam: String(seenInExam),
      });
      router.push(`/quiz/new?${params.toString()}`);
    });
  }

  return (
    <div
      className="card rounded-2xl p-6 h-full"
    >
      {/* Panel header */}
      <div className="flex items-center gap-2 mb-6">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "var(--accent)" }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
          </svg>
        </div>
        <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Configure Quiz</h2>
      </div>

      {/* ── EXAM MODE toggle ── */}
      <div
        className="rounded-xl p-4 mb-5 transition-all duration-200 cursor-pointer"
        style={{
          background: examMode ? "var(--warning-dim)" : "var(--bg-elevated)",
          border: `1px solid ${examMode ? "rgba(245,158,11,0.35)" : "var(--border)"}`,
        }}
        onClick={() => setExamMode((v) => !v)}
        id="toggle-exam-mode"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold" style={{ color: examMode ? "var(--warning)" : "var(--text-primary)" }}>
                ✈ Exam Mode
              </span>
              <span
                className="px-1.5 py-0.5 rounded text-xs font-bold uppercase"
                style={{
                  background: examMode ? "rgba(245,158,11,0.2)" : "var(--bg-overlay)",
                  color: examMode ? "var(--warning)" : "var(--text-muted)",
                }}
              >
                50 Qs · 50 min
              </span>
            </div>
            <p className="text-xs" style={{ color: examMode ? "var(--warning)" : "var(--text-muted)" }}>
              50 random questions · visual timer · all chapters
            </p>
          </div>
          {/* Toggle */}
          <div className={`toggle-track ${examMode ? "active" : ""}`}
            style={examMode ? { background: "#d97706", borderColor: "#f59e0b" } : {}}>
            <div className="toggle-thumb" />
          </div>
        </div>
      </div>

      {/* ── PRACTICE CONFIG (hidden in exam mode) ── */}
      <div
        className="space-y-4 transition-all duration-300"
        style={{
          opacity: examMode ? 0.35 : 1,
          pointerEvents: examMode ? "none" : "auto",
        }}
      >
        {/* Chapter selector */}
        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Chapter
          </label>
          <div className="relative">
            <select
              id="select-chapter"
              value={selectedChapter}
              onChange={(e) => {
                setSelectedChapter(e.target.value);
                setUseAll(true);
              }}
              disabled={examMode}
              className="w-full px-4 py-3 rounded-xl text-sm appearance-none cursor-pointer transition-all duration-150"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                outline: "none",
              }}
              onFocus={(e) => { e.target.style.borderColor = "var(--border-active)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
            >
              <option value="">All Chapters ({questionCounts[""] ?? 0} questions)</option>
              {chapters.map((ch) => (
                <option key={ch} value={ch}>
                  {ch} ({questionCounts[ch] ?? 0} questions)
                </option>
              ))}
            </select>
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-muted)" }}
            >
              ▾
            </div>
          </div>
        </div>

        {/* Question count — Slider */}
        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--text-secondary)" }}
          >
            Number of Questions
          </label>

          {/* All toggle */}
          <div
            className="flex items-center justify-between px-4 py-2.5 rounded-xl cursor-pointer mb-3 transition-all duration-150"
            style={{
              background: useAll ? "var(--accent)" : "var(--bg-elevated)",
              border: `1px solid ${useAll ? "var(--sky-600)" : "var(--border)"}`,
            }}
            onClick={() => setUseAll((v) => !v)}
            id="toggle-use-all"
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: useAll ? "white" : "var(--text-primary)" }}>
                All Questions
              </p>
              <p className="text-xs" style={{ color: useAll ? "rgba(255,255,255,0.7)" : "var(--text-muted)" }}>
                {availableCount} questions available
              </p>
            </div>
            <div className={`toggle-track ${useAll ? "active" : ""}`}>
              <div className="toggle-thumb" />
            </div>
          </div>

          {/* Slider — only visible when not using All */}
          <div
            className="transition-all duration-300 overflow-hidden"
            style={{
              maxHeight: useAll ? "0px" : "80px",
              opacity: useAll ? 0 : 1,
            }}
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>10</span>
              <span className="text-lg font-bold" style={{ color: "var(--sky-400)" }}>
                {clampedSlider}
              </span>
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{availableCount}</span>
            </div>
            <input
              type="range"
              id="slider-question-count"
              className="range-slider w-full"
              min={10}
              max={availableCount}
              step={1}
              value={clampedSlider}
              onChange={(e) => setSliderValue(parseInt(e.target.value, 10))}
              disabled={useAll}
            />
          </div>
        </div>

        {/* Randomize toggle */}
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-150"
          style={{
            background: "var(--bg-elevated)",
            border: `1px solid ${randomize ? "var(--border-active)" : "var(--border)"}`,
          }}
          onClick={() => setRandomize((v) => !v)}
          id="toggle-randomize"
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Randomize Questions
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Shuffle order on each attempt
            </p>
          </div>
          <div className={`toggle-track ${randomize ? "active" : ""}`}>
            <div className="toggle-thumb" />
          </div>
        </div>

        {/* Seen In Exam toggle */}
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-150"
          style={{
            background: "var(--bg-elevated)",
            border: `1px solid ${seenInExam ? "var(--sky-500)" : "var(--border)"}`,
          }}
          onClick={() => setSeenInExam((v) => !v)}
          id="toggle-seen-in-exam"
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Seen In Exam Questions
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Only questions reported from real exams
            </p>
          </div>
          <div className={`toggle-track ${seenInExam ? "active" : ""}`}>
            <div className="toggle-thumb" />
          </div>
        </div>
      </div>

      {/* Summary + Start */}
      <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Ready to attempt</p>
            <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {effectiveCount} question{effectiveCount !== 1 ? "s" : ""}
            </p>
          </div>
          {!examMode && (
            <div className="text-right">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Chapter</p>
              <p className="text-sm font-semibold" style={{ color: "var(--sky-400)" }}>
                {selectedChapter || "All"}
              </p>
            </div>
          )}
          {examMode && (
            <div className="text-right">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Timer</p>
              <p className="text-sm font-semibold" style={{ color: "var(--warning)" }}>
                50 min
              </p>
            </div>
          )}
        </div>

        <button
          id="btn-start-quiz"
          type="button"
          disabled={isPending || effectiveCount === 0}
          onClick={handleStart}
          className="w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: examMode
              ? "linear-gradient(135deg, #d97706, #f59e0b)"
              : "var(--sky-600)",
            color: "white",
          }}
          onMouseEnter={(e) => {
            if (!isPending) {
              e.currentTarget.style.transform = "translateY(-1px)";
              if (!examMode) e.currentTarget.style.background = "var(--sky-500)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            if (!examMode) e.currentTarget.style.background = "var(--sky-600)";
          }}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Preparing…
            </span>
          ) : examMode ? (
            "Begin Exam ✈"
          ) : (
            "Start Quiz →"
          )}
        </button>
      </div>
    </div>
  );
}
