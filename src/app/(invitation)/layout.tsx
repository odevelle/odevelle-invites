import type { Metadata, Viewport } from "next";
import "./invitation.css";

/*
 * Root layout for every invitation, separate from the marketing site: no
 * marketing fonts, tokens or scripts reach an invitation. Each theme brings
 * its own fonts and styles.
 */

export const metadata: Metadata = {
  // Unlisted, not secret: keeps invitations out of search engines.
  // This is not access control; RSVPs and client data are protected by RLS.
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function InvitationRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
