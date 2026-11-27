/** What the dashboard shows while the session and replies load: its shape, quietly. */
export function DashboardSkeleton() {
  const bar = "rounded-full bg-linen/80 motion-safe:animate-pulse";
  return (
    <div aria-busy="true" aria-label="Loading your dashboard">
      <div className="border-b border-ink/8">
        <div className="shell flex min-h-17 items-center justify-between">
          <div className={`h-4 w-40 ${bar}`} />
          <div className={`h-9 w-24 ${bar}`} />
        </div>
      </div>
      <div className="shell py-8 sm:py-12">
        <div className={`h-3 w-28 ${bar}`} />
        <div className={`mt-4 h-10 w-72 max-w-full ${bar}`} />
        <div className="mt-8 grid h-[136px] grid-cols-2 overflow-hidden rounded-[18px] border border-linen lg:grid-cols-4 lg:h-[120px]" />
        <div className={`mt-10 h-11 w-full max-w-[420px] ${bar}`} />
        <div className="mt-4 h-[320px] rounded-[18px] border border-linen" />
      </div>
    </div>
  );
}
