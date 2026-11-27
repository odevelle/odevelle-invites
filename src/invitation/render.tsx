import "server-only";
import { notFound } from "next/navigation";
import { loadTheme } from "@/designs/registry";
import { isUsableSlug } from "@/lib/tenant/slug";
import { parsePublishedInvitation } from "./parse";
import { getPublishedInvitationRecord } from "./queries";
import { getInvitationSource } from "./source";
import { buildInvitationView } from "./view";

/**
 * Thrown when an invitation exists but can't be shown safely (invalid data,
 * unregistered theme, theme failed to load). The segment's error boundary
 * shows guests a calm "temporarily unavailable" page; details go to the logs.
 */
export class InvitationUnavailableError extends Error {
  constructor(
    readonly slug: string,
    readonly reason: string,
  ) {
    super(`Invitation "${slug}" unavailable: ${reason}`);
    this.name = "InvitationUnavailableError";
  }
}

/**
 * The rendering engine: slug → record → validation → theme → page.
 *
 *   not found    no published invitation with that slug (or a malformed slug)
 *   unavailable  it exists but its data or theme can't be rendered
 */
export async function InvitationRenderer({ slug }: { slug: string }) {
  if (!isUsableSlug(slug)) notFound();

  const raw = await getPublishedInvitationRecord(slug);
  if (!raw) notFound();

  const parsed = parsePublishedInvitation(raw);
  if (!parsed.ok) {
    console.error(`[invitation] ${slug}: ${parsed.reason}`, parsed.issues.slice(0, 5));
    throw new InvitationUnavailableError(slug, parsed.reason);
  }

  const { invitation } = parsed;
  const { id: designId, version } = invitation.design;

  let Theme;
  try {
    Theme = await loadTheme(designId, version);
  } catch (error) {
    console.error(`[invitation] ${slug}: theme ${designId}@${version} failed to load`, error);
    throw new InvitationUnavailableError(slug, "theme-load-failed");
  }
  if (!Theme) throw new InvitationUnavailableError(slug, "theme-not-registered");

  const view = buildInvitationView(invitation, getInvitationSource().mediaUrl);

  return (
    <div lang={invitation.locale} data-invitation={invitation.slug} data-theme={designId} data-theme-version={version}>
      <Theme
        invitation={view}
        options={invitation.designOptions}
        appearance={invitation.appearance}
        features={invitation.features}
      />
    </div>
  );
}
