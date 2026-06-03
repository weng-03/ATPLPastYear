"use client";

import { useState, useEffect } from "react";
import { submitQuestionComment, removeQuestionComment, fetchQuestionComments } from "@/lib/actions";
import type { QuestionComment } from "@/types/database";

interface CommunityCommentsProps {
  questionId: number;
  currentUserId: string;
}

export default function CommunityComments({ questionId, currentUserId }: CommunityCommentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState<QuestionComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, questionId]);

  const loadComments = async () => {
    setIsLoading(true);
    const data = await fetchQuestionComments(questionId);
    setComments(data);
    setIsLoading(false);
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    const success = await submitQuestionComment(questionId, newComment.trim());
    if (success) {
      setNewComment("");
      await loadComments();
    } else {
      alert("Failed to post comment.");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (commentId: string | number) => {
    if (!confirm("Delete this comment?")) return;
    const success = await removeQuestionComment(commentId);
    if (success) {
      await loadComments();
    } else {
      alert("Failed to delete comment.");
    }
  };

  return (
    <div className="mt-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 rounded-xl border transition-colors"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
      >
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
          Community Tips & Comments
        </h3>
        <span style={{ color: "var(--text-muted)" }}>{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="mt-4 p-5 rounded-xl border animate-slide-up" style={{ background: "var(--bg-overlay)", borderColor: "var(--border)" }}>
          {isLoading ? (
            <div className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>Loading comments...</div>
          ) : (
            <div className="space-y-4 mb-6">
              {comments.length === 0 ? (
                <div className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>No comments yet. Be the first to share a tip!</div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="p-4 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
                      {comment.comment_text}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                      <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                      {comment.user_id === currentUserId && (
                        <button 
                          onClick={() => handleDelete(comment.id)}
                          className="hover:text-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <form onSubmit={handlePost} className="flex flex-col gap-3 border-t pt-4" style={{ borderColor: "var(--border)" }}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share a mnemonic, tip, or clarification..."
              className="w-full p-3 rounded-lg text-sm bg-transparent border focus:outline-none transition-colors resize-none h-20"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="self-end px-5 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: "var(--sky-600)", color: "white" }}
            >
              {isSubmitting ? "Posting..." : "Post Comment"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
