import { ChatBubble } from "../icons";
import { Eyebrow, button, displayHeading } from "../ui";
import { EnquiryForm } from "./EnquiryForm";

export function Contact() {
  return (
    <section id="begin" aria-labelledby="begin-title" className="bg-sand py-[clamp(64px,8vw,112px)]">
      <div className="shell flex flex-wrap gap-x-[clamp(40px,6vw,96px)] gap-y-10">
        <div className="reveal min-w-0 flex-[1_1_340px]">
          <Eyebrow number="N°7">Begin</Eyebrow>
          <h2 id="begin-title" className={`${displayHeading} mt-4 text-[clamp(36px,7.4vw,58px)]`}>
            Let’s begin <em>your invitation.</em>
          </h2>
          <p className="mt-4.5 mb-0 max-w-[28em] text-[17px] text-muted">
            Tell us your date and the design you love. The studio replies within [N] hours.
          </p>
          {/* TODO: point at the studio's WhatsApp click-to-chat link once the number is confirmed. */}
          <a
            id="whatsapp"
            href="#whatsapp"
            className={button("primary", "mt-7 min-h-14 gap-3 px-7 text-[17px] font-medium")}
          >
            <ChatBubble size={20} />
            Message the studio
          </a>
          <ul className="mt-8 mb-0 flex list-none flex-col gap-3 p-0 text-base">
            <li>
              <a className="link-draw text-ink" href="mailto:hello@odevelle.com">
                [hello@odevelle.com]
              </a>
            </li>
            <li>
              <a className="link-draw text-ink" href="tel:+000000000000">
                [phone]
              </a>
            </li>
            <li className="text-muted">Designed by hand, delivered worldwide. Celebrating couples across Europe, the UK, the Gulf and beyond.</li>
          </ul>
        </div>

        <div className="reveal min-w-0 flex-[1.3_1_420px] rounded-3xl border border-ink/8 bg-cream p-[clamp(24px,4vw,40px)]">
          <EnquiryForm />
        </div>
      </div>
    </section>
  );
}
