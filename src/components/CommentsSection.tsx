"use client";

import { useState, useMemo } from "react";
import { MessageSquare, ThumbsUp, Clock, Search, X, ScanSearch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Comment } from "@/types";

interface CommentsSectionProps {
  comments: Comment[];
  videoTitle: string;
  videoThumbnail: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

/** Highlight matching query text inside a string, returns an array of React nodes */
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function CommentsSection({ comments, videoTitle, videoThumbnail }: CommentsSectionProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return comments;
    return comments.filter(
      (c) =>
        stripHtml(c.text).toLowerCase().includes(q) ||
        c.author.toLowerCase().includes(q)
    );
  }, [comments, query]);

  if (comments.length === 0) return null;

  const isFiltering = query.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider">
          <ScanSearch className="h-4 w-4" />
          コメント深掘りセクション
        </div>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            {videoThumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={videoThumbnail}
                alt={videoTitle}
                className="h-14 w-24 rounded-md object-cover shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <CardTitle className="text-base">全コメント一覧</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {comments.length}件取得
                </Badge>
              </div>
              <CardDescription className="text-xs line-clamp-1">{videoTitle}</CardDescription>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="コメント内を検索（キーワード・投稿者名）..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-9 text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter status */}
          <div className="flex items-center gap-2 mt-1.5 text-xs">
            {isFiltering ? (
              <>
                <span className="text-violet-600 font-medium">
                  {filtered.length} 件ヒット
                </span>
                <span className="text-slate-400">／ 全{comments.length}件</span>
                {filtered.length === 0 && (
                  <span className="text-slate-400 ml-1">— 一致するコメントが見つかりません</span>
                )}
              </>
            ) : (
              <span className="text-slate-400">全{comments.length}件表示中</span>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filtered.length === 0 && isFiltering ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Search className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">「{query}」を含むコメントは見つかりませんでした</p>
              </div>
            ) : (
              filtered.map((comment) => {
                const text = stripHtml(comment.text);
                return (
                  <div
                    key={comment.id}
                    className={`rounded-lg border px-3 py-2.5 transition-colors ${
                      isFiltering
                        ? "border-violet-100 bg-violet-50/50 hover:bg-violet-50"
                        : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <p className="text-xs text-slate-800 leading-relaxed">
                      <HighlightedText text={text} query={query} />
                    </p>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-400">
                      <span className="font-medium text-slate-500">
                        <HighlightedText text={comment.author} query={query} />
                      </span>
                      <span className="flex items-center gap-0.5">
                        <ThumbsUp className="h-3 w-3" />
                        {comment.likeCount}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {formatDate(comment.publishedAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
