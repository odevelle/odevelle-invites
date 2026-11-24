import { ChatBubble, Sparkle } from "./icons";
import { button } from "./ui";

export function FinalCta() {
  return (
    <section
      aria-labelledby="final-title"
      className="on-dark relative overflow-hidden py-[clamp(72px,10vw,128px)] text-cream"
      style={{ background: "radial-gradient(90% 120% at 50% 0%, #5A7050 0%, #4A5E3F 50%, #3B4B32 100%)" }}
    >
      <div
        aria-hidden="true"
        className="absolute top-7 left-1/2 h-[140%] w-[min(86%,720px)] -translate-x-1/2 border border-[rgba(243,227,161,.22)]"
        style={{ borderRadius: "50% 50% 0 0 / 30% 30% 0 0" }}
      />
      <div className="reveal relative mx-auto flex max-w-205 flex-col items-center px-[clamp(20px,5vw,48px)] text-center">
        <Sparkle size={22} fill="#F3E3A1" />
        <h2
          id="final-title"
          className="mt-5.5 mb-0 font-serif text-[clamp(38px,8.4vw,70px)] font-medium leading-[1.02] tracking-[-0.01em] text-balance text-butter [&_em]:text-cream"
        >
          Your celebration begins <em>the moment they open it.</em>
        </h2>
        <p className="mt-5 mb-0 text-lg text-cream">
          Choose a design today, and your invitation can be with your guests in [N] days.
        </p>
        <div className="mt-8.5 flex flex-wrap justify-center gap-3">
          <a href="#begin" className={button("light", "min-h-14 gap-2.5 px-7.5 text-[17px] font-medium")}>
            Begin your invitation
          </a>
          <a href="#whatsapp" className={button("line", "min-h-14 gap-2.5 px-6.5 text-[17px]")}>
            <ChatBubble size={18} />
            Message the studio
          </a>
        </div>
      </div>
    </section>
  );
}
