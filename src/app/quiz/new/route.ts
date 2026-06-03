import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchQuestionIds } from "@/lib/supabase/queries";
import type { ExamMode } from "@/types/database";

/**
 * GET /quiz/new?chapter=...&count=...&randomize=...&mode=...
 *
 * Creates a new quiz_sessions row and redirects to /quiz/[sessionId].
 * This is a Route Handler, not a page — it runs entirely on the server.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // ── Auth guard ──────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // ── Parse query params ──────────────────────────────────────
  const sp = request.nextUrl.searchParams;
  const chapter = sp.get("chapter") || undefined;   // undefined = all chapters
  const count   = parseInt(sp.get("count") ?? "20", 10);
  const randomize = sp.get("randomize") !== "false";
  const mode    = (sp.get("mode") ?? "practice") as ExamMode;
  const seenInExam = sp.get("seenInExam") === "true";

  // ── Pick question IDs ───────────────────────────────────────
  const ids = await fetchQuestionIds({
    chapter: chapter || undefined,
    limit: isNaN(count) ? 20 : count,
    randomize,
    seenInExamFilter: seenInExam,
  });

  if (ids.length === 0) {
    // No questions found — bounce back to dashboard with an error hint
    redirect("/dashboard?error=no-questions");
  }

  // ── Build the new session payload ───────────────────────────
  const now = new Date().toISOString();
  const sessionPayload = {
    user_id:                user.id,
    status:                 "in_progress" as const,
    mode,
    chapter:                chapter ?? null,
    total_questions:        ids.length,
    current_question_index: 0,
    question_ids:           ids,
    answers:                {} as Record<string, never>,
    started_at:             now,
    time_remaining_seconds: mode === "exam" ? 50 * 60 : undefined,
  };

  // ── Insert into Supabase ────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("quiz_sessions")
    .insert(sessionPayload)
    .select("id")
    .single();

  if (error || !data?.id) {
    console.error("[quiz/new] Failed to create session:", error?.message);
    redirect("/dashboard?error=session-create-failed");
  }

  redirect(`/quiz/${data.id}`);
}
