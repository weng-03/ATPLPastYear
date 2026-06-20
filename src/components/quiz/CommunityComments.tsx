"use client";

import { useState, useEffect } from "react";
import { submitQuestionComment, removeQuestionComment, fetchQuestionComments, uploadCommentImage } from "@/lib/actions";
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
  const [pastedImage, setPastedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

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
    if (!newComment.trim() && !pastedImage) return;

    setIsSubmitting(true);
    let imageUrl: string | undefined = undefined;
    
    if (pastedImage) {
      const formData = new FormData();
      formData.append("file", pastedImage);
      const res = await uploadCommentImage(formData);
      if (res.success && res.url) {
        imageUrl = res.url;
      } else {
        alert("Failed to upload image: " + (res.error || "Unknown error"));
        setIsSubmitting(false);
        return;
      }
    }

    const success = await submitQuestionComment(questionId, newComment.trim(), imageUrl);
    if (success) {
      setNewComment("");
      setPastedImage(null);
      setImagePreviewUrl(null);
      await loadComments();
    } else {
      alert("Failed to post comment.");
    }
    setIsSubmitting(false);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setPastedImage(file);
          setImagePreviewUrl(URL.createObjectURL(file));
          e.preventDefault();
          break;
        }
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPastedImage(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
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
                    {comment.image_url && (
                      <div className="mt-2">
                        <a href={comment.image_url} target="_blank" rel="noopener noreferrer">
                          <img src={comment.image_url} alt="Attachment" className="max-w-full h-auto rounded-lg border shadow-sm max-h-64 object-contain" style={{ borderColor: "var(--border)" }} />
                        </a>
                      </div>
                    )}
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
            {imagePreviewUrl && (
              <div className="relative inline-block self-start animate-fade-in">
                <img src={imagePreviewUrl} alt="Preview" className="max-h-32 rounded-lg border shadow-sm object-contain" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }} />
                <button
                  type="button"
                  onClick={() => { setPastedImage(null); setImagePreviewUrl(null); }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-md bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <label className="cursor-pointer p-3 rounded-lg transition-colors shrink-0 hover:opacity-80 flex items-center justify-center" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)" }} title="Attach Image">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onPaste={handlePaste}
                placeholder="Share a mnemonic, tip, or clarification... (Paste images with Ctrl+V)"
                className="w-full p-3 rounded-lg text-sm bg-transparent border focus:outline-none transition-colors resize-none h-14"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || (!newComment.trim() && !pastedImage)}
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
