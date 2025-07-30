import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../lib/ThemeContext";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Market News Sentiment Analyzer",
  description: "AI-powered real-time sentiment analysis of market-moving headlines from multiple sources including RSS feeds, social media, and news APIs.",
  keywords: ["market sentiment", "news analysis", "AI", "financial news", "trading", "sentiment analysis"],
  authors: [{ name: "Market Sentiment Analyzer" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
