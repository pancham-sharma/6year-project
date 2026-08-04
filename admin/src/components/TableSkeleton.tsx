import React from 'react';

interface Props {
  columns: number;
  rows?: number;
  darkMode: boolean;
}

export default function TableSkeleton({ columns, rows = 5, darkMode }: Props) {
  const bg = darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50';
  const itemBg = darkMode ? 'bg-gray-700' : 'bg-gray-100';

  return (
    <div className="animate-pulse w-full">
      <div className={`h-12 w-full ${bg} mb-4 rounded-t-xl`} />
      <div className="space-y-4 px-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2 border-b border-transparent">
            {Array.from({ length: columns }).map((_, j) => (
              <div 
                key={j} 
                className={`h-4 rounded ${itemBg}`} 
                style={{ width: j === 0 ? '40px' : `${Math.floor(Math.random() * 40) + 60}px` }} 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
