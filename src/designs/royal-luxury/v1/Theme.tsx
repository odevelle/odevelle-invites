import Image from "next/image";
import type { ThemeProps } from "../../theme";
import { appearanceVars } from "../../shared/appearance";
import { Countdown } from "../../shared/Countdown";
import { mockFontFamilies } from "../../shared/mock-fonts";
import { RichText } from "../../shared/RichText";
import { royalLuxuryV1 } from "./definition";
import "./theme.css";

/*
 * Royal Luxury v1: PROVISIONAL MOCK, replaced by the final design.
 * Layout: one centred formal card, everything stacked inside it.
 */

const heading = "font-(family-name:--inv-heading-font) text-(--inv-primary)";

export default function RoyalLuxuryTheme({ invitation, options, appearance, features }: ThemeProps) {
  const o = royalLuxuryV1.optionsSchema.parse(options);
  const { content, events, media } = invitation;

  const border =
    o.border === "pearls"
      ? "border-[6px] border-dotted border-(--inv-accent)"
      : "border-2 border-double border-(--inv-accent) outline outline-1 outline-offset-4 outline-(--inv-accent)";

  return (
    <main
      style={appearanceVars(appearance, mockFontFamilies)}
      className="min-h-dvh bg-(--inv-background) px-4 py-10 font-(family-name:--inv-body-font) text-[#2b1d1f] sm:py-16"
    >
      {o.intro === "lace-curtain" && <div aria-hidden="true" className="rl1-curtain" />}

      <article
        className={`${o.intro === "envelope" ? "rl1-envelope" : ""} mx-auto max-w-xl rounded-sm bg-(--inv-secondary)/40 p-6 text-center sm:p-12 ${border}`}
      >
        <header data-section="hero">
          <div data-emblem={o.emblem} className="mx-auto mb-6 flex h-14 items-center justify-center text-(--inv-primary)">
            {o.emblem === "crest" ? (
              <svg viewBox="0 0 40 24" className="h-8" fill="none" aria-hidden="true">
                <path d="M4 20L8 7l8 7 4-11 4 11 8-7 4 13z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M4 20h32" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            ) : (
              <span className="grid h-14 w-14 place-items-center rounded-full border border-current font-(family-name:--inv-heading-font) text-xl">
                {invitation.content.hosts.map((h) => h.displayName[0]).join("")}
              </span>
            )}
          </div>
          {content.eyebrow && <p className="text-xs tracking-[0.25em] uppercase opacity-70">{content.eyebrow}</p>}
          <h1 className={`${heading} mt-4 text-[calc(3.25rem*var(--inv-scale))] leading-tight sm:text-[calc(4rem*var(--inv-scale))]`}>
            {invitation.hostsLine}
          </h1>
          {content.invitationLine && <p className="mt-4 italic">{content.invitationLine}</p>}
          {invitation.date && <p className="mt-6 text-2xl tracking-[0.15em]">{invitation.date.compact}</p>}
          {!features.schedule && events[0] && (
            <p className="mt-2 text-sm tracking-[0.12em] uppercase opacity-70">{events[0].venueName}</p>
          )}
        </header>

        {features.countdown && invitation.countdownTarget && (
          <section data-section="countdown" aria-label="Countdown" className="mt-10">
            <Countdown
              target={invitation.countdownTarget}
              classNames={{
                root: "flex justify-center gap-6",
                item: "flex flex-col",
                value: `${heading} text-3xl`,
                label: "text-xs tracking-widest uppercase opacity-70",
              }}
            />
          </section>
        )}

        {content.intro && <RichText blocks={content.intro} className="mt-10 space-y-3" />}

        {features.schedule && events.length > 0 && (
          <section data-section="events" className="mt-12 space-y-8">
            {events.map((e) => (
              <div key={e.id}>
                <h2 className={`${heading} text-2xl`}>{e.title}</h2>
                <p className="mt-1">{e.dateLabel}</p>
                <p className="text-sm opacity-80">{e.timeLabel}</p>
                {e.venueName && <p className="mt-1 font-medium">{e.venueName}</p>}
                {e.address && <p className="text-sm opacity-80">{e.address}</p>}
                {e.dressCode && <p className="mt-1 text-xs tracking-widest uppercase">Dress code · {e.dressCode}</p>}
                {e.mapHref && (
                  <a href={e.mapHref} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-(--inv-primary) underline">
                    Directions
                  </a>
                )}
              </div>
            ))}
          </section>
        )}

        {features.story && content.story && (
          <section data-section="story" className="mt-12">
            <h2 className={`${heading} text-3xl`}>{content.story.title ?? "Our story"}</h2>
            <RichText blocks={content.story.body} className="mt-4 space-y-3" />
          </section>
        )}

        {media.gallery.length > 0 && (
          <section data-section="gallery" className="mt-12 grid grid-cols-2 gap-3">
            {media.gallery.map((m) => (
              <Image key={m.id} src={m.url} alt={m.alt} width={m.width ?? 1600} height={m.height ?? 1067} sizes="(max-width: 640px) 45vw, 280px" className="h-auto w-full rounded-sm" />
            ))}
          </section>
        )}

        {content.customSections?.map((s) => (
          <section key={s.key} data-section="custom" className="mt-12">
            <h2 className={`${heading} text-2xl`}>{s.title}</h2>
            <RichText blocks={s.body} className="mt-3 space-y-3" />
          </section>
        ))}

        {media.audio && <audio data-section="music" controls preload="none" src={media.audio.url} className="mx-auto mt-10" />}

        {features.rsvp && (
          <section data-section="rsvp" className="mt-12 border-t border-(--inv-accent) pt-8">
            <h2 className={`${heading} text-3xl`}>RSVP</h2>
            {content.rsvpNote && <p className="mt-2">{content.rsvpNote}</p>}
            <p className="mt-2 text-sm opacity-70">Replies open soon.</p>
          </section>
        )}

        {content.closingMessage && <p className="mt-12 italic">{content.closingMessage}</p>}
      </article>
    </main>
  );
}
