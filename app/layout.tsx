import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const qatar2022 = localFont({
  src: [
    {
      path: "../public/fonts/qatar2022/Qatar2022Arabic-Medium.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/qatar2022/Qatar2022Arabic-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/qatar2022/Qatar2022Arabic-Heavy.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-qatar2022",
});

export const metadata: Metadata = {
  title: "Growth Plus - نموذج التسجيل",
  description: "انضم إلى برنامج Growth Plus",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${qatar2022.variable} antialiased`}
        style={{ fontFamily: "var(--font-qatar2022), system-ui, sans-serif" }}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
