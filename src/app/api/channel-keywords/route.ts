import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { VideoItem } from "../channel/route";

export interface VideoRef {
  title: string;
  url: string | null;
}

export interface KeywordResult {
  keyword: string;
  usage: number;
  titleUsage: number;
  thumbnailUsage: number;
  reason: string;
  category: string;
  points: number;
  videos: VideoRef[];
  source: "タイトル" | "サムネイル" | "両方";
  tags: string[];
}

function stripCodeFences(raw: string): string {
  // Remove opening fence (```json or ```) from start, then closing ``` from end
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  // If it now starts with [ it's ready to parse
  if (s.startsWith("[")) return s;
  // Fallback: extract outermost JSON array from anywhere in the string
  const arrMatch = raw.match(/\[[\s\S]*\]/);
  if (arrMatch) return arrMatch[0].trim();
  return s;
}

// Fetch thumbnail and convert to base64 inline data
async function fetchThumbnailPart(url: string): Promise<Part | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const buf = await res.arrayBuffer();
    return {
      inlineData: {
        mimeType: contentType.split(";")[0],
        data: Buffer.from(buf).toString("base64"),
      },
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-gemini-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key is required" }, { status: 400 });
  }
  const model = request.headers.get("x-gemini-model") || "gemini-2.5-flash";

  const { videos, channelName } = (await request.json()) as {
    videos: VideoItem[];
    channelName: string;
  };

  if (!videos || videos.length === 0) {
    return NextResponse.json({ error: "No video data provided" }, { status: 400 });
  }

  const avgViews = videos.reduce((sum, v) => sum + v.viewCount, 0) / videos.length;

  const videoList = videos
    .map(
      (v, i) =>
        `${i + 1}. [${v.type === "popular" ? "人気" : "最新"}] タイトル: "${v.title}" | 再生数: ${v.viewCount.toLocaleString()} | 投稿日: ${v.publishedAt.slice(0, 10)}`
    )
    .join("\n");

  // Fetch top 20 thumbnails by view count
  const top20 = [...videos]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 20)
    .filter((v) => v.thumbnailUrl);

  const thumbnailParts = (
    await Promise.all(top20.map((v) => fetchThumbnailPart(v.thumbnailUrl)))
  ).filter((p): p is Part => p !== null);

  const systemInstruction = `あなたはYouTubeチャンネルのコンテンツ戦略アナリストです。
動画タイトル・再生数・投稿日のテキストデータと、上位動画のサムネイル画像を合わせて分析し、効果的なキーワードを抽出してください。

## 分析対象
- テキスト: 全動画のタイトル・再生数・投稿日
- 画像: 再生数上位20件のサムネイル（視覚的なテーマ・色使い・テキスト・被写体・構図を分析）

## 抽出基準
- 高再生数: チャンネル平均（${Math.round(avgViews).toLocaleString()}回）を上回る動画のキーワード
- 頻出度: タイトルまたはサムネイルに繰り返し登場するキーワード
- トレンド: 直近3ヶ月以内の動画で使われているキーワード
- サムネイル: 画像から読み取れる共通テーマ・テキスト・被写体・デザインパターン

## 出力フォーマット
必ずJSON配列のみで出力してください（コードブロック・説明文不要）：
[
  {
    "keyword": "キーワード文字列",
    "usage": 0,
    "thumbnailUsage": サムネイル画像内にテキストとして写っている枚数(整数),
    "reason": "このキーワードが有効な理由（50字以内）",
    "category": "テーマ"|"手法"|"ターゲット"|"感情"|"トレンド"|"商品・サービス",
    "points": 重要度スコア1〜100(整数),
    "videos": ["関連する動画タイトル（最大3件）"],
    "source": "タイトル"|"サムネイル"|"両方"
  }
]

## sourceフィールドのルール
- "タイトル": 動画タイトルのテキストから検出したキーワード
- "サムネイル": サムネイル画像の視覚情報（テキスト・被写体・デザイン）から検出したキーワード
- "両方": タイトルとサムネイル両方に登場するキーワード

## thumbnailUsageフィールドのルール
- 提供されたサムネイル画像の中で、そのキーワードの文字列が画像内テキストとして実際に写っている枚数を数える
- 被写体やデザインテーマとして登場する場合はカウントしない（文字として写っている場合のみ）

## 注意事項
- タイトル由来を10〜15個、サムネイル由来を5〜10個（合計15〜25個）抽出する
- pointsの降順でソートする
- JSON以外の文字を一切出力しない`;

  const textPart: Part = {
    text: `チャンネル名: ${channelName}\n動画数: ${videos.length}件\n\n## 動画データ（全件）\n${videoList}\n\n## サムネイル画像（再生数上位${thumbnailParts.length}件）`,
  };

  let raw = "";
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const generativeModel = genAI.getGenerativeModel({ model, systemInstruction });
    const result = await generativeModel.generateContent({
      contents: [{ role: "user", parts: [textPart, ...thumbnailParts] }],
    });
    raw = result.response.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[channel-keywords] Gemini error:", msg);
    return NextResponse.json({ error: `Gemini APIエラー: ${msg}` }, { status: 502 });
  }

  let keywords: KeywordResult[] = [];
  try {
    keywords = JSON.parse(stripCodeFences(raw));
    if (!Array.isArray(keywords)) throw new Error("Not an array");
    // Calculate title usage by actual string match, combine with Gemini's thumbnail count
    keywords = keywords.map((kw) => {
      // Split compound keywords (e.g. "実践/実演", "A・B") and match any part
      const parts = kw.keyword.split(/[/／・、,，]/).map((p) => p.trim()).filter(Boolean);
      const titleUsage = videos.filter((v) => parts.some((p) => v.title.includes(p))).length;
      const thumbnailUsage = typeof kw.thumbnailUsage === "number" ? kw.thumbnailUsage : 0;
      return { ...kw, titleUsage, thumbnailUsage, usage: titleUsage + thumbnailUsage };
    });

    // Compute tags server-side
    const now = Date.now();
    const twoMonthMs  = 60  * 24 * 60 * 60 * 1000;
    const fourMonthMs = 120 * 24 * 60 * 60 * 1000;
    const usages = keywords.map((k) => k.usage);
    const medianUsage = usages.sort((a, b) => a - b)[Math.floor(usages.length / 2)] ?? 0;
    const highUsageThreshold        = Math.max(3, Math.ceil(medianUsage));
    const highTitleUsageThreshold   = 3;
    const highThumbUsageThreshold   = 3;

    keywords = keywords.map((kw) => {
      const matchingVideos = videos.filter((v) => v.title.includes(kw.keyword));
      const avgMatchViews  = matchingVideos.length > 0
        ? matchingVideos.reduce((s, v) => s + v.viewCount, 0) / matchingVideos.length
        : 0;
      const recentFour  = matchingVideos.filter((v) => new Date(v.publishedAt).getTime() > now - fourMonthMs).length;
      const recentTwo   = matchingVideos.filter((v) => new Date(v.publishedAt).getTime() > now - twoMonthMs).length;

      const tags: string[] = [];
      if (kw.usage        >= highUsageThreshold)      tags.push("高頻出");
      if (avgMatchViews   >  avgViews * 1.5)           tags.push("再生数多");
      if (recentFour      >= 2)                        tags.push("ハイトレンド");
      if (recentTwo       >= 2)                        tags.push("超ハイトレンド");
      if (kw.titleUsage   >= highTitleUsageThreshold)  tags.push("タイトル高頻出");
      if (kw.thumbnailUsage >= highThumbUsageThreshold) tags.push("サムネイル高頻出");

      // Enrich videos array with YouTube URLs by title matching
      const enrichedVideos = ((kw.videos ?? []) as (string | { title: string })[]).map((v) => {
        const title = typeof v === "string" ? v : v.title;
        const match = videos.find((vid) => vid.title === title || vid.title.includes(title) || title.includes(vid.title));
        return { title, url: match ? `https://www.youtube.com/watch?v=${match.id}` : null };
      });

      return { ...kw, tags, videos: enrichedVideos };
    });
  } catch {
    console.error("[channel-keywords] Parse failed. Raw:", raw.slice(0, 300));
    return NextResponse.json(
      { error: `Geminiのレスポンスをパースできませんでした: ${raw.slice(0, 200)}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ keywords });
}
