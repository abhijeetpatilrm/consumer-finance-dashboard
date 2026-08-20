import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Firma — Next Gen Finance",
  description: "Track your transactions, analyse spending patterns, and manage rewards in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-white text-[#181D27] antialiased">
        <div className="flex h-dvh overflow-hidden bg-white">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden min-w-0 bg-white">
            <TopNav />
            <main
              id="main-content"
              className="flex-1 overflow-y-auto px-6 py-8 sm:px-10 sm:py-10 bg-[#FAFAFB]"
            >
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
