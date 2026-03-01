'use client';

import { useState } from 'react';
import { encryptFile, encryptText } from '@/lib/crypto-client';
import { useRouter } from 'next/navigation';

const causes = ['教育', '医疗', '灾难救助', '动物保护'];

export default function NewPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [file, setFile] = useState<File | null>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    const letter = String(formData.get('letter') || '');
    const instructions = String(formData.get('instructions') || '');
    const avatar = JSON.stringify({
      who: formData.get('who'),
      care: formData.get('care'),
      message: formData.get('message')
    });

    const [encLetter, encInstr, encAvatar] = await Promise.all([
      encryptText(letter, masterPassword),
      encryptText(instructions, masterPassword),
      encryptText(avatar, masterPassword)
    ]);

    const body = {
      name: formData.get('name'),
      summary: formData.get('summary'),
      cause: formData.get('cause'),
      inactivityDays: Number(formData.get('inactivityDays') || 60),
      executorThreshold: Number(formData.get('executorThreshold') || 2),
      executorCount: Number(formData.get('executorCount') || 3),
      contents: [
        { type: 'LETTER', title: '告别信', encryptedPayload: JSON.stringify(encLetter) },
        { type: 'INSTRUCTIONS', title: '关键指引', encryptedPayload: JSON.stringify(encInstr) },
        { type: 'AVATAR_QA', title: '数字分身片段', encryptedPayload: JSON.stringify(encAvatar) }
      ],
      beneficiaries: [
        {
          name: formData.get('beneficiaryName'),
          email: formData.get('beneficiaryEmail'),
          relationship: formData.get('beneficiaryRelationship'),
          scope: formData.get('beneficiaryScope')
        }
      ],
      executors: [
        { name: formData.get('executor1Name'), email: formData.get('executor1Email') },
        { name: formData.get('executor2Name'), email: formData.get('executor2Email') },
        { name: formData.get('executor3Name'), email: formData.get('executor3Email') }
      ]
    };

    const res = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      alert('创建失败');
      setLoading(false);
      return;
    }

    const { planId } = await res.json();

    if (file) {
      const enc = await encryptFile(file, masterPassword);
      const uploadForm = new FormData();
      uploadForm.append('file', new File([enc.blob], `${file.name}.enc`, { type: 'application/octet-stream' }));
      uploadForm.append('planId', planId);
      uploadForm.append('iv', enc.iv);
      uploadForm.append('salt', enc.salt);
      await fetch('/api/upload', { method: 'POST', body: uploadForm });
    }

    alert('计划创建成功。密钥份额（演示）：已生成 3 份，需要 2 份恢复。');
    router.push('/dashboard');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">创建托管计划（移动端优先）</h1>
      <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm">主口令仅用于本地加密/解密，服务端不保存。丢失后无法恢复内容。</p>
      <form className="space-y-6" action={onSubmit}>
        <section className="rounded bg-white p-4 shadow">
          <h2 className="font-semibold">Step 1 基本信息</h2>
          <div className="mt-3 grid gap-2">
            <input name="name" className="rounded border px-3 py-2" placeholder="计划名称" required />
            <textarea name="summary" className="rounded border px-3 py-2" placeholder="简介" />
            <select name="cause" className="rounded border px-3 py-2">{causes.map((c) => <option key={c}>{c}</option>)}</select>
            <input className="rounded border px-3 py-2" placeholder="主口令（本地派生密钥）" value={masterPassword} onChange={(e) => setMasterPassword(e.target.value)} required />
          </div>
        </section>

        <section className="rounded bg-white p-4 shadow">
          <h2 className="font-semibold">Step 2 内容模块</h2>
          <div className="mt-3 grid gap-2">
            <textarea name="letter" className="rounded border px-3 py-2" placeholder="告别信/遗嘱说明（Markdown）" required />
            <textarea name="instructions" className="rounded border px-3 py-2" placeholder="关键指引（不要包含违法内容）" required />
            <input name="who" className="rounded border px-3 py-2" placeholder="我是谁" required />
            <input name="care" className="rounded border px-3 py-2" placeholder="我在乎什么" required />
            <input name="message" className="rounded border px-3 py-2" placeholder="我想对你说什么" required />
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
        </section>

        <section className="rounded bg-white p-4 shadow">
          <h2 className="font-semibold">Step 3 受益人</h2>
          <div className="mt-3 grid gap-2">
            <input name="beneficiaryName" className="rounded border px-3 py-2" placeholder="姓名" required />
            <input name="beneficiaryEmail" className="rounded border px-3 py-2" type="email" placeholder="邮箱" required />
            <input name="beneficiaryRelationship" className="rounded border px-3 py-2" placeholder="关系（可选）" />
            <input name="beneficiaryScope" className="rounded border px-3 py-2" placeholder="可见范围（默认ALL）" defaultValue="ALL" />
          </div>
        </section>

        <section className="rounded bg-white p-4 shadow">
          <h2 className="font-semibold">Step 4 执行人（2~5，默认3）</h2>
          <div className="mt-3 grid gap-2">
            <input name="executor1Name" className="rounded border px-3 py-2" placeholder="执行人1姓名" required />
            <input name="executor1Email" className="rounded border px-3 py-2" type="email" placeholder="执行人1邮箱" required />
            <input name="executor2Name" className="rounded border px-3 py-2" placeholder="执行人2姓名" required />
            <input name="executor2Email" className="rounded border px-3 py-2" type="email" placeholder="执行人2邮箱" required />
            <input name="executor3Name" className="rounded border px-3 py-2" placeholder="执行人3姓名" required />
            <input name="executor3Email" className="rounded border px-3 py-2" type="email" placeholder="执行人3邮箱" required />
          </div>
        </section>

        <section className="rounded bg-white p-4 shadow">
          <h2 className="font-semibold">Step 5 触发条件</h2>
          <div className="mt-3 grid gap-2">
            <input name="inactivityDays" className="rounded border px-3 py-2" type="number" min={1} defaultValue={60} />
            <input name="executorThreshold" className="rounded border px-3 py-2" type="number" min={1} defaultValue={2} />
            <input name="executorCount" className="rounded border px-3 py-2" type="number" min={2} max={5} defaultValue={3} />
          </div>
        </section>

        <button disabled={loading} className="w-full rounded bg-brand px-4 py-3 text-white disabled:opacity-70">
          {loading ? '创建中...' : '创建托管计划'}
        </button>
      </form>
    </div>
  );
}
