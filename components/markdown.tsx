"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

/**
 * Renders skill/context text as formatted Markdown, styled with the app's
 * design tokens. Used wherever a saved skill or context is opened for reading
 * so long-form guidance (headings, tables, lists, emphasis) is easy to scan.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="ds-markdown text-sm leading-relaxed text-graphite">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-2 mt-4 text-base font-bold tracking-tight text-graphite first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-4 text-sm font-bold tracking-tight text-graphite first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-1.5 mt-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-gray-4 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-1 mt-3 text-sm font-semibold text-graphite first:mt-0">{children}</h4>
          ),
          p: ({ children }) => <p className="mb-3 leading-relaxed last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-3 flex list-disc flex-col gap-1 pl-5 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 flex list-decimal flex-col gap-1 pl-5 last:mb-0">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-graphite">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-racing-green underline underline-offset-2 hover:text-racing-green-light"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-2 border-gray-3 pl-3 text-gray-4 last:mb-0">
              {children}
            </blockquote>
          ),
          code: ({ className, children }) => {
            const isBlock = (className ?? "").includes("language-")
            if (isBlock) {
              return (
                <code className="block whitespace-pre-wrap break-words font-mono text-[12px] text-graphite">
                  {children}
                </code>
              )
            }
            return (
              <code className="border border-gray-2 bg-gray-1 px-1 py-0.5 font-mono text-[12px] text-graphite">
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="ds-scroll mb-3 overflow-x-auto border border-gray-2 bg-gray-1 p-3 last:mb-0">
              {children}
            </pre>
          ),
          hr: () => <hr className="my-4 border-gray-2" />,
          table: ({ children }) => (
            <div className="ds-scroll mb-3 overflow-x-auto border border-gray-2 last:mb-0">
              <table className="w-full border-collapse text-[13px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-gray-1">{children}</thead>,
          th: ({ children }) => (
            <th className="border border-gray-2 px-2.5 py-1.5 text-left font-semibold text-graphite">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-2 px-2.5 py-1.5 align-top text-graphite">
              {children}
            </td>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
