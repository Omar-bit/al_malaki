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
      className={`px-6 py-5 text-${align} text-[11px] font-bold uppercase tracking-[0.25em] text-[#8c7a66]`}
    >
      {children}
    </th>
  );
}
