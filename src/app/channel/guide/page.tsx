import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Search, Lightbulb, Target, Tag, AlertCircle, Sparkles, BarChart2, Image as ImageIcon, TrendingUp, Eye, Users, Film } from "lucide-react";

export const metadata: Metadata = {
  title: "できること・活用方法 | YouTube チャンネル内キーワード分析ツール",
  description: "YouTube チャンネル内キーワード分析ツールでできること、分析からわかること、具体的な活用方法のまとめ",
};

const TAGS = [
  { tag: "高頻出",          bg: "#FEF3C7", color: "#92400E", rule: "タイトル＋サムネイルの合計出現数が多い",           read: "チャンネルの「軸」になっている言葉。視聴者がそのチャンネルに期待している定番テーマ" },
  { tag: "再生数多",        bg: "#D1FAE5", color: "#065F46", rule: "関連動画の平均再生数がチャンネル平均の1.5倍超", read: "入れると伸びやすい言葉。次のタイトル・サムネイルに最優先で検討する" },
  { tag: "ハイトレンド",    bg: "#DBEAFE", color: "#1E40AF", rule: "4ヶ月以内の投稿に2件以上含まれる",               read: "直近で力を入れているテーマ。チャンネルの方向性の変化が読める" },
  { tag: "超ハイトレンド",  bg: "#EDE9FE", color: "#5B21B6", rule: "2ヶ月以内の投稿に2件以上含まれる",               read: "今まさに攻めているテーマ。競合分析なら「相手が何を当てにきているか」がわかる" },
  { tag: "タイトル高頻出",  bg: "#E0F2FE", color: "#0369A1", rule: "タイトルへの出現が3件以上",                     read: "検索・おすすめで拾われることを狙った言葉。SEO寄りのキーワード" },
  { tag: "サムネイル高頻出",bg: "#FCE7F3", color: "#9D174D", rule: "サムネイル内テキストへの出現が3件以上",         read: "クリックさせるための言葉。視覚的に「刺さる」と判断されている表現" },
];

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-400">{icon}</div>
      <h2 className="text-base font-bold text-gray-800">{children}</h2>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-gray-100 bg-white p-6 shadow-sm ${className}`}>{children}</section>;
}

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <Link href="/channel" className="flex items-center gap-2.5">
            <img src="/site-logo.png" alt="logo" className="h-9 w-auto object-contain" />
            <div>
              <h1 className="text-sm font-bold text-gray-900">YouTube チャンネル内キーワード分析ツール</h1>
              <p className="text-[11px] text-gray-400">by 株式会社EAVAL</p>
            </div>
          </Link>
          <Link
            href="/channel"
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-red-300 hover:text-red-500"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            ツールに戻る
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-5 py-6">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-400">Guide</p>
          <h2 className="mt-1 text-lg font-bold text-gray-900">このツールでできること・わかること・活用方法</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            チャンネルURLを入れるだけで、そのチャンネルの動画タイトルとサムネイルをAIが読み、「どの言葉が再生数を支えているか」を一覧にします。
            自分のチャンネルの棚卸しにも、競合チャンネルの研究にも使えます。
          </p>
        </div>

        {/* できること */}
        <Card>
          <SectionTitle icon={<Search className="h-4 w-4" />}>できること</SectionTitle>
          <ul className="space-y-3">
            {[
              { icon: <Film className="h-4 w-4" />,        t: "人気動画30本＋最新動画30本を自動取得",   d: "再生数順と投稿日順でそれぞれ30本ずつ集めます。180秒以下のショート動画は除外し、通常動画だけを対象にします。" },
              { icon: <Sparkles className="h-4 w-4" />,    t: "タイトルとサムネイルをAIが同時に分析",     d: "全動画のタイトルと、再生数上位20本のサムネイル画像をGeminiに渡し、繰り返し使われている言葉を15〜25個抽出します。" },
              { icon: <BarChart2 className="h-4 w-4" />,   t: "タイトル／サムネイルそれぞれの使用数を集計", d: "「タイトルに何本」「サムネイルの文字として何枚」に分けて数えます。言葉の役割（検索向けかクリック向けか）が見えます。" },
              { icon: <Tag className="h-4 w-4" />,         t: "6種類の指標タグで自動判定",               d: "高頻出・再生数多・ハイトレンドなど、条件を満たしたキーワードにタグが付きます。タグをクリックすると絞り込めます。" },
              { icon: <Eye className="h-4 w-4" />,         t: "関連動画にワンクリックで飛べる",           d: "各キーワードの行を開くと、AIが選んだ理由と関連動画（YouTubeリンク付き）が確認できます。" },
            ].map(({ icon, t, d }) => (
              <li key={t} className="flex gap-3">
                <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">{icon}</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{t}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* わかること */}
        <Card>
          <SectionTitle icon={<Lightbulb className="h-4 w-4" />}>このツールを使うとわかること</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { t: "視聴者に刺さっている言葉",       d: "再生数が高い動画に共通して入っている言葉がわかります。「なんとなく伸びた」を「この言葉が効いた」に変えられます。" },
              { t: "チャンネルの軸になっているテーマ", d: "何度も繰り返し使われている言葉から、そのチャンネルが何で認知されているかが見えます。" },
              { t: "今まさに力を入れているテーマ",   d: "直近2〜4ヶ月に集中している言葉がわかります。競合なら「次に何を当てにきているか」の予測材料になります。" },
              { t: "タイトル向きの言葉・サムネ向きの言葉", d: "検索で拾わせるための言葉と、クリックさせるための言葉は違います。どちらで使われているかが数字で分かれます。" },
              { t: "伸びた動画と伸びなかった動画の差", d: "同じテーマでも再生数に差がある場合、タイトル・サムネイルの言葉選びの違いが浮かび上がります。" },
              { t: "参入すべき領域・避けるべき表現",   d: "競合が取りこぼしている言葉、逆に使い古されている言葉が見えます。差別化の判断材料になります。" },
            ].map(({ t, d }) => (
              <div key={t} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-800">{t}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{d}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* 活用方法 */}
        <Card>
          <SectionTitle icon={<Target className="h-4 w-4" />}>活用方法</SectionTitle>
          <div className="space-y-5">
            {[
              {
                icon: <Users className="h-4 w-4" />,
                t: "① 自分のチャンネルの棚卸し",
                steps: [
                  "自分のチャンネルURLを入れて分析する",
                  "「再生数多」タグで絞り込み、伸びている言葉を確認する",
                  "「高頻出」だが「再生数多」ではない言葉を探す → 使いすぎて効かなくなっている可能性",
                  "次の動画タイトルに「再生数多」の言葉を1つ入れてみる",
                ],
              },
              {
                icon: <TrendingUp className="h-4 w-4" />,
                t: "② 競合チャンネルの研究",
                steps: [
                  "同ジャンルで伸びているチャンネルのURLを入れる",
                  "「超ハイトレンド」タグで、相手が直近で攻めているテーマを確認する",
                  "「再生数多」の言葉を自分のチャンネルで使っているか照らし合わせる",
                  "相手が使っていない切り口を探し、差別化のネタにする",
                ],
              },
              {
                icon: <ImageIcon className="h-4 w-4" />,
                t: "③ サムネイルの文言づくり",
                steps: [
                  "「サムネイル高頻出」タグで絞り込む",
                  "行を開いて関連動画に飛び、実際のサムネイルを見比べる",
                  "文字の大きさ・配置・色の使い方まで含めて参考にする",
                  "タイトルには別の言葉を入れて、サムネとタイトルで役割を分ける",
                ],
              },
              {
                icon: <Film className="h-4 w-4" />,
                t: "④ 企画出し・ネタ探し",
                steps: [
                  "複数の競合チャンネルを順番に分析する",
                  "どのチャンネルでも「再生数多」になる共通ワードを集める",
                  "CSV / Markdown で書き出し、企画会議の資料にする",
                  "共通ワード × 自分だけの切り口で企画を組む",
                ],
              },
            ].map(({ icon, t, steps }) => (
              <div key={t}>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500">{icon}</div>
                  <p className="text-sm font-bold text-gray-800">{t}</p>
                </div>
                <ol className="ml-9 space-y-1">
                  {steps.map((s, i) => (
                    <li key={s} className="flex gap-2 text-xs leading-relaxed text-gray-600">
                      <span className="flex-shrink-0 text-gray-400">{i + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </Card>

        {/* タグの読み方 */}
        <Card>
          <SectionTitle icon={<Tag className="h-4 w-4" />}>指標タグの読み方</SectionTitle>
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[11px] text-gray-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">タグ</th>
                  <th className="px-3 py-2 font-semibold">付く条件</th>
                  <th className="px-3 py-2 font-semibold">こう読む</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {TAGS.map(({ tag, bg, color, rule, read }) => (
                  <tr key={tag} className="align-top">
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <span style={{ backgroundColor: bg, color }} className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold">{tag}</span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{rule}</td>
                    <td className="px-3 py-2.5 leading-relaxed text-gray-500">{read}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-gray-400">
            「高頻出」の基準は、そのチャンネルで抽出されたキーワードの出現数の中央値（最低3）です。チャンネルごとに自動で変わります。
          </p>
        </Card>

        {/* 注意点 */}
        <Card>
          <SectionTitle icon={<AlertCircle className="h-4 w-4" />}>知っておいてほしいこと</SectionTitle>
          <ul className="space-y-2 text-xs leading-relaxed text-gray-600">
            {[
              "キーワードの抽出とサムネイル内の文字の読み取りはAI（Gemini）が行います。同じチャンネルでも実行ごとに結果が多少変わります。迷ったら2回まわして共通する言葉を見てください。",
              "タイトルの使用数はプログラムが文字列で数えた確定値です。サムネイルの使用数はAIが画像を見て数えた推定値です。",
              "対象は人気30本＋最新30本（重複を除く）で、チャンネルの全動画ではありません。動画数が多いチャンネルほど「最近と、歴代トップ」の傾向になります。",
              "180秒以下のショート動画は除外しています。ショート中心のチャンネルでは取得本数が少なくなることがあります。",
              "APIキーはブラウザのSessionStorageにのみ保持され、サーバーには保存されません。タブを閉じると消えます。",
              "YouTube Data API には1日あたりの無料枠があります。1回の分析でおよそ200〜400ユニットを消費します（無料枠は10,000ユニット/日）。",
            ].map((s) => (
              <li key={s} className="flex gap-2">
                <span className="flex-shrink-0 text-gray-400">・</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="flex justify-center pt-2">
          <Link
            href="/channel"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-500 to-red-400 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            ツールを使ってみる
          </Link>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-3xl px-5 pb-8 mt-4">
        <a href="https://eaval.shop/" target="_blank" rel="noopener noreferrer" className="block transition-opacity hover:opacity-80">
          <img src="/eaval-banner.png" alt="EAVAL運用代行" className="w-full rounded-xl object-contain" />
        </a>
      </footer>
    </div>
  );
}
