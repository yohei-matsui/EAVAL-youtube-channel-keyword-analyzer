"use client";

import { Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Keyword } from "@/types";

interface KeywordsSectionProps {
  keywords: Keyword[];
}

const CATEGORY_CONFIG = {
  problem: {
    label: "悩み・問題",
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-400",
  },
  emotion: {
    label: "感情・感想",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-400",
  },
  topic: {
    label: "トピック",
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-700",
    dot: "bg-sky-400",
  },
};

function KeywordBadge({ keyword, rank }: { keyword: Keyword; rank: number }) {
  const cfg = CATEGORY_CONFIG[keyword.category] ?? CATEGORY_CONFIG.topic;
  const fontSize =
    rank <= 3
      ? "text-base font-semibold"
      : rank <= 8
        ? "text-sm font-medium"
        : "text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 ${cfg.bg} ${cfg.border} ${cfg.text} ${fontSize} transition-transform hover:scale-105`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {keyword.word}
      <span className="ml-0.5 text-xs opacity-60">×{keyword.count}</span>
    </span>
  );
}

export function KeywordsSection({ keywords }: KeywordsSectionProps) {
  if (keywords.length === 0) return null;

  const grouped = {
    problem: keywords.filter((k) => k.category === "problem"),
    emotion: keywords.filter((k) => k.category === "emotion"),
    topic: keywords.filter((k) => k.category === "topic"),
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
            <Hash className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <CardTitle className="text-base">テキストマイニング結果</CardTitle>
            <CardDescription className="text-xs">
              コメントから抽出した頻出キーワード（上位{keywords.length}語）
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
            <span key={key} className="flex items-center gap-1 text-xs text-slate-500">
              <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {(Object.entries(grouped) as [keyof typeof grouped, Keyword[]][]).map(
          ([category, kws]) =>
            kws.length > 0 && (
              <div key={category}>
                <p className="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {CATEGORY_CONFIG[category].label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {kws.map((kw, i) => (
                    <KeywordBadge
                      key={kw.word}
                      keyword={kw}
                      rank={keywords.indexOf(kw) + 1}
                    />
                  ))}
                </div>
              </div>
            )
        )}
      </CardContent>
    </Card>
  );
}
