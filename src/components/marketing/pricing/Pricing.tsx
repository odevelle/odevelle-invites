import { Eyebrow, displayHeading } from "../ui";
import { PricingPlans } from "./PricingPlans";

const glow = "pointer-events-none absolute aspect-square rounded-full";

export function Pricing() {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="relative overflow-hidden bg-[linear-gradient(180deg,#EFEDE5_0%,#F4EFDD_55%,#EFEDE5_100%)] py-[clamp(64px,8vw,112px)]"
    >
      <div
        aria-hidden="true"
        className={`${glow} top-[30%] left-[-8%] w-[46vw] max-w-155 blur-[30px]`}
        style={{ background: "radial-gradient(circle, rgba(127,144,112,.55) 0%, rgba(127,144,112,0) 68%)" }}
      />
      <div
        aria-hidden="true"
        className={`${glow} top-[18%] right-[-6%] w-[42vw] max-w-140 blur-[30px]`}
        style={{ background: "radial-gradient(circle, rgba(243,227,161,.95) 0%, rgba(243,227,161,0) 66%)" }}
      />
      <div
        aria-hidden="true"
        className={`${glow} bottom-[-14%] left-[38%] w-[34vw] max-w-115 blur-[34px]`}
        style={{ background: "radial-gradient(circle, rgba(201,178,106,.5) 0%, rgba(201,178,106,0) 66%)" }}
      />

      <div className="shell relative z-1">
        <PricingPlans
          intro={
            <>
              <Eyebrow number="N°3">Pricing</Eyebrow>
              <h2 id="pricing-title" className={`${displayHeading} mt-4 text-[clamp(36px,7.4vw,60px)]`}>
                One invitation. <em>Every guest.</em>
              </h2>
              <p className="mt-4 mb-0 text-[17px] text-muted">
                A single payment, no subscriptions and no limit on guests. Every plan includes your RSVP dashboard.
              </p>
            </>
          }
        />
      </div>
    </section>
  );
}
