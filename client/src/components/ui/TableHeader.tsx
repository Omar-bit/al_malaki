import React from 'react';

export function TableHeader({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
}) {
  return (
    <th
      className={`px-4 py-3 text-${align} text-[11px] font-semibold text-[#6D5A46]`}
    >
      {children}
    </th>
  );
}
