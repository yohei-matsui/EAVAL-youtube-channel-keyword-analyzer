"use client";

import { Sparkles, Lightbulb, Target, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnalysisResult } from "@/types";

interface AnalysisSectionProps {
  analysis: AnalysisResult;
}

export function AnalysisSection({ analysis }: AnalysisSectionProps) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-200">
              <Sparkles className="h-4 w-4 text-violet-700" />
            </div>
            <CardTitle className="text-base text-violet-900">AI分析サマリー</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-violet-800 leading-relaxed">{analysis.summary}</p>
        </CardContent>
      </Card>

      {/* Needs */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100">
              <Target className="h-4 w-4 text-rose-600" />
            </div>
            <div>
              <CardTitle className="text-base">視聴者の悩み・ニーズ TOP 3</CardTitle>
              <CardDescription className="text-xs">コメントから読み取れる潜在ニーズ</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {analysis.needs.map((need, i) => (
              <div
                key={i}
                className="relative rounded-xl border border-rose-100 bg-rose-50 p-4 hover:border-rose-200 transition-colors"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-rose-900">{need.title}</h3>
                </div>
                <p className="mb-3 text-xs text-rose-800 leading-relaxed">{need.description}</p>
                <div className="rounded-lg bg-white/60 px-2.5 py-1.5">
                  <p className="text-xs text-rose-600">
                    <span className="font-medium">根拠：</span>
                    {need.evidence}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Video Ideas */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <Video className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-base">次回の動画企画案 3選</CardTitle>
              <CardDescription className="text-xs">視聴者ニーズに基づくコンテンツアイデア</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {analysis.videoIdeas.map((idea, i) => (
              <div
                key={i}
                className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 hover:border-emerald-200 transition-colors"
              >
                <div className="mb-2 flex items-start gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white mt-0.5">
                    {i + 1}
                  </div>
                  <h3 className="text-sm font-semibold text-emerald-900 leading-snug">
                    {idea.title}
                  </h3>
                </div>
                <p className="mb-3 text-xs text-emerald-800 leading-relaxed">{idea.description}</p>
                <div className="flex items-start gap-1.5 rounded-lg bg-white/60 px-2.5 py-1.5">
                  <Lightbulb className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-700">
                    <span className="font-medium">解決する悩み：</span>
                    {idea.targetPain}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
