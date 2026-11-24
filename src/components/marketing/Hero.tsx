import { ArrowRight, Ornament, Sparkle } from "./icons";
import { InviteMockup } from "./invite-mockup/InviteMockup";
import { button } from "./ui";

const promises = ["Illustrated by hand", "Private RSVP dashboard", "Ready in [N] days"];

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative pt-[clamp(28px,6vw,72px)] pb-[clamp(56px,8vw,104px)]">
      <div className="shell flex flex-wrap items-center gap-[clamp(40px,6vw,72px)]">
        {/* Copy */}
        <div className="min-w-0 max-w-160 flex-[1_1_460px]">
          <h1 id="hero-title" className="m-0 font-normal">
            <span className="rise flex items-center gap-3 font-sans text-[13px] font-medium uppercase leading-normal tracking-[.22em] text-olive">
              <Ornament />
              Digital wedding invitations, designed by hand
            </span>
            <span className="rise rise-1 mt-4.5 block font-serif text-[clamp(48px,12.6vw,100px)] font-medium leading-none tracking-[-0.015em] text-balance text-gold">
              Every love story deserves <em className="text-olive">a beautiful beginning.</em>
            </span>
          </h1>
          <p className="rise rise-2 mt-4.5 mb-0 font-serif text-[clamp(22px,5.2vw,30px)] font-normal italic leading-[1.2] text-olive">
            An invitation to remember.
          </p>
          <p className="rise rise-2 mt-5.5 mb-0 max-w-[34em] text-[clamp(16px,4.2vw,19px)] leading-[1.6] text-pretty text-muted">
            ODEVELLE designs personalised wedding invitation websites, illustrated by hand and composed around your
            story. One link carries your day to every guest, and their replies gather quietly in your dashboard.
          </p>
          <div className="rise rise-3 mt-7.5 flex flex-wrap items-center gap-x-5.5 gap-y-3.5">
            <a
              href="#begin"
              className={button(
                "primary",
                "min-h-14 gap-3 px-7.5 text-[17px] font-medium shadow-[0_14px_28px_-14px_rgba(74,94,63,.75)]",
              )}
            >
              Begin your invitation
              <ArrowRight size={18} />
            </a>
            <a href="#designs" className="link-draw py-2.5 text-base text-ink">
              View the collection
            </a>
          </div>
          <p className="rise rise-3 mt-3.5 mb-0 text-sm text-muted">You share the details. We design, build and deliver.</p>
          <ul
            aria-label="What every invitation includes"
            className="rise rise-4 mt-7.5 mb-0 flex list-none flex-wrap gap-x-5.5 gap-y-2.5 border-t border-ink/10 pt-5.5 text-sm text-ink"
          >
            {promises.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Sparkle size={10} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Illustration */}
        <div className="flex min-w-0 flex-[1_1_380px] justify-center">
          <figure className="rise rise-2 relative m-0 aspect-470/550 w-[min(100%,470px)]">
            <div
              aria-hidden="true"
              className="absolute inset-x-[7%] top-0 bottom-[7%] overflow-hidden"
              style={{
                borderRadius: "50% 50% 20px 20px / 34% 34% 20px 20px",
                background: "radial-gradient(120% 85% at 50% 18%, #7F9070 0%, #5E7250 50%, #4A5E3F 100%)",
              }}
            >
              <div
                className="absolute inset-3.5 border border-[rgba(243,227,161,.38)]"
                style={{ borderRadius: "50% 50% 10px 10px / 34% 34% 10px 10px" }}
              />
              <Sparkle size={14} fill="#F3E3A1" className="absolute top-[20%] left-[22%] opacity-55" />
              <Sparkle size={9} fill="#F3E3A1" className="absolute top-[13%] right-[26%] opacity-45" />
              <Sparkle size={11} fill="#F3E3A1" className="absolute top-[42%] left-[14%] opacity-35" />
            </div>

            <div className="absolute bottom-[5%] left-[2%] w-[39%] rotate-[-7deg] transition-transform duration-600 ease-soft">
              <InviteMockup design="azulejo" />
            </div>
            <div className="animate-float absolute right-[11%] bottom-0 w-1/2">
              <InviteMockup design="royal" />
            </div>

            {/* Rotating studio stamp */}
            <div
              aria-hidden="true"
              className="absolute top-[9%] left-[-2%] flex h-26 w-26 items-center justify-center rounded-full bg-cream shadow-[0_10px_30px_-14px_rgba(31,36,32,.4)]"
            >
              <svg className="animate-spin-slow absolute inset-1" width="96" height="96" viewBox="0 0 100 100">
                <defs>
                  <path id="odRing" d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0" />
                </defs>
                <text style={{ fontFamily: "var(--font-inter), sans-serif" }} fontSize="8.4" letterSpacing="2.6" fill="#4A5E3F">
                  <textPath href="#odRing">DRAWN BY HAND · ODEVELLE STUDIO ·</textPath>
                </text>
              </svg>
              <Sparkle size={22} />
            </div>

            {/* Sprig */}
            <svg
              aria-hidden="true"
              width="120"
              height="120"
              viewBox="0 0 120 120"
              fill="none"
              className="absolute right-[-4%] bottom-[4%]"
            >
              <path d="M12 112C40 86 62 58 76 18" stroke="#6F7F45" strokeWidth="1.4" strokeLinecap="round" />
              <ellipse cx="40" cy="80" rx="13" ry="5" fill="#8FA068" transform="rotate(-50 40 80)" />
              <ellipse cx="62" cy="76" rx="13" ry="5" fill="#B3C08F" transform="rotate(-10 62 76)" />
              <ellipse cx="54" cy="52" rx="12" ry="4.6" fill="#8FA068" transform="rotate(-62 54 52)" />
              <ellipse cx="78" cy="44" rx="12" ry="4.6" fill="#B3C08F" transform="rotate(-18 78 44)" />
              <circle cx="77" cy="16" r="6" fill="#E2CF83" />
              <circle cx="81" cy="13" r="3.4" fill="#F3E3A1" />
            </svg>

            <figcaption className="sr-only">
              Two ODEVELLE invitations shown on phones: Royal Lace in cherry red and beige, and Azulejo in blue and white
              tiles.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
