import type { Metadata } from "next";
import { Suspense } from "react";
import { getPublishedInvitationRecord } from "@/invitation/queries";
import { InvitationRenderer } from "@/invitation/render";
import { isUsableSlug } from "@/lib/tenant/slug";

/*
 * /sites/[slug]: every invitation renders here. src/proxy.ts rewrites
 * {slug}.odevelle.com to this route and redirects odevelle.com/sites/{slug}
 * to the subdomain (src/lib/tenant/routing.ts).
 *
 * The slug is read inside <Suspense> so Next can serve a static shell
 * instantly and cache each invitation after its first visit. (Consequence: an
 * unknown slug streams a not-found page with status 200 + noindex; the proxy
 * returns real 404s for malformed and reserved hosts.)
 */

export async function generateMetadata({ params }: PageProps<"/sites/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (!isUsableSlug(slug)) return {};
  const record = await getPublishedInvitationRecord(slug);
  const title = record && typeof record === "object" && "title" in record ? String(record.title) : undefined;
  return title ? { title: `${title} · Invitation` } : {};
}

export default function InvitationPage({ params }: PageProps<"/sites/[slug]">) {
  return (
    <Suspense fallback={<div aria-busy="true" className="min-h-dvh bg-white" />}>
      {params.then(({ slug }) => (
        <InvitationRenderer slug={slug} />
      ))}
    </Suspense>
  );
}
