import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { KeywordResult } from "../channel-keywords/route";
import fs from "fs";
import path from "path";

function buildCsv(keywords: KeywordResult[]): string {
  const header = ["キーワード", "使用回数", "カテゴリ", "スコア", "理由", "関連動画"].join(",");
  const rows = keywords.map((k) => {
    const videos = k.videos.join(" / ").replace(/"/g, '""');
    const reason = k.reason.replace(/"/g, '""');
    const keyword = k.keyword.replace(/"/g, '""');
    return `"${keyword}",${k.usage},"${k.category}",${k.points},"${reason}","${videos}"`;
  });
  return "﻿" + [header, ...rows].join("\r\n");
}

async function buildPdf(keywords: KeywordResult[], channelName: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  // Load Noto Sans JP for Japanese support
  const fontPath = path.join(process.cwd(), "public", "fonts", "NotoSansJP-Regular.otf");
  const fontBytes = fs.readFileSync(fontPath);
  const jpFont = await doc.embedFont(fontBytes, { subset: false });

  const PAGE_W = 841.89; // A4 landscape
  const PAGE_H = 595.28;
  const MARGIN = 36;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  const CHARCOAL = rgb(0.17, 0.17, 0.17);
  const BEIGE    = rgb(0.96, 0.94, 0.91);
  const BEIGE2   = rgb(0.99, 0.98, 0.96);
  const ACCENT   = rgb(0.8,  0.12, 0.12);
  const WHITE    = rgb(1,    1,    1   );
  const GRAY     = rgb(0.5,  0.5,  0.5 );
  const BORDER   = rgb(0.78, 0.75, 0.68);

  let page = doc.addPage([PAGE_W, PAGE_H]);

  const drawText = (
    p: typeof page,
    text: string,
    x: number,
    y: number,
    size: number,
    color = CHARCOAL,
    maxWidth?: number
  ) => {
    let t = text;
    if (maxWidth) {
      while (t.length > 0 && jpFont.widthOfTextAtSize(t + "…", size) > maxWidth) {
        t = t.slice(0, -1);
      }
      if (t !== text) t += "…";
    }
    p.drawText(t, { x, y, size, font: jpFont, color });
  };

  // ── Header band ──────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: PAGE_H - 52, width: PAGE_W, height: 52, color: CHARCOAL });
  drawText(page, "YouTubeチャンネル キーワード分析レポート", MARGIN, PAGE_H - 24, 14, WHITE);
  const dateStr = new Date().toLocaleDateString("ja-JP");
  drawText(page, `チャンネル: ${channelName}   作成日: ${dateStr}`, MARGIN, PAGE_H - 42, 9, rgb(0.75, 0.72, 0.68));

  // ── Summary strip ────────────────────────────────────────────────────────
  const sumY = PAGE_H - 68;
  page.drawRectangle({ x: MARGIN, y: sumY - 14, width: CONTENT_W, height: 28, color: BEIGE, borderColor: BORDER, borderWidth: 0.5 });
  const avg = Math.round(keywords.reduce((s, k) => s + k.points, 0) / (keywords.length || 1));
  drawText(page, `総キーワード数: ${keywords.length}件`, MARGIN + 10, sumY, 9, CHARCOAL);
  drawText(page, `最高スコア: ${keywords[0]?.points ?? 0}pt  平均スコア: ${avg}pt`, MARGIN + 220, sumY, 9, CHARCOAL);

  // ── Column definitions ───────────────────────────────────────────────────
  const cols = [
    { header: "No.",        w: 30,  align: "center" },
    { header: "キーワード", w: 110, align: "left"   },
    { header: "使用数",     w: 44,  align: "center" },
    { header: "カテゴリ",   w: 76,  align: "left"   },
    { header: "スコア",     w: 44,  align: "center" },
    { header: "理由",       w: CONTENT_W - 30 - 110 - 44 - 76 - 44, align: "left" },
  ];

  const colX: number[] = [];
  let cx = MARGIN;
  for (const c of cols) { colX.push(cx); cx += c.w; }

  const ROW_H = 20;
  const HEADER_H = 18;
  const TABLE_TOP = PAGE_H - 94;

  // Table header row
  page.drawRectangle({ x: MARGIN, y: TABLE_TOP - HEADER_H, width: CONTENT_W, height: HEADER_H, color: CHARCOAL });
  cols.forEach((c, i) => {
    const labelW = jpFont.widthOfTextAtSize(c.header, 8);
    const tx = c.align === "center" ? colX[i] + c.w / 2 - labelW / 2 : colX[i] + 3;
    drawText(page, c.header, tx, TABLE_TOP - 13, 8, WHITE);
  });

  let rowY = TABLE_TOP - HEADER_H;

  for (let idx = 0; idx < keywords.length; idx++) {
    if (rowY - ROW_H < MARGIN) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      rowY = PAGE_H - MARGIN;
    }

    const k = keywords[idx];
    const bg = idx % 2 === 0 ? BEIGE2 : BEIGE;
    page.drawRectangle({ x: MARGIN, y: rowY - ROW_H, width: CONTENT_W, height: ROW_H, color: bg, borderColor: BORDER, borderWidth: 0.3 });

    const cells = [
      String(idx + 1),
      k.keyword,
      String(k.usage),
      k.category,
      String(k.points),
      k.reason,
    ];

    cells.forEach((cell, i) => {
      const c = cols[i];
      const size = 8;
      const color = i === 4 ? ACCENT : i === 1 ? CHARCOAL : GRAY;
      const maxWidth = c.w - 6;
      const cellW = jpFont.widthOfTextAtSize(cell, size);
      const tx = c.align === "center" ? colX[i] + c.w / 2 - cellW / 2 : colX[i] + 3;
      drawText(page, cell, tx, rowY - ROW_H + 6, size, color, c.align === "center" ? undefined : maxWidth);
    });

    rowY -= ROW_H;
  }

  // Footer
  const lastPage = doc.getPages().at(-1)!;
  drawText(lastPage, "Generated by YouTube Channel Keyword Analyzer  |  Powered by Gemini AI", MARGIN, 18, 7, GRAY);

  return doc.save();
}

export async function POST(request: NextRequest) {
  const { format, keywords, channelName } = (await request.json()) as {
    format: "csv" | "pdf";
    keywords: KeywordResult[];
    channelName: string;
  };

  if (!keywords || keywords.length === 0) {
    return NextResponse.json({ error: "No keywords to export" }, { status: 400 });
  }

  try {
    if (format === "csv") {
      const csv = buildCsv(keywords);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="keywords_${Date.now()}.csv"`,
        },
      });
    }

    if (format === "pdf") {
      const bytes = await buildPdf(keywords, channelName);
      return new NextResponse(Buffer.from(bytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="keywords_${Date.now()}.pdf"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid format. Use csv or pdf." }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[export]", msg);
    return NextResponse.json({ error: `エクスポートエラー: ${msg}` }, { status: 500 });
  }
}
