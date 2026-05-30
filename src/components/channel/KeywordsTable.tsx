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

type SortKey = "usage" | "keyword" | "category";

interface Props {
  keywords: KeywordResult[];
  showSource?: boolean;
}

export function KeywordsTable({ keywords, showSource = false }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("usage");
  const [sortAsc, setSortAsc] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const sorted = [...keywords].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "usage") cmp = a.usage - b.usage;
    else if (sortKey === "keyword") cmp = a.keyword.localeCompare(b.keyword, "ja");
    else if (sortKey === "category") cmp = a.category.localeCompare(b.category, "ja");
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
    { label: "使用数",      key: "usage",    cls: "w-20 text-center" },
    { label: "カテゴリ",    key: "category", cls: "w-32 text-center" },
    { label: "指標タグ",     key: null,       cls: "w-48 text-center" },
    ...(showSource ? [{ label: "出典", key: null as null, cls: "w-32 text-center" }] : []),
    { label: "理由",        key: null,       cls: "text-left" },
  ];

  return (
    <div className="w-full overflow-x-auto rounded-xl border" style={{ borderColor: "#D4CCB8", backgroundColor: "#FDFAF5" }}>
      <table className="w-full border-collapse" style={{ minWidth: "640px" }}>
        <colgroup>
          <col style={{ width: "36px" }} />
          <col />
          <col style={{ width: "80px" }} />
          <col style={{ width: "128px" }} />
          <col style={{ width: "192px" }} />
          {showSource && <col style={{ width: "128px" }} />}
          <col />
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
                  <td className="px-3 py-3 text-center">
                    <span
                      title={`📝 タイトル: ${kw.titleUsage ?? kw.usage}件 / 🖼 サムネイル: ${kw.thumbnailUsage ?? 0}件`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold cursor-help"
                      style={{ backgroundColor: "#E8E0D0", color: "#4A3C2A" }}
                    >
                      {kw.usage}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center"><CategoryBadge category={kw.category} /></td>
                  <td className="px-3 py-3"><TagBadges tags={kw.tags ?? []} /></td>
                  {showSource && (
                    <td className="px-3 py-3 text-center"><SourceBadge source={kw.source ?? "タイトル"} /></td>
                  )}
                  <td className="px-3 py-3 text-xs" style={{ color: "#5A5A5A" }}><p>{kw.reason}</p></td>
                </tr>

                {isExpanded && (
                  <tr key={`${kw.keyword}-exp`} style={{ backgroundColor: "#EDE6D8", borderTop: "1px solid #D4CCB8" }}>
                    <td colSpan={cols.length} className="px-5 py-3">
                      <p className="mb-1.5 text-xs font-semibold" style={{ color: "#4A3C2A" }}>関連動画タイトル</p>
                      <ul className="space-y-1">
                        {kw.videos.map((v, vi) => (
                          <li key={vi} className="flex items-start gap-2 text-xs" style={{ color: "#3A3A3A" }}>
                            <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold" style={{ backgroundColor: "#2C2C2C", color: "#F5F0E8" }}>
                              {vi + 1}
                            </span>
                            {v}
                          </li>
                        ))}
                      </ul>
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
