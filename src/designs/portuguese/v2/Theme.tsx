import Image from "next/image";
import type { ThemeProps } from "../../theme";
import { appearanceVars } from "../../shared/appearance";
import { Countdown } from "../../shared/Countdown";
import { mockFontFamilies } from "../../shared/mock-fonts";
import { RichText } from "../../shared/RichText";
import { portugueseV2 } from "./definition";
import "./theme.css";
import { RsvpForm } from "../../shared/rsvp/RsvpForm";
import { rsvpClasses } from "./rsvp";

/*
 * Portuguese v2: PROVISIONAL MOCK. Demonstrates a new version with a
 * different structure (date-led hero, vertical timeline, optional side tiles)
 * while v1 invitations keep rendering v1.
 */

const heading = "font-(family-name:--inv-heading-font) text-(--inv-secondary)";

export default function PortugueseV2Theme({ invitation, options, appearance, features }: ThemeProps) {
  const o = portugueseV2.optionsSchema.parse(options);
  const { content, events, media } = invitation;
  const sideTiles = o.layout === "side-tiles";

  return (
    <main
      data-layout={o.layout}
      style={appearanceVars(appearance, mockFontFamilies)}
      className={`min-h-dvh bg-(--inv-background) font-(family-name:--inv-body-font) text-[#1f2a44] ${
        sideTiles ? "lg:grid lg:grid-cols-[120px_minmax(0,1fr)_120px]" : ""
      }`}
    >
      <div aria-hidden="true" className={`pt2-tiles h-12 ${sideTiles ? "lg:h-auto" : ""}`} />

      <div className={`${o.intro === "tile-reveal" ? "pt2-reveal" : ""} mx-auto w-full max-w-2xl px-5 py-12 sm:py-16`}>
        <header data-section="hero" className="text-center">
          {invitation.date && (
            <p className="text-sm tracking-[0.3em] text-(--inv-primary) uppercase">{invitation.date.long}</p>
          )}
          <h1 className={`${heading} mt-6 text-[calc(2.75rem*var(--inv-scale))] leading-tight sm:text-[calc(3.75rem*var(--inv-scale))]`}>
            {invitation.hostsLine}
          </h1>
          {content.invitationLine && <p className="mt-4">{content.invitationLine}</p>}
          {o.showScripture && content.scripture && (
            <p className="mx-auto mt-8 max-w-sm border-y border-(--inv-accent) py-4 italic">
              “{content.scripture.text}” <span className="not-italic opacity-70">· {content.scripture.reference}</span>
            </p>
          )}
        </header>

        {features.countdown && invitation.countdownTarget && (
          <section data-section="countdown" aria-label="Countdown" className="mt-10 text-center">
            <Countdown
              target={invitation.countdownTarget}
              classNames={{
                root: "inline-flex gap-3",
                item: "flex w-20 flex-col rounded-full bg-(--inv-primary) py-4 text-white",
                value: "text-2xl font-semibold",
                label: "text-[10px] tracking-widest uppercase opacity-80",
              }}
            />
          </section>
        )}

        {features.schedule && events.length > 0 && (
          <section data-section="events" className="mt-14">
            <ol className="relative ml-3 border-l-2 border-(--inv-accent)">
              {events.map((e) => (
                <li key={e.id} className="mb-8 ml-6">
                  <span aria-hidden="true" className="absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full bg-(--inv-primary)" />
                  <p className="text-sm tracking-wide text-(--inv-primary)">{e.timeLabel}</p>
                  <h2 className={`${heading} text-2xl`}>{e.title}</h2>
                  {e.venueName && <p className="mt-1">{e.venueName}</p>}
                  {e.mapHref && (
                    <a href={e.mapHref} target="_blank" rel="noreferrer" className="text-sm text-(--inv-primary) underline">
                      Directions
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {features.story && content.story && (
          <section data-section="story" className="mt-12">
            <h2 className={`${heading} text-3xl`}>{content.story.title ?? "Our story"}</h2>
            <RichText blocks={content.story.body} className="mt-4 space-y-3" />
          </section>
        )}

        {media.gallery.length > 0 && (
          <section data-section="gallery" className="mt-12 flex snap-x gap-3 overflow-x-auto pb-2">
            {media.gallery.map((m) => (
              <Image key={m.id} src={m.url} alt={m.alt} width={m.width ?? 1600} height={m.height ?? 1067} sizes="80vw" className="h-auto w-[80%] flex-none snap-start rounded-md" />
            ))}
          </section>
        )}

        {content.customSections?.map((s) => (
          <section key={s.key} data-section="custom" className="mt-12">
            <h2 className={`${heading} text-2xl`}>{s.title}</h2>
            <RichText blocks={s.body} className="mt-3 space-y-3" />
          </section>
        ))}

        {features.rsvp && (
          <section data-section="rsvp" className="mt-12 text-center">
            <h2 className={`${heading} text-3xl`}>RSVP</h2>
            {content.rsvpNote && <p className="mt-2">{content.rsvpNote}</p>}
            {invitation.rsvp && (
              <div className="mt-6">
                <RsvpForm slug={invitation.slug} hostsLine={invitation.hostsLine} rsvp={invitation.rsvp} classes={rsvpClasses} />
              </div>
            )}
          </section>
        )}
      </div>

      <div aria-hidden="true" className={`pt2-tiles h-12 ${sideTiles ? "lg:h-auto" : ""}`} />
    </main>
  );
}
