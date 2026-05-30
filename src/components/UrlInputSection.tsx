"use client";

import { Tv, Loader2, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface UrlInputSectionProps {
  videoUrl: string;
  onUrlChange: (url: string) => void;
  onAnalyze: () => void;
  isRunning: boolean;
  step: string;
  disabled: boolean;
}

const STEP_LABELS: Record<string, { label: string; progress: number }> = {
  idle: { label: "", progress: 0 },
  fetching: { label: "コメントを取得中...", progress: 30 },
  mining: { label: "キーワードを抽出中...", progress: 60 },
  analyzing: { label: "AIがニーズを分析中...", progress: 85 },
  done: { label: "分析完了", progress: 100 },
};

export function UrlInputSection({
  videoUrl,
  onUrlChange,
  onAnalyze,
  isRunning,
  step,
  disabled,
}: UrlInputSectionProps) {
  const stepInfo = STEP_LABELS[step] ?? STEP_LABELS.idle;

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
            <Tv className="h-4 w-4 text-red-600" />
          </div>
          <CardTitle className="text-base">Step 2 — 分析する動画を指定</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            disabled={isRunning}
            className="text-sm"
          />
          <Button
            onClick={onAnalyze}
            disabled={disabled || isRunning || !videoUrl.trim()}
            className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white"
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span className="ml-1.5">{isRunning ? "分析中..." : "分析スタート"}</span>
          </Button>
        </div>
        {isRunning && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500">
              <span>{stepInfo.label}</span>
              <span>{stepInfo.progress}%</span>
            </div>
            <Progress value={stepInfo.progress} className="h-1.5" />
          </div>
        )}
        {step === "done" && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-emerald-600">
              <span>✓ 分析が完了しました</span>
              <span>100%</span>
            </div>
            <Progress value={100} className="h-1.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
