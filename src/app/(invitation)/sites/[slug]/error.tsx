"use client";

/**
 * The invitation exists but can't be shown right now (invalid data, theme not
 * registered or failed to load). Guests see a calm message; the cause is in the
 * server logs. Error boundaries must be client components.
 */
export default function InvitationUnavailable({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main data-invitation-state="unavailable" className="grid min-h-dvh place-items-center bg-[#f7f5ef] px-6 text-center text-[#1f2420]">
      <div className="max-w-md">
        <p className="text-sm tracking-[0.2em] text-[#4a5e3f] uppercase">ODEVELLE</p>
        <h1 className="mt-4 font-serif text-4xl">This invitation is taking a moment</h1>
        <p className="mt-4 text-base text-[#4f554e]">It isn’t available right now. Please try again a little later.</p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-8 rounded-full border border-[#1f2420]/30 px-6 py-3 text-base hover:bg-[#1f2420] hover:text-white"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
