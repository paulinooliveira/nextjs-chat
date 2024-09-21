import 'server-only'

import {
  createStreamableUI,
  getMutableAIState,
  streamUI,
  createStreamableValue
} from 'ai/rsc'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { BotMessage } from '@/components/stocks/message'
import { nanoid } from 'nanoid'
import { executeRCode, parseRResult } from '../r-execution'
import RCodeOutput from '@/components/r-code-output'

export async function submitUserMessage(content: string) {
  'use server'

  const aiState = getMutableAIState()

  // Log the initial aiState before update
  console.log('Initial aiState:', aiState.get())

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })
  console.log('After adding user message:', aiState.get().messages)

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode
  let currentAssistantMessageId: string | null = null
  let assistantMessageContent = '' // Initialize content accumulator

  const systemInstruction = `Você é um modelo de linguagem avançado com ferramentas para análise de dados. Suas respostas devem ser precisas e factuais, citando fontes quando necessário.

  Habilidades:
  - Análise estruturada com inputs/outputs claros
  - Proficiência em R e Vega-Lite para análise e visualização
  - Acesso a um namespace para armazenar variáveis entre chamadas de R
  - Capacidade de baixar dados da internet

  Exemplos de uso do R:
  - Resumo estatístico
  - Dados da bolsa (usando tidyquant)
  - Leitura de arquivos PDF

  Criação de gráficos:
  - Use Vega-Lite, referenciando dados do namespace
  - Siga os princípios de Edward Tufte
  - Formate datas adequadamente (YYYY-MM-DD)

  Boas práticas:
  - Comente o código R
  - Formate mensagens no estilo de publicações financeiras
  - Evite exibir código ao usuário, a menos que solicitado
  - Faça transformações no R antes de enviar ao Vega-Lite
  - Seja proativo e focado em resultados precisos e verificáveis`

  const result = await streamUI({
    model: openai('gpt-4o'),
    maxRetries: 10,
    system: systemInstruction,
    messages: [
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      }))
    ],
    text: ({ content, done, delta, message }) => {
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value} />
        currentAssistantMessageId = nanoid()
        assistantMessageContent = '' // Reset content accumulator
        aiState.update({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: currentAssistantMessageId,
              role: 'assistant',
              content: ''
            }
          ]
        })
        console.log('Created new assistant message with ID:', currentAssistantMessageId)
      }

      if (delta) {
        assistantMessageContent += delta
        textStream.update(delta)
        aiState.update({
          ...aiState.get(),
          messages: aiState.get().messages.map(msg =>
            msg.id === currentAssistantMessageId
              ? { ...msg, content: assistantMessageContent }
              : msg
          )
        })
        console.log('Assistant message content updated:', assistantMessageContent)
      }

      if (message?.function_call) {
        // Finish current assistant message
        textStream.done()
        console.log('Assistant message finalized with content:', assistantMessageContent)

        // Update aiState with the final assistant message content
        aiState.update({
          ...aiState.get(),
          messages: aiState.get().messages.map(msg =>
            msg.id === currentAssistantMessageId
              ? { ...msg, content: assistantMessageContent }
              : msg
          )
        })
        console.log('aiState after assistant message done:', aiState.get().messages)

        // Create a new message for the tool call
        const toolCallId = nanoid()
        const functionArgs = JSON.parse(message.function_call.arguments)
        aiState.update({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: toolCallId,
              role: 'assistant',
              content: {
                type: 'tool-call',
                toolName: message.function_call.name,
                toolCallId,
                args: functionArgs
              }
            }
          ]
        })
        console.log('Added tool call message:', {
          id: toolCallId,
          role: 'assistant',
          content: {
            type: 'tool-call',
            toolName: message.function_call.name,
            toolCallId,
            args: functionArgs
          }
        })
      } else if (done) {
        textStream.done()
        console.log('Assistant message finalized with content:', assistantMessageContent)

        // Update aiState with the final assistant message content
        aiState.update({
          ...aiState.get(),
          messages: aiState.get().messages.map(msg =>
            msg.id === currentAssistantMessageId
              ? { ...msg, content: assistantMessageContent }
              : msg
          )
        })
        console.log('aiState after assistant message done:', aiState.get().messages)
      }

      return textNode
    },
    tools: {
      gptR: {
        description: `Executa função R em uma chamada sessionless ao OpenCPU. Retorna apenas uma variável, que é salva no namespace compartilhado. Pode baixar dados da internet ou usar dados de chamadas anteriores. Não retorna gráficos, mas exibe o que é plotado. Objetos não data-frames, JSONs ou strings devem ser serializados em JSON. Modular e capaz de importar bibliotecas, mas não de instalar.`,
        parameters: z.object({
          inputVariableNames: z.array(z.string()).describe(`Lista de nomes de variáveis de chamadas anteriores necessárias. Lista vazia se não houver.`),
          files: z.array(z.string()).describe(`Lista opcional de anexos locais fornecidos pelo usuário.`),
          outputVariableName: z.string().describe(`Nome único para a variável a ser salva no namespace, em camelCase e português.`),
          rFunction: z.string().refine(
            (value) => {
              const functionRegex = /^function\s*\([^)]*\)\s*\{[\s\S]*\}$/;
              return functionRegex.test(value);
            },
            {
              message: "rFunction deve começar com 'function(input se aplicável) {' e terminar com '}'",
            }
          ).describe(`Código R comentado e modular para OpenCPU. Deve começar com 'function(input se aplicável) {' e terminar com '}'. As variáveis de entrada devem estar na função de entrada, se houver.`),
          codeDescription: z.string().describe(`Explicação da abordagem e função R em termos simples voltados para negócios.`)
        }),
        generate: async function* (args: any) {
          const { inputVariableNames, files, outputVariableName, rFunction, codeDescription } = args
          const toolCallId = nanoid()

          // Log the tool call arguments
          console.log('Executing gptR tool with args:', args)

          // Add the tool call to aiState messages
          aiState.update({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: toolCallId,
                role: 'assistant',
                content: {
                  type: 'tool-call',
                  toolName: 'gptR',
                  toolCallId,
                  args
                }
              }
            ]
          })
          console.log('Added tool call message to aiState:', {
            id: toolCallId,
            role: 'assistant',
            content: {
              type: 'tool-call',
              toolName: 'gptR',
              toolCallId,
              args
            }
          })

          // Execute the R code
          const result = await executeRCode(
            JSON.stringify({
              inputVariableNames,
              files,
              outputVariableName,
              rFunction
            })
          )
          console.log('Result from executeRCode:', result)

          const parsedResult = parseRResult(result)
          console.log('Parsed result:', parsedResult)

          // Create new messages for the code description and R output
          const codeDescriptionId = nanoid()
          const rOutputId = nanoid()
          aiState.update({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: codeDescriptionId,
                role: 'assistant',
                content: codeDescription
              },
              {
                id: rOutputId,
                role: 'assistant',
                content: {
                  type: 'tool-result',
                  toolName: 'gptR',
                  result: parsedResult,
                  rCode: rFunction,
                  outputVariableName
                }
              }
            ]
          })
          console.log('Added code description and tool result to aiState:', [
            {
              id: codeDescriptionId,
              role: 'assistant',
              content: codeDescription
            },
            {
              id: rOutputId,
              role: 'assistant',
              content: {
                type: 'tool-result',
                toolName: 'gptR',
                result: parsedResult,
                rCode: rFunction,
                outputVariableName
              }
            }
          ])

          return (
            <>
              <BotMessage content={assistantMessageContent || codeDescription} />
              <RCodeOutput
                rCode={rFunction}
                result={parsedResult}
                outputVariableName={outputVariableName}
              />
            </>
          )
        }
      }
    }
  })

  // Log the final aiState after streamUI
  console.log('Final aiState after streamUI:', aiState.get())

  return {
    id: nanoid(),
    display: result.value
  }
}
