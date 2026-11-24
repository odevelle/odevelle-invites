"use client";

import { useState, type FormEvent } from "react";

export function Subscribe() {
  const [subscribed, setSubscribed] = useState(false);

  // TODO: connect to the mailing list provider. Until then nothing is stored.
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
  };

  return (
    <section id="subscribe" aria-labelledby="subscribe-title" className="py-[clamp(56px,7vw,96px)]">
      <div className="reveal mx-auto flex max-w-180 flex-col items-center px-[clamp(20px,5vw,48px)] text-center">
        <h2
          id="subscribe-title"
          className="m-0 font-serif text-[clamp(30px,6.4vw,46px)] font-medium leading-[1.08] tracking-[-0.015em] text-balance text-gold [&_em]:text-olive"
        >
          First to see <em>new collections.</em>
        </h2>
        <p className="mt-3.5 mb-0 text-base text-muted">
          New designs for weddings, christenings and anniversaries, shared with you before anyone else.
        </p>
        {subscribed ? (
          <p role="status" className="mt-6.5 mb-0 font-serif text-xl italic text-olive">
            You are on the list. We will write when something new is ready.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6.5 flex w-full max-w-120 flex-wrap gap-2.5">
            <label htmlFor="sub-email" className="sr-only">
              Email address
            </label>
            <input
              id="sub-email"
              className="field min-h-13 min-w-0 flex-[1_1_220px] rounded-full border border-ink/22 bg-white px-5 text-base text-ink"
              type="email"
              autoComplete="email"
              placeholder="Your email address"
            />
            <button
              type="submit"
              className="btn min-h-13 flex-none cursor-pointer rounded-full border border-ink bg-transparent px-6.5 text-base font-medium text-ink hover:bg-ink hover:text-cream"
            >
              Join the list
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
