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
4. Confirm the sign-up experience shows links to both pages and a required consent checkbox.
5. Test in a development instance first, including password, OAuth, and SSO sign-up paths that Mitaito enables.
6. After deployment, verify that the URLs resolve to the intended current version and that the sign-up result has a Clerk `legalAcceptedAt` timestamp.

Do not point Clerk at a dated URL for normal sign-up. The stable URL is the right integration point; dated URLs are for historical evidence and review.

## Consent version check in mi-caro

Clerk records `legalAcceptedAt`, not a Terms version or Privacy version. Since both documents use the same effective date, mi-caro can determine the applicable version by comparing the UTC acceptance timestamp with the dated files in the repository.

The check should be based on the current legal release policy. If both documents always share one effective date, mi-caro can compare `legalAcceptedAt` with that date; otherwise, the comparison must be performed independently for Terms and Privacy, which a single Clerk timestamp cannot prove. The application should require re-consent when the accepted timestamp predates the relevant required date. When the user accepts again, update Clerk's `legalAcceptedAt` through the Clerk Backend API. Do not put this audit value in `unsafeMetadata`.

This is an inference from two records, not a complete consent ledger. Preserve the dated documents, PR reviews, merge commits, and deployment records. If a regulator or counsel requires a stronger audit trail, add a dedicated consent-event store later rather than silently treating a timestamp as proof of every detail of the interaction.

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
