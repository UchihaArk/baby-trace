import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeColorSync } from "@/components/theme-color-sync";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "拾光记",
  description: "新生儿喂奶 / 换尿布 / 睡眠一键记录",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

// iOS「添加到主屏幕」启动图。对齐 shiye-books（同设备可用）的写法，直接在 <head> 硬编码，
// 不走 Next.js metadata 的 appleWebApp（Next 15+ 对 apple-touch-startup-image 有渲染差异，
// 且 Next 不会输出 apple-mobile-web-app-capable）。
// 关键：不要带「无 media 的兜底 link」——iOS 会把它当作全设备默认值，尺寸不符时整体弃用、显白屏。
const APPLE_STARTUP_IMAGES: ReadonlyArray<readonly [string, string]> = [
  ["splash-640x1136.png", "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"],
  ["splash-750x1334.png", "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"],
  ["splash-1125x2436.png", "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"],
  ["splash-1170x2532.png", "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"],
  ["splash-1179x2556.png", "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"],
  ["splash-1206x2622.png", "(device-width: 402px) and (device-height: 869px) and (-webkit-device-pixel-ratio: 3)"],
  ["splash-1242x2688.png", "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)"],
  ["splash-1284x2778.png", "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)"],
  ["splash-1290x2796.png", "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"],
  ["splash-1320x2868.png", "(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3)"],
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="拾光记" />
        <meta name="apple-touch-fullscreen" content="yes" />
        {APPLE_STARTUP_IMAGES.map(([file, media]) => (
          <link key={file} rel="apple-touch-startup-image" href={`/icons/${file}`} media={media} />
        ))}
      </head>
      <body className="flex min-h-dvh flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ThemeColorSync />
          {children}
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
