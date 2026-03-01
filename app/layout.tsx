import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'LegacyTrust',
  description: 'Digital legacy custody MVP'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="zh-CN">
      <body>
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold text-brand">LegacyTrust</Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/disclaimer">免责声明</Link>
              <Link href="/privacy">隐私政策</Link>
              {session ? <span className="text-slate-500">{session.user?.email}</span> : <Link href="/login">登录</Link>}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
