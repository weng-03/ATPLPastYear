import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * GET /api/diagnose
 * 
 * Temporary diagnostic route — visit this in your browser to see
 * exactly what's happening with your Supabase database.
 * DELETE this file once everything is working.
 */
export async function GET() {
  const supabase = await createClient();

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const results: Record<string, unknown> = {
    auth: { userId: user.id, isAnonymous: user.is_anonymous },
  };

  // 1. Check if questions table is accessible + count rows
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: qCount, error: qErr } = await (supabase as any)
    .from("questions")
    .select("*", { count: "exact", head: true });

  results.questions_table = {
    accessible: !qErr,
    total_rows: qCount ?? 0,
    error: qErr?.message ?? null,
  };

  // 2. Fetch a few sample rows to check column names
  if (!qErr) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sample, error: sErr } = await (supabase as any)
      .from("questions")
      .select("*")
      .limit(2);

    results.sample_questions = {
      rows: sample ?? [],
      columns: sample?.[0] ? Object.keys(sample[0]) : [],
      error: sErr?.message ?? null,
    };
  }

  // 3. Check distinct chapters
  if (!qErr && (qCount ?? 0) > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: chaps, error: cErr } = await (supabase as any)
      .from("questions")
      .select("chapter")
      .order("chapter");

    const uniqueChapters = chaps
      ? [...new Set((chaps as Array<{ chapter: string }>).map((r) => r.chapter))]
      : [];

    results.chapters = {
      list: uniqueChapters,
      count: uniqueChapters.length,
      error: cErr?.message ?? null,
    };
  }

  // 4. Check quiz_sessions table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: sCount, error: sErr } = await (supabase as any)
    .from("quiz_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  results.quiz_sessions_table = {
    accessible: !sErr,
    your_sessions: sCount ?? 0,
    error: sErr?.message ?? null,
  };

  return Response.json(results, {
    headers: { "Content-Type": "application/json" },
  });
}
