import type { RsvpSummary } from "@/dashboard/data";

/**
 * The four headline figures. "Attending" and "Declined" count replies;
 * "Confirmed guests" counts people (the sum of guests on accepted replies).
 */
export function SummaryFigures({ summary }: { summary: RsvpSummary }) {
  const figures = [
    { label: "Total responses", value: summary.total, note: "replies received" },
    { label: "Attending", value: summary.attending, note: summary.attending === 1 ? "reply accepted" : "replies accepted" },
    { label: "Declined", value: summary.declined, note: summary.declined === 1 ? "reply declined" : "replies declined" },
    { label: "Confirmed guests", value: summary.guests, note: "people coming", highlight: true },
  ];
  return (
    <dl className="m-0 grid grid-cols-2 overflow-hidden rounded-[18px] border border-linen bg-white/60 lg:grid-cols-4">
      {figures.map((f, i) => (
        <div
          key={f.label}
          className={`flex flex-col gap-1 p-5 sm:p-6 ${i % 2 === 1 ? "border-l border-linen" : ""} ${i >= 2 ? "border-t border-linen lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""} ${f.highlight ? "bg-sage-wash/60" : ""}`}
        >
          <dt className="order-2 text-sm font-medium text-ink">{f.label}</dt>
          <dd className={`order-1 m-0 font-serif text-[44px] leading-none font-medium lining-nums tabular-nums ${f.highlight ? "text-olive" : "text-gold"}`}>{f.value}</dd>
          <dd className="order-3 m-0 text-xs text-muted">{f.note}</dd>
        </div>
      ))}
    </dl>
  );
}
