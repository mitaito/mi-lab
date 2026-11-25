# Legal documents and Clerk setup

This repository keeps the Terms of Service and Privacy Policy as dated Markdown files. The pages are public, reviewable in GitHub, and rendered by the same Next.js site as the rest of Mitaito Lab.

> Set `status: published` only after a version has been reviewed. A `draft` version still renders, with a "Draft for review" badge.

## Files and URLs

```text
content/legal/terms/2026-11-25.md
content/legal/privacy/2026-11-25.md
```

The date is the effective-date/version identifier. The front matter `effectiveDate` must exactly match the filename. Never edit or delete a version after it has been published; add a new dated file instead.

Public URLs:

- `https://mitaito.com/terms` — current Terms at the time of the last deployment
- `https://mitaito.com/privacy` — current Privacy Policy at the time of the last deployment
- `https://mitaito.com/terms/2026-11-25` — immutable dated Terms page
- `https://mitaito.com/privacy/2026-11-25` — immutable dated Privacy Policy page

The site also exposes an earlier-version list and a link to the public repository history on each page.

## Publishing a new version

1. Create a branch and add one new file for each document that changes:

   ```text
   content/legal/terms/YYYY-MM-DD.md
   content/legal/privacy/YYYY-MM-DD.md
   ```

2. Set `effectiveDate` to the same `YYYY-MM-DD` value. Use UTC and choose a date on which the change is intended to take effect.
3. Keep the old files unchanged. Do not reuse a date for a different document text.
4. Run `pnpm lint`, `pnpm test`, and `pnpm build`.
5. Open a GitHub PR. Require review from the designated legal/product owner before merging.
6. Deploy on or after the effective date. Because the site is statically prerendered, the bare `/terms` and `/privacy` routes select the newest dated document included in that deployment; a future-dated file must not be deployed before its effective date. A new version does not switch without a deployment.

Minor edits that do not change the legal meaning can be made in a new version if an audit-friendly record is more important than avoiding a new consent date. For a material change, always use a new effective date and require re-consent where applicable.

## Clerk Dashboard configuration

Use the shared Clerk instance for all Mitaito products.

1. Open the Clerk Dashboard and select the shared production instance.
2. Open **Legal** / **Compliance** settings.
3. Set:
   - **Terms of Service URL:** `https://mitaito.com/terms`
   - **Privacy Policy URL:** `https://mitaito.com/privacy`
   - Enable **Require express consent to legal documents**.
   - If using Clerk prebuilt components, also set their appearance options `termsPageUrl` and `privacyPageUrl` to the same two URLs if the Dashboard configuration does not populate them automatically.
