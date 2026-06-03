import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getQuizSession, getQuestionsByIds } from "@/lib/supabase/queries";
import QuizEngine from "@/components/quiz/QuizEngine";

export const metadata: Metadata = {
  title: "Quiz — ATPL Past Year",
  description: "Answer questions and track your aviation exam preparation progress.",
};

export default async function QuizPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  // ── Auth guard ──────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // ── Load session ────────────────────────────────────────────────────────
  const session = await getQuizSession(sessionId, user.id);

  if (!session) notFound();

  // If already completed, redirect straight to results
  if (session.status === "completed") {
    redirect(`/quiz/${sessionId}/results`);
  }

  // ── Load questions in session order ────────────────────────────────────
  const questions = await getQuestionsByIds(session.question_ids);

  if (questions.length === 0) {
    redirect("/dashboard?error=no-questions");
  }

  return <QuizEngine session={session} questions={questions} />;
}
