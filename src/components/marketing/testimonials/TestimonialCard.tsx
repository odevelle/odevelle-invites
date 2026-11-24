import type { Testimonial } from "@/content/marketing/testimonials";
import { Star } from "../icons";

/** Five gold stars. Every client review carries the same rating. */
function Rating() {
  return (
    <p className="m-0 flex items-center gap-1" aria-label="Rated 5 out of 5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} />
      ))}
    </p>
    
  );
}

/** One review: rating, the client's words, then their initials, name and place. */
export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="m-0 flex h-full flex-col rounded-[22px] bg-white px-7 py-7.5 shadow-[0_1px_2px_rgba(31,36,32,0.05),0_12px_32px_-14px_rgba(31,36,32,0.22)]">
      <Rating />
      <blockquote className="mt-5 mb-8 font-serif text-[21px] font-medium leading-[1.45] text-muted">
        “{testimonial.quote}”
      </blockquote>
      <figcaption className="mt-auto flex items-center gap-3.5 border-t border-ink/10 pt-5.5">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-sage-wash text-[13px] font-semibold tracking-[0.04em] text-olive-deep"
        >
          {testimonial.initials}
        </span>
        <span className="flex flex-col leading-[1.35]">
          <strong className="font-medium">{testimonial.name}</strong>
          <span className="text-sm text-muted">{testimonial.place}</span>
        </span>
      </figcaption>
    </figure>
  );
}
