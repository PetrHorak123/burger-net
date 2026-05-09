import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/contexts/LocaleContext";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Burger-Net",
  description: "Spin the wheel, claim your burger, climb the leaderboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="cs"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider>
          {process.env.ANNOUNCEMENT && (
            <div className="print:hidden bg-amber-100 border-b border-amber-200 py-2 px-4 text-center text-sm text-amber-800 font-medium">
              {process.env.ANNOUNCEMENT}
            </div>
          )}
          {children}
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}
