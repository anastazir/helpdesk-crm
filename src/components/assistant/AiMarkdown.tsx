import type { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

interface AiMarkdownProps {
  content: string
  className?: string
}

const text = (children: ReactNode) => (
  <span className="text-sm leading-6 text-foreground">{children}</span>
)

const AiMarkdown = ({ content, className }: AiMarkdownProps) => (
  <div className={cn('ai-markdown min-w-0 max-w-full text-sm leading-6', className)}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      components={{
        h1: ({ children }) => (
          <h2 className="mb-2 mt-4 text-lg font-semibold text-foreground">
            {children}
          </h2>
        ),
        h2: ({ children }) => (
          <h3 className="mb-2 mt-4 text-base font-semibold text-foreground">
            {children}
          </h3>
        ),
        h3: ({ children }) => (
          <h4 className="mb-1.5 mt-3 text-sm font-semibold text-foreground">
            {children}
          </h4>
        ),
        p: ({ children }) => (
          <p className="mb-2 whitespace-pre-wrap break-words last:mb-0">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="mb-2 ml-5 list-disc space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 ml-5 list-decimal space-y-1">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="break-words">{children}</li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ children }) => (
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="mb-3 max-w-full overflow-x-auto rounded-lg border border-border bg-muted p-3 text-xs">
            {children}
          </pre>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline underline-offset-2"
          >
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-2 border-l-2 border-primary/40 pl-3 text-muted-foreground">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="mb-3 w-full max-w-full overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-muted/60">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-border">{children}</tbody>
        ),
        tr: ({ children }) => (
          <tr className="border-b border-border last:border-0">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="max-w-[18rem] px-3 py-2 align-top text-sm">
            {text(children)}
          </td>
        ),
        hr: () => <hr className="my-4 border-border" />,
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
)

export default AiMarkdown
