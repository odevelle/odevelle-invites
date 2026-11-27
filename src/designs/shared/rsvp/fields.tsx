"use client";

import type { ReactNode } from "react";
import type { RsvpFormClasses } from "./parts";

/*
 * The RSVP form's controls. Stateless: RsvpForm owns the answers. Each takes
 * the resolved theme classes and the field's error message, if any.
 */

export const fieldId = (name: string) => `rsvp-${name.replace(/[^a-z0-9-]/gi, "-")}`;
const errorId = (name: string) => `${fieldId(name)}-error`;
const hintId = (name: string) => `${fieldId(name)}-hint`;
const describedBy = (name: string, error?: string, hint?: boolean) =>
  [error && errorId(name), hint && hintId(name)].filter(Boolean).join(" ") || undefined;

function FieldError({ name, error, c }: { name: string; error?: string; c: RsvpFormClasses }) {
  return error ? (
    <p id={errorId(name)} className={c.error}>
      {error}
    </p>
  ) : null;
}

type Common = { name: string; error?: string; c: RsvpFormClasses };

export function TextField({
  name,
  label,
  hint,
  error,
  c,
  defaultValue,
  multiline,
  ...input
}: Common & {
  label: string;
  hint?: string;
  defaultValue?: string;
  multiline?: boolean;
  placeholder?: string;
  maxLength: number;
  required?: boolean;
  autoComplete?: string;
}) {
  const shared = {
    id: fieldId(name),
    name,
    defaultValue,
    maxLength: input.maxLength,
    placeholder: input.placeholder,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy(name, error, !!hint),
  };
  return (
    <div className={c.field}>
      <label htmlFor={fieldId(name)} className={c.label}>
        {label}
        {hint && (
          <span id={hintId(name)} className={c.hint}>
            {hint}
          </span>
        )}
      </label>
      {multiline ? (
        <textarea {...shared} rows={3} className={c.textarea} />
      ) : (
        <input {...shared} type="text" required={input.required} autoComplete={input.autoComplete} className={c.input} />
      )}
      <FieldError name={name} error={error} c={c} />
    </div>
  );
}

/** A required or optional single choice, as a row of pill-shaped radios. */
export function ChoiceGroup({
  name,
  legend,
  hint,
  options,
  value,
  onChange,
  required,
  error,
  c,
}: Common & {
  legend: ReactNode;
  hint?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <fieldset className={c.group} aria-describedby={describedBy(name, error, !!hint)}>
      <legend className={c.legend}>
        {legend}
        {hint && (
          <span id={hintId(name)} className={c.hint}>
            {hint}
          </span>
        )}
      </legend>
      <div className={c.choices}>
        {options.map((option) => (
          <label key={option.value} className={c.choice}>
            <input
              type="radio"
              name={name}
              value={option.value}
              required={required}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              data-invalid={error ? true : undefined}
              className={c.choiceInput}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      <FieldError name={name} error={error} c={c} />
    </fieldset>
  );
}

export function AttendanceChoice(props: Common & { value: string; onChange: (value: string) => void }) {
  return (
    <ChoiceGroup
      {...props}
      legend="Will you be joining us?"
      required
      options={[
        { value: "yes", label: "Joyfully Accept" },
        { value: "no", label: "Regretfully Decline" },
      ]}
    />
  );
}

export function MealChoice(props: Common & { options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <ChoiceGroup
      {...props}
      legend="Meal preference"
      hint="(optional)"
      options={props.options.map((option) => ({ value: option, label: option }))}
    />
  );
}

/**
 * Guests on this reply, including the person replying: a native dropdown,
 * 1…max (accessible and easy on phones, where it opens the system picker).
 */
export function GuestCount({
  name,
  max,
  value,
  onChange,
  error,
  c,
}: Common & { max: number; value: string; onChange: (value: string) => void }) {
  const id = fieldId(name);
  return (
    <div className={c.field}>
      <label htmlFor={id} className={c.label}>
        Number of guests
      </label>
      <select
        id={id}
        name={name}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, error, true)}
        className={c.select}
      >
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <p id={hintId(name)} className={c.hint}>
        Including yourself
      </p>
      <FieldError name={name} error={error} c={c} />
    </div>
  );
}
