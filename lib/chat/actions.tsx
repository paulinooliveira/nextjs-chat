import 'server-only'

import { AI, type AIState, type UIState } from './ai-config'
import { submitUserMessage } from './message-actions'
import { executeRCode } from '../r-execution'
import { getUIStateFromAIState } from './ui-state'
import { Chat, Message } from '@/lib/types'
import { nanoid } from 'nanoid'

export { AI, type AIState, type UIState, submitUserMessage, getUIStateFromAIState }
export type { Chat, Message }

export async function executeR(aiState: AIState, code: string): Promise<AIState> {
  try {
    const result = await executeRCode(code);
    const parsedResult = JSON.parse(result);

    const newMessage: Message = {
      id: nanoid(),
      role: 'assistant',
      content: `R Execution Result:\n${parsedResult.result}\n\nConsole Output:\n${parsedResult.console}\n\nFiles Processed:\n${parsedResult.files}`
    };

    return {
      ...aiState,
      messages: [...aiState.messages, newMessage]
    };
  } catch (error) {
    const errorMessage: Message = {
      id: nanoid(),
      role: 'assistant',
      content: `Error executing R code: ${error.message}`
    };

    return {
      ...aiState,
      messages: [...aiState.messages, errorMessage]
    };
  }
}

// Add any other necessary functions or exports here