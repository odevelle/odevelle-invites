#!/usr/bin/env node
/*
 * Onboarding: gives a couple access to their Couple Dashboard.
 *
 *   1. Finds the invitation by slug, and the client (couple) it belongs to.
 *   2. Finds or creates the couple's Supabase Auth account for the email they
 *      ordered with. Created already confirmed, and NO email is sent.
 *   3. Links the account to the client (clients.owner_user_id). RLS then lets
 *      the couple read every invitation of that client, and nothing else.
 *   4. Optionally sets the RSVP form's meal options. (The guest limit is the
 *      same 50 for every invitation, not a setting.)
 *   5. Optionally prints a one-time sign-in link to send by WhatsApp, for
 *      when no email provider is set up yet. It's a credential: send it only
 *      to the couple.
 *
 * Public sign-up stays off; this script (and later, the checkout) is the only
 * way couple accounts are made. Dry run unless --apply. Uses the SECRET key,
 * read from the environment and never printed.
 *
 *   node --env-file=.env.local scripts/clients/provision.mjs --invitation chloe-shane --email couple@example.com
 *   node --env-file=.env.local scripts/clients/provision.mjs --invitation chloe-shane --email couple@example.com --apply
 *
 * Options:
 *   --name "Chloe & Shane"     the account's display name (optional)
 *   --meals "Vegetarian,Non-vegetarian"   meal options; --meals "" turns the meal question off
 *   --link                     also print a one-time sign-in link (expires with Supabase's OTP expiry)
 *   --site https://odevelle.com   base URL for that link (default: https://$ROOT_DOMAIN)
 *   --force                    replace a different account already linked to this couple
 */
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : (args[i + 1] ?? "");
};

const apply = flag("apply");
const email = option("email")?.trim().toLowerCase();
const slug = option("invitation")?.trim().toLowerCase();
const name = option("name")?.trim();
const meals = option("meals");
const site = (option("site") ?? `https://${process.env.ROOT_DOMAIN || "odevelle.com"}`).replace(/\/+$/, "");

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) fail("Set SUPABASE_URL and SUPABASE_SECRET_KEY (e.g. node --env-file=.env.local …).");
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) fail("--email: the address the couple ordered with.");
if (!slug || !/^[a-z0-9-]{3,63}$/.test(slug)) fail("--invitation: the invitation's slug, e.g. chloe-shane.");

let mealOptions;
if (meals !== undefined) {
  mealOptions = meals.split(",").map((m) => m.trim()).filter(Boolean);
  if (mealOptions.length > 6 || mealOptions.some((m) => m.length > 40)) fail("--meals: at most 6 options, each up to 40 characters.");
  if (new Set(mealOptions.map((m) => m.toLowerCase())).size !== mealOptions.length) fail("--meals: options must be distinct.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

// 1. The invitation and its couple.
const { data: invitation, error: invitationError } = await supabase
  .from("invitations")
  .select("id, slug, title, status, client_id, clients ( id, display_name, email, owner_user_id )")
  .eq("slug", slug)
  .maybeSingle();
if (invitationError) fail(`Couldn't read invitations: ${invitationError.message}`);
if (!invitation) fail(`No invitation with the slug "${slug}".`);
const client = invitation.clients;

// 2. The account, if it exists already (the Admin API lists users in pages).
async function findUser(address) {
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) fail(`Couldn't list accounts: ${error.message}`);
    const user = data.users.find((u) => u.email?.toLowerCase() === address);
    if (user || data.users.length < 1000) return user;
  }
}
let user = await findUser(email);

console.log(`${new URL(SUPABASE_URL).host}${apply ? "" : "  (dry run: pass --apply to make these changes)"}`);
console.log(`  invitation  ${invitation.title} (${invitation.slug}, ${invitation.status})`);
console.log(`  couple      ${client.display_name}`);
console.log(`  account     ${email}: ${user ? "exists" : "will be created (no email is sent)"}`);

if (client.owner_user_id && user && client.owner_user_id === user.id) {
  console.log("  link        already linked");
} else if (client.owner_user_id && !flag("force")) {
  fail("This couple is already linked to a different account. Re-run with --force to replace it.");
} else {
  console.log(`  link        ${client.owner_user_id ? "replaces the current account" : "links the account to this couple"}`);
}
if (mealOptions) console.log(`  RSVP meals  ${mealOptions.length ? mealOptions.join(", ") : "not asked"}`);

if (!apply) process.exit(0);

// 2b. Create the account: confirmed, no email.
if (!user) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: name ? { full_name: name } : undefined,
  });
  if (error) fail(`Couldn't create the account: ${error.message}`);
  user = data.user;
  console.log("  ✓ account created");
}

// 3. Link it.
if (client.owner_user_id !== user.id) {
  const { error } = await supabase
    .from("clients")
    .update({ owner_user_id: user.id, email: client.email ?? email })
    .eq("id", client.id);
  if (error) fail(`Couldn't link the account: ${error.message}`);
  console.log("  ✓ linked");
}

// 4. Meal options.
if (mealOptions) {
  const { error } = await supabase
    .from("rsvp_settings")
    .upsert({ invitation_id: invitation.id, meal_options: mealOptions }, { onConflict: "invitation_id" });
  if (error) fail(`Couldn't save the meal options: ${error.message}`);
  console.log("  ✓ meal options saved (a published invitation shows them once its cached page refreshes)");
}

// 5. A one-time sign-in link, for sending by hand.
if (flag("link")) {
  const { data, error } = await supabase.auth.admin.generateLink({ type: "magiclink", email });
  if (error) fail(`Couldn't make a sign-in link: ${error.message}`);
  const url = `${site}/auth/confirm?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=magiclink`;
  console.log(`  ✓ one-time sign-in link (send only to the couple):\n    ${url}`);
}

console.log(`Done. The couple signs in at ${site}/login with ${email}.`);
