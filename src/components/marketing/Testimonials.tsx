import { TestimonialsCarousel } from "./testimonials/TestimonialsCarousel";
import { Eyebrow, displayHeading } from "./ui";

export function Testimonials() {
  return (
    <section id="stories" aria-labelledby="stories-title" className="py-[clamp(64px,8vw,112px)]">
      <div className="shell">
        <Eyebrow number="N°5" className="reveal">
          Kind Words
        </Eyebrow>
        <h2 id="stories-title" className={`reveal ${displayHeading} mt-4 text-[clamp(36px,7.4vw,58px)]`}>
          In their <em>words.</em>
        </h2>
      </div>
      <TestimonialsCarousel />
    </section>
  );
}
