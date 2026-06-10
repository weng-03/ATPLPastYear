import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  getChapterCounts,
  getActiveSessions,
  getCompletedSessions,
} from "@/lib/supabase/queries";
import Header from "@/components/dashboard/Header";
import QuizConfigPanel from "@/components/dashboard/QuizConfigPanel";
import SessionCard from "@/components/dashboard/SessionCard";

export const metadata: Metadata = {
  title: "Dashboard — ATPL Past Year",
  description: "Select your chapter, configure your quiz, and track your progress.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  // ── Auth guard ──
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // ── Parallel data fetching (single RPC for chapters + counts) ──
  const [{ chapters, countMap }, activeSessions, completedSessions] = await Promise.all([
    getChapterCounts(),
    getActiveSessions(user.id),
    getCompletedSessions(user.id),
  ]);

  const hasActiveSessions = activeSessions.length > 0;
  const hasCompletedSessions = completedSessions.length > 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      <Header email={user.email ?? "Pilot"} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome banner */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            Welcome back,{" "}
            <span style={{ color: "var(--sky-400)" }}>
              {user.email?.split("@")[0]}
            </span>{" "}
            ✈
          </h1>
          <p style={{ color: "var(--text-secondary)" }} className="text-sm">
            {hasActiveSessions
              ? `You have ${activeSessions.length} quiz${activeSessions.length > 1 ? "zes" : ""} in progress. Keep going!`
              : "Configure a new quiz below to begin studying."}
          </p>
        </div>

        {/* ── Main grid: Config panel + Sessions ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6 items-start">

          {/* LEFT: Quiz Config Panel */}
          <div className="animate-slide-up" style={{ animationDelay: "0.05s" }}>
            <QuizConfigPanel
              chapters={chapters}
              questionCounts={countMap}
            />
          </div>

          {/* RIGHT: Sessions */}
          <div className="space-y-6">

            {/* Active / Paused Sessions */}
            {hasActiveSessions && (
              <section>
                <div className="flex items-center gap-2 mb-3" >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: "var(--correct)" }}
                  />
                  <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    In Progress
                  </h2>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: "var(--bg-overlay)", color: "var(--text-muted)" }}
                  >
                    {activeSessions.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
                  {activeSessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              </section>
            )}

            {/* Completed Sessions */}
            {hasCompletedSessions && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }}>
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Completed
                  </h2>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: "var(--bg-overlay)", color: "var(--text-muted)" }}
                  >
                    {completedSessions.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                  {completedSessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              </section>
            )}

            {/* Empty state */}
            {!hasActiveSessions && !hasCompletedSessions && (
              <div
                className="card rounded-2xl flex flex-col items-center justify-center py-20 px-8 text-center animate-slide-up"
                style={{ animationDelay: "0.1s" }}
              >
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                  style={{
                    background: "var(--bg-overlay)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10" style={{ color: "var(--sky-400)" }}>
                    <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                  No quizzes yet
                </h3>
                <p className="text-sm max-w-xs" style={{ color: "var(--text-muted)" }}>
                  Configure your first quiz on the left and hit{" "}
                  <strong style={{ color: "var(--text-primary)" }}>Start Quiz</strong> to begin your aviation exam preparation.
                </p>
                <p className="text-xs mt-4" style={{ color: "var(--text-muted)" }}>
                  Study smart. Fly safe. ✈
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats footer if completed sessions exist */}
        {hasCompletedSessions && (
          <div
            className="mt-8 card rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-6 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            {[
              {
                label: "Quizzes Taken",
                value: completedSessions.length,
                color: "var(--sky-400)",
              },
              {
                label: "Avg. Score",
                value: `${Math.round(
                  completedSessions.reduce((sum, s) => sum + (s.score ?? 0), 0) /
                  completedSessions.length
                )}%`,
                color:
                  completedSessions.reduce((sum, s) => sum + (s.score ?? 0), 0) /
                    completedSessions.length >=
                  70
                    ? "var(--correct)"
                    : "var(--incorrect)",
              },
              {
                label: "Questions Attempted",
                value: completedSessions.reduce(
                  (sum, s) => sum + s.total_questions,
                  0
                ),
                color: "var(--text-primary)",
              },
              {
                label: "Best Score",
                value: `${Math.max(...completedSessions.map((s) => s.score ?? 0))}%`,
                color: "var(--warning)",
              },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p
                  className="text-2xl font-bold"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </p>
                <p className="text-xs mt-1 font-medium" style={{ color: "var(--text-muted)" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
