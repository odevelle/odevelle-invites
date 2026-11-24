import { Eyebrow, button, displayHeading } from "./ui";

const qualities = [
  { title: "Hand illustrated", body: "Every design is drawn by our in house illustrator, never stock." },
  {
    title: "Made for every tradition",
    body: "Church ceremonies, receptions and family customs, wherever in the world you celebrate.",
  },
  { title: "Done for you", body: "No builders or templates to fight with. Send details, we do the rest." },
  {
    title: "Kind to every guest",
    body: "Opens instantly on any phone, in any country, with no app. Easy for grandparents too.",
  },
];

export function Studio() {
  return (
    <section id="why" aria-labelledby="why-title" className="py-[clamp(64px,8vw,112px)]">
      <div className="shell flex flex-wrap items-center gap-[clamp(40px,6vw,88px)]">
        <figure className="reveal relative m-0 min-w-0 max-w-125 flex-[1_1_360px]">
          {/* Placeholder from the approved design, to be replaced with studio photography. */}
          <div
            className="flex aspect-4/5 items-center justify-center border border-ink/10 p-8 text-center text-sm text-muted"
            style={{
              borderRadius: "50% 50% 18px 18px / 30% 30% 18px 18px",
              background: "repeating-linear-gradient(135deg, #EFEDE5 0 14px, #E9E6DD 14px 28px)",
            }}
          >
            [Editorial image: illustrator at work, or printed card beside the digital invitation]
          </div>
          <blockquote className="on-dark absolute right-[-4%] bottom-[-6%] m-0 w-[min(78%,300px)] rounded-[18px] bg-ink px-6.5 pt-6.5 pb-6 text-cream shadow-[0_24px_48px_-24px_rgba(31,36,32,.7)]">
            <p className="m-0 font-serif text-[26px] font-normal italic leading-[1.2]">
              Opened once. Remembered long after.
            </p>
            <p className="mt-2.5 mb-0 text-[13px] uppercase tracking-[.12em] text-linen">The ODEVELLE promise</p>
          </blockquote>
          <figcaption className="sr-only">Placeholder for a studio photograph.</figcaption>
        </figure>

        <div className="min-w-0 flex-[1_1_440px]">
          <Eyebrow number="N°4">The Studio</Eyebrow>
          <h2 id="why-title" className={`${displayHeading} mt-4 text-[clamp(36px,7.4vw,58px)] text-balance`}>
            Quietly luxurious, <em>made just for you.</em>
          </h2>
          <dl className="mt-8.5 mb-0 grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-x-9 gap-y-6.5">
            {qualities.map((q) => (
              <div key={q.title} className="reveal border-t border-ink/14 pt-4.5">
                <dt className="font-serif text-[21px] font-normal text-gold-deep">{q.title}</dt>
                <dd className="mt-1.5 mb-0 ml-0 text-[15px] text-muted">{q.body}</dd>
              </div>
            ))}
          </dl>
          <a href="#begin" className={button("primary", "mt-9 min-h-13 gap-2.5 px-6.5 text-base font-medium")}>
            Begin your invitation
          </a>
        </div>
      </div>
    </section>
  );
}
