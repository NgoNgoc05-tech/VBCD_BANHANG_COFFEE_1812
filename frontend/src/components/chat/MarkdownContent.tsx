import { Fragment } from "react"

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="rounded bg-black/5 px-1 py-0.5 text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      )
    }
    return <Fragment key={index}>{part}</Fragment>
  })
}

export default function MarkdownContent({ content }: { content: string }) {
  const blocks: Array<{
    type: "paragraph" | "list" | "heading"
    lines: string[]
    level?: number
  }> = []
  let listItems: string[] = []

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: "list", lines: listItems })
      listItems = []
    }
  }

  for (const line of content.split(/\r?\n/)) {
    const heading = line.match(/^\s{0,3}(#{1,3})\s+(.+)$/)
    if (heading) {
      flushList()
      blocks.push({
        type: "heading",
        lines: [heading[2]],
        level: heading[1].length,
      })
      continue
    }
    const listItem = line.match(/^\s*[-*]\s+(.+)$/)
    if (listItem) {
      listItems.push(listItem[1])
      continue
    }
    flushList()
    if (line.trim()) {
      blocks.push({ type: "paragraph", lines: [line] })
    }
  }
  flushList()

  return (
    <div className="space-y-2 break-words">
      {blocks.map((block, index) =>
        block.type === "list" ? (
          <ul key={index} className="list-disc space-y-1 pl-5">
            {block.lines.map((line, itemIndex) => (
              <li key={itemIndex}>{renderInline(line)}</li>
            ))}
          </ul>
        ) : block.type === "heading" ? (
          <h3
            key={index}
            className={block.level === 1 ? "text-base font-semibold" : "font-semibold"}
          >
            {renderInline(block.lines[0])}
          </h3>
        ) : (
          <p key={index}>{renderInline(block.lines[0])}</p>
        )
      )}
    </div>
  )
}
