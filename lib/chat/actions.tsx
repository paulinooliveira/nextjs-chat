'use server';

import { createAI, getMutableAIState, streamUI } from 'ai/rsc';
import { openai } from '@ai-sdk/openai';
import { ReactNode } from 'react';
import { z } from 'zod';
import { Message as AIMessage } from 'ai';
import { BotMessage } from '@/components/chat/message';
import { executeRCode } from '@/lib/functions/r-execution';
import { createVegaLiteChart } from '@/lib/functions/vega-lite';
import { createD3Chart } from '@/lib/functions/d3-charts';
import { createLeafletMap } from '@/lib/functions/leaflet-maps';
import { performWebScraping } from '@/lib/functions/web-scraping';
import { processData } from '@/lib/functions/data-processing';
import { nanoid } from 'nanoid';

export interface AIState {
  messages: AIMessage[];
}

export interface UIState {
  messages: AIMessage[];
}

export const AI = createAI({
  actions: {
    submitUserMessage: async (content: string): Promise<void> => {
      const aiState = getMutableAIState<AIState>();
      aiState.update((draft: AIState) => {
        draft.messages.push({
          id: nanoid(),
          role: 'user',
          content,
        });
      });

      await streamUI({
        model: openai('gpt-4-turbo'),
        messages: [
          ...aiState.get().messages,
          { role: 'user', content }
        ],
        text: ({ content, done }) => {
          if (done) {
            aiState.update((draft: AIState) => {
              draft.messages.push({
                id: nanoid(),
                role: 'assistant',
                content,
              });
            });
          }
          return <BotMessage content={content} />;
        },
        tools: {
          executeR: {
            description: 'Execute R code',
            parameters: z.object({ code: z.string() }),
            generate: async ({ code }): Promise<ReactNode> => {
              const result = await executeRCode(code);
              const parsedResult = JSON.parse(result);
              
              if (parsedResult.error) {
                throw new Error(parsedResult.error);
              }

              const outputVariableName = Object.keys(parsedResult).find(key => key !== 'console' && key !== 'files');
              const rOutput = outputVariableName ? parsedResult[outputVariableName] : 'No output';

              const content = `R Execution Result:\n${JSON.stringify(rOutput, null, 2)}\n\nConsole Output:\n${parsedResult.console}\n\nFiles Processed:\n${parsedResult.files}`;

              aiState.update((draft: AIState) => {
                draft.messages.push({
                  id: nanoid(),
                  role: 'assistant',
                  content,
                });
              });
              return <BotMessage content={content} />;
            },
          },
          createVegaLiteChart: {
            description: 'Create a Vega-Lite chart',
            parameters: z.object({ spec: z.any() }),
            generate: async ({ spec }): Promise<ReactNode> => {
              const result = await createVegaLiteChart(spec);
              aiState.update((draft: AIState) => {
                draft.messages.push({
                  id: nanoid(),
                  role: 'assistant',
                  content: 'Vega-Lite chart created',
                });
              });
              return <BotMessage content={result} />;
            },
          },
          createD3Chart: {
            description: 'Create a D3 chart',
            parameters: z.object({ data: z.any() }),
            generate: async ({ data }): Promise<ReactNode> => {
              const result = await createD3Chart(data);
              aiState.update((draft: AIState) => {
                draft.messages.push({
                  id: nanoid(),
                  role: 'assistant',
                  content: 'D3 chart created',
                });
              });
              return <BotMessage content={result} />;
            },
          },
          createLeafletMap: {
            description: 'Create a Leaflet map',
            parameters: z.object({ mapData: z.any() }),
            generate: async ({ mapData }): Promise<ReactNode> => {
              const result = await createLeafletMap(mapData);
              aiState.update((draft: AIState) => {
                draft.messages.push({
                  id: nanoid(),
                  role: 'assistant',
                  content: 'Leaflet map created',
                });
              });
              return <BotMessage content={result} />;
            },
          },
          performWebScraping: {
            description: 'Perform web scraping',
            parameters: z.object({ url: z.string() }),
            generate: async ({ url }): Promise<ReactNode> => {
              const result = await performWebScraping(url);
              aiState.update((draft: AIState) => {
                draft.messages.push({
                  id: nanoid(),
                  role: 'assistant',
                  content: `Web scraping performed on ${url}`,
                });
              });
              return <BotMessage content={result} />;
            },
          },
          processData: {
            description: 'Process data',
            parameters: z.object({ data: z.any() }),
            generate: async ({ data }): Promise<ReactNode> => {
              const result = await processData(data);
              aiState.update((draft: AIState) => {
                draft.messages.push({
                  id: nanoid(),
                  role: 'assistant',
                  content: 'Data processed',
                });
              });
              return <BotMessage content={result} />;
            },
          },
        },
      });
    },
  },
  initialAIState: {
    messages: [],
  },
  initialUIState: {
    messages: [],
  },
});

export type AI = typeof AI;

export function getUIStateFromAIState(aiState: AIState): UIState {
  return {
    messages: aiState.messages,
  };
}

export { executeRCode, createVegaLiteChart, createD3Chart };
