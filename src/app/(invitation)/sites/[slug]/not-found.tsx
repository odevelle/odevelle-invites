/** No published invitation at this address (unknown, unpublished or malformed slug). */
export default function InvitationNotFound() {
  return (
    <main data-invitation-state="not-found" className="grid min-h-dvh place-items-center bg-[#f7f5ef] px-6 text-center text-[#1f2420]">
      <div className="max-w-md">
        <p className="text-sm tracking-[0.2em] text-[#4a5e3f] uppercase">ODEVELLE</p>
        <h1 className="mt-4 font-serif text-4xl">We couldn’t find this invitation</h1>
        <p className="mt-4 text-base text-[#4f554e]">
          Please check the link you were sent. If it still doesn’t open, ask the couple or host to share it again.
        </p>
      </div>
    </main>
  );
}
