"use server";

import { reportQuestionSeen, getQuestionSeenCounts, postQuestionComment, deleteQuestionComment, getQuestionComments, getProfile, updateProfile } from "./supabase/queries";

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
  return await postQuestionComment(questionId, commentText);
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
