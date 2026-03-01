'use client';

import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button className="rounded border px-3 py-1 text-sm" onClick={() => signOut({ callbackUrl: '/' })}>
      退出登录
    </button>
  );
}
