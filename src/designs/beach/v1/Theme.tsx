import Image from "next/image";
import type { ThemeProps } from "../../theme";
import { appearanceVars } from "../../shared/appearance";
import { Countdown } from "../../shared/Countdown";
import { mockFontFamilies } from "../../shared/mock-fonts";
import { RichText } from "../../shared/RichText";
import { beachV1 } from "./definition";
import "./theme.css";
import { RsvpForm } from "../../shared/rsvp/RsvpForm";
import { rsvpClasses } from "./rsvp";

/*
 * Destination Beach v1: PROVISIONAL MOCK, replaced by the final design.
 * Layout: full-bleed hero (photo or sky gradient), a wave band, then sections
 * on sand; events scroll sideways as cards on phones.
 */

const heading = "font-(family-name:--inv-heading-font) text-(--inv-primary)";

export default function BeachTheme({ invitation, options, appearance, features }: ThemeProps) {
  const o = beachV1.optionsSchema.parse(options);
  const { content, events, media } = invitation;
  const intro = o.intro === "wave-reveal";

  return (
    <main style={appearanceVars(appearance, mockFontFamilies)} className="min-h-dvh bg-(--inv-background) font-(family-name:--inv-body-font) text-[#2b3a3b]">
      <header data-section="hero" className={`relative isolate overflow-hidden ${media.hero ? "" : "bc1-sky"}`}>
        {media.hero && (
          <Image src={media.hero.url} alt={media.hero.alt} fill priority sizes="100vw" className="-z-10 object-cover" />
        )}
        <div className={`${intro ? "bc1-fade-up" : ""} mx-auto flex min-h-[78dvh] max-w-3xl flex-col items-center justify-center px-6 pt-16 pb-28 text-center`}>
          {o.emblem === "scallop" && (
            <svg viewBox="0 0 40 36" className="h-12 w-12" fill="none" aria-hidden="true">
              <path d="M20 33L4 14Q20-5 36 14Z" fill="white" fillOpacity=".7" stroke="var(--inv-accent)" strokeWidth="1" />
              <path d="M20 33L9 10M20 33L14 6M20 33V4M20 33L26 6M20 33L31 10" stroke="var(--inv-accent)" strokeWidth=".8" />
            </svg>
          )}
          {content.eyebrow && <p className="mt-4 text-xs tracking-[0.35em] uppercase">{content.eyebrow}</p>}
          <h1 className={`${heading} mt-4 text-[calc(3.25rem*var(--inv-scale))] leading-none italic sm:text-[calc(5rem*var(--inv-scale))]`}>
            {invitation.hostsLine}
          </h1>
          {content.invitationLine && <p className="mt-4 text-lg">{content.invitationLine}</p>}
          {invitation.date && <p className="mt-6 rounded-full bg-white/70 px-5 py-2 text-lg tracking-[0.15em]">{invitation.date.compact}</p>}
        </div>
        <svg
          viewBox="0 0 400 80"
          preserveAspectRatio="none"
          aria-hidden="true"
          className={`${intro ? "bc1-wave-reveal" : ""} absolute inset-x-0 bottom-0 h-20 w-full`}
        >
          {o.waves === "layered" && <path d="M0 30C60 10 120 50 200 30S340 10 400 30V80H0Z" fill="var(--inv-secondary)" opacity=".35" />}
          {o.waves === "layered" && <path d="M0 48C70 32 130 64 200 48S330 32 400 48V80H0Z" fill="var(--inv-secondary)" opacity=".6" />}
          <path d="M0 62C70 52 130 74 200 62S330 52 400 62V80H0Z" fill="var(--inv-background)" />
        </svg>
      </header>

      <div className="mx-auto max-w-4xl space-y-14 px-5 pb-16">
        {features.countdown && invitation.countdownTarget && (
          <section data-section="countdown" aria-label="Countdown" className="text-center">
            <Countdown
              target={invitation.countdownTarget}
              classNames={{
                root: "inline-flex gap-8",
                item: "flex flex-col",
                value: `${heading} text-4xl`,
                label: "text-xs tracking-widest uppercase opacity-70",
              }}
            />
          </section>
        )}

        {content.intro && <RichText blocks={content.intro} className="mx-auto max-w-xl space-y-3 text-center text-lg" />}

        {features.schedule && events.length > 0 && (
          <section data-section="events">
            <h2 className={`${heading} text-center text-3xl`}>The plan</h2>
            <div className="mt-6 flex snap-x gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-2 md:overflow-visible">
              {events.map((e) => (
                <div key={e.id} className="w-[80%] flex-none snap-start rounded-2xl bg-white p-6 shadow-sm md:w-auto">
                  <p className="text-xs tracking-widest text-(--inv-accent) uppercase">{e.dateLabel}</p>
                  <h3 className={`${heading} mt-2 text-2xl`}>{e.title}</h3>
                  <p className="mt-1 text-sm">{e.timeLabel}</p>
                  {e.venueName && <p className="mt-2 font-medium">{e.venueName}</p>}
                  {e.dressCode && <p className="text-sm opacity-80">{e.dressCode}</p>}
                  {e.mapHref && (
                    <a href={e.mapHref} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded-full bg-(--inv-primary) px-4 py-2 text-sm text-white">
                      Directions
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {features.story && content.story && (
          <section data-section="story" className="mx-auto max-w-xl text-center">
            <h2 className={`${heading} text-3xl italic`}>{content.story.title ?? "Our story"}</h2>
            <RichText blocks={content.story.body} className="mt-4 space-y-3" />
          </section>
        )}

        {media.gallery.length > 0 && (
          <section data-section="gallery" className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {media.gallery.map((m) => (
              <Image key={m.id} src={m.url} alt={m.alt} width={m.width ?? 1600} height={m.height ?? 1067} sizes="(max-width: 768px) 45vw, 300px" className="aspect-square h-auto w-full rounded-2xl object-cover" />
            ))}
          </section>
        )}

        {content.customSections?.map((s) => (
          <section key={s.key} data-section="custom" className="mx-auto max-w-xl">
            <h2 className={`${heading} text-2xl`}>{s.title}</h2>
            <RichText blocks={s.body} className="mt-3 space-y-3" />
          </section>
        ))}

        {media.audio && <audio data-section="music" controls preload="none" src={media.audio.url} className="mx-auto" />}

        {features.rsvp && (
          <section data-section="rsvp" className="rounded-2xl bg-(--inv-primary) p-8 text-center text-white">
            <h2 className="font-(family-name:--inv-heading-font) text-3xl italic">RSVP</h2>
            {content.rsvpNote && <p className="mt-2">{content.rsvpNote}</p>}
            {invitation.rsvp && (
              <div className="mt-6">
                <RsvpForm slug={invitation.slug} hostsLine={invitation.hostsLine} rsvp={invitation.rsvp} classes={rsvpClasses} />
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
