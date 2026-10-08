import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Familjen_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Familjen_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "流程单",
  description:
    "个人项目的 Issue 驱动开发流程：提 Issue、从最新 main 开分支、本地检查、关联 PR，Review 通过后合并。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-CN"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
