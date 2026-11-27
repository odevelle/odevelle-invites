import type { ThemeProps } from "../../theme";
import { appearanceVars } from "../../shared/appearance";
import { artworkFor } from "./assets";
import { royalLuxuryV2 } from "./definition";
import { Experience } from "./Experience";
import { fontFamilies, serifFont } from "./fonts";
import { dottedDate, dressCode, locationCards, moments } from "./model";
import { Countdown } from "./sections/Countdown";
import { Finale, Rsvp } from "./sections/Finale";
import { Hero } from "./sections/Hero";
import { Locations } from "./sections/Locations";
import { MomentsGift } from "./sections/MomentsGift";
import { DressCode, OrderOfTheDay, Silk, SilkEnd } from "./sections/Programme";
import "./theme.css";

/*
 * Royal Luxury v2 (released): Melina's "Cherry Red" design, in any of its
 * colourways (options.colourway; see colourways.ts).
 * Server-rendered; the client islands are the intro, the countdown clock,
 * the scratch card and the reveal/music shell.
 */

export default function RoyalLuxuryTheme({ invitation, options, appearance, features }: ThemeProps) {
  const o = royalLuxuryV2.optionsSchema.parse(options);
  const { content, media } = invitation;
  const art = artworkFor(o.colourway);

  const cards = features.schedule ? locationCards(invitation) : [];
  const programme = features.schedule ? moments(invitation) : [];
  const dress = dressCode(invitation);
  const date = dottedDate(invitation);
  const photos = features.gallery ? (media.hero ? [media.hero, ...media.gallery] : media.gallery) : [];

  return (
    <div className="rl2-root" style={{ ...appearanceVars(appearance, fontFamilies), ...art.style }}>
      <Experience
        intro={o.intro === "envelope-video" && art.intro ? { videoSrc: art.intro.video, poster: art.intro.poster, seal: art.intro.seal, hostsLine: invitation.hostsLine } : undefined}
        audio={features.music && media.audio ? { src: media.audio.url, type: media.audio.mimeType } : undefined}
      >
        <main className="rl2">
          <Hero invitation={invitation} art={art} />
          {features.countdown && invitation.countdownTarget && <Countdown target={invitation.countdownTarget} art={art} />}
          {cards.length > 0 && <Locations cards={cards} slug={invitation.slug} art={art} />}
          {(programme.length > 0 || dress) && (
            <Silk art={art}>
              {programme.length > 0 && <OrderOfTheDay items={programme} showTimes={o.timelineTimes} art={art} />}
              {dress ? <DressCode code={dress} note={invitation.occasion === "wedding" ? "Avoid wearing white, it’s reserved for the Bride!" : undefined} art={art} /> : <SilkEnd />}
            </Silk>
          )}
          <MomentsGift photos={photos} isGallery={photos.length > 0} names={invitation.hostsLine} date={date} fontFamily={serifFont.style.fontFamily} art={art} />
          {features.rsvp && <Rsvp note={content.rsvpNote} closing={content.closingMessage} art={art} />}
          <Finale hosts={content.hosts.map((h) => h.displayName)} date={date} art={art} />
        </main>
      </Experience>
    </div>
  );
}
