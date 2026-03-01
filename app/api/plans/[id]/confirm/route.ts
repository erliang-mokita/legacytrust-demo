import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { simpleRateLimit } from '@/lib/utils';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const contentType = request.headers.get('content-type') || '';
  let email = '';
  if (contentType.includes('application/json')) {
    const body = await request.json();
    email = String(body.email || '').toLowerCase();
  } else {
    const form = await request.formData();
    email = String(form.get('email') || '').toLowerCase();
  }
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });
  const rl = simpleRateLimit(`confirm:${email}`, 20);
  if (!rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const executor = await prisma.executor.findFirst({ where: { planId: params.id, email } });
  if (!executor) return NextResponse.json({ error: 'Executor not found' }, { status: 404 });

  await prisma.executorConfirmation.upsert({
    where: { executorId_planId: { executorId: executor.id, planId: params.id } },
    create: { executorId: executor.id, planId: params.id },
    update: { confirmedAt: new Date() }
  });

  const plan = await prisma.plan.findUnique({ where: { id: params.id }, include: { confirmations: true } });
  if (plan && plan.confirmations.length >= plan.executorThreshold && plan.status !== 'DELIVERED') {
    await prisma.plan.update({ where: { id: plan.id }, data: { status: 'DELIVERED', deliveredAt: new Date() } });
    await prisma.auditLog.create({ data: { planId: plan.id, action: 'DELIVERED_BY_EXECUTORS', detail: `${plan.confirmations.length} confirmations` } });
    console.log(`[LegacyTrust] plan delivered ${plan.id} notify beneficiaries by email (TODO)`);
  }

  return NextResponse.json({ ok: true });
}
