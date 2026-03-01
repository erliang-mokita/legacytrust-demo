'use client';

export function DeliveryActions({ planId }: { planId: string }) {
  async function call(endpoint: string) {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId })
    });
    location.reload();
  }

  return (
    <div className="mt-3 flex gap-2">
      <button className="rounded bg-emerald-600 px-3 py-1 text-sm text-white" onClick={() => call('/api/trigger')}>
        一键交付
      </button>
      <button className="rounded bg-rose-600 px-3 py-1 text-sm text-white" onClick={() => call('/api/revoke')}>
        撤回
      </button>
    </div>
  );
}
