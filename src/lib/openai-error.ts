import OpenAI from "openai";

export interface OpenAIErrorInfo {
  /** User-facing Japanese message */
  message: string;
  /** HTTP status to return to the client */
  status: number;
  /** Machine-readable key for the frontend to show specialised UI */
  code:
    | "quota_exceeded"
    | "rate_limit"
    | "invalid_key"
    | "model_not_found"
    | "context_too_long"
    | "server_error"
    | "unknown";
  /** Optional URL the user can visit to resolve the issue */
  actionUrl?: string;
}

/**
 * Inspect an unknown thrown value and return structured info.
 * Works for OpenAI SDK errors (APIError subclasses) and plain Errors.
 */
export function classifyOpenAIError(err: unknown): OpenAIErrorInfo {
  // OpenAI SDK throws APIError (or subclasses: RateLimitError, AuthenticationError, etc.)
  if (err instanceof OpenAI.APIError) {
    const { status, code, message } = err;

    // 429 – two distinct sub-cases
    if (status === 429) {
      if (code === "insufficient_quota" || message.includes("exceeded your current quota")) {
        return {
          message:
            "OpenAI APIのクレジット残高が不足しています。\n" +
            "OpenAIのダッシュボードで請求情報を確認し、クレジットを追加してください。",
          status: 402,
          code: "quota_exceeded",
          actionUrl: "https://platform.openai.com/settings/organization/billing",
        };
      }
      return {
        message:
          "OpenAI APIのリクエスト上限（レートリミット）に達しました。\n" +
          "しばらく待ってから再度お試しください。",
        status: 429,
        code: "rate_limit",
        actionUrl: "https://platform.openai.com/docs/guides/rate-limits",
      };
    }

    // 401 / 403 – bad key
    if (status === 401 || status === 403) {
      return {
        message:
          "OpenAI APIキーが無効です。\n" +
          "入力したキーが正しいか、有効期限が切れていないかを確認してください。",
        status: 401,
        code: "invalid_key",
        actionUrl: "https://platform.openai.com/api-keys",
      };
    }

    // 404 – wrong model name
    if (status === 404) {
      return {
        message:
          `モデル「${process.env.OPENAI_MODEL ?? "gpt-4o"}」が見つかりません。\n` +
          ".env.local の OPENAI_MODEL の値を確認してください。",
        status: 404,
        code: "model_not_found",
      };
    }

    // 400 – context length exceeded
    if (status === 400 && (code === "context_length_exceeded" || message.includes("context"))) {
      return {
        message:
          "送信するコメント数が多すぎてモデルのコンテキスト上限を超えました。\n" +
          "コメント取得数を減らして再試行してください。",
        status: 400,
        code: "context_too_long",
      };
    }

    // 5xx – OpenAI server error
    if (status >= 500) {
      return {
        message:
          "OpenAIのサーバーでエラーが発生しています。\n" +
          "しばらく待ってから再度お試しください。",
        status: 502,
        code: "server_error",
        actionUrl: "https://status.openai.com",
      };
    }

    // Generic API error
    return {
      message: `OpenAI API エラー (${status}): ${message}`,
      status: 502,
      code: "unknown",
    };
  }

  // Fallback for non-SDK errors (network failures, etc.)
  const msg = err instanceof Error ? err.message : String(err);
  return {
    message: `予期しないエラー: ${msg}`,
    status: 500,
    code: "unknown",
  };
}
