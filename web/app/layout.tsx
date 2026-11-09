import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "途屿 · Our Little Atlas | 我们的旅行回忆",
  description: "世界很大，我们慢慢走。收藏两个人的旅行足迹、照片与故事。",
  robots: { index: false, follow: false },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
