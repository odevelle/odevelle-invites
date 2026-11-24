import { designs } from "@/content/marketing/designs";
import { LoopingRow } from "./LoopingRow";
import { Eye } from "./icons";
import { InviteMockup } from "./invite-mockup/InviteMockup";
import { PreviewTrigger } from "./preview/DesignStudio";
import { Eyebrow, button, displayHeading } from "./ui";

export function Collection() {
  return (
    <section
      id="designs"
      aria-labelledby="designs-title"
      className="bg-sand pt-[clamp(64px,8vw,104px)] pb-[clamp(44px,5vw,72px)]"
    >
      <div className="reveal shell flex flex-col items-center text-center">
        <Eyebrow number="N°1">The Collection</Eyebrow>
        <h2
          id="designs-title"
          className={`${displayHeading} mt-4 max-w-[15em] text-[clamp(36px,7.6vw,62px)] text-balance`}
        >
          Four invitations, each with <em>a character of its own.</em>
        </h2>
        <p className="mt-4.5 mb-0 max-w-[34em] text-[17px] text-pretty text-muted">
          Drawn by hand, then made entirely yours: your names, your venues, your palette. Tap a design to watch it open.
        </p>
      </div>

      {/* Horizontal gallery on small screens, a centred row of four on wide screens.
          On narrow screens it loops forward a design every 3.5s; wide screens
          show all four at once, so there it stays still. */}
      <LoopingRow
        compactInterval={3500}
        itemLabel="design"
        role="list"
        className="no-scrollbar mt-[clamp(32px,5vw,56px)] flex snap-x snap-mandatory gap-[clamp(20px,3vw,36px)] overflow-x-auto px-[clamp(20px,5vw,48px)] pt-3 pb-6 scroll-px-[clamp(20px,5vw,48px)] xl:justify-center-safe"
      >
        {designs.map((d) => {
          const label = `Preview the ${d.title} invitation`;
          return (
            <article
              key={d.id}
              role="listitem"
              aria-label={`${d.title} invitation`}
              className="flex w-[clamp(272px,80vw,300px)] flex-none snap-start flex-col overflow-hidden rounded-3xl bg-white shadow-[0_1px_0_rgba(31,36,32,.04),0_24px_48px_-32px_rgba(31,36,32,.45)]"
            >
              <PreviewTrigger
                design={d.id}
                label={label}
                className="group relative block aspect-300/380 w-full cursor-pointer overflow-hidden border-0 p-0 leading-[normal]"
                style={{ background: d.wash }}
              >
                <span className="absolute top-4 left-4 z-2 rounded-full bg-butter px-3.25 py-1.5 font-sans text-xs font-semibold tracking-[.04em] text-ink">
                  {d.theme}
                </span>
                <span className="absolute top-[11%] right-[14%] left-[14%] block transition-transform duration-600 ease-soft group-hover:-translate-y-2">
                  <InviteMockup design={d.id} frame="paper" />
                </span>
              </PreviewTrigger>
              <div className="flex flex-auto flex-col items-center px-6 pt-6.5 pb-6 text-center">
                <h3 className="m-0 font-serif text-[32px] font-semibold italic leading-[1.1] text-gold">{d.title}</h3>
                <p className="mt-3 mb-0 text-[15px] leading-[1.6] text-pretty text-muted">{d.mood}</p>
                <PreviewTrigger
                  design={d.id}
                  label={label}
                  className={button(
                    "outline",
                    "relative mt-auto min-h-13 w-full cursor-pointer gap-2.5 bg-transparent text-[15px] font-semibold",
                  )}
                >
                  <Eye size={18} />
                  Preview design
                </PreviewTrigger>
              </div>
            </article>
          );
        })}
      </LoopingRow>

      <div className="shell mt-[clamp(8px,4vw,72px)] flex flex-col items-center gap-3.5 text-center">
        <p
          aria-hidden="true"
          className="m-0 flex items-center gap-2.5 text-[13px] uppercase tracking-[.14em] text-muted xl:hidden"
        >
          Swipe to see the collection
          <svg width="22" height="12" viewBox="0 0 22 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 6h19M15 1l5 5-5 5" />
          </svg>
        </p>
        <p className="m-0 text-[15px] text-muted">
          Unsure which suits your day?{" "}
          <a className="link-draw font-medium text-olive" href="#whatsapp">
            Message the studio
          </a>
          . New collections are taking shape in the studio.{" "}
          <a className="link-draw font-medium text-olive" href="#subscribe">
            Be the first to see them
          </a>
          .
        </p>
      </div>
    </section>
  );
}
