"use client";

type Step = "idle" | "fetching" | "analyzing" | "done" | "error";

const STEPS = [
  { key: "fetching", label: "動画データ取得中", desc: "YouTube APIから最大100件" },
  { key: "analyzing", label: "キーワード分析中", desc: "Claude AIが解析" },
  { key: "done", label: "分析完了", desc: "結果を表示中" },
] as const;

interface Props {
  step: Step;
}

export function StepIndicator({ step }: Props) {
  if (step === "idle" || step === "error") return null;

  const currentIdx =
    step === "fetching" ? 0 : step === "analyzing" ? 1 : 2;

  return (
    <div className="rounded-xl border border-[#D4CCB8] bg-[#FDFAF5] p-4">
      <div className="flex items-start gap-0">
        {STEPS.map((s, i) => {
          const isDone = i < currentIdx;
          const isActive = i === currentIdx;
          return (
            <div key={s.key} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {i > 0 && (
                  <div
                    className={`h-0.5 flex-1 transition-colors ${isDone ? "bg-[#2C2C2C]" : "bg-[#D4CCB8]"}`}
                  />
                )}
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                    isDone
                      ? "border-[#2C2C2C] bg-[#2C2C2C] text-[#F5F0E8]"
                      : isActive
                      ? "border-[#2C2C2C] bg-[#F5F0E8] text-[#2C2C2C]"
                      : "border-[#D4CCB8] bg-[#F5F0E8] text-[#B0A890]"
                  }`}
                >
                  {isDone ? "✓" : isActive ? (
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 transition-colors ${isDone ? "bg-[#2C2C2C]" : "bg-[#D4CCB8]"}`}
                  />
                )}
              </div>
              <p
                className={`mt-1.5 text-center text-xs font-medium ${
                  isActive ? "text-[#2C2C2C]" : isDone ? "text-[#5A5A5A]" : "text-[#B0A890]"
                }`}
              >
                {s.label}
              </p>
              <p className="text-center text-[10px] text-[#8A8070]">{s.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
