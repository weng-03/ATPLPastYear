// ============================================================
// Database Types — mirrors Supabase PostgreSQL schema
// ============================================================

/**
 * Represents a single question row from the `questions` table.
 */
export interface Question {
  id: number;
  chapter: string;
  question_number: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  /** The correct answer key: 'A' | 'B' | 'C' | 'D' */
  correct_answer: 'A' | 'B' | 'C' | 'D';
  image_url: string | null;
  explanation: string | null;
}

export interface QuestionSeenReport {
  id: string;
  user_id: string;
  question_id: number;
  airline: string;
  reported_at: string;
}

export interface QuestionReport {
  id: string;
  user_id: string;
  question_id: number;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  updated_at: string | null;
}

export interface QuestionComment {
  id: string;
  question_id: number;
  user_id: string;
  comment_text: string;
  image_url?: string | null;
  created_at: string;
  profiles?: { display_name: string | null } | null;
}

/**
 * A question option after visual shuffling.
 * Maps a display label (A/B/C/D shown on screen) to the original answer key.
 */
export interface ShuffledOption {
  /** The label shown to the user (A, B, C, D) */
  displayLabel: 'A' | 'B' | 'C' | 'D';
  /** The text content of this option */
  text: string;
  /** The original answer key this option maps to (used for correctness check) */
  originalKey: 'A' | 'B' | 'C' | 'D';
}

/**
 * A question enriched with its shuffled options for quiz rendering.
 */
export interface QuizQuestion extends Question {
  shuffledOptions: ShuffledOption[];
}

// ============================================================
// Quiz Session Types — for saving/loading quiz state
// ============================================================

export type QuizStatus = 'in_progress' | 'paused' | 'completed';

export type ExamMode = 'practice' | 'exam';

/**
 * Represents a user's answer to a single question in a quiz session.
 * `selectedDisplayLabel` is the label the user clicked (A/B/C/D on screen).
 * `originalKey` is the actual answer key after un-shuffling.
 * `isCorrect` is pre-computed at answer time.
 */
export interface UserAnswer {
  questionId: number;
  selectedDisplayLabel: 'A' | 'B' | 'C' | 'D';
  originalKeySelected: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  /** Serialized shuffled option order so we can replay the same layout on resume */
  shuffleOrder: Array<'A' | 'B' | 'C' | 'D'>;
}

/**
 * A full quiz session as stored/loaded from Supabase.
 * The `quiz_sessions` table will hold a JSONB column for `answers`
 * and a JSONB column for `question_ids` (ordered list).
 */
export interface QuizSession {
  id: string;                    // UUID from Supabase
  user_id: string;               // Auth user UUID
  status: QuizStatus;
  mode: ExamMode;
  chapter: string | null;        // null means "All Chapters"
  total_questions: number;
  current_question_index: number;
  question_ids: number[];        // Ordered array of question IDs
  answers: Record<number, UserAnswer>; // questionId → answer
  score?: number;                // Populated on completion
  started_at: string;            // ISO timestamp
  completed_at?: string;         // ISO timestamp
  time_remaining_seconds?: number; // For exam mode timer persistence
}

// ============================================================
// Supabase Database generic type (for typed client)
// ============================================================

export type Database = {
  public: {
    Tables: {
      questions: {
        Row: Question;
        Insert: Omit<Question, 'id'>;
        Update: Partial<Omit<Question, 'id'>>;
      };
      quiz_sessions: {
        Row: QuizSession;
        Insert: Omit<QuizSession, 'id'>;
        Update: Partial<Omit<QuizSession, 'id'>>;
      };
    };
  };
};
