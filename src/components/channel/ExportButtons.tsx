"use client";

import { KeywordResult } from "@/app/api/channel-keywords/route";
import { useState } from "react";

interface Props {
  keywords: KeywordResult[];
  channelName: string;
}

type Format = "csv" | "pdf";

const BUTTONS: { format: Format; label: string; icon: string }[] = [
  { format: "pdf", label: "PDFでダウンロード", icon: "📄" },
  { format: "csv", label: "CSVでダウンロード", icon: "📋" },
];

export function ExportButtons({ keywords, channelName }: Props) {
  const [loading, setLoading] = useState<Format | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (format: Format) => {
    setLoading(format);
    setError(null);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, keywords, channelName }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "エクスポートに失敗しました");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `keywords_${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エクスポートエラー");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-2 items-end">
      <div className="flex flex-wrap gap-2 justify-end">
        {BUTTONS.map(({ format, label, icon }) => (
          <button
            key={format}
            onClick={() => handleExport(format)}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderColor: "#D4CCB8",
              backgroundColor: "#F5F0E8",
              color: "#2C2C2C",
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = "#2C2C2C";
                e.currentTarget.style.color = "#F5F0E8";
                e.currentTarget.style.borderColor = "#2C2C2C";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#F5F0E8";
              e.currentTarget.style.color = "#2C2C2C";
              e.currentTarget.style.borderColor = "#D4CCB8";
            }}
          >
            {loading === format ? (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <span className="text-base leading-none">{icon}</span>
            )}
            <span>{label}</span>
          </button>
        ))}
      </div>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
