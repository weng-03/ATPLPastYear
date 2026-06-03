import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getQuizSession, getQuestionsByIds } from "@/lib/supabase/queries";
import type { Question, ShuffledOption } from "@/types/database";

export const metadata: Metadata = {
  title: "Results — ATPL Past Year",
  description: "Review your quiz answers and see your final score.",
};

function rebuildOptions(q: Question, shuffleOrder?: Array<"A" | "B" | "C" | "D">): ShuffledOption[] {
  const keys: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];
  const textMap: Record<string, string> = {
    A: q.option_a,
    B: q.option_b,
    C: q.option_c,
    D: q.option_d,
  };
  const order = shuffleOrder ?? keys;
  return order.map((originalKey, idx) => ({
    displayLabel: keys[idx],
    text: textMap[originalKey],
    originalKey,
  }));
}

function ScoreMeter({ score }: { score: number }) {
  const passing = score >= 70;
  const color = passing ? "var(--correct)" : "var(--incorrect)";

  return (
    <div className="flex flex-col items-center py-10">
      {/* Ring */}
      <div
        className="relative w-36 h-36 rounded-full flex items-center justify-center mb-4"
        style={{
          background: `conic-gradient(${color} ${score}%, var(--bg-overlay) 0)`,
        }}
      >
        <div
          className="w-28 h-28 rounded-full flex flex-col items-center justify-center"
          style={{ background: "var(--bg-surface)" }}
        >
          <span className="text-4xl font-bold" style={{ color }}>
            {score}%
          </span>
          <span className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
            Score
          </span>
        </div>
      </div>
      <p
        className="text-lg font-bold"
        style={{ color: passing ? "var(--correct)" : "var(--incorrect)" }}
      >
        {passing ? "🎉 Pass — Well done!" : "📚 Keep Studying"}
      </p>
      <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
        {passing
          ? "You're above the 70% passing threshold."
          : "70% is required to pass. Review your wrong answers below."}
      </p>
    </div>
  );
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const session = await getQuizSession(sessionId, user.id);
  if (!session) notFound();

  if (session.status !== "completed") {
    redirect(`/quiz/${sessionId}`);
  }

  const questions = await getQuestionsByIds(session.question_ids);

  const score = session.score ?? 0;
  const answers = session.answers ?? {};
  const answeredArr = Object.values(answers);
  const correctCount = answeredArr.filter((a) => a.isCorrect).length;
  const wrongCount = answeredArr.filter((a) => !a.isCorrect).length;
  const skippedCount = session.total_questions - answeredArr.length;

  const completedDate = session.completed_at
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(session.completed_at))
    : "—";

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-base)" }}
    >
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between"
        style={{
          background: "var(--header-bg)",
          borderBottom: "1px solid var(--card-border)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background:
                score >= 70 ? "var(--correct)" : "var(--incorrect)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Quiz Results</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {session.chapter ?? "All Chapters"} · {completedDate}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard"
          id="btn-back-to-dashboard"
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
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
          ← Dashboard
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-16">
        {/* Score meter */}
        <div className="card rounded-2xl mt-6 mb-6 animate-slide-up">
          <ScoreMeter score={score} />

          {/* Stats grid */}
          <div
            className="grid grid-cols-3 gap-0 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            {[
              { label: "Correct", value: correctCount, color: "var(--correct)" },
              { label: "Wrong",   value: wrongCount,   color: "var(--incorrect)" },
              { label: "Skipped", value: skippedCount, color: "var(--text-muted)" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="py-4 text-center"
                style={{
                  borderRight: i < 2 ? `1px solid var(--border)` : "none",
                }}
              >
                <p className="text-xl font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-8 animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <Link
            href="/dashboard"
            id="btn-results-dashboard"
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-center transition-all duration-150"
            style={{
              background: "var(--bg-elevated)",
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
            Back to Dashboard
          </Link>
          <Link
            href={`/api/quiz/${session.id}/retake`}
            id="btn-retake"
            className="flex-1 py-3 rounded-xl text-sm font-bold text-center transition-all duration-200"
            style={{
              background: "var(--sky-600)",
              color: "white",
              border: "1px solid transparent"
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--sky-500)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--sky-400)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--sky-600)";
              (e.currentTarget as HTMLElement).style.borderColor = "transparent";
            }}
          >
            Retake Quiz ↺
          </Link>
        </div>

        {/* ── Question review ── */}
        <h2
          className="text-sm font-bold uppercase tracking-wider mb-4 animate-slide-up"
          style={{ color: "var(--text-secondary)", animationDelay: "0.1s" }}
        >
          Question Review
        </h2>

        <div className="space-y-4 stagger-children">
          {questions.map((q, idx) => {
            const userAnswer = answers[q.id];
            const shuffledOpts = rebuildOptions(q, userAnswer?.shuffleOrder);
            const correctDisplayLabel = shuffledOpts.find(
              (o) => o.originalKey === q.correct_answer
            )?.displayLabel;

            const wasCorrect  = userAnswer?.isCorrect;
            const wasAnswered = !!userAnswer;

            return (
              <div
                key={q.id}
                className="card rounded-xl p-4"
                style={{
                  borderColor: !wasAnswered
                    ? "var(--card-border)"
                    : wasCorrect
                    ? "rgba(16,185,129,0.25)"
                    : "rgba(239,68,68,0.25)",
                }}
              >
                {/* Question header */}
                <div className="flex items-start gap-3 mb-3">
                  <span
                    className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold"
                    style={{
                      background: !wasAnswered
                        ? "var(--bg-overlay)"
                        : wasCorrect
                        ? "var(--correct-dim)"
                        : "var(--incorrect-dim)",
                      color: !wasAnswered
                        ? "var(--text-muted)"
                        : wasCorrect
                        ? "var(--correct)"
                        : "var(--incorrect)",
                    }}
                  >
                    {idx + 1}
                  </span>
                  <p
                    className="text-base font-medium leading-relaxed flex-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {q.question_text}
                  </p>
                  <span className="flex-shrink-0 text-base">
                    {!wasAnswered ? "—" : wasCorrect ? "✓" : "✗"}
                  </span>
                </div>

                {/* Options */}
                <div className="space-y-1.5 ml-10">
                  {shuffledOpts.map((opt) => {
                    const isUserChoice = userAnswer?.selectedDisplayLabel === opt.displayLabel;
                    const isCorrect    = opt.displayLabel === correctDisplayLabel;

                    let bg    = "transparent";
                    let color = "var(--text-muted)";
                    let border = "transparent";

                    if (isCorrect) {
                      bg     = "var(--correct-dim)";
                      color  = "var(--correct)";
                      border = "rgba(16,185,129,0.3)";
                    } else if (isUserChoice && !isCorrect) {
                      bg     = "var(--incorrect-dim)";
                      color  = "var(--incorrect)";
                      border = "rgba(239,68,68,0.3)";
                    }

                    return (
                      <div
                        key={opt.displayLabel}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                        style={{ background: bg, border: `1px solid ${border}`, color }}
                      >
                        <span className="font-bold w-4 flex-shrink-0">{opt.displayLabel}.</span>
                        <span className="flex-1">{opt.text}</span>
                        {isCorrect && (
                          <span className="flex-shrink-0 text-xs font-semibold" style={{ color: "var(--correct)" }}>
                            ✓ Correct
                          </span>
                        )}
                        {isUserChoice && !isCorrect && (
                          <span className="flex-shrink-0 text-xs font-semibold" style={{ color: "var(--incorrect)" }}>
                            Your answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Not answered label */}
                {!wasAnswered && (
                  <p className="text-xs ml-10 mt-2" style={{ color: "var(--text-muted)" }}>
                    Not answered
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
