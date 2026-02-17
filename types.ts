
export enum QuestionType {
  MCQ = 'MCQ',
  SHORT = 'SHORT',
  LONG = 'LONG',
  FILL_BLANKS = 'FILL_BLANKS',
  TRUE_FALSE = 'TRUE_FALSE'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  markingRubric?: string; // Teacher feature: how to award partial marks
  cognitiveLevel?: 'Knowledge' | 'Understanding' | 'Application' | 'Analysis' | 'Synthesis' | 'Evaluation'; // Bloom's Taxonomy
  marks: number;
}

export interface QuestionPaper {
  id: string;
  createdAt: number;
  title: string;
  subject: string;
  institutionName: string;
  logoUrl?: string;
  totalMarks: number;
  duration: string;
  instructions: string[];
  watermark?: string;
  sections: {
    id: string;
    title: string;
    questions: Question[];
  }[];
}

export interface SourceFile {
  data: string;
  mimeType: string;
  name: string;
}

export interface GeneratorSettings {
  language: string;
  difficulty: Difficulty;
  mcqCount: number;
  shortCount: number;
  longCount: number;
  fillBlanksCount: number;
  trueFalseCount: number;
  title: string;
  subject: string;
  institutionName: string;
  duration: string;
  watermarkText: string;
  logoUrl: string;
}
