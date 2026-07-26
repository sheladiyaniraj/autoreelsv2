import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "AutoReels — AI Faceless Reel Generator";
const description =
  "Turn a topic, script, or URL into a finished faceless short-form video with AI voiceover, captions, B-roll, and music. Free to try.";

export const metadata: Metadata = {
  metadataBase: new URL("https://autoreels-one.vercel.app"),
  title: {
    default: title,
    template: "%s — AutoReels",
  },
  description,
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "AutoReels",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
