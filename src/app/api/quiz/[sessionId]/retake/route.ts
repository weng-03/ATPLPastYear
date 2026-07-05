import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const url = new URL(request.url);
  const wrongOnly = url.searchParams.get("wrongOnly") === "true";
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Fetch the old session
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: oldSession, error: oldError } = await (supabase as any)
    .from("quiz_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (oldError || !oldSession) {
    console.error("[retake] Failed to find session:", oldError?.message);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Build the new session payload
  const now = new Date().toISOString();

  // Determine which question IDs to include
  let questionIds: number[] = oldSession.question_ids;
  if (wrongOnly && oldSession.answers) {
    const answers = oldSession.answers as Record<number, { isCorrect: boolean }>;
    questionIds = (oldSession.question_ids as number[]).filter((qId) => {
      const answer = answers[qId];
      // Include questions that were answered incorrectly OR skipped (not answered at all)
      return !answer || !answer.isCorrect;
    });
    // If somehow all questions were correct, fall back to full retake
    if (questionIds.length === 0) {
      questionIds = oldSession.question_ids;
    }
  }

  const sessionPayload = {
    user_id: user.id,
    status: "in_progress" as const,
    mode: oldSession.mode,
    chapter: oldSession.chapter,
    total_questions: questionIds.length,
    current_question_index: 0,
    question_ids: questionIds,
    answers: {} as Record<string, never>,
    started_at: now,
    time_remaining_seconds: oldSession.mode === "exam" ? 50 * 60 : undefined,
  };

  // Insert new session
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newSession, error: newError } = await (supabase as any)
    .from("quiz_sessions")
    .insert(sessionPayload)
    .select("id")
    .single();

  if (newError || !newSession?.id) {
    console.error("[retake] Failed to create new session:", newError?.message);
    return NextResponse.redirect(new URL("/dashboard?error=session-create-failed", request.url));
  }

  // Redirect to new session
  return NextResponse.redirect(new URL(`/quiz/${newSession.id}`, request.url));
}
