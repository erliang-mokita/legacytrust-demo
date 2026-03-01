import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/session';

const contentSchema = z.object({
  type: z.enum(['LETTER', 'INSTRUCTIONS', 'AVATAR_QA']),
  title: z.string().min(1),
  encryptedPayload: z.string().min(1),
  metadata: z.string().optional()
});

const payloadSchema = z.object({
  name: z.string().min(1),
  summary: z.string().optional(),
  cause: z.string().optional(),
  inactivityDays: z.number().int().min(1).max(3650).default(60),
  executorThreshold: z.number().int().min(1).max(5).default(2),
  executorCount: z.number().int().min(2).max(5).default(3),
  contents: z.array(contentSchema).default([]),
  beneficiaries: z.array(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
      relationship: z.string().optional(),
      scope: z.string().default('ALL')
    })
  ),
  executors: z.array(
    z.object({
      name: z.string().min(1),
      email: z.string().email()
    })
  ).min(2).max(5)
});

export async function GET() {
  try {
    const userId = await requireUserId();
    const plans = await prisma.plan.findMany({
      where: { settlorId: userId },
      include: {
        beneficiaries: true,
        executors: true,
        confirmations: true
      },
      orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json({ plans });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const parsed = payloadSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const data = parsed.data;
    const plan = await prisma.plan.create({
      data: {
        settlorId: userId,
        name: data.name,
        summary: data.summary,
        cause: data.cause,
        inactivityDays: data.inactivityDays,
        executorThreshold: data.executorThreshold,
        executorCount: data.executorCount,
        contentItems: {
          create: data.contents
        },
        beneficiaries: {
          create: data.beneficiaries
        },
        executors: {
          create: data.executors
        },
        auditLogs: {
          create: {
            userId,
            action: 'PLAN_CREATED',
            detail: 'Created custody plan'
          }
        }
      }
    });

    return NextResponse.json({ planId: plan.id });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
