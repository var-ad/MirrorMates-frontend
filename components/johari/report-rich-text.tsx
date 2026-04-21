import type { ReactNode } from "react";

type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

function normalizeReportText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(
      /###\s([A-Za-z][A-Za-z ()&+\/-]{1,64})\s(?=[A-Z])/g,
      "### $1\n",
    )
    .trim();
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const boldRegex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match = boldRegex.exec(text);

  while (match) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    nodes.push(
      <strong key={`bold-${match.index}`} className="font-semibold text-[var(--text)]">
        {match[1]}
      </strong>,
    );

    lastIndex = match.index + match[0].length;
    match = boldRegex.exec(text);
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function parseBlocks(rawText: string): Block[] {
  const text = normalizeReportText(rawText);
  const lines = text.split("\n");
  const blocks: Block[] = [];

  let paragraphLines: string[] = [];
  let unorderedItems: string[] = [];
  let orderedItems: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      blocks.push({
        type: "paragraph",
        text: paragraphLines.join(" ").trim(),
      });
      paragraphLines = [];
    }
  };

  const flushUnordered = () => {
    if (unorderedItems.length > 0) {
      blocks.push({ type: "ul", items: unorderedItems });
      unorderedItems = [];
    }
  };

  const flushOrdered = () => {
    if (orderedItems.length > 0) {
      blocks.push({ type: "ol", items: orderedItems });
      orderedItems = [];
    }
  };

  for (const sourceLine of lines) {
    const line = sourceLine.trim();

    if (!line) {
      flushParagraph();
      flushUnordered();
      flushOrdered();
      continue;
    }

    const headingMatch = line.match(/^###\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushUnordered();
      flushOrdered();
      blocks.push({ type: "heading", text: headingMatch[1].trim() });
      continue;
    }

    const unorderedMatch = line.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      flushParagraph();
      flushOrdered();
      unorderedItems.push(unorderedMatch[1].trim());
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      flushUnordered();
      orderedItems.push(orderedMatch[1].trim());
      continue;
    }

    flushUnordered();
    flushOrdered();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushUnordered();
  flushOrdered();

  return blocks;
}

export function ReportRichText({ text }: { text: string }) {
  const blocks = parseBlocks(text);

  return (
    <div className="space-y-4 text-[var(--text)]">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h3
              key={`heading-${index}`}
              className="pt-2 font-[var(--font-display)] text-2xl tracking-[-0.02em] text-[var(--text)]"
            >
              {renderInline(block.text)}
            </h3>
          );
        }

        if (block.type === "ul") {
          return (
            <ul
              key={`ul-${index}`}
              className="list-disc space-y-2 pl-6 text-base leading-8 text-[var(--text-muted)]"
            >
              {block.items.map((item, itemIndex) => (
                <li key={`ul-item-${index}-${itemIndex}`}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "ol") {
          return (
            <ol
              key={`ol-${index}`}
              className="list-decimal space-y-2 pl-6 text-base leading-8 text-[var(--text-muted)]"
            >
              {block.items.map((item, itemIndex) => (
                <li key={`ol-item-${index}-${itemIndex}`}>{renderInline(item)}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={`p-${index}`} className="text-base leading-8 text-[var(--text-muted)]">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
