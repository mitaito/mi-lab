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

type Props = PageProps<"/terms/[[...version]]">;

export function generateStaticParams() {
  return legalStaticParams("terms");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const version = (await params).version?.[0];
  const document = version
    ? getLegalDocument("terms", version)
    : getCurrentLegal("terms");
  if (!document) return {};

  return pageMetadata({
    title: "Terms of Service",
    description: `Mitaito Lab Terms of Service, effective ${document.effectiveDate}.`,
    path: legalPath("terms", version),
    publishedTime: document.effectiveDate,
  });
}

export default async function TermsPage({ params }: Props) {
  const version = (await params).version?.[0];
  const document = version
    ? getLegalDocument("terms", version)
    : getCurrentLegal("terms");
  if (!document) notFound();

  return (
    <LegalPage
      kind="terms"
      document={document}
      versions={getLegalDocuments("terms")}
    />
  );
}
