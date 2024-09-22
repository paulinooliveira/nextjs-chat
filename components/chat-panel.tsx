import * as React from 'react'
import { Button } from '@/components/ui/button'
import { PromptForm } from '@/components/prompt-form'
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom'
import { IconShare } from '@/components/ui/icons'
import { FooterText } from '@/components/footer'
import { ChatShareDialog } from '@/components/chat-share-dialog'

export interface ChatPanelProps {
  id?: string
  isAtBottom: boolean
  scrollToBottom: () => void
  onSubmit: (value: string) => Promise<void>
}

export function ChatPanel({
  id,
  isAtBottom,
  scrollToBottom,
  onSubmit
}: ChatPanelProps) {
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false)

  return (
    <div className="fixed inset-x-0 bottom-0 w-full bg-gradient-to-b from-muted/30 from-0% to-muted/30 to-50% duration-300 ease-in-out animate-in dark:from-background/10 dark:from-10% dark:to-background/80 peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
      <ButtonScrollToBottom
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
      />

      <div className="mx-auto sm:max-w-2xl sm:px-4">
        {id && (
          <div className="flex h-12 items-center justify-center">
            <div className="flex space-x-2">
              <Button
                onClick={() => setShareDialogOpen(true)}
              >
                <IconShare className="mr-2" />
                Share
              </Button>
              <ChatShareDialog
                open={shareDialogOpen}
                onOpenChange={setShareDialogOpen}
                onCopy={() => setShareDialogOpen(false)}
                shareChat={() => {}}
                chat={{
                  id,
                  title: 'Chat',
                  messages: []
                }}
              />
            </div>
          </div>
        )}

        <div className="space-y-4 border-t bg-background px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-4">
          <PromptForm onSubmit={onSubmit} />
          <FooterText className="hidden sm:block" />
        </div>
      </div>
    </div>
  )
}
