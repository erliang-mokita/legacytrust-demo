import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/session';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const plan = await prisma.plan.findFirst({
      where: { id: params.id, settlorId: userId },
      include: { confirmations: true, executors: true, beneficiaries: true, contentItems: true }
    });
    if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      status: plan.status,
      threshold: plan.executorThreshold,
      confirmations: plan.confirmations.length,
      executors: plan.executors.map((e) => ({ id: e.id, name: e.name, email: e.email })),
      beneficiaries: plan.beneficiaries,
      contentItems: plan.contentItems
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
