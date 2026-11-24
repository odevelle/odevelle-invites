"use client";

import { useState, type FormEvent } from "react";
import { designById, designs, isDesignId } from "@/content/marketing/designs";
import { Sparkle } from "../icons";
import { useDesignStudio } from "../preview/DesignStudio";

const label = "flex flex-col gap-1.5 text-sm font-medium";
const fieldBase = "field min-h-12.5 rounded-xl border border-ink/20 bg-white text-base font-normal text-ink";
const field = `${fieldBase} px-4`;

export function EnquiryForm() {
  const { chosen, setChosen } = useDesignStudio();
  const [sent, setSent] = useState(false);

  // TODO: send the enquiry with a server action + email provider. Until then the
  // form only shows the confirmation state from the design and nothing is delivered.
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <div role="status" className="flex min-h-90 flex-col items-center justify-center gap-3 text-center">
        <Sparkle size={28} />
        <p className="m-0 font-serif text-[32px] font-medium leading-[1.15]">Thank you. Your story is in good hands.</p>
        <p className="m-0 text-base text-muted">We will be in touch within [N] hours.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      aria-labelledby="begin-title"
      className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-x-4 gap-y-4.5"
    >
      {chosen && (
        <p className="col-span-full m-0 rounded-xl bg-butter px-4 py-3 text-[15px] text-ink">
          You have chosen <strong className="font-semibold">{designById[chosen].title}</strong>. A beautiful place to
          begin.
        </p>
      )}
      <label className={label}>
        Your names
        <input className={field} name="names" type="text" autoComplete="name" placeholder="Charlotte and Henry" />
      </label>
      <label className={label}>
        Email
        <input className={field} name="email" type="email" autoComplete="email" placeholder="you@example.com" />
      </label>
      <label className={label}>
        WhatsApp number
        <input className={field} name="whatsapp" type="tel" autoComplete="tel" placeholder="+44" />
      </label>
      <label className={label}>
        Wedding date
        <input className={field} name="date" type="date" />
      </label>
      <label className={`${label} col-span-full`}>
        The design you love
        <select
          className={`${fieldBase} px-3.5`}
          name="design"
          value={chosen}
          onChange={(e) => setChosen(isDesignId(e.target.value) ? e.target.value : "")}
        >
          <option value="">Still deciding</option>
          {designs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title} · {d.theme}
            </option>
          ))}
        </select>
      </label>
      <label className={`${label} col-span-full`}>
        Your celebration
        <textarea
          className="field h-25.5 resize-y rounded-xl leading-[normal] border border-ink/20 bg-white px-4 py-3.5 text-base font-normal text-ink"
          name="message"
          rows={4}
          placeholder="Venues, guest count, anything you are dreaming of"
        />
      </label>
      <button
        type="submit"
        className="btn col-span-full min-h-14 cursor-pointer rounded-full border-0 bg-olive text-[17px] font-medium text-white hover:bg-olive-deep"
      >
        Send to the studio
      </button>
    </form>
  );
}
