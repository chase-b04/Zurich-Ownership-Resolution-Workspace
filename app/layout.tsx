import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Nav } from "@/components/nav";
import { MockDataBanner } from "@/components/mock-data-banner";
import { SystemFooter } from "@/components/system-footer";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { isUsingMockData } from "@/lib/servicenow/client";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased">
      <body className="app-shell min-h-full flex flex-col">
        <Nav role={role} connected={!isUsingMockData()} />
        <MockDataBanner />
        <main className="mx-auto w-full max-w-[1480px] flex-1 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          {children}
        </main>
        <SystemFooter />
      </body>
    </html>
  );
}
