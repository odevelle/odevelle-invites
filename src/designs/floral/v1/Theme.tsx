import Image from "next/image";
import type { ThemeProps } from "../../theme";
import { appearanceVars } from "../../shared/appearance";
import { Countdown } from "../../shared/Countdown";
import { mockFontFamilies } from "../../shared/mock-fonts";
import { RichText } from "../../shared/RichText";
import { floralV1 } from "./definition";
import "./theme.css";

/*
 * Floral v1: PROVISIONAL MOCK, replaced by the final design.
 * Layout: asymmetric. On wide screens a sticky hero column (names, garland)
 * sits beside a scrolling content column; on phones they stack.
 */

const heading = "font-(family-name:--inv-heading-font) text-(--inv-secondary)";

function Sprig({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} fill="none" aria-hidden="true">
      <path d="M8 72C30 54 46 34 62 8" stroke="var(--inv-primary)" strokeWidth="1.4" />
      <ellipse cx="30" cy="50" rx="10" ry="4" fill="var(--inv-primary)" opacity=".7" transform="rotate(-45 30 50)" />
      <ellipse cx="46" cy="32" rx="9" ry="3.6" fill="var(--inv-primary)" opacity=".5" transform="rotate(-30 46 32)" />
      <circle cx="62" cy="8" r="4" fill="var(--inv-accent)" />
    </svg>
  );
}

export default function FloralTheme({ invitation, options, appearance, features }: ThemeProps) {
  const o = floralV1.optionsSchema.parse(options);
  const { content, events, media } = invitation;

  return (
    <main
      style={appearanceVars(appearance, mockFontFamilies)}
      className={`${o.texture === "linen" ? "fl1-linen" : "bg-(--inv-background)"} min-h-dvh font-(family-name:--inv-body-font) text-[#2f3b2a]`}
    >
      {o.intro === "petal-fall" && (
        <div aria-hidden="true" className="fl1-petals">
          {[8, 22, 37, 51, 66, 80, 92].map((left, i) => (
            <span key={left} className="fl1-petal" style={{ left: `${left}%`, animationDelay: `${i * 0.25}s` }} />
          ))}
        </div>
      )}

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:py-20">
        <header data-section="hero" className="relative self-start text-center lg:sticky lg:top-12 lg:text-left">
          {o.garland === "arch" ? (
            <svg viewBox="0 0 200 60" className="mx-auto h-14 w-56 lg:mx-0" fill="none" aria-hidden="true">
              <path d="M10 55C50 5 150 5 190 55" stroke="var(--inv-primary)" strokeWidth="1.2" strokeDasharray="3 2" />
              {[30, 60, 100, 140, 170].map((x, i) => (
                <circle key={x} cx={x} cy={i === 2 ? 17 : i % 2 ? 24 : 38} r="5" fill="white" stroke="var(--inv-primary)" />
              ))}
            </svg>
          ) : (
            <>
              <Sprig className="absolute -top-6 -left-4 h-16 w-16" />
              <Sprig className="absolute -top-6 -right-4 h-16 w-16 -scale-x-100" />
            </>
          )}
          {content.eyebrow && <p className="mt-6 font-(family-name:--inv-heading-font) text-xl text-(--inv-primary)">{content.eyebrow}</p>}
          <h1 className={`${heading} mt-4 text-[calc(3.5rem*var(--inv-scale))] leading-[1.05] sm:text-[calc(4.5rem*var(--inv-scale))]`}>
            {invitation.hostsLine}
          </h1>
          {invitation.date && <p className="mt-6 text-lg tracking-[0.2em]">{invitation.date.long}</p>}
          {content.invitationLine && <p className="mt-3 italic">{content.invitationLine}</p>}

          {features.countdown && invitation.countdownTarget && (
            <section data-section="countdown" aria-label="Countdown" className="mt-8">
              <Countdown
                target={invitation.countdownTarget}
                classNames={{
                  root: "inline-flex gap-5 border-y border-dashed border-(--inv-primary) py-3",
                  item: "flex flex-col items-center",
                  value: `${heading} text-3xl`,
                  label: "text-[11px] tracking-widest uppercase",
                }}
              />
            </section>
          )}
        </header>

        <div className="space-y-12">
          {content.intro && <RichText blocks={content.intro} className="space-y-3 text-lg" />}

          {features.schedule && events.length > 0 && (
            <section data-section="events" className="space-y-6">
              {events.map((e) => (
                <div key={e.id} className="border-l-2 border-dashed border-(--inv-primary) pl-5">
                  <h2 className={`${heading} text-3xl`}>{e.title}</h2>
                  <p className="mt-1">
                    {e.dateLabel} · {e.timeLabel}
                  </p>
                  {e.venueName && <p className="font-medium">{e.venueName}</p>}
                  {e.dressCode && <p className="text-sm opacity-80">Dress code: {e.dressCode}</p>}
                  {e.notes && <p className="text-sm opacity-80">{e.notes}</p>}
                  {e.mapHref && (
                    <a href={e.mapHref} target="_blank" rel="noreferrer" className="text-sm text-(--inv-primary) underline">
                      Map
                    </a>
                  )}
                </div>
              ))}
            </section>
          )}

          {features.story && content.story && (
            <section data-section="story">
              <h2 className={`${heading} text-4xl`}>{content.story.title ?? "Our story"}</h2>
              <RichText blocks={content.story.body} className="mt-4 space-y-3" />
            </section>
          )}

          {media.gallery.length > 0 && (
            <section data-section="gallery" className="columns-2 gap-3 [&>*]:mb-3">
              {media.gallery.map((m) => (
                <Image key={m.id} src={m.url} alt={m.alt} width={m.width ?? 1600} height={m.height ?? 1067} sizes="(max-width: 1024px) 45vw, 320px" className="h-auto w-full rounded-lg" />
              ))}
            </section>
          )}

          {content.customSections?.map((s) => (
            <section key={s.key} data-section="custom">
              <h2 className={`${heading} text-3xl`}>{s.title}</h2>
              <RichText blocks={s.body} className="mt-3 space-y-3" />
            </section>
          ))}

          {media.video && <video data-section="video" controls preload="none" src={media.video.url} className="w-full rounded-lg" />}

          {features.rsvp && (
            <section data-section="rsvp" className="rounded-lg border border-dashed border-(--inv-primary) bg-white/60 p-8">
              <h2 className={`${heading} text-4xl`}>RSVP</h2>
              {content.rsvpNote && <p className="mt-2">{content.rsvpNote}</p>}
              <p className="mt-2 text-sm opacity-70">Replies open soon.</p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
