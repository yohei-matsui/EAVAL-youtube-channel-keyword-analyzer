"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Key, ShieldCheck, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const SS_KEY_YT = "yt_analyzer_yt_key";
const SS_KEY_OAI = "yt_analyzer_oai_key";

interface ApiKeySectionProps {
  youtubeApiKey: string;
  openaiApiKey: string;
  onYoutubeKeyChange: (key: string) => void;
  onOpenaiKeyChange: (key: string) => void;
  isLocked: boolean;
}

export function ApiKeySection({
  youtubeApiKey,
  openaiApiKey,
  onYoutubeKeyChange,
  onOpenaiKeyChange,
  isLocked,
}: ApiKeySectionProps) {
  const [showYt, setShowYt] = useState(false);
  const [showOai, setShowOai] = useState(false);
  const [restored, setRestored] = useState(false);

  // Restore keys from SessionStorage on first mount
  useEffect(() => {
    try {
      const yt = sessionStorage.getItem(SS_KEY_YT);
      const oai = sessionStorage.getItem(SS_KEY_OAI);
      if (yt) onYoutubeKeyChange(yt);
      if (oai) onOpenaiKeyChange(oai);
      if (yt || oai) setRestored(true);
    } catch {
      // sessionStorage unavailable (e.g. private browsing with strict settings)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleYtChange = (val: string) => {
    onYoutubeKeyChange(val);
    try { sessionStorage.setItem(SS_KEY_YT, val); } catch { /* noop */ }
  };

  const handleOaiChange = (val: string) => {
    onOpenaiKeyChange(val);
    try { sessionStorage.setItem(SS_KEY_OAI, val); } catch { /* noop */ }
  };

  const bothSet = youtubeApiKey.trim() && openaiApiKey.trim();

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
            <Key className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <CardTitle className="text-base">Step 1 — APIキー設定</CardTitle>
            <CardDescription className="text-xs flex items-center gap-1 mt-0.5">
              <Lock className="h-3 w-3" />
              キーはブラウザの SessionStorage にのみ保持され、サーバーには保存されません
            </CardDescription>
          </div>
          {restored && (
            <span className="ml-auto text-xs text-violet-600 bg-violet-50 border border-violet-200 rounded px-2 py-0.5">
              前回のキーを復元
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {/* YouTube API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">
              YouTube Data API v3
            </label>
            <div className="relative">
              <Input
                type={showYt ? "text" : "password"}
                placeholder="AIza..."
                value={youtubeApiKey}
                onChange={(e) => handleYtChange(e.target.value)}
                disabled={isLocked}
                className="pr-9 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowYt((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showYt ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* OpenAI API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">
              OpenAI API Key
            </label>
            <div className="relative">
              <Input
                type={showOai ? "text" : "password"}
                placeholder="sk-..."
                value={openaiApiKey}
                onChange={(e) => handleOaiChange(e.target.value)}
                disabled={isLocked}
                className="pr-9 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowOai((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showOai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {bothSet && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>両方のAPIキーが設定されています（セッション中は自動で保持）</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
