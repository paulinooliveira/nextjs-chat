import { Chat, Message } from '@/lib/types'
import { BotCard, BotMessage, UserMessage } from '@/components/stocks/message'

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .flatMap((message, index) => renderMessage(message, aiState.chatId, index))
}

const renderMessage = (message: Message, chatId: string, index: number): Array<{ id: string, display: React.ReactNode }> => {
  switch (message.role) {
    case 'user':
      return [{
        id: `${chatId}-${index}`,
        display: <UserMessage>{message.content as string}</UserMessage>
      }]
    case 'assistant':
      if (typeof message.content === 'string') {
        return [{
          id: `${chatId}-${index}`,
          display: <BotMessage content={message.content} />
        }]
      } else if (Array.isArray(message.content)) {
        return message.content.flatMap((part, partIndex) => {
          if (part.type === 'text') {
            return [{
              id: `${chatId}-${index}-text-${partIndex}`,
              display: <BotMessage content={part.text} />
            }]
          } else if (part.type === 'function' && part.function.name === 'gptR') {
            const args = JSON.parse(part.function.arguments)
            return [{
              id: `${chatId}-${index}-function-${partIndex}`,
              display: (
                <BotCard>
                  <BotMessage content={`Executing R code: ${args.rFunction}`} />
                </BotCard>
              )
            }]
          }
          return []
        })
      }
      return []
    case 'function':
      if (message.name === 'gptR') {
        let content = message.content
        try {
          content = JSON.parse(message.content)
        } catch (e) {
          // If parsing fails, use the original content
        }
        return [{
          id: `${chatId}-${index}-function-result`,
          display: (
            <BotCard>
              <BotMessage content={`R execution result: ${JSON.stringify(content, null, 2)}`} />
            </BotCard>
          )
        }]
      }
      return []
    default:
      return []
  }
}