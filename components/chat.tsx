'use client'

import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { useEffect } from 'react'
import { useUIState, useAIState, useActions } from 'ai/rsc'
import { Message, Session } from '@/lib/types'
import { usePathname, useRouter } from 'next/navigation'
import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor'
import { toast } from 'sonner'
import { AI } from '@/lib/chat/actions'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
  session?: Session
  missingKeys: string[]
}

export function Chat({ id, className, session, missingKeys }: ChatProps) {
  const router = useRouter()
  const path = usePathname()
  const [uiState, setUIState] = useUIState<typeof AI>()
  const [aiState] = useAIState<typeof AI>()
  const { submitUserMessage } = useActions<typeof AI>()

  const [_, setNewChatId] = useLocalStorage('newChatId', id)

  const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } =
    useScrollAnchor()

  useEffect(() => {
    if (session?.user) {
      if (path && !path.includes('chat') && uiState.messages.length === 1) {
        window.history.replaceState({}, '', `/chat/${id}`)
      }
    }
  }, [id, path, session?.user, uiState.messages])

  const handleSubmit = async (content: string) => {
    try {
      await submitUserMessage(content)
    } catch (error) {
      toast.error('An error occurred while sending the message.')
    }
    scrollToBottom()
  }

  return (
    <div
      className={cn('group w-full overflow-auto pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]', className)}
      ref={scrollRef}
    >
      <div className={cn('pb-[200px] pt-4 md:pt-10')} ref={messagesRef}>
        {uiState.messages.length ? (
          <ChatList
            messages={uiState.messages as Message[]}
            session={session}
            isShared={false}
          />
        ) : (
          <EmptyScreen />
        )}
        <div className="w-full h-px" ref={visibilityRef} />
      </div>
      <ChatPanel
        id={id}
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
