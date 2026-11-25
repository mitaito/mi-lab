import Link from "next/link";
import { LegalNotes } from "@/components/legal/legal-notes";
import type { LegalDocument, LegalKind } from "@/lib/legal";
import { legalPath } from "@/lib/legal";

const labels: Record<LegalKind, { title: string; other: LegalKind }> = {
  terms: { title: "Terms of Service", other: "privacy" },
  privacy: { title: "Privacy Policy", other: "terms" },
};

export function LegalPage({
  kind,
  document,
  versions,
}: {
  kind: LegalKind;
  document: LegalDocument;
  versions: LegalDocument[];
}) {
  const label = labels[kind];
  const otherLabel = labels[label.other].title;

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-space-md py-space-xl">
      <header className="flex flex-col gap-space-sm border-b border-surface-container-highest/40 pb-space-lg">
        <p className="font-mono text-label-sm uppercase tracking-[0.12em] text-secondary">
          Mitaito Lab · Legal
        </p>
        <h1 className="text-headline-lg text-primary">{label.title}</h1>
        <div className="flex flex-wrap items-center gap-x-space-md gap-y-space-xs font-mono text-label-md text-outline">
          <span>Version {document.version}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={document.effectiveDate}>
            Effective {document.effectiveDate.replaceAll("-", ".")}
          </time>
          {document.status === "draft" ? (
            <span className="rounded-xs border border-tertiary/50 px-space-xs py-0.5 text-tertiary">
              Draft for review
            </span>
          ) : null}
        </div>
      </header>

      <LegalNotes markdown={document.body} />

      <footer className="flex flex-col gap-space-md border-t border-surface-container-highest/40 pt-space-md font-mono text-label-md text-outline">
        <nav aria-label="Legal documents" className="flex flex-wrap gap-x-space-md gap-y-space-xs">
          <Link className="text-primary underline underline-offset-4 hover:text-secondary" href={legalPath(kind)}>
            Current {label.title}
          </Link>
          <Link className="text-primary underline underline-offset-4 hover:text-secondary" href={legalPath(label.other)}>
            {otherLabel}
          </Link>
          <a
            className="text-primary underline underline-offset-4 hover:text-secondary"
            href="https://github.com/mitaito/mi-lab/tree/main/content/legal"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source history
          </a>
        </nav>
        <details>
          <summary className="cursor-pointer text-primary hover:text-secondary">
            Earlier versions ({Math.max(versions.length - 1, 0)})
          </summary>
          <ul className="mt-space-sm flex flex-col gap-space-xs pl-space-md">
            {versions.slice(1).map((version) => (
              <li key={version.version}>
                <Link
                  className="underline underline-offset-4 hover:text-secondary"
                  href={legalPath(kind, version.version)}
                >
                  {version.version} — {version.status}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      </footer>
    </article>
  );
}
