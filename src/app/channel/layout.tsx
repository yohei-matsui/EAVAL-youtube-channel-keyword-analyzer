import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "YouTube チャンネル内キーワード分析ツール",
  description: "YouTubeチャンネルの動画タイトルとサムネイルをAIが解析し、再生数を伸ばすキーワードを抽出するツール",
  icons: {
    icon: "/site-logo.png",
    apple: "/site-logo.png",
  },
};

export default function ChannelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
