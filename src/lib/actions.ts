"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";
import { reportQuestionSeen, getQuestionSeenCounts, postQuestionComment, deleteQuestionComment, getQuestionComments, getProfile, updateProfile, getUserQuestionReport, toggleQuestionReport } from "./supabase/queries";

export async function submitQuestionSeenReport(questionId: number, airline: string) {
  return await reportQuestionSeen(questionId, airline);
}

export async function fetchQuestionSeenCounts(questionId: number) {
  return await getQuestionSeenCounts(questionId);
}

export async function fetchQuestionComments(questionId: number) {
  return await getQuestionComments(questionId);
}

export async function submitQuestionComment(questionId: number, commentText: string) {
  const ok = await postQuestionComment(questionId, commentText);
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
  const { data, error } = await supabase.auth.updateUser({ email });
  if (error) {
    return { success: false, message: error.message };
  }
  return { success: true, message: "A confirmation link has been sent to both your old and new email addresses." };
}

export async function updateUserPassword(password: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.updateUser({ password });
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
