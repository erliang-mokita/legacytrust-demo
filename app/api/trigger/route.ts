import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const { planId } = await request.json();
    const plan = await prisma.plan.findFirst({ where: { id: planId, settlorId: userId } });
    if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.plan.update({ where: { id: planId }, data: { status: 'PENDING_DELIVERY' } });
    await prisma.auditLog.create({ data: { planId, userId, action: 'MANUAL_TRIGGER' } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
