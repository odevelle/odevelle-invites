import type { MediaView } from "@/invitation/view";
import { type Artwork, ovalOpening } from "../assets";
import { ScratchReveal } from "../ScratchReveal";
import { Art, box, centred, delay, u } from "../psd";

/*
 * "Our Moments" and "Gift" (artboard 04, y 0–2010). One section, because the
 * PSD layers them together: the right bouquet trails over the gift's velvet,
 * and the envelope sits above both.
 */

const HEIGHT = 2010;

type Props = {
  photos: MediaView[];
  /** Gallery is entitled and has photos: marks the section for the platform. */
  isGallery: boolean;
  names: string;
  date?: string;
  fontFamily: string;
  art: Artwork;
};

export function MomentsGift({ photos, isGallery, names, date, fontFamily, art }: Props) {
  return (
    <section className="rl2-section rl2-sheet" aria-label="Our moments and gift">
      <div aria-hidden="true" className="rl2-sheet__band" />
      <div className="rl2-col" style={{ height: u(HEIGHT) }}>
        <div aria-hidden="true">
          <Art asset={art.a4.paper} y={0} />
          <Art asset={art.a4.paper} x={-720} y={0} className="rl2-mirror" />
          <Art asset={art.a4.paper} x={720} y={0} className="rl2-mirror" />
        </div>

        <div className="rl2-fill" data-section={isGallery ? "gallery" : "moments"} data-reveal-group>
          <h2 className="rl2-script rl2-ink rl2-moments__title" data-reveal="write" style={centred(360.5, 44, 680)}>
            Our Moments
          </h2>
          <div className="rl2-drift rl2-drift--float rl2-fill" aria-hidden="true">
            <Art asset={art.a4.pearlsLeft} y={art.a4.pearlsLeft.y} data-reveal="fade" style={delay(300)} className="rl2-z2" />
            <Art asset={art.a4.pearlsRight} y={art.a4.pearlsRight.y} data-reveal="fade" style={delay(450)} className="rl2-z2" />
          </div>
          <Art asset={art.a4.bouquetLeft} y={art.a4.bouquetLeft.y} data-reveal="from-left" style={delay(400)} className="rl2-z3" />
          <Art asset={art.a4.bouquetRight} y={art.a4.bouquetRight.y} data-reveal="from-right" style={delay(550)} className="rl2-z3" />
          <div className="rl2-fill rl2-z6" data-reveal="frame" style={delay(150)}>
            <Art asset={art.a4.ovalFrame} y={art.a4.ovalFrame.y} />
            <ScratchReveal
              frameSrc={art.a4.ovalFrame.src}
              frame={art.a4.ovalFrame}
              opening={ovalOpening}
              photos={photos.map((p) => ({ src: p.url, alt: p.alt, width: p.width, height: p.height }))}
              fallback={{ names, date }}
              fontFamily={fontFamily}
            />
          </div>
        </div>

        <div className="rl2-fill" data-section="gift" data-reveal-group>
          <Art asset={art.a4.velvet} y={art.a4.velvet.y} data-reveal="fade" className="rl2-z1" />
          <div aria-hidden="true" className="rl2-gift__shadow rl2-z3" data-reveal="fade" style={{ ...box(-15, 2012, 750, 56), ...delay(900) }} />
          <Art asset={art.a4.envelope} y={art.a4.envelope.y} data-reveal="rise-slow" style={delay(150)} className="rl2-z4" />
          <h2 className="rl2-script rl2-ink rl2-gift__title rl2-z5" data-reveal="write" style={{ ...centred(359.5, 1233, 320), ...delay(650) }}>
            Gift
          </h2>
          <p className="rl2-serif rl2-caps rl2-gift__text rl2-z5" data-reveal="rise" style={{ ...centred(360, 1397, 440), ...delay(950) }}>
            Your presence
            <br />
            is our greatest
            <br />
            blessing.
          </p>
        </div>
      </div>
    </section>
  );
}
