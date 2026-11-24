import { ChatBubble, Sparkle } from "./icons";
import { Eyebrow, button } from "./ui";

const steps = [
  {
    title: "Choose your design",
    body: "Browse the collection and choose the theme that feels like your day. Unsure? We will help you decide.",
  },
  {
    title: "Share your details",
    body: "Send your names, dates, venues and photographs by form or on WhatsApp. Leave the layout to us.",
  },
  {
    title: "We craft and refine",
    body: "Our illustrator composes your invitation by hand. Review a private preview within [N] days and refine it with us.",
    highlight: true,
  },
  {
    title: "Share with your guests",
    body: "Receive your finished invitation link, send it on WhatsApp, Instagram or email, and watch the RSVPs arrive.",
  },
];

const dots = (direction: "x" | "y") =>
  direction === "x"
    ? "radial-gradient(circle, #B3AFA3 1.3px, transparent 1.8px) left center / 10px 6px repeat-x"
    : "radial-gradient(circle, #B3AFA3 1.3px, transparent 1.8px) center top / 6px 10px repeat-y";

export function Process() {
  return (
    <section id="how-it-works" aria-labelledby="how-it-works-title" className="relative bg-cream pt-[clamp(48px,5vw,72px)] pb-[clamp(72px,9vw,128px)]">
      <div className="shell">
        <div className="reveal flex flex-col items-center text-center">
          <Eyebrow number="N°2">The Process</Eyebrow>
          <h2
            id="how-it-works-title"
            className="mt-4 mb-0 max-w-[15em] font-serif text-[clamp(38px,7.6vw,60px)] font-medium leading-[1.02] tracking-[-0.01em] text-balance text-gold [&_em]:text-olive"
          >
            You share the story. <em>We do everything else.</em>
          </h2>
          <p className="mt-7 mb-0 inline-flex max-w-full items-center gap-3 rounded-[28px] border border-butter-deep bg-white px-6 py-3.5 text-left font-serif text-[clamp(18px,4.4vw,22px)] font-semibold leading-[1.3] text-ink shadow-[0_10px_24px_-20px_rgba(31,36,32,.4)]">
            <span aria-hidden="true" className="flex h-8.5 w-8.5 flex-none items-center justify-center rounded-full bg-butter">
              <Sparkle size={14} />
            </span>
            Hand designed for you, with a private RSVP dashboard and personal support included.
          </p>
        </div>

        <div className="relative mt-[clamp(48px,6vw,80px)]">
          <span
            aria-hidden="true"
            className="absolute inset-x-[12.5%] top-8.25 hidden h-1.5 min-[900px]:block"
            style={{ background: dots("x") }}
          />
          <ol className="relative m-0 grid list-none grid-cols-1 gap-5.5 p-0 min-[900px]:grid-cols-4 min-[900px]:gap-8">
            {steps.map((step, i) => (
              <li key={step.title} className="reveal flex flex-col items-center text-center">
                <span
                  aria-hidden="true"
                  className={`flex h-18 w-18 items-center justify-center rounded-full bg-olive font-serif text-[28px] font-semibold text-cream ${
                    step.highlight ? "shadow-[0_0_0_7px_#F3E3A1]" : ""
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-6 mb-0 font-serif text-[28px] font-semibold leading-[1.15] text-gold">
                  <span className="sr-only">Step {i + 1}: </span>
                  {step.title}
                </h3>
                <p className="mt-3 mb-0 max-w-[18em] text-base leading-[1.65] text-muted">{step.body}</p>
                {i < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="mt-5.5 block h-11 w-1.5 min-[900px]:hidden"
                    style={{ background: dots("y") }}
                  />
                )}
              </li>
            ))}
          </ol>
        </div>

        <div className="reveal mt-[clamp(48px,6vw,72px)] flex flex-col items-center gap-6 text-center">
          <p className="m-0 max-w-[18em] font-serif text-[clamp(28px,6vw,42px)] font-medium italic leading-[1.12] text-balance text-olive">
            Made to invite. Designed to be remembered.
          </p>
          <p className="-mt-2 mb-0 text-base text-muted">
            Choose your design today and it can be with every guest in [N] days.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="#begin" className={button("primary", "min-h-13 gap-2.5 px-6.5 text-base font-medium")}>
              Begin your invitation
            </a>
            <a href="#whatsapp" className={button("ghost", "min-h-13 gap-2.5 px-5.5 text-base")}>
              <ChatBubble size={18} />
              Message the studio
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
