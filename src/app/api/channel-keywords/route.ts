import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
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

  const avgViews =
    videos.reduce((sum, v) => sum + v.viewCount, 0) / videos.length;

  const videoList = videos
    .map(
      (v, i) =>
        `${i + 1}. [${v.type === "popular" ? "人気" : "最新"}] タイトル: "${v.title}" | 再生数: ${v.viewCount.toLocaleString()} | 投稿日: ${v.publishedAt.slice(0, 10)}`
    )
    .join("\n");

  const systemInstruction = `あなたはYouTubeチャンネルのコンテンツ戦略アナリストです。
チャンネルの動画タイトル・再生数・投稿日データを分析し、効果的なキーワードを抽出してください。

## 抽出基準
- 高再生数: チャンネル平均（${Math.round(avgViews).toLocaleString()}回）を上回る動画に含まれるキーワード
- 頻出度: 複数の動画タイトルに繰り返し登場するキーワード
- トレンド: 直近3ヶ月以内に投稿された動画で使われているキーワード

## 出力フォーマット
必ずJSON配列のみで出力してください（コードブロック・説明文不要）：
[
  {
    "keyword": "キーワード文字列",
    "usage": 動画タイトルに登場した回数(整数),
    "reason": "このキーワードが有効な理由（50字以内）",
    "category": "テーマ"|"手法"|"ターゲット"|"感情"|"トレンド"|"商品・サービス",
    "points": 重要度スコア1〜100(整数),
    "videos": ["関連する動画タイトル（最大3件）"]
  }
]

## 注意事項
- 15〜25個のキーワードを抽出する
- pointsの降順でソートする
- 単語・フレーズ両方を対象とする（助詞除く）
- 人名・固有名詞も含めてよい
- JSON以外の文字を一切出力しない`;

  const prompt = `チャンネル名: ${channelName}\n動画数: ${videos.length}件\n\n## 動画データ\n${videoList}`;

  let raw = "";
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const generativeModel = genAI.getGenerativeModel({
      model,
      systemInstruction,
    });
    const result = await generativeModel.generateContent(prompt);
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
