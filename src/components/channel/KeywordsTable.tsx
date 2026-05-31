"use client";

import { KeywordResult } from "@/app/api/channel-keywords/route";
import { useState } from "react";

const CATEGORY_STYLE: Record<string, { bg: string; color: string }> = {
  テーマ:          { bg: "#E8E0D0", color: "#4A3C2A" },
  手法:            { bg: "#D5E8D0", color: "#2A4A2A" },
  ターゲット:      { bg: "#D0DCE8", color: "#2A3A4A" },
  感情:            { bg: "#E8D5D0", color: "#4A2A2A" },
  トレンド:        { bg: "#E0D0E8", color: "#3A2A4A" },
  "商品・サービス":{ bg: "#E8E8D0", color: "#4A4A2A" },
};

const SOURCE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  タイトル:  { bg: "#DBEAFE", color: "#1E40AF", label: "📝 タイトル" },
  サムネイル: { bg: "#FCE7F3", color: "#9D174D", label: "🖼 サムネイル" },
  両方:      { bg: "#D1FAE5", color: "#065F46", label: "✦ 両方" },
};

function CategoryBadge({ category }: { category: string }) {
  const s = CATEGORY_STYLE[category] ?? { bg: "#E0E0E0", color: "#3A3A3A" };
  return (
    <span style={{ backgroundColor: s.bg, color: s.color }}
      className="inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold">
      {category}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const s = SOURCE_STYLE[source] ?? { bg: "#E0E0E0", color: "#3A3A3A", label: source };
  return (
    <span style={{ backgroundColor: s.bg, color: s.color }}
      className="inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold">
      {s.label}
    </span>
  );
}

const TAG_STYLE: Record<string, { bg: string; color: string }> = {
  "高頻出":         { bg: "#FEF3C7", color: "#92400E" },
  "再生数多":       { bg: "#D1FAE5", color: "#065F46" },
  "ハイトレンド":   { bg: "#DBEAFE", color: "#1E40AF" },
  "超ハイトレンド": { bg: "#EDE9FE", color: "#5B21B6" },
  "タイトル高頻出": { bg: "#E0F2FE", color: "#0369A1" },
  "サムネイル高頻出":{ bg: "#FCE7F3", color: "#9D174D" },
};

function TagBadges({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) return <span className="text-xs" style={{ color: "#C0B8A8" }}>—</span>;
  return (
    <div className="flex flex-wrap gap-1 justify-center">
      {tags.map((tag) => {
        const s = TAG_STYLE[tag] ?? { bg: "#E0E0E0", color: "#3A3A3A" };
        return (
          <span key={tag} style={{ backgroundColor: s.bg, color: s.color }}
            className="inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold">
            {tag}
          </span>
        );
      })}
    </div>
  );
}

type SortKey = "titleUsage" | "thumbnailUsage" | "keyword";

interface Props {
  keywords: KeywordResult[];
  showSource?: boolean;
}

export function KeywordsTable({ keywords, showSource = false }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("titleUsage");
  const [sortAsc, setSortAsc] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const sorted = [...keywords].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "titleUsage") cmp = (a.titleUsage ?? 0) - (b.titleUsage ?? 0);
    else if (sortKey === "thumbnailUsage") cmp = (a.thumbnailUsage ?? 0) - (b.thumbnailUsage ?? 0);
    else if (sortKey === "keyword") cmp = a.keyword.localeCompare(b.keyword, "ja");
return sortAsc ? cmp : -cmp;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  };

  const Arrow = ({ k }: { k: SortKey }) => (
    <span className="ml-0.5 text-[10px] opacity-60">
      {sortKey === k ? (sortAsc ? "▲" : "▼") : "⇅"}
    </span>
  );

  const cols: { label: string; key: SortKey | null; cls: string }[] = [
    { label: "#",          key: null,       cls: "w-9 text-center" },
    { label: "キーワード",  key: "keyword",  cls: "text-left min-w-[110px]" },
    { label: "📝",          key: "titleUsage",     cls: "w-14 text-center" },
    { label: "🖼",          key: "thumbnailUsage", cls: "w-14 text-center" },
    { label: "指標タグ",     key: null,       cls: "w-48 text-center" },
    ...(showSource ? [{ label: "出典", key: null as null, cls: "w-32 text-center" }] : []),
  ];

  return (
    <div className="w-full overflow-x-auto rounded-xl border" style={{ borderColor: "#D4CCB8", backgroundColor: "#FDFAF5" }}>
      <table className="w-full border-collapse" style={{ minWidth: "640px" }}>
        <colgroup>
          <col style={{ width: "36px" }} />
          <col />
          <col style={{ width: "56px" }} />
          <col style={{ width: "56px" }} />
          <col style={{ width: "192px" }} />
          {showSource && <col style={{ width: "128px" }} />}
        </colgroup>

        <thead>
          <tr style={{ backgroundColor: "#2C2C2C" }}>
            {cols.map((col) => (
              <th
                key={col.label}
                className={`px-3 py-3 text-xs font-semibold ${col.cls} ${col.key ? "cursor-pointer select-none" : ""}`}
                style={{ color: "#F5F0E8" }}
                onClick={() => col.key && handleSort(col.key)}
              >
                {col.label}
                {col.key && <Arrow k={col.key} />}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sorted.map((kw, idx) => {
            const isExpanded = expanded === idx;
            const rowBg = idx % 2 === 0 ? "#FDFAF5" : "#F5F0E8";
            return (
              <>
                <tr
                  key={kw.keyword}
                  className="cursor-pointer transition-colors"
                  style={{ backgroundColor: rowBg, borderTop: "1px solid #E8E0D0" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#EDE6D8")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = rowBg)}
                  onClick={() => setExpanded(isExpanded ? null : idx)}
                >
                  <td className="px-3 py-3 text-center text-xs" style={{ color: "#8A8070" }}>{idx + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm" style={{ color: "#2C2C2C" }}>{kw.keyword}</span>
                      {isExpanded && <span className="text-[10px]" style={{ color: "#8A8070" }}>▲</span>}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    {(kw.titleUsage ?? 0) > 0
                      ? <span className="text-xs font-bold" style={{ color: "#1E40AF" }}>{kw.titleUsage}</span>
                      : <span className="text-xs" style={{ color: "#C0B8A8" }}>—</span>}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {(kw.thumbnailUsage ?? 0) > 0
                      ? <span className="text-xs font-bold" style={{ color: "#9D174D" }}>{kw.thumbnailUsage}</span>
                      : <span className="text-xs" style={{ color: "#C0B8A8" }}>—</span>}
                  </td>
                  <td className="px-3 py-3"><TagBadges tags={kw.tags ?? []} /></td>
                  {showSource && (
                    <td className="px-3 py-3 text-center"><SourceBadge source={kw.source ?? "タイトル"} /></td>
                  )}
                </tr>

                {isExpanded && (
                  <tr key={`${kw.keyword}-exp`} style={{ backgroundColor: "#EDE6D8", borderTop: "1px solid #D4CCB8" }}>
                    <td colSpan={cols.length} className="px-5 py-3 space-y-2">
                      <div>
                        <p className="mb-1 text-xs font-semibold" style={{ color: "#4A3C2A" }}>理由</p>
                        <p className="text-xs" style={{ color: "#3A3A3A" }}>{kw.reason}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-semibold" style={{ color: "#4A3C2A" }}>関連動画タイトル</p>
                        <ul className="space-y-1">
                          {kw.videos.map((v, vi) => (
                            <li key={vi} className="flex items-start gap-2 text-xs" style={{ color: "#3A3A3A" }}>
                              <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold" style={{ backgroundColor: "#2C2C2C", color: "#F5F0E8" }}>
                                {vi + 1}
                              </span>
                              {v.url ? (
                                <a href={v.url} target="_blank" rel="noopener noreferrer"
                                  className="underline underline-offset-2 hover:opacity-70 transition-opacity"
                                  style={{ color: "#1E40AF" }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {v.title}
                                </a>
                              ) : (
                                <span>{v.title}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
