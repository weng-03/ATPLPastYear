"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";
import { reportQuestionSeen, getQuestionSeenCounts, postQuestionComment, deleteQuestionComment, getQuestionComments, getProfile, updateProfile, getUserQuestionReport, toggleQuestionReport, deleteQuizSession } from "./supabase/queries";

export async function submitQuestionSeenReport(questionId: number, airline: string) {
  return await reportQuestionSeen(questionId, airline);
}

export async function fetchQuestionSeenCounts(questionId: number) {
  return await getQuestionSeenCounts(questionId);
}

export async function fetchQuestionComments(questionId: number) {
  return await getQuestionComments(questionId);
}

export async function submitQuestionComment(questionId: number, commentText: string, imageUrl?: string) {
  const ok = await postQuestionComment(questionId, commentText, imageUrl);
  if (ok) revalidatePath("/quiz/[sessionId]", "page");
  return ok;
}

export async function removeQuestionComment(commentId: string | number) {
  return await deleteQuestionComment(commentId);
}

export async function fetchProfile(userId: string) {
  return await getProfile(userId);
}

export async function saveProfile(userId: string, displayName: string) {
  return await updateProfile(userId, displayName);
}

export async function updateUserEmail(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email });
  if (error) {
    return { success: false, message: error.message };
  }
  return { success: true, message: "A confirmation link has been sent to both your old and new email addresses." };
}

export async function updateUserPassword(password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { success: false, message: error.message };
  }
  return { success: true, message: "Password updated successfully." };
}

export async function fetchUserQuestionReport(questionId: number) {
  return await getUserQuestionReport(questionId);
}

export async function submitQuestionReportToggle(questionId: number, isReporting: boolean) {
  return await toggleQuestionReport(questionId, isReporting);
}

export async function removeQuizSession(sessionId: string) {
  const ok = await deleteQuizSession(sessionId);
  if (ok) revalidatePath("/dashboard");
  return ok;
}

export async function uploadCommentImage(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "No file provided" };

  if (!file.type.startsWith("image/")) {
    return { success: false, error: "Only images are allowed" };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "Image too large (max 5MB)" };
  }

  const ext = file.name.split('.').pop() || 'png';
  const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).storage
    .from("comment-images")
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error("[uploadCommentImage]", error.message);
    return { success: false, error: error.message };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: urlData } = (supabase as any).storage
    .from("comment-images")
    .getPublicUrl(fileName);

  return { success: true, url: urlData.publicUrl };
}
