import { createClient } from "@/lib/supabase/server";
import type { QuizSession } from "@/types/database";

// ============================================================
// Questions Queries
// ============================================================

/**
 * Fetch all chapters with their question counts in a single RPC call.
 * Falls back to the old paginated approach if the RPC doesn't exist.
 */
export async function getChapterCounts(): Promise<{ chapters: string[]; countMap: Record<string, number> }> {
  const supabase = await createClient();

  // Try the optimized RPC first
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('get_chapter_counts');

  if (!error && data && data.length > 0) {
    const countMap: Record<string, number> = {};
    let total = 0;
    const chapters: string[] = [];

    for (const row of data as { chapter: string; question_count: number }[]) {
      countMap[row.chapter] = row.question_count;
      total += row.question_count;
      chapters.push(row.chapter);
    }
    countMap[""] = total;
    return { chapters, countMap };
  }

  // Fallback: paginated approach (if RPC not deployed yet)
  console.warn('[getChapterCounts] RPC not available, using fallback. Error:', error?.message);
  const allChapters = new Set<string>();
  let hasMore = true;
  let offset = 0;
  const PAGE_SIZE = 1000;

  while (hasMore) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pageData, error: pageError } = await (supabase as any)
      .from("questions")
      .select("chapter")
      .range(offset, offset + PAGE_SIZE - 1);

    if (pageError) { console.error("[getChapterCounts:fallback]", pageError.message); break; }
    if (pageData && pageData.length > 0) {
      pageData.forEach((r: { chapter: string }) => allChapters.add(r.chapter));
      offset += PAGE_SIZE;
    }
    if (!pageData || pageData.length < PAGE_SIZE) hasMore = false;
  }

  const chapters = Array.from(allChapters).sort();
  const countMap: Record<string, number> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: totalCount } = await (supabase as any)
    .from("questions")
    .select("id", { count: "exact", head: true });
  countMap[""] = totalCount ?? 0;

  await Promise.all(
    chapters.map(async (ch) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: c } = await (supabase as any)
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("chapter", ch);
      countMap[ch] = c ?? 0;
    })
  );

  return { chapters, countMap };
}

/**
 * Fetch question IDs matching the given criteria.
 * Returns an array of IDs (randomized if requested, limited to `limit`).
 */
export async function fetchQuestionIds({
  chapter,
  limit,
  randomize,
  seenInExamFilter,
}: {
  chapter?: string;
  limit?: number;
  randomize?: boolean;
  seenInExamFilter?: boolean;
}): Promise<number[]> {
  const supabase = await createClient();
  let allIds: number[] = [];
  
  let hasMore = true;
  let offset = 0;
  const PAGE_SIZE = 1000;

  while (hasMore) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any).from("questions").select("id").range(offset, offset + PAGE_SIZE - 1);
    if (chapter) query = query.eq("chapter", chapter);
    if (seenInExamFilter) {
      // First, get all distinct question_ids from the seen reports table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: seenData, error: seenError } = await (supabase as any)
        .from("question_seen_reports")
        .select("question_id");
      if (seenError) {
        console.error("[fetchQuestionIds:seenInExamFilter]", seenError.message);
      } else {
        const seenIds = Array.from(new Set((seenData || []).map((r: any) => r.question_id)));
        if (seenIds.length > 0) {
          query = query.in("id", seenIds);
        } else {
          // If no questions are seen in exam, return empty result quickly
          return [];
        }
      }
    }

    const { data, error } = await query;
    if (error) {
      console.error("[fetchQuestionIds]", error?.message);
      break;
    }

    if (data && data.length > 0) {
      allIds = allIds.concat(data.map((r: { id: number }) => r.id));
      offset += PAGE_SIZE;
    }

    if (!data || data.length < PAGE_SIZE) {
      hasMore = false;
    }
  }

  let ids = allIds;

  if (randomize) {
    // Fisher-Yates shuffle
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
  }

  if (limit) ids = ids.slice(0, limit);
  return ids;
}

/**
 * Fetch full question rows for a list of IDs, preserving the given order.
 */
export async function getQuestionsByIds(
  ids: number[]
): Promise<import("@/types/database").Question[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  
  const CHUNK_SIZE = 500;
  const chunks = [];
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    chunks.push(ids.slice(i, i + CHUNK_SIZE));
  }

  let allData: import("@/types/database").Question[] = [];

  for (const chunk of chunks) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("questions")
      .select("*")
      .in("id", chunk);

    if (error) {
      console.error("[getQuestionsByIds]", error?.message);
      // If one chunk fails, we might want to return what we have or just continue
      continue;
    }
    if (data) {
      allData = allData.concat(data);
    }
  }

  // Re-order to match the original `ids` order (Supabase returns in arbitrary order)
  const map = new Map<number, import("@/types/database").Question>(
    allData.map((q) => [q.id, q])
  );
  return ids.map((id) => map.get(id)).filter(Boolean) as import("@/types/database").Question[];
}

// ============================================================
// Quiz Session Queries
// ============================================================

/**
 * Fetch all active (paused / in_progress) quiz sessions for a user.
 */
export async function getActiveSessions(userId: string): Promise<QuizSession[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("quiz_sessions")
    .select("id, status, mode, chapter, total_questions, answers, score, started_at, completed_at, time_remaining_seconds, user_id")
    .eq("user_id", userId)
    .in("status", ["in_progress", "paused"])
    .order("started_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("[getActiveSessions]", error.message);
    return [];
  }
  return (data ?? []) as QuizSession[];
}

/**
 * Fetch all completed quiz sessions for a user.
 */
