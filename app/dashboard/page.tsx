import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DeliveryActions } from '@/components/delivery-actions';
import { SignOutButton } from '@/components/signout-button';

export default async function DashboardPage({ searchParams }: { searchParams?: { mode?: string; planId?: string } }) {
  const mode = searchParams?.mode ?? 'settlor';

  if (mode === 'executor') {
    const plan = searchParams?.planId ? await prisma.plan.findUnique({ where: { id: searchParams.planId } }) : null;
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">执行人确认视图</h1>
        <p className="text-sm text-slate-600">执行人仅可查看必要元信息，不可查看具体内容。</p>
        {plan ? (
          <div className="rounded bg-white p-4 shadow">
            <p>计划：{plan.name}</p>
            <p>状态：{plan.status}</p>
            <form action={`/api/plans/${plan.id}/confirm`} method="post" className="mt-3 flex gap-2">
              <input name="email" className="rounded border px-2 py-1" placeholder="执行人邮箱" required />
              <button className="rounded bg-brand px-3 py-1 text-white">确认交付</button>
            </form>
          </div>
        ) : (
          <p>请携带 planId 参数访问，例如 /dashboard?mode=executor&planId=xxx</p>
        )}
      </div>
    );
  }

  if (mode === 'beneficiary') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">受益人交付视图</h1>
        <p className="text-sm text-slate-700">仅在计划状态为“已交付”后可查看密文内容并输入主口令在本地解密。</p>
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">MVP 演示：请访问公开 API /api/plans/:id/status 并在前端使用主口令解密。</p>
      </div>
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const plans = await prisma.plan.findMany({
    where: { settlorId: session.user.id },
    include: { confirmations: true, executors: true },
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">我的托管计划</h1>
        <div className="flex items-center gap-2">
          <Link href="/plan/new" className="rounded bg-brand px-3 py-2 text-sm text-white">创建计划</Link>
          <SignOutButton />
        </div>
      </div>
      {plans.length === 0 ? <p>暂无计划，先创建一个吧。</p> : null}
      {plans.map((plan) => (
        <div key={plan.id} className="rounded-xl bg-white p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">{plan.name}</h2>
              <p className="text-sm text-slate-600">状态：{plan.status} · 执行人确认 {plan.confirmations.length}/{plan.executorThreshold}</p>
              <p className="text-sm text-slate-600">触发：{plan.inactivityDays} 天未登录，阈值 {plan.executorThreshold}-of-{plan.executorCount}</p>
            </div>
            <form action={`/api/plans/${plan.id}`} method="post"></form>
          </div>
          <DeliveryActions planId={plan.id} />
        </div>
      ))}
    </div>
  );
}