4. Allow users to delete their own account, so the **Delete account** section appears in the Clerk user profile (`<UserProfile />` and the Account Portal). This is the `delete_self_enabled` user setting; the Privacy Policy tells users they can delete their account there. Deleting in Clerk removes only the Clerk user: each app must also delete its own data, see [Account deletion across apps](#account-deletion-across-apps).
5. Confirm the sign-up experience shows links to both pages and a required consent checkbox.
6. Test in a development instance first, including password, OAuth, and SSO sign-up paths that Mitaito enables.
7. After deployment, verify that the URLs resolve to the intended current version and that the sign-up result has a Clerk `legalAcceptedAt` timestamp.

Do not point Clerk at a dated URL for normal sign-up. The stable URL is the right integration point; dated URLs are for historical evidence and review.

## Consent version check in mi-caro

Clerk records `legalAcceptedAt`, not a Terms version or Privacy version. Since both documents use the same effective date, mi-caro can determine the applicable version by comparing the UTC acceptance timestamp with the dated files in the repository.

The check should be based on the current legal release policy. If both documents always share one effective date, mi-caro can compare `legalAcceptedAt` with that date; otherwise, the comparison must be performed independently for Terms and Privacy, which a single Clerk timestamp cannot prove. The application should require re-consent when the accepted timestamp predates the relevant required date. When the user accepts again, update Clerk's `legalAcceptedAt` through the Clerk Backend API. Do not put this audit value in `unsafeMetadata`.

This is an inference from two records, not a complete consent ledger. Preserve the dated documents, PR reviews, merge commits, and deployment records. If a regulator or counsel requires a stronger audit trail, add a dedicated consent-event store later rather than silently treating a timestamp as proof of every detail of the interaction.

## Account deletion across apps

The Privacy Policy promises that deleting an account deletes the account **and all product data linked to it**, with backups expiring within 7 days. Clerk only deletes its own user record, so every Mitaito app that stores user data must delete that data itself when the user is deleted. This applies whether the user deletes the account from their profile or an admin deletes it in the Clerk Dashboard.

### One webhook endpoint per app

Each app registers its own endpoint in the Clerk Dashboard, under **Webhooks**, subscribed to `user.deleted`. Clerk delivers webhooks through Svix, which sends the same event to every subscribed endpoint:

```text
Clerk -- user.deleted --+--> https://caro.mitaito.com/api/webhooks/clerk -> deletes mi-caro data
       (Svix fan-out)   +--> https://<app>.mitaito.com/api/webhooks/clerk -> deletes that app's data
                        +--> ...
```

Why one endpoint per app, rather than a central receiver that forwards events:

- Apps fail independently. Svix retries each endpoint on its own schedule, so one app being down only delays that app's deletion.
- Each app knows its own schema and deletes its own data. Nothing central has to know every app's tables.
- Adding an app is adding one endpoint in the Dashboard. No other code changes.

A central receiver with a queue or event bus is worth it only with many apps or more complex event processing; at the current scale it adds a service to run and a shared point of failure.

### Requirements for every app's handler

1. **Verify the signature** with Clerk's `verifyWebhook()`. Each endpoint has its own signing secret; store it as that app's secret, never in this public repository.
2. **Be idempotent.** Clerk delivers at least once, so the same event can arrive more than once. A delete keyed by the Clerk user ID (`DELETE ... WHERE user_id = ?`) already is.
3. **Return `2xx` only after the data is deleted.** A `4xx` or `5xx` response, or none, makes Svix retry the event.
4. **Never recreate a deleted user.** If a `user.created` or `user.updated` event arrives after `user.deleted` (events can arrive out of order), ignore it. `user.deleted` has no `updated_at`; compare the event's top-level `timestamp` instead.

The endpoint must be reachable from the internet. Optionally, accept requests only from [Svix's webhook IPs](https://docs.svix.com/webhook-ips.json).

### Reconciliation job

Webhooks can still be missed: an app down longer than the Svix retry window, or an app added after a user was deleted. Each app should also run a scheduled job (for example daily) that checks the Clerk user IDs in its database against Clerk and deletes the data of users that no longer exist. This keeps the Privacy Policy promise true even when a webhook is lost.

### Checklist for a new app

- [ ] Webhook endpoint in the Clerk Dashboard, subscribed to `user.deleted`
- [ ] Signing secret stored as the app's secret
- [ ] Handler verifies the signature, deletes all data for the user ID, and returns `2xx` when done
- [ ] Repeated and out-of-order events are handled (requirements 2 and 4)
- [ ] Reconciliation job scheduled
- [ ] Backups of the app's data expire within 7 days, as the Privacy Policy states
- [ ] Tested in the development instance: delete a test user, confirm its data is gone

## Required legal review before production

At minimum, fill in and verify:

- the operator's legal name, address, jurisdiction, and contact details;
- which products require accounts and exactly what each product stores;
- Clerk and every other processor/provider, their purposes, locations, and privacy links;
- analytics, cookies, logs, IP handling, and retention periods;
- AI/integration providers and whether user content is sent to them;
- international-transfer mechanisms and regional rights;
- age/children rules;
- deletion, access, correction, and account-closure workflows; and
- the governing-law, liability, and dispute language.
