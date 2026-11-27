import type { Artwork } from "../assets";
import { CountdownClock } from "../CountdownClock";
import { Art, centred, delay, u } from "../psd";
import { AnimatedPearls } from "./AnimatedPearls";

/* Countdown (artboard 03, y 1290–2025): animated pearl frame, calla bouquets, live clock. */

const TOP = 1290;
const HEIGHT = 735;

export function Countdown({ target, art }: { target: string; art: Artwork }) {
  return (
    <section data-section="countdown" className="rl2-section rl2-countdown-section" aria-labelledby="rl2-countdown-title">
      <div className="rl2-col" style={{ height: u(HEIGHT) }}>
        <div className="rl2-fill" data-reveal-group>
          <AnimatedPearls top={TOP} base={art.base} />
          <Art asset={art.a3.countdownBouquetLeft} y={art.a3.countdownBouquetLeft.y - TOP} data-reveal="from-left" style={delay(350)} />
          <Art asset={art.a3.countdownBouquetRight} y={art.a3.countdownBouquetRight.y - TOP} data-reveal="from-right" style={delay(350)} />
          <h2 id="rl2-countdown-title" className="rl2-script rl2-cream rl2-countdown__title" data-reveal="write" style={{ ...centred(360, 226, 420), ...delay(150) }}>
            Countdown
          </h2>
        </div>
        <CountdownClock target={target} top={322} />
      </div>
    </section>
  );
}
