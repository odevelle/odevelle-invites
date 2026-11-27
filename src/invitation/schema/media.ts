import { z } from "zod";
import { optional, text, uuid } from "./primitives";

export const MEDIA_KINDS = ["hero", "gallery", "illustration", "audio", "video", "og"] as const;
export const mediaKind = z.enum(MEDIA_KINDS);
export type MediaKind = z.infer<typeof mediaKind>;

const MB = 1024 * 1024;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
const AUDIO_TYPES = ["audio/mpeg", "audio/mp4", "audio/aac"] as const;
const VIDEO_TYPES = ["video/mp4", "video/webm"] as const;

/**
 * Upload rules per kind. Mirrored by the `invitation_media_*` CHECK constraints
 * (a unit test compares them). SVG is deliberately excluded: it can carry script.
 */
export const MEDIA_RULES = {
  hero: { mimeTypes: IMAGE_TYPES, maxBytes: 15 * MB },
  gallery: { mimeTypes: IMAGE_TYPES, maxBytes: 15 * MB },
  illustration: { mimeTypes: IMAGE_TYPES, maxBytes: 15 * MB },
  og: { mimeTypes: IMAGE_TYPES, maxBytes: 15 * MB },
  audio: { mimeTypes: AUDIO_TYPES, maxBytes: 15 * MB },
  video: { mimeTypes: VIDEO_TYPES, maxBytes: 150 * MB },
} as const satisfies Record<MediaKind, { mimeTypes: readonly string[]; maxBytes: number }>;

export const ALL_MEDIA_TYPES = [...IMAGE_TYPES, ...AUDIO_TYPES, ...VIDEO_TYPES] as const;

const isImageKind = (kind: MediaKind) => kind !== "audio" && kind !== "video";

/** One row of `invitation_media` as returned to the renderer. `path` is relative to the bucket. */
export const invitationMedia = z
  .strictObject({
    id: uuid,
    kind: mediaKind,
    path: z.string().min(1).max(512),
    mimeType: z.enum(ALL_MEDIA_TYPES),
    width: optional(z.number().int().positive()),
    height: optional(z.number().int().positive()),
    durationMs: optional(z.number().int().nonnegative()),
    alt: optional(text(300)),
    blurDataUrl: optional(z.string().startsWith("data:image/").max(2000)),
    sortOrder: z.number().int(),
  })
  .refine((m) => (MEDIA_RULES[m.kind].mimeTypes as readonly string[]).includes(m.mimeType), {
    message: "File type not allowed for this media kind",
    path: ["mimeType"],
  })
  .refine((m) => !isImageKind(m.kind) || m.alt !== undefined, {
    message: "Images need alt text",
    path: ["alt"],
  });

export type InvitationMedia = z.infer<typeof invitationMedia>;
