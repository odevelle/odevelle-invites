import type { Artwork } from "../assets";
import type { LocationCard } from "../model";
import { Art, box, centred, delay, u } from "../psd";

/*
 * Locations (artboard 03, y 2025–4400 for two venues): ivory net between two
 * lace borders, one embossed card per venue. The section boundary sits under
 * each lace border, so the burgundy above and below never meets the net.
 */

const TOP = 2025;
const CARD_TOP = 2235 - TOP; // first frame image (it carries 36px of shadow padding)
const CARD_PITCH = 984;
const TAIL = 197;
const FRAME_PAD = 36;
/** "RECEPTION NAME" fills the card at 50u; longer venue names scale down to stay on one line. */
const venueSize = (name: string) => u(50 * Math.max(0.6, Math.min(1, 17 / [...name].length)));

/** Per-illustration placement on the card, from the PSD (relative to the paper's top edge). */
const CARD_LAYOUT = {
  church: { art: 2314 - 2271, text: 2837 - 2271, buttons: 3008 - 2271, bouquet: 2944 - 2271 },
  mansion: { art: 3468 - 3255, text: 3801 - 3255, buttons: 3978 - 3255, bouquet: 3915 - 3255 },
} as const;

export function Locations({ cards, slug, art }: { cards: LocationCard[]; slug: string; art: Artwork }) {
  const height = CARD_TOP + cards.length * CARD_PITCH + TAIL;
  return (
    <section data-section="events" className="rl2-section rl2-locations" aria-labelledby="rl2-locations-title">
      <div aria-hidden="true" className="rl2-lace rl2-lace--top" />
      <div className="rl2-col" style={{ height: u(height) }}>
        <h2 id="rl2-locations-title" className="rl2-script rl2-ink rl2-locations__title" data-reveal="write" style={centred(360, 136, 520)}>
          Locations
        </h2>
        {cards.map((card, i) => (
          <Card key={card.key} card={card} top={CARD_TOP + i * CARD_PITCH} slug={slug} art={art} />
        ))}
      </div>
      <div aria-hidden="true" className="rl2-lace rl2-lace--bottom" />
    </section>
  );
}

function Card({ card, top, slug, art }: { card: LocationCard; top: number; slug: string; art: Artwork }) {
  const layout = CARD_LAYOUT[card.illustration];
  const paper = top + FRAME_PAD;
  return (
    <article className="rl2-card" data-reveal-group aria-label={card.venueName}>
      <Art asset={art.a3.frame} y={top} data-reveal="card" />
      <Art asset={art.a3[card.illustration]} y={paper + layout.art} data-reveal="draw" style={delay(350)} />
      <div className="rl2-card__text" style={centred(360, paper + layout.text - 6, 580)}>
        <h3 className="rl2-serif rl2-ink rl2-card__venue" data-reveal="rise" style={{ fontSize: venueSize(card.venueName), ...delay(700) }}>
          {card.venueName}
        </h3>
        {card.address && (
          <p className="rl2-serif rl2-ink rl2-card__place" data-reveal="rise" style={delay(820)}>
            {card.address}
          </p>
        )}
        <p className="rl2-serif rl2-ink rl2-card__time" data-reveal="rise" style={delay(940)}>
          {card.timeLabel}
        </p>
      </div>
      <div className="rl2-card__actions" data-reveal="rise" style={{ ...box(88, paper + layout.buttons, 542, 72), ...delay(1050) }}>
        {card.mapHref ? (
          <a className="rl2-btn rl2-btn--start" href={card.mapHref} target="_blank" rel="noreferrer">
            Directions
          </a>
        ) : (
          <span className="rl2-btn rl2-btn--start" aria-hidden="true" />
        )}
        <a className="rl2-btn rl2-btn--end" href={card.calendarHref} download={`${slug}-${card.key.replace(/[^a-z0-9]+/g, "-")}.ics`}>
          Calendar
        </a>
      </div>
      <Art asset={art.a3.cardBouquet} y={paper + layout.bouquet} data-reveal="bloom" style={delay(1200)} className="rl2-card__bouquet" />
    </article>
  );
}
