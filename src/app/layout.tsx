import "@/styles/globals.css";

import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Schedule Checker",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={`size-full ${jetbrainsMono.variable} dark`}
    >
      <body className={`size-full ${jetbrainsMono.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
