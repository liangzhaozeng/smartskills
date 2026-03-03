import type { Metadata } from "next";
import { Fira_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const firaMono = Fira_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Skills Directory",
  description: "Internal Agent Skills Directory",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${firaMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
