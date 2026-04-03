import React from "react";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-slate-200/60 ${className}`} />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between border-b pb-4 border-slate-200">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex justify-between items-start">
               <Skeleton className="h-4 w-24" />
               <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-10 w-32 mt-4" />
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-[450px] rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex justify-between items-center mb-8">
             <Skeleton className="h-6 w-48" />
             <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="h-[300px] w-full" />
        </div>
        <div className="h-[450px] rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4">
             <Skeleton className="h-6 w-32" />
             <Skeleton className="h-4 w-48" />
             <div className="flex justify-center py-8">
                <Skeleton className="h-40 w-40 rounded-full" />
             </div>
             <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
             </div>
          </div>
        </div>
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-80 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
           <Skeleton className="h-6 w-48 mb-6" />
           <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between items-center">
                   <Skeleton className="h-4 w-32" />
                   <Skeleton className="h-4 w-16" />
                </div>
              ))}
           </div>
        </div>
        <div className="h-80 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
           <Skeleton className="h-6 w-48 mb-6" />
           <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3 items-center">
                   <Skeleton className="h-10 w-10 rounded-full" />
                   <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full mb-6" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
