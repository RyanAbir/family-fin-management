"use client";

interface DistributionErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DistributionError({ error, reset }: DistributionErrorProps) {
  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h2 className="text-3xl font-bold">Distribution</h2>
      </header>

      <div className="rounded-xl bg-red-50 border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          Failed to Load Distribution Data
        </h3>
        <p className="text-red-700 mb-4">
          {error.message || "An error occurred while loading distribution data. Please try again."}
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
        <p className="text-sm text-slate-600">
          <strong>Error Details:</strong> {error.digest || "Unknown error"}
        </p>
      </div>
    </div>
  );
}
