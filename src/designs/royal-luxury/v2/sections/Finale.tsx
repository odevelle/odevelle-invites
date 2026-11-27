import type { Artwork } from "../assets";
import { capsFont } from "../fonts";
import { Amp, Art, centred, delay, u } from "../psd";

/*
 * RSVP (artboard 04, y 2010–3135) and the veiled finale (y 3135–4035).
 * The PSD leaves the space under "RSVP" for the reply form (Phase 6); until
 * then it carries the reply note.
 */

const RSVP_TOP = 2010;
const FINALE_TOP = 3135;

export function Rsvp({ note, closing, art }: { note?: string; closing?: string; art: Artwork }) {
  return (
    <section data-section="rsvp" className="rl2-section rl2-rsvp" aria-labelledby="rl2-rsvp-title">
      <div className="rl2-col" style={{ height: u(FINALE_TOP - RSVP_TOP) }}>
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
          <div className="rl2-rsvp__body" style={centred(360, 2700 - RSVP_TOP, 600)}>
            {note && (
              <p className="rl2-serif rl2-cream rl2-rsvp__note" data-reveal="rise" style={delay(750)}>
                {note}
              </p>
            )}
            <p className="rl2-serif rl2-cream rl2-caps rl2-rsvp__status" data-reveal="rise" style={delay(900)}>
              Replies open soon
            </p>
            {closing && (
              <p className="rl2-serif rl2-cream rl2-rsvp__closing" data-reveal="rise" style={delay(1050)}>
                {closing}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

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
