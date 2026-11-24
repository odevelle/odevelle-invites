"use client";

import "swiper/css";
import "swiper/css/pagination";
import { useState } from "react";
import { A11y, Autoplay, Keyboard, Pagination } from "swiper/modules";
import type { SwiperClass } from "swiper/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { testimonials } from "@/content/marketing/testimonials";
import { ChevronLeft, ChevronRight } from "../icons";
import { COMPACT_SCREEN, useMediaQuery } from "../useMediaQuery";
import { useMounted } from "../useMounted";
import { useReducedMotion } from "../useReducedMotion";
import { TestimonialCard } from "./TestimonialCard";

const frame = "mx-auto mt-[clamp(28px,4vw,48px)] max-w-334 px-[clamp(20px,5vw,48px)]";

/**
 * Three cards at a time on desktop, looping back to the first so all six
 * reviews keep coming round. Autoplay pauses on hover and stays off for
 * visitors who ask for reduced motion.
 *
 * Swiper reads the clock as it initialises, which a prerender cannot do, so it
 * only takes over after hydration. Until then the cards render as a plain
 * swipeable row — which is also what a visitor without JavaScript keeps.
 */
export function TestimonialsCarousel() {
  const [swiper, setSwiper] = useState<SwiperClass | null>(null);
  const mounted = useMounted();
  const animate = !useReducedMotion();
  /** One or two cards on a narrow screen, so the reviews come round sooner. */
  const delay = useMediaQuery(COMPACT_SCREEN) ? 5_000 : 12_000;

  /** Once the visitor steers, autoplay gets out of the way for good. */
  const step = (to: "next" | "prev") => {
    if (!swiper) return;
    swiper.autoplay?.stop();
    if (to === "next") swiper.slideNext();
    else swiper.slidePrev();
  };

  if (!mounted) {
    return (
      <div
        className={`no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 scroll-px-[clamp(20px,5vw,48px)] ${frame}`}
      >
        {testimonials.map((t) => (
          <div key={t.name} className="w-[min(84%,380px)] flex-none snap-start lg:w-[calc((100%-40px)/3)]">
            <TestimonialCard testimonial={t} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`od-swiper ${frame}`}>
      <Swiper
        modules={[A11y, Autoplay, Keyboard, Pagination]}
        onSwiper={setSwiper}
        loop
        speed={700}
        spaceBetween={20}
        slidesPerView={1}
        slidesPerGroup={1}
        /* One card on a phone sizes itself; side by side they share a height. */
        autoHeight
        breakpoints={{
          600: { slidesPerView: 2, slidesPerGroup: 2, autoHeight: false },
          960: { slidesPerView: 3, slidesPerGroup: 3, autoHeight: false },
        }}
        autoplay={animate ? { delay, pauseOnMouseEnter: true } : false}
        loopPreventsSliding={false}
        keyboard={{ enabled: true }}
        pagination={{ clickable: true }}
        a11y={{ containerMessage: "Client reviews" }}
        grabCursor
        watchSlidesProgress
      >
        {testimonials.map((t) => (
          <SwiperSlide key={t.name}>
            <TestimonialCard testimonial={t} />
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => step("prev")}
          aria-label="Previous reviews"
          className="btn flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-olive/35 bg-transparent text-olive hover:bg-olive hover:text-white"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => step("next")}
          aria-label="Next reviews"
          className="btn flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-olive/35 bg-transparent text-olive hover:bg-olive hover:text-white"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
