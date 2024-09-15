import { Chat } from '@/lib/types'
import { BotCard, BotMessage, UserMessage } from '@/components/stocks/message'

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'tool' ? (
          message.content.map(tool => {
            return tool.toolName === 'gptR' ? (
              <BotCard key={`${aiState.chatId}-${index}-${tool.toolCallId}`}>
                {/* TODO: Infer types based on the tool result*/}
                <BotMessage content={`Executed R code result: ${tool.result}`} />
              </BotCard>
            ) : null
          })
        ) : message.role === 'user' ? (
          <UserMessage>{message.content as string}</UserMessage>
        ) : message.role === 'assistant' &&
          typeof message.content === 'string' ? (
          <BotMessage content={message.content} />
        ) : null
    }))
}