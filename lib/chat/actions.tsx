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

    console.log('Parsed R execution result:', parsedResult);

    if (parsedResult.error) {
      throw new Error(parsedResult.error);
    }

    const outputVariableName = Object.keys(parsedResult).find(key => key !== 'console' && key !== 'files');
    const rOutput = outputVariableName ? parsedResult[outputVariableName] : 'No output';

    const newMessage: Message = {
      id: nanoid(),
      role: 'assistant',
      content: `R Execution Result:\n${JSON.stringify(rOutput, null, 2)}\n\nConsole Output:\n${parsedResult.console}\n\nFiles Processed:\n${parsedResult.files}`
    };

    console.log('New message content:', newMessage.content);

    return {
      ...aiState,
      messages: [...aiState.messages, newMessage]
    };
  } catch (error) {
    console.error('Error in executeR:', error);
    const errorMessage: Message = {
      id: nanoid(),
      role: 'assistant',
      content: `Error executing R code: ${error instanceof Error ? error.message : 'An unknown error occurred'}`
    };

    return {
      ...aiState,
      messages: [...aiState.messages, errorMessage]
    };
  }
}

// Add any other necessary functions or exports here