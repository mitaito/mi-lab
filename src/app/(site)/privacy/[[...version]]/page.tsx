import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/legal/legal-page";
import {
  getCurrentLegal,
  getLegalDocument,
  getLegalDocuments,
  legalPath,
  legalStaticParams,
} from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

type Props = PageProps<"/privacy/[[...version]]">;

export function generateStaticParams() {
  return legalStaticParams("privacy");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const version = (await params).version?.[0];
  const document = version
    ? getLegalDocument("privacy", version)
    : getCurrentLegal("privacy");
  if (!document) return {};

  return pageMetadata({
    title: "Privacy Policy",
    description: `Mitaito Lab Privacy Policy, effective ${document.effectiveDate}.`,
    path: legalPath("privacy", version),
    publishedTime: document.effectiveDate,
  });
}

export default async function PrivacyPage({ params }: Props) {
  const version = (await params).version?.[0];
  const document = version
    ? getLegalDocument("privacy", version)
    : getCurrentLegal("privacy");
  if (!document) notFound();

  return (
    <LegalPage
      kind="privacy"
      document={document}
      versions={getLegalDocuments("privacy")}
    />
  );
}
