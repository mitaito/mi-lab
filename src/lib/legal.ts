import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { parseFrontMatter } from "./content/frontmatter";

export const LEGAL_KINDS = ["terms", "privacy"] as const;
export type LegalKind = (typeof LEGAL_KINDS)[number];

const VERSION_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const legalFrontMatterSchema = z.strictObject({
  title: z.string().trim().min(1),
  effectiveDate: z.string().regex(VERSION_PATTERN),
  status: z.enum(["draft", "published"]),
});

type LegalFrontMatter = z.infer<typeof legalFrontMatterSchema>;

export interface LegalDocument extends LegalFrontMatter {
  kind: LegalKind;
  version: string;
  body: string;
}

const contentDir = () =>
  process.env.CONTENT_DIR ?? path.join(process.cwd(), "content");

function isRealDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function describe(kind: LegalKind, file: string, reason: string): never {
  throw new Error(`Invalid legal document ${kind}/${file}: ${reason}`);
}

function readLegalDocument(kind: LegalKind, fileName: string): LegalDocument {
  const filePath = path.join(contentDir(), "legal", kind, fileName);
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = parseFrontMatter(raw);
  if (!parsed) describe(kind, fileName, "missing front-matter");

  const result = legalFrontMatterSchema.safeParse(parsed.data);
  if (!result.success) {
    describe(
      kind,
      fileName,
      result.error.issues.map((issue) => issue.message).join("; "),
    );
  }

  const version = fileName.slice(0, -3);
  if (!VERSION_PATTERN.test(version) || !isRealDate(version)) {
    describe(kind, fileName, "file name must be a real date like 2026-11-25.md");
  }
  if (result.data.effectiveDate !== version) {
    describe(kind, fileName, "effectiveDate must match the file name");
  }
  if (!isRealDate(result.data.effectiveDate)) {
    describe(kind, fileName, "effectiveDate must be a real calendar date");
  }

  return {
    kind,
    version,
    ...result.data,
    body: parsed.content.trim(),
  };
}

/** Returns immutable legal versions, newest effective date first. */
export function getLegalDocuments(kind: LegalKind): LegalDocument[] {
  const directory = path.join(contentDir(), "legal", kind);
  if (!fs.existsSync(directory)) {
    throw new Error(`Missing legal content directory: content/legal/${kind}`);
  }

  const files = fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .toSorted();

  return files
    .map((fileName) => readLegalDocument(kind, fileName))
    .toSorted((a, b) => b.version.localeCompare(a.version));
}

/** The latest dated document in the repository.
 *
 * The site is statically built, so "current" is the newest file included in
 * that deployment. Publish a new file and redeploy on or after its effective
 * date; this keeps the selection deterministic and avoids request-time clock
 * access during Next.js prerendering.
 */
export function getCurrentLegal(kind: LegalKind): LegalDocument {
  const current = getLegalDocuments(kind)[0];
  if (!current) {
    throw new Error(`No legal document exists for ${kind}`);
  }
  return current;
}

export function getLegalDocument(
  kind: LegalKind,
  version: string,
): LegalDocument | undefined {
  return getLegalDocuments(kind).find((document) => document.version === version);
}

export function legalStaticParams(kind: LegalKind): { version: string[] }[] {
  return [
    { version: [] },
    ...getLegalDocuments(kind).map((document) => ({ version: [document.version] })),
  ];
}

export function legalPath(kind: LegalKind, version?: string): string {
  return version ? `/${kind}/${version}` : `/${kind}`;
}
