import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { AnalysisResult } from "@/types";
import { classifyOpenAIError } from "@/lib/openai-error";

/**
 * Strip optional Markdown code fences that some models add,
 * e.g.  ```json\n{...}\n```  →  {...}
 */
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : raw).trim();
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-openai-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key is required" }, { status: 400 });
  }

  let comments: { text: string }[];
  let keywords: { word: string; count: number; category: string }[];
  let videoTitle: string;
  try {
    ({ comments, keywords, videoTitle } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!comments || comments.length === 0) {
    return NextResponse.json({ error: "No comments provided" }, { status: 400 });
  }

  const client = new OpenAI({ apiKey });

  const commentSample = comments
    .slice(0, 100)
    .map((c) => `- ${c.text}`)
    .join("\n");

  const keywordList = (keywords ?? [])
    .slice(0, 20)
    .map((k) => `${k.word}(${k.category}, ${k.count}件)`)
    .join(", ");

  let raw = "";
  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `あなたはYouTubeチャンネルのコンテンツ戦略アドバイザーです。
コメント分析から視聴者の潜在ニーズを深く洞察し、次の動画企画に活かせる具体的な提案を返してください。

必ず以下のJSON形式のみで出力してください（Markdownコードブロック不要）：
{
  "summary": "視聴者の全体的な傾向を2〜3文で要約",
  "needs": [
    {
      "title": "悩み・ニーズのタイトル（15文字以内）",
      "description": "詳細な説明（50〜80文字）",
      "evidence": "コメントから見られる根拠・具体例（40〜60文字）"
    }
  ],
  "videoIdeas": [
    {
      "title": "動画タイトル案（30文字以内）",
      "description": "動画の内容・構成の説明（60〜100文字）",
      "targetPain": "この動画が解決する視聴者の悩み（30〜50文字）"
    }
  ]
}

needsは上位3つ、videoIdeasは3つ提案してください。`,
        },
        {
          role: "user",
          content: `動画タイトル：${videoTitle}

【抽出されたキーワード】
${keywordList}

【コメント一覧（抜粋）】
${commentSample}

上記を分析して、視聴者の悩み・ニーズと次回の動画企画案を提案してください。`,
        },
      ],
    });
    raw = response.choices[0].message.content ?? "{}";
  } catch (err) {
    const info = classifyOpenAIError(err);
    console.error("[/api/analysis] OpenAI error:", info.code, info.message);
    return NextResponse.json(
      { error: info.message, code: info.code, actionUrl: info.actionUrl },
      { status: info.status }
    );
  }

  let result: AnalysisResult;
  try {
    result = JSON.parse(extractJson(raw)) as AnalysisResult;
  } catch (err) {
    console.error("[/api/analysis] JSON parse failed. Raw content:", raw);
    return NextResponse.json(
      { error: `OpenAIのレスポンスをJSONとして解析できませんでした。Raw: ${raw.slice(0, 200)}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ analysis: result });
}
