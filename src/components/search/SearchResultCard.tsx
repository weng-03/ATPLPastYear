"use client";

import { useState } from "react";
import type { Question } from "@/types/database";

interface SearchResultCardProps {
  question: Question;
}

export default function SearchResultCard({ question }: SearchResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className="card p-5 rounded-2xl transition-all duration-300"
      style={{ 
        background: "var(--bg-surface)",
        border: "1px solid var(--border)"
      }}
    >
      <div className="flex justify-between items-start gap-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: "var(--bg-overlay)", color: "var(--text-muted)" }}>
              #{question.id}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--sky-400)" }}>
              {question.chapter}
            </span>
          </div>
          <p className="font-semibold text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
            {question.question_text}
          </p>
        </div>
        <button 
          className="p-2 rounded-full transition-colors flex-shrink-0"
          style={{ background: isExpanded ? "var(--bg-overlay)" : "transparent", color: "var(--text-secondary)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t animate-slide-up" style={{ borderColor: "var(--border)" }}>
          {/* Options */}
          <div className="space-y-2 mb-4">
            {(['A', 'B', 'C', 'D'] as const).map(key => {
              const text = question[`option_${key.toLowerCase()}` as keyof Question];
              if (!text) return null;
              
              const isCorrect = question.correct_answer === key;
              return (
                <div 
                  key={key}
                  className="flex items-start gap-3 p-3 rounded-xl border"
                  style={{
                    background: isCorrect ? "rgba(16, 185, 129, 0.1)" : "var(--bg-overlay)",
                    borderColor: isCorrect ? "rgba(16, 185, 129, 0.3)" : "transparent",
                    color: isCorrect ? "var(--correct)" : "var(--text-secondary)"
                  }}
                >
                  <span className="font-bold text-xs mt-0.5">{key}</span>
                  <span className="text-sm">{String(text)}</span>
                </div>
              );
            })}
          </div>

          {/* Explanation */}
          {question.explanation && (
            <div className="p-4 rounded-xl text-sm leading-relaxed" style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)" }}>
              <span className="font-bold text-xs uppercase tracking-wider block mb-1" style={{ color: "var(--text-muted)" }}>Explanation</span>
              {question.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
