"use client";

import { useActionState, useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { submitRsvpAction } from "@/invitation/rsvp/actions";
import { RSVP_FIELDS, type RsvpFormState } from "@/invitation/rsvp/types";
import type { RsvpView } from "@/invitation/view";
import { AttendanceChoice, GuestCount, MealChoice, TextField } from "./fields";
import { resolveRsvpClasses, type RsvpFormClasses } from "./parts";
import { RsvpConfirmation } from "./RsvpConfirmation";

/*
 * The RSVP form every theme renders. One implementation of behaviour, wording
 * and accessibility; each theme styles it through `classes` (see parts.ts).
 *
 *   name → accept / decline → (if accepting) guests and meal → message
 *
 * The server re-derives every rule from the invitation's record, so what the
 * browser shows here is a convenience, never the source of truth.
 */

const idle: RsvpFormState = { status: "idle" };
const noSubscription = () => () => {};

type Props = {
  slug: string;
  /** "Charlotte & Henry": who receives the reply. */
  hostsLine: string;
  rsvp: RsvpView;
  classes?: Partial<RsvpFormClasses>;
};

export function RsvpForm({ slug, hostsLine, rsvp, classes }: Props) {
  const c = resolveRsvpClasses(classes);
  const [action] = useState(() => submitRsvpAction.bind(null, slug));
  const [state, formAction, pending] = useActionState(action, idle);
  const [dismissed, setDismissed] = useState<RsvpFormState | null>(null);
  const [round, setRound] = useState(0);
  // Closed is decided by the visitor's clock (the page itself is cached); the server re-checks on submit.
  const closed = useSyncExternalStore(
    noSubscription,
    () => !!rsvp.closesAt && Date.now() >= Date.parse(rsvp.closesAt),
    () => false,
  );

  if (closed) {
    return (
      <div className={c.status} data-rsvp-state="closed">
        <p className={c.statusTitle}>Replies have now closed</p>
        <p className={c.hint}>If you still need to reply, please contact {hostsLine} directly.</p>
      </div>
    );
  }

  if (state.status === "sent" && state !== dismissed) {
    return (
      <RsvpConfirmation
        guestName={state.guestName}
        attending={state.attending}
        hostsLine={hostsLine}
        c={c}
        onAgain={() => {
          setDismissed(state);
          setRound((r) => r + 1);
        }}
      />
    );
  }

  return (
    <Fields
      key={round}
      state={state === dismissed ? idle : state}
      formAction={formAction}
      pending={pending}
      hostsLine={hostsLine}
      rsvp={rsvp}
      c={c}
    />
  );
}

const errorText = (reason: Extract<RsvpFormState, { status: "error" }>["reason"], hostsLine: string) =>
  ({
    closed: "This invitation isn’t taking replies any more.",
    "rate-limited": "We’ve had several replies from this connection. Please try again in an hour.",
    full: `This invitation can’t take more replies online. Please contact ${hostsLine} directly.`,
    unavailable: "Your reply couldn’t be sent just now. Please try again in a moment.",
  })[reason];

/** A fresh id per filled-in form (crypto.randomUUID needs a secure context: https or localhost). */
const newSubmissionId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : "");

function Fields({
  state,
  formAction,
  pending,
  hostsLine,
  rsvp,
  c,
}: {
  state: RsvpFormState;
  formAction: (formData: FormData) => void;
  pending: boolean;
  hostsLine: string;
  rsvp: RsvpView;
  c: RsvpFormClasses;
}) {
  const values = state.status === "invalid" || state.status === "error" ? state.values : {};
  const errors = state.status === "invalid" ? state.fieldErrors : {};
  const formRef = useRef<HTMLFormElement>(null);

  // Choices are controlled (they show or hide fields); text inputs keep defaultValue.
  const [attending, setAttending] = useState(values[RSVP_FIELDS.attending] ?? "");
  const [guests, setGuests] = useState(values[RSVP_FIELDS.partySize] || "1");
  const [meal, setMeal] = useState(values[RSVP_FIELDS.meal] ?? "");
  const accepting = attending === "yes";

  // After a failed submission, take keyboard and screen-reader users to the first problem.
  useEffect(() => {
    if (state.status === "invalid") formRef.current?.querySelector<HTMLElement>("[aria-invalid=true], [data-invalid=true]")?.focus();
  }, [state]);

  // One id for this form's lifetime (React resets the form after each action,
  // so it lives in a ref): a double-click or a retry after a lost response is
  // the same reply. "Reply for someone else" remounts the form, with a new id.
  const submissionId = useRef("");
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (pending) {
      event.preventDefault();
      return;
    }
    submissionId.current ||= newSubmissionId();
    const input = event.currentTarget.elements.namedItem(RSVP_FIELDS.submission);
    if (input instanceof HTMLInputElement) input.value = submissionId.current;
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      className={c.form}
      aria-busy={pending}
      data-rsvp-state={state.status}
    >
      {state.status === "error" && (
        <p role="alert" className={c.alert}>
          {errorText(state.reason, hostsLine)}
        </p>
      )}

      <TextField
        name={RSVP_FIELDS.name}
        label="Your name"
        placeholder="Enter your full name"
        autoComplete="name"
        maxLength={120}
        required
        defaultValue={values[RSVP_FIELDS.name]}
        error={errors[RSVP_FIELDS.name]}
        c={c}
      />

      <AttendanceChoice name={RSVP_FIELDS.attending} value={attending} onChange={setAttending} error={errors[RSVP_FIELDS.attending]} c={c} />

      {accepting && (
        <GuestCount
          name={RSVP_FIELDS.partySize}
          max={rsvp.maxPartySize}
          value={guests}
          onChange={setGuests}
          error={errors[RSVP_FIELDS.partySize]}
          c={c}
        />
      )}

      {accepting && rsvp.mealOptions.length > 0 && (
        <MealChoice
          name={RSVP_FIELDS.meal}
          options={rsvp.mealOptions}
          value={meal}
          onChange={setMeal}
          error={errors[RSVP_FIELDS.meal]}
          c={c}
        />
      )}

      <TextField
        name={RSVP_FIELDS.message}
        label={`A message for ${hostsLine}`}
        hint="(optional)"
        placeholder="Write a little note…"
        maxLength={2000}
        multiline
        defaultValue={values[RSVP_FIELDS.message]}
        error={errors[RSVP_FIELDS.message]}
        c={c}
      />

      <input type="hidden" name={RSVP_FIELDS.submission} defaultValue="" />

      {/* Honeypot: off-screen and skipped by keyboard and screen readers; only bots fill it in. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
        <label>
          Website
          <input type="text" name={RSVP_FIELDS.trap} tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <p className={c.privacy}>Only {hostsLine} will see your reply.</p>
      <button type="submit" disabled={pending} className={c.submit}>
        {pending ? "Sending…" : "Send RSVP"}
      </button>
    </form>
  );
}
