export interface AdminColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
}

interface AdminTableProps<T = Record<string, unknown>> {
  columns: AdminColumn<T>[];
  rows: T[];
  emptyMessage?: string;
  emptyDescription?: string;
}

function getVal(row: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce((acc: unknown, k) => {
    if (acc !== null && typeof acc === 'object') return (acc as Record<string, unknown>)[k];
    return undefined;
  }, row);
}

export function AdminTable<T extends Record<string, unknown>>({
  columns,
  rows,
  emptyMessage = 'No records found',
  emptyDescription,
}: AdminTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="a-card text-center py-12">
        <p className="text-sm font-medium text-[#555]">{emptyMessage}</p>
        {emptyDescription && (
          <p className="mt-1 text-xs text-[#444]">{emptyDescription}</p>
        )}
      </div>
    );
  }

  return (
    <div className="a-card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="a-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render
                      ? col.render(getVal(row, col.key), row)
                      : String(getVal(row, col.key) ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
