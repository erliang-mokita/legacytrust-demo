import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/session';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const plan = await prisma.plan.findFirst({
      where: { id: params.id, settlorId: userId },
      include: {
        contentItems: true,
        beneficiaries: true,
        executors: true,
        fileAssets: true,
        confirmations: true,
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 20 }
      }
    });
    if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ plan });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const allowed = ['ARCHIVED', 'SAFE'];
    if (!allowed.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const plan = await prisma.plan.updateMany({
      where: { id: params.id, settlorId: userId },
      data: { status: body.status }
    });

    if (!plan.count) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.auditLog.create({ data: { planId: params.id, userId, action: 'PLAN_STATUS_UPDATED', detail: body.status } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
