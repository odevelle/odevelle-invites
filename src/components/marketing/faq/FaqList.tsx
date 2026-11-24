"use client";

import { useState } from "react";
import type { Faq } from "@/content/marketing/faq";
import { Plus } from "../icons";

/** Single-open accordion; the first answer starts open, as in the design. */
export function FaqList({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="min-w-0 flex-[2_1_520px] border-t border-ink/14">
      {items.map((item, i) => {
        const expanded = open === i;
        const id = `faq-${i}`;
        return (
          <div key={item.question} className="border-b border-ink/14">
            <h3 className="m-0 text-gold">
              <button
                type="button"
                onClick={() => setOpen(expanded ? -1 : i)}
                aria-expanded={expanded}
                aria-controls={id}
                className="flex min-h-16 w-full cursor-pointer items-center justify-between gap-5 border-0 bg-transparent py-4.5 text-left font-serif text-[clamp(18px,4.6vw,21px)] font-medium leading-[1.3] text-gold-deep"
              >
                {item.question}
                <Plus
                  size={18}
                  stroke="#4A5E3F"
                  className="flex-none transition-transform duration-300"
                  style={{ transform: `rotate(${expanded ? 45 : 0}deg)` }}
                />
              </button>
            </h3>
            {expanded && (
              <div id={id} className="pr-10 pb-5.5 text-base text-muted">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
