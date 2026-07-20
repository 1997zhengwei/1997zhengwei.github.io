import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wei Zheng (郑伟) | Antennas, Electromagnetics & 6G",
  description:
    "Bilingual academic profile of Wei Zheng, a POSTECH postdoctoral fellow researching antennas, electromagnetics, holographic focusing, and 6G technologies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
