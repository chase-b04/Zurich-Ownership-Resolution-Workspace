import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { Nav } from "@/components/nav";
import { MockDataBanner } from "@/components/mock-data-banner";
import { SystemFooter } from "@/components/system-footer";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ownership Resolution Workspace",
  description: "AI-assisted CMDB ownership review and resolution",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const role = token ? verifySessionToken(token) : null;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-900">
        <Nav role={role} />
        <MockDataBanner />
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
        <SystemFooter />
      </body>
    </html>
  );
}
