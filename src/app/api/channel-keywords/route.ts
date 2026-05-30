import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { VideoItem } from "../channel/route";

export interface KeywordResult {
  keyword: string;
  usage: number;
  reason: string;
  category: string;
  points: number;
  videos: string[];
}

function stripCodeFences(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (match ? match[1] : raw).trim();
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
- 画像: 再生数上位20件のサムネイル（視覚的なテーマ・色使い・文字・構図も分析）

## 抽出基準
- 高再生数: チャンネル平均（${Math.round(avgViews).toLocaleString()}回）を上回る動画に含まれるキーワード
- 頻出度: タイトルまたはサムネイルに繰り返し登場するキーワード
- トレンド: 直近3ヶ月以内の動画で使われているキーワード
- サムネイル: 画像から読み取れる共通テーマ・文字・被写体・スタイル

## 出力フォーマット
必ずJSON配列のみで出力してください（コードブロック・説明文不要）：
[
  {
    "keyword": "キーワード文字列",
    "usage": 動画タイトルまたはサムネイルへの登場回数(整数),
    "reason": "このキーワードが有効な理由（50字以内）",
    "category": "テーマ"|"手法"|"ターゲット"|"感情"|"トレンド"|"商品・サービス",
    "points": 重要度スコア1〜100(整数),
    "videos": ["関連する動画タイトル（最大3件）"]
  }
]

## 注意事項
- 15〜25個のキーワードを抽出する
- pointsの降順でソートする
- タイトル由来・サムネイル由来どちらも含める
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
  } catch {
    console.error("[channel-keywords] Parse failed. Raw:", raw.slice(0, 300));
    return NextResponse.json(
      { error: `Geminiのレスポンスをパースできませんでした: ${raw.slice(0, 200)}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ keywords });
}
