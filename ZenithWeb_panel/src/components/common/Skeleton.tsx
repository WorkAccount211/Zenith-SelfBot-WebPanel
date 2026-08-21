import React from 'react';

export const SkeletonBox: React.FC<{
  className?: string;
  rounded?: string;
}> = ({ className = 'h-4 w-full', rounded = 'rounded-xl' }) => {
  return (
    <div
      className={`skeleton-shimmer bg-purple-950/20 border border-purple-500/10 ${rounded} ${className}`}
    />
  );
};

export const SkeletonCircle: React.FC<{
  size?: string;
  className?: string;
}> = ({ size = 'w-10 h-10', className = '' }) => {
  return (
    <div
      className={`skeleton-shimmer bg-purple-950/20 border border-purple-500/10 rounded-full shrink-0 ${size} ${className}`}
    />
  );
};

export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}> = ({ lines = 2, className = '', lastLineWidth = 'w-2/3' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          className={`h-3.5 ${i === lines - 1 && lines > 1 ? lastLineWidth : 'w-full'}`}
          rounded="rounded-md"
        />
      ))}
    </div>
  );
};

export const ChartSkeleton: React.FC<{ className?: string; height?: string }> = ({
  className = '',
  height = 'h-64'
}) => {
  return (
    <div className={`p-6 rounded-2xl bg-[#131024]/70 border border-purple-500/20 backdrop-blur-xl shadow-xl space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SkeletonCircle size="w-6 h-6" />
          <SkeletonBox className="h-5 w-48" />
        </div>
        <SkeletonBox className="h-6 w-28 rounded-lg" />
      </div>

      <div className={`flex items-end justify-between gap-3 pt-6 ${height}`}>
        {[45, 60, 85, 55, 95, 75, 65].map((pct, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <SkeletonBox className="h-3 w-8" rounded="rounded" />
            <div
              style={{ height: `${pct}%` }}
              className="w-full max-w-[44px] skeleton-shimmer bg-purple-900/30 border border-purple-500/20 rounded-t-xl"
            />
            <SkeletonBox className="h-3 w-6" rounded="rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-[#131024]/70 border border-purple-500/20 backdrop-blur-xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <SkeletonBox className="h-3.5 w-24" />
              <SkeletonCircle size="w-9 h-9" />
            </div>
            <SkeletonBox className="h-8 w-32" />
            <SkeletonBox className="h-3 w-40" />
          </div>
        ))}
      </div>

      {/* Bot Hero & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#131024]/70 border border-purple-500/20 backdrop-blur-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <SkeletonCircle size="w-20 h-20" />
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <SkeletonBox className="h-6 w-44" />
                <SkeletonBox className="h-5 w-16 rounded-full" />
              </div>
              <SkeletonBox className="h-4 w-64" />
              <div className="flex gap-2 pt-1">
                <SkeletonBox className="h-5 w-20 rounded-full" />
                <SkeletonBox className="h-5 w-24 rounded-full" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBox key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Quick Actions Skeleton */}
        <div className="p-6 rounded-2xl bg-[#131024]/70 border border-purple-500/20 backdrop-blur-xl space-y-4">
          <SkeletonBox className="h-5 w-36" />
          <div className="space-y-3">
            <SkeletonBox className="h-10 rounded-xl" />
            <SkeletonBox className="h-10 rounded-xl" />
            <SkeletonBox className="h-10 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Chart Skeleton */}
      <ChartSkeleton height="h-60" />
    </div>
  );
};

export const ServersSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <SkeletonBox className="h-6 w-44" />
          <SkeletonBox className="h-3.5 w-60" />
        </div>
        <SkeletonBox className="h-10 w-full sm:w-72 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-[#131024]/70 border border-purple-500/20 backdrop-blur-xl overflow-hidden"
          >
            <div className="h-28 skeleton-shimmer bg-purple-950/40" />
            <div className="p-5 space-y-4 -mt-8">
              <div className="flex items-end justify-between">
                <SkeletonCircle size="w-16 h-16" className="ring-4 ring-[#131024]" />
                <SkeletonBox className="h-6 w-24 rounded-lg" />
              </div>
              <div className="space-y-1.5 pt-1">
                <SkeletonBox className="h-5 w-40" />
                <SkeletonBox className="h-4 w-32" />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <SkeletonBox className="h-12 rounded-xl" />
                <SkeletonBox className="h-12 rounded-xl" />
                <SkeletonBox className="h-12 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MembersSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <SkeletonBox className="h-6 w-48" />
          <SkeletonBox className="h-3.5 w-64" />
        </div>
        <SkeletonBox className="h-10 w-full sm:w-72 rounded-xl" />
      </div>

      <div className="rounded-2xl bg-[#131024]/70 border border-purple-500/20 backdrop-blur-xl divide-y divide-purple-500/10 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <SkeletonCircle size="w-11 h-11" />
              <div className="space-y-2 flex-1 max-w-xs">
                <SkeletonBox className="h-4 w-36" />
                <SkeletonBox className="h-3 w-24" />
              </div>
            </div>
            <div className="hidden sm:flex gap-2">
              <SkeletonBox className="h-6 w-20 rounded-md" />
              <SkeletonBox className="h-6 w-24 rounded-md" />
            </div>
            <SkeletonBox className="h-8 w-28 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const EmojisSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <SkeletonBox className="h-6 w-44" />
          <SkeletonBox className="h-3.5 w-56" />
        </div>
        <SkeletonBox className="h-10 w-full sm:w-72 rounded-xl" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-[#131024]/70 border border-purple-500/20 backdrop-blur-xl flex flex-col items-center justify-center space-y-3 text-center"
          >
            <SkeletonBox className="w-12 h-12 rounded-xl" />
            <SkeletonBox className="h-3.5 w-16" />
            <SkeletonBox className="h-4 w-20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const LogsSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <SkeletonBox className="h-6 w-40" />
          <SkeletonBox className="h-3.5 w-52" />
        </div>
        <div className="flex gap-2">
          <SkeletonBox className="h-9 w-24 rounded-xl" />
          <SkeletonBox className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      <div className="rounded-2xl bg-[#090812] border border-purple-500/20 p-5 font-mono space-y-3 shadow-2xl">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <SkeletonBox className="h-4 w-16 rounded" />
            <SkeletonBox className="h-4 w-14 rounded" />
            <SkeletonBox className={`h-4 ${i % 2 === 0 ? 'w-3/4' : 'w-1/2'} rounded`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export const StatsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-1">
        <SkeletonBox className="h-6 w-52" />
        <SkeletonBox className="h-3.5 w-72" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl bg-[#131024]/70 border border-purple-500/20 space-y-2">
            <SkeletonBox className="h-3.5 w-24" />
            <SkeletonBox className="h-8 w-20" />
            <SkeletonBox className="h-3 w-32" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <ChartSkeleton height="h-56" />
        </div>
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#131024]/70 border border-purple-500/20 space-y-3">
          <SkeletonBox className="h-5 w-44" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBox key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
