import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Keyword } from "@/types";
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
  try {
    ({ comments } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!comments || comments.length === 0) {
    return NextResponse.json({ error: "No comments provided" }, { status: 400 });
  }

  const client = new OpenAI({ apiKey });

  const commentTexts = comments
    .slice(0, 150)
    .map((c, i) => `${i + 1}. ${c.text}`)
    .join("\n");

  let raw = "";
  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `あなたはYouTubeコメントのテキストマイニング専門家です。
コメント群を分析し、頻出するキーワードをJSONで返してください。

特に以下に注目してください：
- 視聴者の悩み・問題を示す言葉（category: "problem"）
- 感情・感想を示す言葉（category: "emotion"）
- 頻繁に言及されるトピック・テーマ（category: "topic"）

必ず以下のJSON形式のみで出力してください（Markdownコードブロック不要）：
{
  "keywords": [
    { "word": "キーワード", "count": 出現頻度の推定数, "category": "problem"|"emotion"|"topic" }
  ]
}

キーワードは20〜30個抽出し、countの降順で並べてください。`,
        },
        {
          role: "user",
          content: `以下のYouTubeコメント群からキーワードを抽出してください：\n\n${commentTexts}`,
        },
      ],
    });
    raw = response.choices[0].message.content ?? "{}";
  } catch (err) {
    const info = classifyOpenAIError(err);
    console.error("[/api/keywords] OpenAI error:", info.code, info.message);
    return NextResponse.json(
      { error: info.message, code: info.code, actionUrl: info.actionUrl },
      { status: info.status }
    );
  }

  let keywords: Keyword[] = [];
  try {
    const parsed = JSON.parse(extractJson(raw));
    keywords = parsed.keywords ?? [];
  } catch (err) {
    console.error("[/api/keywords] JSON parse failed. Raw content:", raw);
    return NextResponse.json(
      { error: `OpenAIのレスポンスをJSONとして解析できませんでした。Raw: ${raw.slice(0, 200)}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ keywords });
}
