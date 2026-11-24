import { faqs } from "@/content/marketing/faq";
import { Eyebrow, displayHeading } from "../ui";
import { FaqList } from "./FaqList";

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="py-[clamp(64px,8vw,112px)]">
      <div className="shell flex flex-wrap gap-x-[clamp(40px,6vw,96px)] gap-y-8">
        <div className="reveal min-w-0 flex-[1_1_300px]">
          <Eyebrow number="N°6">Questions</Eyebrow>
          <h2 id="faq-title" className={`${displayHeading} mt-4 text-[clamp(36px,7.4vw,56px)]`}>
            Questions, <em>answered.</em>
          </h2>
          <p className="mt-4.5 mb-0 text-base text-muted">
            Something else on your mind?{" "}
            <a className="link-draw font-medium text-olive" href="#begin">
              Write to the studio
            </a>
          </p>
        </div>
        <FaqList items={faqs} />
      </div>
    </section>
  );
}
