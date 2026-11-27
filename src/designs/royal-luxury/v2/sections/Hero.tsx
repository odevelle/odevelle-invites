import type { CSSProperties } from "react";
import type { InvitationView } from "@/invitation/view";
import type { Artwork } from "../assets";
import { dottedDate } from "../model";
import { Amp, Art, box, centred, delay, u } from "../psd";

/*
 * Hero (artboard 03, y 0–1290): lace-edged paper with the names. The plate is
 * the Photoshop composite with the text areas rebuilt; on wide screens it is
 * mirrored on both sides, which keeps paper and lace continuous at the seams.
 */

const HEIGHT = 1290;
const NAME_SIZE = 92;
/** At 92u, ~7 characters of Pinyon Script fill each name's half of the card; longer names scale down. */
const nameSize = (name: string): CSSProperties => ({ fontSize: u(NAME_SIZE * Math.max(0.58, Math.min(1, 7 / [...name].length))) });

export function Hero({ invitation, art }: { invitation: InvitationView; art: Artwork }) {
  const { content } = invitation;
  const [first, second] = content.hosts;
  const pair = content.hosts.length === 2;
  const date = dottedDate(invitation);

  return (
    <section data-section="hero" className="rl2-section rl2-hero" aria-label="Invitation">
      <div className="rl2-col" style={{ height: u(HEIGHT) }}>
        <div className="rl2-fill" data-reveal="plate">
          <Art asset={art.a3.hero} y={0} eager />
          <Art asset={art.a3.hero} x={-720} y={0} eager className="rl2-mirror" />
          <Art asset={art.a3.hero} x={720} y={0} eager className="rl2-mirror" />
        </div>

        <div className="rl2-fill" data-reveal-group>
          <p className="rl2-serif rl2-ink rl2-hero__invite" data-reveal="rise" style={{ ...centred(360, 431, 560), ...delay(150) }}>
            {content.eyebrow ?? (
              <>
                You are invited to celebrate the
                <br />
                wedding of
              </>
            )}
          </p>

          {pair ? (
            <h1 className="rl2-hero__names">
              <span className="rl2-script rl2-ink rl2-hero__name" data-reveal="write" style={{ ...centred(181, 527, 340), ...nameSize(first.displayName), ...delay(500) }}>
                {first.displayName}
              </span>{" "}
              <Amp className="rl2-ink rl2-hero__amp" data-reveal="fade" style={{ ...box(327, 572, 66, 62), ...delay(1150) }} />{" "}
              <span className="rl2-script rl2-ink rl2-hero__name" data-reveal="write" style={{ ...centred(539, 527, 340), ...nameSize(second.displayName), ...delay(1350) }}>
                {second.displayName}
              </span>
            </h1>
          ) : (
            <h1 className="rl2-script rl2-ink rl2-hero__name" data-reveal="write" style={{ ...centred(360, 532, 700), fontSize: u(content.hosts.length > 2 ? 56 : NAME_SIZE), ...delay(500) }}>
              {invitation.hostsLine}
            </h1>
          )}

          {pair &&
            [first, second].map(
              (host, i) =>
                host.parents && (
                  <p key={i} className="rl2-serif rl2-ink rl2-hero__parents" data-reveal="rise" style={{ ...centred(i === 0 ? 177 : 529, 650, 320), ...delay(1900 + i * 120) }}>
                    {host.parents.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </p>
                ),
            )}

          {content.invitationLine && (
            <p className="rl2-serif rl2-ink rl2-hero__line" data-reveal="rise" style={{ ...centred(360, 722, 600), ...delay(2150) }}>
              {content.invitationLine}
            </p>
          )}

          {date && (
            <p className="rl2-serif rl2-ink rl2-hero__date" data-reveal="settle" style={{ ...centred(360, 776, 560), ...delay(2300) }}>
              <time dateTime={invitation.events[0]?.startsAt ?? undefined}>{date}</time>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
