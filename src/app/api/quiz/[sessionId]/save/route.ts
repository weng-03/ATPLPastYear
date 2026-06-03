import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { QuizSession } from "@/types/database";

/**
 * POST /api/quiz/[sessionId]/save
 * Body: Partial<QuizSession> — the fields to update.
 *
 * Called by the QuizEngine client component to persist progress.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let updates: Partial<QuizSession>;
  try {
    updates = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Only allow updating safe fields (never allow changing user_id, etc.)
  const allowedKeys: Array<keyof QuizSession> = [
    "status",
    "current_question_index",
    "answers",
    "score",
    "completed_at",
    "time_remaining_seconds",
  ];
  const safeUpdates: Partial<QuizSession> = {};
  for (const key of allowedKeys) {
    if (key in updates) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (safeUpdates as any)[key] = (updates as any)[key];
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("quiz_sessions")
    .update(safeUpdates)
    .eq("id", sessionId)
    .eq("user_id", user.id); // Ensure users can only update their own sessions

  if (error) {
    console.error("[api/quiz/save]", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
