import { requireSuperAdmin } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';

export const dynamic = 'force-dynamic';

function fmtDate(iso: string | null) {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function isExpired(iso: string | null) {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

const cols: AdminColumn[] = [
  {
    key: 'code',
    label: 'Code',
    render: (v) => <span className="font-mono text-[13px] text-[#e8e8e8]">{String(v)}</span>,
  },
  {
    key: 'subject_type',
    label: 'Scope',
    render: (v, row) => {
      const cls = v === 'global' ? 'a-badge a-badge-blue' : v === 'gym' ? 'a-badge a-badge-ok' : 'a-badge a-badge-warn';
      const label = v === 'global' ? 'Global' : v === 'gym' ? `Gym` : `User`;
      const id = row.subject_id ? ` · ${String(row.subject_id).slice(0, 6).toUpperCase()}` : '';
      return <span className={cls}>{label}{id}</span>;
    },
  },
  {
    key: 'features',
    label: 'Features',
    render: (v) => {
      const arr = Array.isArray(v) ? v : [];
      return (
        <span className="text-[12px] text-[#909090]">
          {arr.length ? (arr as string[]).join(', ') : '—'}
        </span>
      );
    },
  },
  {
    key: 'valid_until',
    label: 'Expires',
    render: (v) => {
      const expired = isExpired(v as string | null);
      return (
        <span className={expired ? 'text-[#555] line-through text-[12px]' : 'text-[12px] text-[#909090]'}>
          {fmtDate(v as string | null)}
        </span>
      );
    },
  },
  {
    key: 'created_at',
    label: 'Created',
    render: (v) => fmtDate(v as string | null),
  },
];

export default async function PromotionsPage() {
  await requireSuperAdmin();
  const admin = getAdminSupabase();

  const { data: promos } = await admin
    .from('promotion_rules')
    .select('id, code, features, valid_until, subject_type, subject_id')
    .order('code', { ascending: true });

  const rows = (promos ?? []) as Record<string, unknown>[];
  const active = rows.filter(r => !isExpired(r.valid_until as string | null));

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h2 className="text-[18px] font-bold text-[#e8e8e8]">Promotions</h2>
        <p className="text-[13px] text-[#555] mt-0.5">
          {active.length} active · {rows.length} total
        </p>
      </div>
      <AdminTable
        columns={cols}
        rows={rows}
        emptyMessage="No promotion rules"
        emptyDescription="Promotions grant features beyond a user's base plan. Add them via SQL or a future admin UI."
      />
    </div>
  );
}
