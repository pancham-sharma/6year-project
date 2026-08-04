

interface Props {
  darkMode: boolean;
}

export default function CardSkeleton({ darkMode }: Props) {
  const bg = darkMode ? 'bg-gray-800/50' : 'bg-gray-50/50';
  const itemBg = darkMode ? 'bg-gray-700' : 'bg-gray-200';

  return (
    <div className={`animate-pulse rounded-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-100'} p-5 ${bg}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${itemBg}`} />
          <div className="space-y-2">
            <div className={`h-4 w-24 rounded ${itemBg}`} />
            <div className={`h-3 w-16 rounded ${itemBg}`} />
          </div>
        </div>
        <div className={`w-8 h-8 rounded-lg ${itemBg}`} />
      </div>
      <div className="space-y-3">
        <div className={`h-3 w-full rounded ${itemBg}`} />
        <div className={`h-3 w-3/4 rounded ${itemBg}`} />
        <div className={`h-3 w-1/2 rounded ${itemBg}`} />
      </div>
    </div>
  );
}
