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

export interface AIState {
  messages: AIMessage[];
}

export interface UIState {
  messages: AIMessage[];
}

export const AI = createAI({
  actions: {
    submitUserMessage: async function* (content: string) {
      const aiState = getMutableAIState<AIState>();
      aiState.update((draft) => {
        draft.messages.push({
          id: crypto.randomUUID(),
          role: 'user',
          content,
        });
      });

      const result = await streamUI({
        model: openai('gpt-4-turbo'),
        messages: [
          ...aiState.get().messages,
          { role: 'user', content }
        ],
        text: ({ content, done }) => {
          if (done) {
            aiState.update((draft) => {
              draft.messages.push({
                id: crypto.randomUUID(),
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
            generate: async function* ({ code }) {
              yield <BotMessage content="Executing R code..." />;
              const result = await executeRCode(code);
              aiState.update((draft) => {
                draft.messages.push({
                  id: crypto.randomUUID(),
                  role: 'assistant',
                  content: `R code executed: ${result}`,
                });
              });
              return <BotMessage content={result} />;
            },
          },
          createVegaLiteChart: {
            description: 'Create a Vega-Lite chart',
            parameters: z.object({ spec: z.any() }),
            generate: async function* ({ spec }) {
              yield <BotMessage content="Creating Vega-Lite chart..." />;
              const result = await createVegaLiteChart(spec);
              aiState.update((draft) => {
                draft.messages.push({
                  id: crypto.randomUUID(),
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
            generate: async function* ({ data }) {
              yield <BotMessage content="Creating D3 chart..." />;
              const result = await createD3Chart(data);
              aiState.update((draft) => {
                draft.messages.push({
                  id: crypto.randomUUID(),
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
            generate: async function* ({ mapData }) {
              yield <BotMessage content="Creating Leaflet map..." />;
              const result = await createLeafletMap(mapData);
              aiState.update((draft) => {
                draft.messages.push({
                  id: crypto.randomUUID(),
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
            generate: async function* ({ url }) {
              yield <BotMessage content="Performing web scraping..." />;
              const result = await performWebScraping(url);
              aiState.update((draft) => {
                draft.messages.push({
                  id: crypto.randomUUID(),
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
            generate: async function* ({ data }) {
              yield <BotMessage content="Processing data..." />;
              const result = await processData(data);
              aiState.update((draft) => {
                draft.messages.push({
                  id: crypto.randomUUID(),
                  role: 'assistant',
                  content: 'Data processed',
                });
              });
              return <BotMessage content={result} />;
            },
          },
        },
      });

      yield result.value;
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