export default function DistributionLoading() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h2 className="text-3xl font-bold">Distribution</h2>
      </header>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 dark:border-slate-800/60 p-5 shadow-sm bg-slate-100 dark:bg-slate-800 animate-pulse"
          >
            <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded w-1/2 mt-2"></div>
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <section className="rounded-xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800/60">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
            <div className="w-full h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"></div>
          </div>
          <div className="flex-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
            <div className="w-full h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"></div>
          </div>
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded px-4 animate-pulse w-24"></div>
        </div>
      </section>

      {/* Table Skeleton */}
      <section className="rounded-xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800/60">
        <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Property Distribution</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
          ))}
        </div>
      </section>
    </div>
  );
}
