import React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  IconComponent?: React.ElementType;
  variant?: 'analytics' | 'default';
  trend?: string;
  trendPositive?: boolean;
  subtitle?: string;
}

export function StatCard({
  label,
  value,
  icon,
  IconComponent,
  variant = 'default',
  trend,
  trendPositive = true,
  subtitle,
}: StatCardProps) {
  if (variant === 'analytics') {
    return (
      <div className='relative overflow-hidden rounded-[18px] border border-[#3F060F] bg-[#D9D9D957] p-4 shadow-sm flex-1'>
        <div className='flex items-center justify-between mb-3'>
          <p className='text-[18px]  text-[#1c1c1c] font-bona'>{label}</p>
          {IconComponent && (
            <div className='flex h-6 w-6 items-center justify-center rounded-md bg-[#D9D9D9] text-[#000000]'>
              <IconComponent className='h-4 w-4 text-sm' strokeWidth={2.5} />
            </div>
          )}
        </div>

        <div>
          <div className='text-base font-semibold text-black mb-1   font-aboreto'>
            {value}
          </div>

          {trend && (
            <div
              className={`text-xs  font-abee ${
                trendPositive ? 'text-[#38a169]' : 'text-[#e53e3e]'
              }`}
            >
              {trend}
            </div>
          )}
          {subtitle && !trend && (
            <div className='text-[11px] font-aboreto text-[#00000082] uppercase tracking-wider'>
              {subtitle}
            </div>
          )}
        </div>
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
