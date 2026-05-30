"use client";

import {
  AlertCircle,
  CreditCard,
  Clock,
  KeyRound,
  ServerCrash,
  ExternalLink,
} from "lucide-react";
import { AppError, ApiErrorCode } from "@/types";

interface ErrorBannerProps {
  error: AppError;
}

const CONFIG: Record<
  ApiErrorCode,
  {
    icon: React.ReactNode;
    title: string;
    bg: string;
    border: string;
    text: string;
    linkLabel?: string;
  }
> = {
  quota_exceeded: {
    icon: <CreditCard className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />,
    title: "APIクレジット残高不足",
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-800",
    linkLabel: "OpenAI 請求ページを開く →",
  },
  rate_limit: {
    icon: <Clock className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />,
    title: "レートリミット超過",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-800",
    linkLabel: "レートリミットについて →",
  },
  invalid_key: {
    icon: <KeyRound className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />,
    title: "APIキーが無効",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    linkLabel: "APIキー管理ページを開く →",
  },
  model_not_found: {
    icon: <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />,
    title: "モデルが見つかりません",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
  },
  context_too_long: {
    icon: <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />,
    title: "コンテキスト上限超過",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
  },
  server_error: {
    icon: <ServerCrash className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />,
    title: "OpenAIサーバーエラー",
    bg: "bg-slate-50",
    border: "border-slate-300",
    text: "text-slate-700",
    linkLabel: "OpenAI ステータスページ →",
  },
  unknown: {
    icon: <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />,
    title: "エラーが発生しました",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
  },
};

export function ErrorBanner({ error }: ErrorBannerProps) {
  const cfg = CONFIG[error.code] ?? CONFIG.unknown;

  return (
    <div className={`rounded-lg border ${cfg.border} ${cfg.bg} px-4 py-3`}>
      <div className="flex items-start gap-3">
        {cfg.icon}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${cfg.text}`}>{cfg.title}</p>
          {/* Split on newlines so multi-line messages render properly */}
          {error.message.split("\n").map((line, i) => (
            <p key={i} className={`text-xs mt-0.5 ${cfg.text} opacity-90`}>
              {line}
            </p>
          ))}
          {error.actionUrl && cfg.linkLabel && (
            <a
              href={error.actionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 mt-2 text-xs font-medium underline underline-offset-2 ${cfg.text}`}
            >
              <ExternalLink className="h-3 w-3" />
              {cfg.linkLabel}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
