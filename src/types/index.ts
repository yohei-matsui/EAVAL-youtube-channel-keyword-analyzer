export interface Comment {
  id: string;
  author: string;
  text: string;
  likeCount: number;
  publishedAt: string;
}

export interface Keyword {
  word: string;
  count: number;
  category: "problem" | "emotion" | "topic";
}

export interface Need {
  title: string;
  description: string;
  evidence: string;
}

export interface VideoIdea {
  title: string;
  description: string;
  targetPain: string;
}

export interface AnalysisResult {
  needs: Need[];
  videoIdeas: VideoIdea[];
  summary: string;
}

export type ApiErrorCode =
  | "quota_exceeded"
  | "rate_limit"
  | "invalid_key"
  | "model_not_found"
  | "context_too_long"
  | "server_error"
  | "unknown";

export interface AppError {
  message: string;
  code: ApiErrorCode;
  actionUrl?: string;
}

export interface AppState {
  youtubeApiKey: string;
  openaiApiKey: string;
  videoUrl: string;
  comments: Comment[];
  keywords: Keyword[];
  analysis: AnalysisResult | null;
  step: "idle" | "fetching" | "mining" | "analyzing" | "done";
  error: AppError | null;
  videoTitle: string;
  videoThumbnail: string;
  totalComments: number;
}
