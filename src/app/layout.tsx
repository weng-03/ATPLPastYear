import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ATPL Past Year — Aviation Exam Preparation",
  description:
    "Prepare for your aviation ground school exams with adaptive quizzes, timed exam mode, and detailed progress tracking.",
  keywords: ["aviation", "ground school", "exam prep", "pilot", "EASA", "ATPL", "PPL", "CPL"],
  openGraph: {
    title: "ATPL Past Year",
    description: "Prepare for your aviation ground school exams with adaptive quizzes, timed exam mode, and detailed progress tracking.",
    url: "https://atpl-past-year.vercel.app", // Replace with actual URL
    siteName: "ATPL Past Year",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ATPL Past Year",
    description: "Prepare for your aviation ground school exams with adaptive quizzes, timed exam mode, and detailed progress tracking.",
  },
  appleWebApp: {
    title: "ATPL Past Year",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full antialiased" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
