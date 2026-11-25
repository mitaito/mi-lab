import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders reviewed legal Markdown without allowing raw HTML or executable URLs.
 * Keep this separate from release notes so legal copy can evolve independently.
 */
export function LegalNotes({ markdown }: { markdown: string }) {
  return (
    <div className="release-notes legal-notes">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) =>
            href?.startsWith("http") ? (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ) : (
              <a href={href}>{children}</a>
            ),
        }}
      >
        {markdown}
      </Markdown>
    </div>
  );
}
