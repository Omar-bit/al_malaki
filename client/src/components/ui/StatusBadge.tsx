
export function StatusBadge({ status }: { status: 'active' | 'expired' | 'disabled' | string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
    expired: { bg: 'bg-red-100', text: 'text-red-800', label: 'Expired' },
    disabled: { bg: 'bg-gray-200', text: 'text-gray-600', label: 'Disabled' },
  };
  const c = config[status] ?? config.disabled;
  return (
    <span
      className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}
    >
      {c.label}
    </span>
  );
}
