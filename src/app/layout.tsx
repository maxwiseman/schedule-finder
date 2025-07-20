import "@/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Schedule Checker",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={`size-full ${geist.variable}`}
    >
      <body className="size-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
