export interface Citation {
  type: "quran" | "hadith";
  ref: string; // e.g. "2:255" or "Bukhari 1/2"
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  confidence?: number;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  confidence: number;
} 