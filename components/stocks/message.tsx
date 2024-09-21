// This directive ensures the file is treated as a client-side module in Next.js
'use client'

// Importing necessary components, utilities, and libraries
import { IconOpenAI, IconUser } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { spinner } from './spinner'
import { CodeBlock } from '../ui/codeblock'
import { MemoizedReactMarkdown } from '../markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { StreamableValue } from 'ai/rsc'
import { useStreamableText } from '@/lib/hooks/use-streamable-text'

// The following components represent different types of message bubbles in the chat interface

// UserMessage: Displays messages from the user
// Props:
// - children: React.ReactNode - The content of the message
export function UserMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="group relative flex items-start md:-ml-12">
      {/* User icon */}
      <div className="flex size-[25px] shrink-0 select-none items-center justify-center rounded-md border bg-background shadow-sm">
        <IconUser />
      </div>
      {/* Message content */}
      <div className="ml-4 flex-1 space-y-2 overflow-hidden pl-2">
        {children}
      </div>
    </div>
  )
}

// BotMessage: Displays messages from the AI bot
// Props:
// - content: string | StreamableValue<string> - The message content, which can be a string or a streamable value
// - className?: string - Optional CSS class for additional styling
export function BotMessage({
  content,
  className
}: {
  content: string | StreamableValue<string>
  className?: string
}) {
  // Hook to handle streaming text content
  const text = useStreamableText(content)

  return (
    <div className={cn('group relative flex items-start md:-ml-12', className)}>
      {/* Bot icon */}
      <div className="flex size-[24px] shrink-0 select-none items-center justify-center rounded-md border bg-primary text-primary-foreground shadow-sm">
        <IconOpenAI />
      </div>
      {/* Message content with Markdown support */}
      <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
        <MemoizedReactMarkdown
          className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
          remarkPlugins={[remarkGfm, remarkMath]} // Add support for GitHub Flavored Markdown and math
          components={{
            // Custom rendering for different markdown elements
            p({ children }) {
              return <p className="mb-2 last:mb-0">{children}</p>
            },
            code({ node, inline, className, children, ...props }) {
              // Handle code blocks and inline code
              if (children.length) {
                if (children[0] == '▍') {
                  return (
                    <span className="mt-1 animate-pulse cursor-default">▍</span>
                  )
                }

                children[0] = (children[0] as string).replace('`▍`', '▍')
              }

              const match = /language-(\w+)/.exec(className || '')

              if (inline) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }

              // Use CodeBlock component for non-inline code
              return (
                <CodeBlock
                  key={Math.random()}
                  language={(match && match[1]) || ''}
                  value={String(children).replace(/\n$/, '')}
                  {...props}
                />
              )
            }
          }}
        >
          {text}
        </MemoizedReactMarkdown>
      </div>
    </div>
  )
}

// BotCard: A container for bot-related content, similar to BotMessage but with more flexibility
// Props:
// - children: React.ReactNode - The content to be displayed
// - showAvatar?: boolean - Whether to show the bot avatar (default: true)
export function BotCard({
  children,
  showAvatar = true
}: {
  children: React.ReactNode
  showAvatar?: boolean
}) {
  return (
    <div className="group relative flex items-start md:-ml-12">
      {/* Bot icon, conditionally rendered based on showAvatar prop */}
      <div
        className={cn(
          'flex size-[24px] shrink-0 select-none items-center justify-center rounded-md border bg-primary text-primary-foreground shadow-sm',
          !showAvatar && 'invisible'
        )}
      >
        <IconOpenAI />
      </div>
      {/* Card content */}
      <div className="ml-4 flex-1 pl-2">{children}</div>
    </div>
  )
}

// SystemMessage: Displays system messages or notifications
// Props:
// - children: React.ReactNode - The content of the system message
export function SystemMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={
        'mt-2 flex items-center justify-center gap-2 text-xs text-gray-500'
      }
    >
      <div className={'max-w-[600px] flex-initial p-2'}>{children}</div>
    </div>
  )
}

// SpinnerMessage: Displays a loading spinner, typically used while waiting for a response
export function SpinnerMessage() {
  return (
    <div className="group relative flex items-start md:-ml-12">
      {/* Bot icon */}
      <div className="flex size-[24px] shrink-0 select-none items-center justify-center rounded-md border bg-primary text-primary-foreground shadow-sm">
        <IconOpenAI />
      </div>
      {/* Spinner */}
      <div className="ml-4 h-[24px] flex flex-row items-center flex-1 space-y-2 overflow-hidden px-1">
        {spinner}
      </div>
    </div>
  )
}

// Notes on React and TypeScript concepts used:
// 1. Function Components: All components in this file are function components, a modern way to write React components.
// 2. Props: Components use destructured props with TypeScript types for type safety.
// 3. Children prop: Many components use the 'children' prop, which allows passing JSX as content to the component.
// 4. Conditional rendering: The BotCard component uses conditional rendering with the showAvatar prop.
// 5. Custom hooks: The BotMessage component uses a custom hook 'useStreamableText' for handling streaming content.
// 6. TypeScript types: Props are typed using TypeScript interfaces or inline types for better type checking.
// 7. Markdown rendering: The BotMessage component uses a custom Markdown renderer with plugins for advanced formatting.

// Libraries and utilities used:
// - cn: A utility function for conditionally joining classNames.
// - MemoizedReactMarkdown: A memoized version of ReactMarkdown for efficient rendering of Markdown content.
// - remarkGfm and remarkMath: Plugins for the Markdown renderer to support GitHub Flavored Markdown and math expressions.
// - StreamableValue: A type from the 'ai/rsc' library, likely used for handling streaming responses.
// - useStreamableText: A custom hook for managing streamable text content.

// The components in this file are designed to be used together to create a chat interface,
// with different message types (user, bot, system) and supporting features like code highlighting and loading indicators.
