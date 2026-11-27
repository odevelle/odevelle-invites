import type { CSSProperties } from "react";
import type { RsvpView } from "@/invitation/view";
import { RsvpForm } from "../../../shared/rsvp/RsvpForm";
import type { RsvpFormClasses } from "../../../shared/rsvp/parts";
import type { Artwork } from "../assets";
import { capsFont } from "../fonts";
import { Amp, Art, centred, delay, u } from "../psd";

/*
 * RSVP (artboard 04, y 2010–3135) and the veiled finale (y 3135–4035).
 * The bouquet and heading keep their PSD positions; the PSD leaves the space
 * under "RSVP" for the reply form, which flows there and lets the section grow.
 */

const RSVP_TOP = 2010;
/** Where the PSD's body text starts under the heading. */
const BODY_TOP = 2700;
const FINALE_TOP = 3135;

type RsvpFormData = { slug: string; hostsLine: string; rsvp: RsvpView };

export function Rsvp({ note, closing, art, form }: { note?: string; closing?: string; art: Artwork; form?: RsvpFormData }) {
  return (
    <section
      data-section="rsvp"
      className="rl2-section rl2-rsvp"
      aria-labelledby="rl2-rsvp-title"
      style={{ "--rl2-caps": capsFont.style.fontFamily } as CSSProperties}
    >
      <div className="rl2-col" style={{ height: u(BODY_TOP - RSVP_TOP) }}>
        <div className="rl2-fill" data-reveal-group>
          <Art asset={art.a4.rsvpBouquet} y={art.a4.rsvpBouquet.y - RSVP_TOP} data-reveal="descend" />
          <h2
            id="rl2-rsvp-title"
            className="rl2-rsvp__title"
            data-reveal="settle"
            style={{ ...centred(360, 2563 - RSVP_TOP, 460), fontFamily: capsFont.style.fontFamily, ...delay(450) }}
          >
            RSVP
          </h2>
        </div>
      </div>
      {/* Without a form this is exactly the PSD's remaining height, so the finale stays where it was. */}
      <div className="rl2-col" style={{ minHeight: u(FINALE_TOP - BODY_TOP) }}>
        <div className="rl2-rsvp__body" data-reveal-group>
          {form ? (
            <div className="rl2-rsvp-card" data-reveal="rise" style={delay(150)}>
              <header className="rl2-rsvp-card__head">
                <div className="rl2-rsvp-card__crest" aria-hidden="true">
                  <span className="rl2-rsvp-card__rule" />
                  <span className="rl2-rsvp-card__initials">{initials(form.hostsLine)}</span>
                  <span className="rl2-rsvp-card__rule" />
                </div>
                <p className="rl2-rsvp-card__title">Kindly RSVP</p>
                <span className="rl2-rsvp-card__divider" aria-hidden="true" />
                <p className="rl2-rsvp-card__lede">Please let us know if you’ll be joining us</p>
                {note && <p className="rl2-rsvp-card__note">{note}</p>}
              </header>
              <RsvpForm slug={form.slug} hostsLine={form.hostsLine} rsvp={form.rsvp} classes={formClasses} />
              <p className="rl2-rsvp-card__foot">Thank you for responding</p>
            </div>
          ) : (
            <>
              {note && (
                <p className="rl2-serif rl2-cream rl2-rsvp__note" data-reveal="rise" style={delay(150)}>
                  {note}
                </p>
              )}
              <p className="rl2-serif rl2-cream rl2-caps rl2-rsvp__status" data-reveal="rise" style={delay(300)}>
                Replies open soon
              </p>
            </>
          )}
          {closing && (
            <p className="rl2-serif rl2-cream rl2-rsvp__closing" data-reveal="rise" style={delay(450)}>
              {closing}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/** "Rafael & Isabel" → "R & I": the card's monogram. */
const initials = (hostsLine: string) =>
  hostsLine
    .split(/\s*(?:&|,| and )\s*/)
    .filter(Boolean)
    .map((name) => [...name.trim()][0]?.toUpperCase() ?? "")
    .join(" & ");

/** The shared form, in this theme's own classes (theme.css, "rsvp form"). */
const formClasses: Partial<RsvpFormClasses> = {
  form: "rl2-form",
  field: "rl2-form__field",
  label: "rl2-form__label",
  hint: "rl2-form__hint",
  input: "rl2-form__input",
  textarea: "rl2-form__input rl2-form__textarea",
  select: "rl2-form__input rl2-form__select",
  group: "rl2-form__group",
  legend: "rl2-form__label rl2-form__legend",
  choices: "rl2-form__choices",
  choice: "rl2-form__choice",
  choiceInput: "rl2-form__choice-input",
  error: "rl2-form__error",
  alert: "rl2-form__alert",
  privacy: "rl2-form__privacy",
  submit: "rl2-form__submit",
  status: "rl2-form__status",
  statusTitle: "rl2-form__status-title",
  again: "rl2-form__again",
};

export function Finale({ hosts, date, art }: { hosts: string[]; date?: string; art: Artwork }) {
  const line = hosts.length === 2 ? `${hosts[0]} & ${hosts[1]}` : hosts.join(", ");
  const size = 88 * Math.max(0.6, Math.min(1, 14 / [...line].length));
  return (
    <section data-section="finale" className="rl2-section rl2-finale" aria-label="With love">
      <div className="rl2-col" style={{ height: u(4035 - FINALE_TOP) }}>
        <div className="rl2-fill" data-reveal-group>
          <Art asset={art.a4.veil} y={art.a4.veil.y - FINALE_TOP} data-reveal="unveil" className="rl2-finale__veil" />
          <Art asset={art.a4.rings} y={art.a4.rings.y - FINALE_TOP} data-reveal="rise" style={delay(500)} className="rl2-finale__rings" />
          <p className="rl2-script rl2-finale__names" data-reveal="write" style={{ ...centred(360, 3469 - FINALE_TOP, 720), fontSize: u(size), ...delay(800) }}>
            {hosts.length === 2 ? (
              <>
                {hosts[0]} <Amp className="rl2-finale__amp" /> {hosts[1]}
              </>
            ) : (
              line
            )}
          </p>
          {date && (
            <p className="rl2-serif rl2-finale__date" data-reveal="settle" style={{ ...centred(360, 3642 - FINALE_TOP, 560), ...delay(1300) }}>
              {date}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
