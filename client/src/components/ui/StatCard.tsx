import React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  IconComponent?: React.ElementType;
  variant?: 'analytics' | 'default';
}

export function StatCard({ label, value, icon, IconComponent, variant = 'default' }: StatCardProps) {
  if (variant === 'analytics') {
    return (
      <div className='group relative overflow-hidden rounded-[28px] border border-[#d5bd9d] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md'>
        <div className='flex items-center justify-between'>
          <p className='text-xs uppercase tracking-[0.2em] text-[#6D5A46] font-bold'>
            {label}
          </p>
          {IconComponent && (
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-[#F4E0D4]/50 text-dark-red transition-colors group-hover:bg-dark-red group-hover:text-white'>
              <IconComponent className='h-5 w-5' />
            </div>
          )}
        </div>
        <div className='mt-4 text-3xl font-extrabold text-black'>{value}</div>
      </div>
    );
  }

  return (
    <div className='bg-[#D9D9D957] rounded-3xl p-6 shadow-sm border border-[#3F060F]/40 flex flex-col justify-between min-h-[128px] hover:shadow-md transition-shadow'>
      <div className='flex items-center justify-between'>
        <h3 className='text-black font-semibold text-lg'>{label}</h3>
        {icon && <span className='text-[#6D5A46]'>{icon}</span>}
      </div>
      <div className='mt-auto text-2xl font-bold text-black'>{value}</div>
    </div>
  );
}
