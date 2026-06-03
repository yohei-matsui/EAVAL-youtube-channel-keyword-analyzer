"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Key, Sparkles, Play, BarChart2, ArrowRight } from "lucide-react";
import { KeywordResult } from "@/app/api/channel-keywords/route";
import { VideoItem } from "@/app/api/channel/route";
import { KeywordsTable } from "@/components/channel/KeywordsTable";
import { ExportButtons } from "@/components/channel/ExportButtons";

type Step = "idle" | "fetching" | "analyzing" | "done" | "error";

interface ChannelData {
  channelId: string;
  channelName: string;
  channelThumbnail: string;
  subscriberCount: number;
  videos: VideoItem[];
  recentCount: number;
  popularCount: number;
}

// ── Eye icon ────────────────────────────────────────────────────────────────
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ── API Key field ───────────────────────────────────────────────────────────
function ApiKeyField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  helpText,
  helpUrl,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled: boolean;
  helpText: string;
  helpUrl?: string;
  children?: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          <EyeIcon open={show} />
        </button>
      </div>
      {helpUrl ? (
        <a
          href={helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-600 underline hover:text-blue-800"
        >
          {helpText}
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      ) : (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
      {children}
    </div>
  );
}

// ── Step card ───────────────────────────────────────────────────────────────
function StepCard({
  number,
  title,
  icon,
  children,
}: {
  number: number;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-50">
          {icon}
        </div>
        <h2 className="text-base font-bold text-gray-800">
          Step {number} — {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

// ── Progress bar ────────────────────────────────────────────────────────────
function ProgressBar({ step }: { step: Step }) {
  const steps = [
    { key: "fetching",  label: "動画データ取得中…",          cap: 45 },
    { key: "analyzing", label: "Gemini AIがキーワードを分析中…", cap: 90 },
  ];
  const idx = steps.findIndex((s) => s.key === step);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (idx === -1) return;
    const start = idx === 0 ? 0 : 50;
    const cap   = steps[idx].cap;
    setPct(start);
    const id = setInterval(() => {
      setPct((prev) => {
        const next = prev + 10;
        if (next >= cap) { clearInterval(id); return cap; }
        return next;
      });
    }, 1200);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  if (idx === -1) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">{steps[idx].label}</p>
        <span className="text-xs text-gray-400">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-3 flex gap-4">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div
              className={`h-2 w-2 rounded-full ${
                i < idx ? "bg-red-400" : i === idx ? "animate-pulse bg-red-400" : "bg-gray-200"
              }`}
            />
            <span className={`text-xs ${i <= idx ? "text-gray-600" : "text-gray-300"}`}>
              {s.label.replace("中…", "")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stat chip ───────────────────────────────────────────────────────────────
function StatChip({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-lg font-bold tabular-nums text-gray-800">{value}</span>
      <span className="text-[11px] text-gray-400">{label}</span>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function ChannelPage() {
  const [youtubeKey, setYoutubeKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState("gemini-2.5-flash");
  const [channelInput, setChannelInput] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [channelData, setChannelData] = useState<ChannelData | null>(null);
  const [keywords, setKeywords] = useState<KeywordResult[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  const isRunning = step === "fetching" || step === "analyzing";
  const canRun = !isRunning && youtubeKey.trim() && geminiKey.trim() && channelInput.trim();

  const reset = () => {
    setStep("idle");
    setError(null);
    setChannelData(null);
    setKeywords([]);
    setSelectedCategory(null);
    setSelectedTags([]);
  };

  const filteredKeywords = keywords
    .filter((k) => !selectedCategory || k.category === selectedCategory)
    .filter((k) => selectedTags.length === 0 || selectedTags.every((t) => k.tags?.includes(t)));

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  const handleAnalyze = useCallback(async () => {
    if (!canRun) return;
    setStep("fetching");
    setError(null);
    setChannelData(null);
    setKeywords([]);

    try {
      const chRes = await fetch("/api/channel", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-youtube-api-key": youtubeKey },
        body: JSON.stringify({ channelInput }),
      });
      if (!chRes.ok) {
        const d = await chRes.json();
        throw new Error(d.error ?? "チャンネルデータの取得に失敗しました");
      }
      const chData: ChannelData & { videos: VideoItem[] } = await chRes.json();
      setChannelData(chData);

      setStep("analyzing");
      const kwRes = await fetch("/api/channel-keywords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": geminiKey,
          "x-gemini-model": geminiModel,
        },
        body: JSON.stringify({ videos: chData.videos, channelName: chData.channelName }),
      });
      if (!kwRes.ok) {
        const d = await kwRes.json();
        throw new Error(d.error ?? "キーワード分析に失敗しました");
      }
      const kwData = await kwRes.json();
      setKeywords(kwData.keywords ?? []);
      setStep("done");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "予期しないエラーが発生しました");
      setStep("error");
    }
  }, [canRun, youtubeKey, geminiKey, geminiModel, channelInput]);

  const models = [
    { id: "gemini-2.5-flash", label: "gemini-2.5-flash（推奨）" },
    { id: "gemini-2.0-flash", label: "gemini-2.0-flash" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-500">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white">
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5V8.5l6.5 3.5-6.5 3.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">
                YouTube チャンネル内キーワード分析ツール
              </h1>
              <p className="text-[11px] text-gray-400">by 株式会社EAVAL</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-3xl space-y-4 px-5 py-6">

        {/* Overview */}
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4">
          <p className="text-sm leading-relaxed text-gray-700">
            このツールは、指定したチャンネルの動画タイトルとサムネイル画像をAIが解析し、再生数を伸ばしているキーワードを自動で抽出します。
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            「どんな言葉が視聴者に刺さっているか」「どのキーワードがトレンドか」が一目でわかるため、次の動画タイトルやサムネイルの制作に活かせます。競合チャンネルの分析にも使うことで、参入すべきテーマや避けるべき表現の判断材料にもなります。
          </p>
        </div>

        {/* How to use */}
        <section className="pb-2">
          <p className="mb-5 text-center text-[11px] font-semibold uppercase tracking-widest text-slate-400">使い方</p>
          <div className="flex items-stretch gap-1.5">
            {([
              { step: "1", icon: <Key className="h-5 w-5" />,      label: "YouTube\nAPIキー取得",    desc: "Google Cloud Console で YouTube Data API v3 を有効化する" },
              { step: "2", icon: <Sparkles className="h-5 w-5" />, label: "Gemini\nAPIキー取得",     desc: "Google AI Studio で Gemini API キーを無料発行する" },
              { step: "3", icon: <Play className="h-5 w-5" />,     label: "チャンネルURLを\n入力・分析", desc: "分析したいチャンネルのURLや@ハンドルを貼り付けてスタート" },
              { step: "4", icon: <BarChart2 className="h-5 w-5" />,label: "キーワードで\n戦略を立てる",  desc: "指標タグを確認し、次の動画タイトル・サムネイル制作に活かす" },
            ] as const).map((item, i) => (
              <div key={item.step} className="flex flex-1 items-start">
                <div className="flex flex-1 flex-col items-center gap-2.5 rounded-xl border border-slate-100 bg-white px-2 py-4 text-center shadow-sm">
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500 shadow-sm">
                    {item.icon}
                    <span className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-700 ring-1 ring-slate-100 shadow-sm">
                      {item.step}
                    </span>
                  </div>
                  <p className="whitespace-pre-line text-[11px] font-bold leading-tight text-slate-800">{item.label}</p>
                  <p className="text-[10px] leading-snug text-slate-500">{item.desc}</p>
                </div>
                {i < 3 && (
                  <div className="shrink-0 px-0.5 pt-5 text-slate-300">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Step 1 — API キー設定 */}
        <StepCard
          number={1}
          title="APIキー設定"
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          }
        >
          <p className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            キーはブラウザの SessionStorage にのみ保持され、サーバーには保存されません
          </p>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <ApiKeyField
              label="YouTube Data API v3"
              value={youtubeKey}
              onChange={setYoutubeKey}
              placeholder="AIza."
              disabled={isRunning}
              helpText="YouTube Data API v3の取得方法はこちら（参考サイト）"
              helpUrl="https://note.com/yuki_tech/n/na82ad826df1f"
            />

            <ApiKeyField
              label="Gemini API Key"
              value={geminiKey}
              onChange={setGeminiKey}
              placeholder="AIza."
              disabled={isRunning}
              helpText="Gemini API Keyの取得方法はこちら（参考サイト）"
              helpUrl="https://monomonotech.jp/kurage/memo/m240725_get_gemini_api_key.html"
            >
              <div className="mt-1 flex flex-col gap-1.5">
                <p className="text-xs font-medium text-gray-600">使用モデル</p>
                <div className="flex flex-wrap gap-2">
                  {models.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setGeminiModel(m.id)}
                      disabled={isRunning}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                        geminiModel === m.id
                          ? "bg-red-500 text-white"
                          : "border border-gray-200 bg-white text-gray-600 hover:border-red-300"
                      } disabled:opacity-50`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400">
                  クォータエラーが続く場合は別のモデルをお試しください
                </p>
              </div>
            </ApiKeyField>
          </div>
        </StepCard>

        {/* Step 2 — チャンネル指定 */}
        <StepCard
          number={2}
          title="分析するチャンネルを指定"
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
              <polyline points="17 2 12 7 7 2" />
            </svg>
          }
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={channelInput}
              onChange={(e) => setChannelInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="https://www.youtube.com/@channelname"
              disabled={isRunning}
              className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:opacity-50"
            />
            <button
              onClick={handleAnalyze}
              disabled={!canRun}
              className="flex flex-shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-red-500 to-red-400 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              {isRunning ? "分析中…" : "キーワード分析スタート"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-gray-400">
            例: https://www.youtube.com/@MrBeast &nbsp;/&nbsp; @handle &nbsp;/&nbsp; UCxxxxxx（チャンネルID）
          </p>
        </StepCard>

        {/* Progress */}
        {isRunning && <ProgressBar step={step} />}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
            <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-700">エラーが発生しました</p>
              <p className="mt-0.5 text-xs text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Channel info */}
        {channelData && (
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            {channelData.channelThumbnail && (
              <img
                src={channelData.channelThumbnail}
                alt={channelData.channelName}
                className="h-11 w-11 flex-shrink-0 rounded-full object-cover ring-2 ring-gray-100"
              />
            )}
            <div className="flex-1" style={{ minWidth: 0 }}>
              <a
                href={`https://www.youtube.com/channel/${channelData.channelId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate font-semibold text-gray-800 hover:text-red-500 underline-offset-2 hover:underline transition-colors"
              >
                {channelData.channelName}
              </a>
              <p className="text-xs text-gray-400">
                登録者 {channelData.subscriberCount.toLocaleString("ja-JP")} 人
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center divide-x divide-gray-100 rounded-xl border border-gray-100 bg-gray-50 px-1">
              <div className="px-4 py-2"><StatChip value={channelData.videos.length} label="取得動画" /></div>
              <div className="px-4 py-2"><StatChip value={channelData.recentCount} label="最新" /></div>
              <div className="px-4 py-2"><StatChip value={channelData.popularCount} label="人気" /></div>
            </div>
          </div>
        )}

        {/* Results */}
        {keywords.length > 0 && channelData && (
          <div ref={resultRef} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50">
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-red-400" fill="none" stroke="currentColor" strokeWidth={2}>
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-800">キーワード分析結果</h3>
                <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white">
                  {filteredKeywords.length}{selectedCategory ? `/${keywords.length}` : ""} 件
                </span>
              </div>
              <ExportButtons keywords={keywords} channelName={channelData.channelName} />
            </div>

            {/* Tag legend */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
                <span className="flex items-center gap-1 text-[11px] text-gray-600">
                  <span>📝</span><span className="font-semibold">タイトル</span><span className="text-gray-400">— 動画タイトルへの出現数</span>
                </span>
                <span className="flex items-center gap-1 text-[11px] text-gray-600">
                  <span>🖼</span><span className="font-semibold">サムネイル</span><span className="text-gray-400">— サムネイル画像内テキストへの出現数</span>
                </span>
              </div>
              <p className="mb-2 text-[11px] font-semibold text-gray-500">
                指標タグの説明
                <span className="ml-1.5 font-normal text-gray-400">（タグをクリックして絞り込み・複数選択可）</span>
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {[
                  { tag: "高頻出",          bg: "#FEF3C7", color: "#92400E", desc: "タイトル＋サムネイルの合計出現数が多い" },
                  { tag: "再生数多",        bg: "#D1FAE5", color: "#065F46", desc: "関連動画の平均再生数がチャンネル平均の1.5倍超" },
                  { tag: "ハイトレンド",    bg: "#DBEAFE", color: "#1E40AF", desc: "4ヶ月以内の投稿に2件以上含まれる" },
                  { tag: "超ハイトレンド",  bg: "#EDE9FE", color: "#5B21B6", desc: "2ヶ月以内の投稿に2件以上含まれる" },
                  { tag: "タイトル高頻出",  bg: "#E0F2FE", color: "#0369A1", desc: "タイトルへの出現が3件以上" },
                  { tag: "サムネイル高頻出",bg: "#FCE7F3", color: "#9D174D", desc: "サムネイル内テキストへの出現が3件以上" },
                ].map(({ tag, bg, color, desc }) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <div key={tag} className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleTag(tag)}
                        style={{
                          backgroundColor: active ? color : bg,
                          color: active ? "#fff" : color,
                          outline: active ? `2px solid ${color}` : "none",
                        }}
                        className="inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0 transition-all"
                      >
                        {tag}
                      </button>
                      <span className="text-[11px] text-gray-500">{desc}</span>
                    </div>
                  );
                })}
              </div>
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="mt-2 text-[11px] text-red-400 underline hover:text-red-600"
                >
                  フィルターをリセット
                </button>
              )}
            </div>

            <p className="text-[11px] text-gray-400">
              ※180秒（3分）以下の短尺動画は除外しています
            </p>
            <p className="text-[11px] text-gray-400">
              列ヘッダーをクリックしてソート・<span className="font-semibold text-gray-500">行をクリックすると「理由」と「関連動画タイトル」が確認できます</span>
            </p>

            <KeywordsTable keywords={filteredKeywords} showSource={true} />

            <button
              onClick={reset}
              className="mt-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
            >
              リセットして再分析
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
