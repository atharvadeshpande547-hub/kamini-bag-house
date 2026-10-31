import type { ReactNode } from 'react';

type Color = 'green' | 'red' | 'amber' | 'blue' | 'stone' | 'purple';

interface BadgeProps {
  color?: Color;
  children: ReactNode;
  className?: string;
}

const colors: Record<Color, string> = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  stone: 'bg-stone-100 text-stone-700',
  purple: 'bg-purple-100 text-purple-700',
};

export default function Badge({ color = 'stone', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color]} ${className}`}
    >
      {children}
    </span>
  );
}
