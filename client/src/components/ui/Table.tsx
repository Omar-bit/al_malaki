import type { ReactNode } from 'react';

interface CommonProps {
  children?: ReactNode;
  className?: string;
}

export function TableContainer({ children, className = '' }: CommonProps) {
  return (
    <div className={`overflow-x-auto custom-scrollbar ${className}`}>
      {children}
    </div>
  );
}

export function Table({ children, className = '' }: CommonProps) {
  return (
    <table className={`w-full text-sm text-left border-collapse ${className}`}>
      {children}
    </table>
  );
}

export function TableHead({ children, className = '' }: CommonProps) {
  return <thead className={`${className}`}>{children}</thead>;
}

export function TableBody({ children, className = '' }: CommonProps) {
  return <tbody className={`${className}`}>{children}</tbody>;
}

export function TableRow({ children, className = '' }: CommonProps) {
  return <tr className={`${className}`}>{children}</tr>;
}

export function TableCell({
  children,
  className = '',
  colSpan,
}: CommonProps & { colSpan?: number }) {
  return (
    <td className={`py-3 px-3 ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}

export function TableHeaderCell({
  children,
  className = '',
  align = 'left',
}: CommonProps & { align?: 'left' | 'right' | 'center' }) {
  return (
    <th className={`py-3 px-3 font-semibold text-black text-${align} ${className}`}>
      {children}
    </th>
  );
}
