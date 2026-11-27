import Image from "next/image";
import type { ThemeProps } from "../../theme";
import { appearanceVars } from "../../shared/appearance";
import { Countdown } from "../../shared/Countdown";
import { mockFontFamilies } from "../../shared/mock-fonts";
import { RichText } from "../../shared/RichText";
import { portugueseV1 } from "./definition";
import "./theme.css";
import { RsvpForm } from "../../shared/rsvp/RsvpForm";
import { rsvpClasses } from "./rsvp";

/*
 * Portuguese v1: PROVISIONAL MOCK, replaced by the final design.
 * Layout: tile bands (or a full tile frame), verse first, event cards in a grid.
 */

const heading = "font-(family-name:--inv-heading-font) text-(--inv-secondary)";

export default function PortugueseTheme({ invitation, options, appearance, features }: ThemeProps) {
  const o = portugueseV1.optionsSchema.parse(options);
  const { content, events, media } = invitation;
  const band = `pt1-tiles ${o.intro === "tile-reveal" ? "pt1-tile-reveal" : ""} h-16 sm:h-24`;

  const body = (
    <div className={`${o.intro === "tile-reveal" ? "pt1-rise" : ""} mx-auto max-w-3xl px-5 py-12 text-center sm:py-16`}>
      <header data-section="hero">
        {o.showScripture && content.scripture && (
          <figure className="mx-auto max-w-md">
            <blockquote className="font-(family-name:--inv-heading-font) text-lg text-(--inv-primary) italic">{content.scripture.text}</blockquote>
            <figcaption className="mt-1 text-xs tracking-[0.22em] uppercase opacity-70">{content.scripture.reference}</figcaption>
          </figure>
        )}
        <h1 className={`${heading} mt-8 flex flex-col text-[calc(3rem*var(--inv-scale))] leading-none sm:text-[calc(4.25rem*var(--inv-scale))]`}>
          {content.hosts.map((h, i) => (
            <span key={h.displayName}>
              {i > 0 && <span className="my-2 block text-[0.55em] text-(--inv-accent)">&amp;</span>}
              {h.displayName}
            </span>
          ))}
        </h1>
        {content.invitationLine && <p className="mt-6">{content.invitationLine}</p>}
        {invitation.date && <p className="mt-6 text-2xl tracking-[0.12em] text-(--inv-secondary)">{invitation.date.compact}</p>}
      </header>

      {features.countdown && invitation.countdownTarget && (
        <section data-section="countdown" aria-label="Countdown" className="mt-10">
          <Countdown
            target={invitation.countdownTarget}
            classNames={{
              root: "inline-flex divide-x divide-(--inv-primary)/30 rounded-md border border-(--inv-primary)/30 bg-white",
              item: "flex flex-col px-5 py-3",
              value: "text-2xl font-semibold text-(--inv-primary)",
              label: "text-[11px] tracking-widest uppercase opacity-70",
            }}
          />
        </section>
      )}

      {content.intro && <RichText blocks={content.intro} className="mt-10 space-y-3" />}

      {features.schedule && events.length > 0 && (
        <section data-section="events" className="mt-12 grid gap-4 text-left sm:grid-cols-2">
          {events.map((e) => (
            <div key={e.id} className="rounded-md border-t-4 border-(--inv-accent) bg-white p-5 shadow-sm">
              <h2 className={`${heading} text-xl`}>{e.title}</h2>
              <p className="mt-2 text-sm">{e.dateLabel}</p>
              <p className="text-sm opacity-80">{e.timeLabel}</p>
              {e.venueName && <p className="mt-2 font-medium">{e.venueName}</p>}
              {e.mapHref && (
                <a href={e.mapHref} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-(--inv-primary) underline">
                  Open in maps
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
        <section data-section="gallery" className="mt-12 grid gap-3 sm:grid-cols-2">
          {media.gallery.map((m) => (
            <Image key={m.id} src={m.url} alt={m.alt} width={m.width ?? 1600} height={m.height ?? 1067} sizes="(max-width: 640px) 90vw, 380px" className="h-auto w-full rounded-md" />
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
        <section data-section="rsvp" className="mt-12 rounded-md bg-(--inv-primary) p-8 text-white">
          <h2 className="font-(family-name:--inv-heading-font) text-3xl">RSVP</h2>
          {content.rsvpNote && <p className="mt-2">{content.rsvpNote}</p>}
          {invitation.rsvp && (
              <div className="mt-6">
                <RsvpForm slug={invitation.slug} hostsLine={invitation.hostsLine} rsvp={invitation.rsvp} classes={rsvpClasses} />
              </div>
            )}
        </section>
      )}
    </div>
  );

  return (
    <main style={appearanceVars(appearance, mockFontFamilies)} className="min-h-dvh bg-(--inv-background) font-(family-name:--inv-body-font) text-[#1f2a44]">
      {o.tiles === "top-and-bottom" ? (
        <>
          <div aria-hidden="true" className={band} />
          {body}
          <div aria-hidden="true" className={band} />
        </>
      ) : (
        <div className={`pt1-tiles min-h-dvh p-3 sm:p-6`}>
          <div className="min-h-[calc(100dvh-1.5rem)] bg-(--inv-background) sm:min-h-[calc(100dvh-3rem)]">{body}</div>
        </div>
      )}
    </main>
  );
}
