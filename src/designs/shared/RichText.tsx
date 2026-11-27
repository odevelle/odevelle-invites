import type { RichText as RichTextBlocks } from "@/invitation/schema/primitives";

/**
 * Renders structured rich text as React text nodes, never as HTML.
 * Themes pass their own classes, so the typography stays theirs.
 */
export function RichText({
  blocks,
  paragraphClassName,
  className,
}: {
  blocks: RichTextBlocks;
  paragraphClassName?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {blocks.map((block, i) => (
        <p key={i} className={paragraphClassName}>
          {block.children.map((run, j) => {
            let node: React.ReactNode = run.text;
            if (run.marks?.includes("em")) node = <em>{node}</em>;
            if (run.marks?.includes("strong")) node = <strong>{node}</strong>;
            return <span key={j}>{node}</span>;
          })}
        </p>
      ))}
    </div>
  );
}
