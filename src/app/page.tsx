"use client";

import { useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { ApiKeySection } from "@/components/ApiKeySection";
import { UrlInputSection } from "@/components/UrlInputSection";
import { CommentsSection } from "@/components/CommentsSection";
import { KeywordsSection } from "@/components/KeywordsSection";
import { AnalysisSection } from "@/components/AnalysisSection";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/ui/button";
import { AppState, AppError, ApiErrorCode } from "@/types";

const INITIAL_STATE: AppState = {
  youtubeApiKey: "",
  openaiApiKey: "",
  videoUrl: "",
  comments: [],
  keywords: [],
  analysis: null,
  step: "idle",
  error: null,
  videoTitle: "",
  videoThumbnail: "",
  totalComments: 0,
};

export default function Home() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);

  const update = useCallback((partial: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({
      ...INITIAL_STATE,
      youtubeApiKey: prev.youtubeApiKey,
      openaiApiKey: prev.openaiApiKey,
    }));
  }, []);

  /**
   * Safely fetch + parse JSON.
   * On non-OK responses, preserves structured error info (code, actionUrl)
   * from the API route and re-throws as an AppError-shaped object.
   */
  const safeJson = useCallback(
    async (res: Response, fallbackLabel: string): Promise<Record<string, unknown>> => {
      const text = await res.text();
      if (!res.ok) {
        let appError: AppError = {
          message: `${fallbackLabel} (HTTP ${res.status}): サーバーエラーが発生しました`,
          code: "unknown" as ApiErrorCode,
        };
        try {
          const j = JSON.parse(text) as { error?: string; code?: ApiErrorCode; actionUrl?: string };
          appError = {
            message: j.error ?? appError.message,
            code: j.code ?? "unknown",
            actionUrl: j.actionUrl,
          };
        } catch { /* body wasn't JSON, use fallback */ }
        console.error(`[${fallbackLabel}] HTTP ${res.status}:`, text.slice(0, 300));
        throw appError; // throw the structured object, not a plain Error
      }
      try {
        return JSON.parse(text) as Record<string, unknown>;
      } catch {
        console.error(`[${fallbackLabel}] JSON parse failed. Raw:`, text.slice(0, 300));
        const appError: AppError = {
          message: `${fallbackLabel}: サーバーから無効なレスポンスが返されました。\n${text.slice(0, 150)}`,
          code: "unknown",
        };
        throw appError;
      }
    },
    []
  );

  const handleAnalyze = useCallback(async () => {
    if (!state.youtubeApiKey || !state.openaiApiKey || !state.videoUrl) return;

    update({ step: "fetching", error: null, comments: [], keywords: [], analysis: null });

    try {
      // Step 1: Fetch YouTube comments
      const ytRes = await fetch("/api/youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-youtube-api-key": state.youtubeApiKey,
        },
        body: JSON.stringify({ videoUrl: state.videoUrl, maxComments: 200 }),
      });
      const ytData = await safeJson(ytRes, "YouTubeコメント取得");

      update({
        comments: (ytData.comments ?? []) as AppState["comments"],
        videoTitle: (ytData.videoTitle ?? "") as string,
        videoThumbnail: (ytData.videoThumbnail ?? "") as string,
        totalComments: (ytData.totalComments ?? 0) as number,
        step: "mining",
      });

      // Step 2: Keyword extraction
      const kwRes = await fetch("/api/keywords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-openai-api-key": state.openaiApiKey,
        },
        body: JSON.stringify({ comments: ytData.comments }),
      });
      const kwData = await safeJson(kwRes, "キーワード抽出");

      update({
        keywords: (kwData.keywords ?? []) as AppState["keywords"],
        step: "analyzing",
      });

      // Step 3: AI needs analysis
      const aiRes = await fetch("/api/analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-openai-api-key": state.openaiApiKey,
        },
        body: JSON.stringify({
          comments: ytData.comments,
          keywords: kwData.keywords,
          videoTitle: ytData.videoTitle,
        }),
      });
      const aiData = await safeJson(aiRes, "AI分析");

      update({
        analysis: aiData.analysis as AppState["analysis"],
        step: "done",
      });
    } catch (err) {
      // err is either an AppError object (from safeJson) or a plain Error
      const appError: AppError =
        err && typeof err === "object" && "code" in err
          ? (err as AppError)
          : {
              message: err instanceof Error ? err.message : "予期しないエラーが発生しました",
              code: "unknown",
            };
      update({ step: "idle", error: appError });
    }
  }, [state.youtubeApiKey, state.openaiApiKey, state.videoUrl, update, safeJson]);

  const isRunning = ["fetching", "mining", "analyzing"].includes(state.step);
  const hasResults = state.comments.length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">YouTube Comment Analyzer</h1>
              <p className="text-xs text-slate-500">視聴者ニーズをAIで深掘り分析</p>
            </div>
          </div>
          {hasResults && !isRunning && (
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              リセット
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-20">

        {/* ══════════════════════════════════════════════
            ① TOP ZONE — API keys + URL + run
        ══════════════════════════════════════════════ */}
        <section className="space-y-4 py-6">
          <ApiKeySection
            youtubeApiKey={state.youtubeApiKey}
            openaiApiKey={state.openaiApiKey}
            onYoutubeKeyChange={(key) => update({ youtubeApiKey: key })}
            onOpenaiKeyChange={(key) => update({ openaiApiKey: key })}
            isLocked={isRunning}
          />
          <UrlInputSection
            videoUrl={state.videoUrl}
            onUrlChange={(url) => update({ videoUrl: url })}
            onAnalyze={handleAnalyze}
            isRunning={isRunning}
            step={state.step}
            disabled={!state.youtubeApiKey.trim() || !state.openaiApiKey.trim()}
          />

          {/* Error banner — type-aware */}
          {state.error && <ErrorBanner error={state.error} />}
        </section>

        {/* ══════════════════════════════════════════════
            ② MIDDLE ZONE — AI analysis report + keywords
            （コメント取得後に段階的に表示）
        ══════════════════════════════════════════════ */}
        {(state.keywords.length > 0 || state.analysis) && (
          <section className="space-y-4 pb-6">
            {/* Section divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                AI 分析レポート
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Keywords appear first (arrive with step "analyzing") */}
            {state.keywords.length > 0 && (
              <KeywordsSection keywords={state.keywords} />
            )}

            {/* Full analysis (arrive with step "done") */}
            {state.analysis && (
              <AnalysisSection analysis={state.analysis} />
            )}
          </section>
        )}

        {/* ══════════════════════════════════════════════
            ③ BOTTOM ZONE — Comment deep-dive + search
            （コメント取得完了後に表示）
        ══════════════════════════════════════════════ */}
        {state.comments.length > 0 && (
          <section className="pb-6">
            <CommentsSection
              comments={state.comments}
              videoTitle={state.videoTitle}
              videoThumbnail={state.videoThumbnail}
            />
          </section>
        )}
      </main>
    </div>
  );
}
