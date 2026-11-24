import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const SPARKLE_PATH =
  "M12 0C12.6 7 17 11.4 24 12C17 12.6 12.6 17 12 24C11.4 17 7 12.6 0 12C7 11.4 11.4 7 12 0Z";

/** The four-point ODEVELLE star. */
export function Sparkle({ size = 18, fill = "#4A5E3F", ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...rest}>
      <path d={SPARKLE_PATH} fill={fill} />
    </svg>
  );
}

/** Filled five-point star used for the testimonial ratings. */
export function Star({ size = 17, fill = "#E0A82E", ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...rest}>
      <path
        d="M12 1.6l3.1 6.65 7.3.86-5.4 4.96 1.46 7.18L12 17.66l-6.46 3.59L7 14.07 1.6 9.11l7.3-.86z"
        fill={fill}
      />
    </svg>
  );
}

/** · ✦ · ornament used beside section numbers. */
export function Ornament(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="30" height="10" viewBox="0 0 30 10" aria-hidden="true" className="flex-none" {...props}>
      <circle cx="2.5" cy="5" r="1.2" fill="#C9B26A" />
      <path
        d="M15 0C15.3 3.4 16.6 4.7 20 5C16.6 5.3 15.3 6.6 15 10C14.7 6.6 13.4 5.3 10 5C13.4 4.7 14.7 3.4 15 0Z"
        fill="#4A5E3F"
      />
      <circle cx="27.5" cy="5" r="1.2" fill="#C9B26A" />
    </svg>
  );
}

function Stroke({ size = 18, strokeWidth = 1.6, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const ArrowRight = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Stroke>
);

export const ChatBubble = (p: IconProps) => (
  <Stroke strokeWidth={1.5} strokeLinecap="butt" {...p}>
    <path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.1A8 8 0 1 1 20 11.5z" />
  </Stroke>
);

export const Check = ({ stroke = "#4A5E3F", ...p }: IconProps) => (
  <Stroke strokeWidth={1.7} stroke={stroke} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Stroke>
);

export const Eye = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Stroke>
);

export const Plus = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 5v14M5 12h14" />
  </Stroke>
);

export const Close = (p: IconProps) => (
  <Stroke strokeWidth={1.5} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Stroke>
);

export const Menu = (p: IconProps) => (
  <Stroke strokeWidth={1.5} {...p}>
    <path d="M4 9h16M4 15h16" />
  </Stroke>
);

export const ChevronDown = (p: IconProps) => (
  <Stroke strokeWidth={1.8} {...p}>
    <path d="M6 9l6 6 6-6" />
  </Stroke>
);

export const ChevronLeft = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Stroke>
);

export const ChevronRight = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M9 6l6 6-6 6" />
  </Stroke>
);

export const Replay = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />
  </Stroke>
);

export const LinkIcon = (p: IconProps) => (
  <Stroke strokeWidth={1.8} {...p}>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </Stroke>
);
