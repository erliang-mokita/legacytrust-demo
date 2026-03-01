'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow">
      <h1 className="text-xl font-semibold">注册账号</h1>
      <form
        className="mt-4 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
          });
          if (!res.ok) {
            setError('注册失败，邮箱可能已存在。');
            return;
          }
          router.push('/login');
        }}
      >
        <input className="w-full rounded border px-3 py-2" placeholder="姓名" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="w-full rounded border px-3 py-2" placeholder="邮箱" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full rounded border px-3 py-2" placeholder="密码（至少8位）" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button className="w-full rounded bg-brand px-4 py-2 text-white">创建账号</button>
      </form>
    </div>
  );
}