export async function getCompletedSessions(userId: string): Promise<QuizSession[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("quiz_sessions")
    .select("id, status, mode, chapter, total_questions, answers, score, started_at, completed_at, time_remaining_seconds, user_id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[getCompletedSessions]", error.message);
    return [];
  }
  return (data ?? []) as QuizSession[];
}

/**
 * Create a new quiz session and return its ID.
 */
export async function createQuizSession(
  session: Omit<QuizSession, "id">
): Promise<string | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("quiz_sessions")
    .insert(session)
    .select("id")
    .single();

  if (error) {
    console.error("[createQuizSession]", error.message);
    return null;
  }
  return (data as { id: string })?.id ?? null;
}

/**
 * Delete a quiz session by ID.
 */
export async function deleteQuizSession(sessionId: string): Promise<boolean> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("quiz_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    console.error("[deleteQuizSession]", error.message);
    return false;
  }
  return true;
}

/**
 * Save quiz progress (called on pause or answer submission).
 */
export async function saveQuizProgress(
  sessionId: string,
  updates: Partial<QuizSession>
): Promise<boolean> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("quiz_sessions")
    .update(updates)
    .eq("id", sessionId);

  if (error) {
    console.error("[saveQuizProgress]", error.message);
    return false;
  }
  return true;
}

/**
 * Fetch a single quiz session by ID (for resuming).
 */
export async function getQuizSession(
  sessionId: string,
  userId: string
): Promise<QuizSession | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("quiz_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("[getQuizSession]", error.message);
    return null;
  }
  return data as QuizSession;
}

// ============================================================
// Seen in Exam Queries
// ============================================================

export async function reportQuestionSeen(questionId: number, airline: string): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "User not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("question_seen_reports")
    .insert({ user_id: user.id, question_id: questionId, airline });

  if (error) {
    console.error("[reportQuestionSeen]", error.message, error.code);
    if (error.code === '23505') {
      // Unique constraint violation - already reported
      return { success: true, message: "Already reported" };
    }
    return { success: false, message: error.message };
  }
  return { success: true };
}

export async function getQuestionSeenCounts(questionId: number): Promise<Record<string, number>> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("question_seen_reports")
    .select("airline")
    .eq("question_id", questionId);

  if (error) {
    console.error("[getQuestionSeenCounts]", error.message);
    return {};
  }

  // Group by airline and count
  const counts: Record<string, number> = {};
  for (const row of (data ?? [])) {
    counts[row.airline] = (counts[row.airline] || 0) + 1;
  }
  return counts;
}

// ============================================================
// Community Comments Queries
// ============================================================

export async function getQuestionComments(questionId: number): Promise<import("@/types/database").QuestionComment[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("question_comments")
    .select("*, profiles(display_name)")
    .eq("question_id", questionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getQuestionComments]", error.message);
    return [];
  }
  return (data ?? []) as import("@/types/database").QuestionComment[];
}

export async function postQuestionComment(questionId: number, commentText: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("question_comments")
    .insert({
      question_id: questionId,
      user_id: user.id,
      comment_text: commentText,
    });

  if (error) {
    console.error("[postQuestionComment]", error.message);
    return false;
  }
  return true;
}

export async function deleteQuestionComment(commentId: string | number): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("question_comments")
    .delete()
    .match({ id: commentId, user_id: user.id }); // only delete if user_id matches

  if (error) {
    console.error("[deleteQuestionComment]", error.message);
    return false;
  }
  return true;
}

// ============================================================
// Profile Queries
// ============================================================

export async function getProfile(userId: string): Promise<import("@/types/database").Profile | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[getProfile]", error.message);
    return null;
  }
  return data as import("@/types/database").Profile | null;
}

export async function updateProfile(userId: string, displayName: string): Promise<boolean> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("profiles")
    .upsert({
      id: userId,
      display_name: displayName,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("[updateProfile]", error.message);
    return false;
  }
  return true;
}

// ============================================================
// Question Report Queries
// ============================================================

export async function getUserQuestionReport(questionId: number): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("question_reports")
    .select("id")
    .match({ question_id: questionId, user_id: user.id })
    .maybeSingle();

  if (error) {
    console.error("[getUserQuestionReport]", error.message);
    return false;
  }
  return !!data;
}

export async function toggleQuestionReport(questionId: number, isReporting: boolean): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  if (isReporting) {
    // Insert report
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("question_reports")
      .insert({ question_id: questionId, user_id: user.id });

    if (error && error.code !== "23505") { // Ignore unique violation
      console.error("[toggleQuestionReport:insert]", error.message);
      return false;
    }
  } else {
    // Delete report
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("question_reports")
      .delete()
      .match({ question_id: questionId, user_id: user.id });

    if (error) {
      console.error("[toggleQuestionReport:delete]", error.message);
      return false;
    }
  }
  return true;
}

/**
 * Search questions by text, explanation, or ID.
 */
export async function searchQuestions(query: string): Promise<import("@/types/database").Question[]> {
  if (!query || query.trim().length === 0) return [];
  const supabase = await createClient();

  const isNumber = /^\d+$/.test(query.trim());
  let dbQuery;

  if (isNumber) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dbQuery = (supabase as any).from("questions").select("*").or(`id.eq.${query},question_number.eq.${query}`);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dbQuery = (supabase as any).from("questions").select("*").or(`question_text.ilike.%${query}%,explanation.ilike.%${query}%`);
  }

  const { data, error } = await dbQuery;

  if (error) {
    console.error("[searchQuestions]", error.message);
    return [];
  }
  return data as import("@/types/database").Question[];
}
