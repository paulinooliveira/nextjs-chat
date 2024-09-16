import 'server-only'

import {
  createStreamableUI,
  getMutableAIState,
  streamUI,
  createStreamableValue
} from 'ai/rsc'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { BotMessage, SystemMessage } from '@/components/stocks/message'
import { nanoid } from 'nanoid'
import { executeRCode, parseRResult } from '../r-execution'
import RCodeOutput from '@/components/r-code-output'

export async function submitUserMessage(content: string) {
  'use server'

  const aiState = getMutableAIState()

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

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  const systemInstruction = `Você é um modelo de linguagem aprimorado com RLHF e ferramentas avançadas para aquisição e análise de dados. Como você é auto-regressivo, cada token é uma chance de melhorar a análise, de forma que você sempre escreve algumas palavras comentando sobre como vai trabalhar ANTES de efetivamente atender a demanda do usuário. Suas respostas devem ser precisas, factuais e com fontes mencionadas. Se não souber a resposta, diga claramente.

  ## Habilidades
  - **Modularidade:** Análises estruturadas com inputs/outputs claros.
  - **Análise e Visualização:** Proficiência em R e Vega-Lite, seguindo os princípios de Edward Tufte.
  - **nameSpace:** Você tem acesso a um namespace onde salva, a cada chamada de R, **uma única variável**, preferencialmente um dataframe, que segue disponível e pode ser chamada em outras funções sempre que for inserida como uma input variable. 
  - **Confiabilidade:** Use apenas dados reais e verificáveis.
  - **Acesso à internet:** Você proativamente baixa dados da internet, incluindo APIs, arquivos, sites, etc.
  
  ## Exemplo de Leitura de Dados
  
  **Resumo Estatístico:**
  \`\`\`r
  function(meusDados) { 
    summaryData <- summary(meusDados)
    printData <- print(summaryData)
    return(result)
  }
  \`\`\`
  Onde meusDados é uma variável vinda de outra chamada de função anterior.
  
  **Dados da Bolsa:**
  \`\`\`r
  function(){
    library(tidyquant)
    symbols <- c('^BVSP')
    data <- tq_get(symbols, from = Sys.Date() - 30, to = Sys.Date(), get = 'stock.prices')
    return(data)
  }
  \`\`\`
  **Arquivos PDF:**
  \`\`\`r
  function() {
  library(pdftools)
    "https://someKnownUrl.com/egDoc.pdf" %>%
    pdf_text() %>%
    return()
  }
  \`\`\`
  
  Observação: nesse caso, o \`pdftools\` é usado apenas para extrair o texto de PDFs. Caso o conteúdo seja longo, ele será resumido automaticamente na fase de pós-processamento, sem necessidade de intervenção sua. Observe que o usuário poderia ter fornecido o arquivo diretamente.
  
  ## Criação de Gráficos com Vega-Lite
  Os gráficos devem ser gerados utilizando Vega-Lite, referenciando os dados através do namespace.
  ### Exemplo de Gráfico Interativo em Vega-Lite
  \`\`\`json
  {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": {"text": "Relação entre Potência e Consumo de Combustível"},
    "subtitle": {"text": "Fonte: MIT Cars Dataset"},
    "data": {"name": "carros"},
    "transform": [{"calculate": "year(datum.Year)", "as": "Ano"}],
    "layer": [{
      "params": [{
        "name": "CilindrosAno",
        "value": [{"Cilindros": 4, "Ano": 1977}],
        "select": {"type": "point", "fields": ["Cilindros", "Ano"]},
        "bind": {
          "Cilindros": {"input": "range", "min": 3, "max": 8, "step": 1},
          "Ano": {"input": "range", "min": 1969, "max": 1981, "step": 1}
        }
      }],
      "mark": "circle",
      "encoding": {
        "x": {"field": "Horsepower", "type": "quantitative", "title": "Potência (HP)"},
        "y": {"field": "Miles_per_Gallon", "type": "quantitative", "title": "Milhas por Galão (MPG)"},
        "color": {
          "condition": {"param": "CilindrosAno", "field": "Origin", "type": "nominal"},
          "value": "grey"
        }
      }
    }, {
      "transform": [{"filter": {"param": "CilindrosAno"}}],
      "mark": "circle",
      "encoding": {
        "x": {"field": "Horsepower", "type": "quantitative"},
        "y": {"field": "Miles_per_Gallon", "type": "quantitative"},
        "color": {"field": "Origin", "type": "nominal"},
        "size": {"value": 100}
      }
    }]
  }
  \`\`\`
  ### Requisitos para Gráficos
  - Os dados do \`nameSpace\` do R são acessados através da propriedade top-level de datasets do Vega-Lite, referenciados pelo nome exato da variável (ex: {"name": "someData"}).
  ## Boas Práticas
  - Comente cada linha de código antes de escrevê-la.
  - Formate mensagens no estilo de publicações financeiras, usando **negrito** e sendo direto.
  - Evite exibir código ao usuário, a menos que solicitado.
  - Faça todas as trasnformações necessárias no R **antes** de enviar ao Vega-Lite.
  - Formate datas antes de gerar gráficos; colunas como ano e mês devem ser transformadas em YYYY-MM, por examplo, e colunas só com ano devem ser transformadas em YYYY-MM-DD.
  Seu foco deve ser em resultados precisos e verificáveis, seguindo práticas de alta qualidade na análise e apresentação de dados. Seja proativo.`

  const result = await streamUI({
    model: openai('gpt-4'),
    system: systemInstruction,
    messages: [
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      }))
    ],
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value} />
      }

      if (done) {
        textStream.done()
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content
            }
          ]
        })
      } else {
        textStream.update(delta)
      }

      return textNode
    },
    tools: {
      gptR: {
        description: `Executa função R em uma chamada sessionless ao OpenCPU, que retorna APENAS uma única variável. O código R precisa estar completamente envelopado e isolado na função. Apenas a variável explicitamente retornada pela função pode ser reutilizada (são salvas em memória, num nameSpace compartilhado). Dados podem ser baixados diretamente da internet, podem ser vindos de chamadas anteriores, ou de arquivos explicitamente fornecidos pelo usuário como anexo. Gráficos não podem ser retornados, mas tudo que é plotado é exibido ao usuário. Objetos que não sejam data-frames, JSONs ou strings tem que ser serializados em JSON antes de serem retornados. Prefere ser o mais modular possível, conferindo o resultado a cada execução. Capaz de importar biblitecas, mas não é capaz de instalar nada.`,
        parameters: z.object({
          inputVariableNames: z.array(z.string()).describe(`Lista de nomes de variáveis de chamadas anteriores que serão necessárias, se houver, e que serão passadas para a função R e utilizadas dentro dela. R só trabalha com variáveis em memória de chamadas anterioes que forem explicitamente passadas para a função. Somente funciona com dados que tenham sido gerados anteriormente por outras funções. Se não houver variáveis sendo utilizadas, deve ser uma lista vazia, isto é, [].`),
          files: z.array(z.string()).describe(`Lista opcional de anexos locais fornecidos pelo usuário, se houver e se for relevante para o código que será executado, que serão disponibilizados no CSD e que você gostaria de acessar na função. Isso só se aplica para arquivos fornecidos explicitamente pelo usuário, e NÃO para arquivos baixados da internet.`),
          outputVariableName: z.string().describe(`Nome único para a variável que será salva no nameSpace, em camelCase. Deve ser descritivo de seu conteúdo, em português. Somente esta variável permanece disponível para próximas funções.`),
          rFunction: z.string().describe(`Código R em várias linhas para OpenCPU, comentado e modular, no formato:
function({{inputVariableNames salvas previamente, se houver}}) { 
  {{importações, se houver}} 
  {{código R com transformações}} 
  ... %>% ... 
  return({{única variável a exportar: data-frame, string ou JSON/JSON-serializable}})
}`),
          codeDescription: z.string().describe(`Mensagem ao usuário explicando sua abordagem e o que está fazendo na função R, usando termos simples e específicos voltados para negócios.`)
        }),
        generate: async function* ({ inputVariableNames, files, outputVariableName, rFunction, codeDescription }) {
          const toolCallId = nanoid()
          const result = await executeRCode(
            JSON.stringify({
              inputVariableNames,
              files,
              outputVariableName,
              rFunction
            })
          )
          const parsedResult = parseRResult(result)
          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'gptR',
                    toolCallId,
                    args: { inputVariableNames, files, outputVariableName, rFunction, codeDescription }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'gptR',
                    toolCallId,
                    result: parsedResult
                  }
                ]
              }
            ]
          })
          return (
            <>
            <BotMessage content={codeDescription}/>
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

  return {
    id: nanoid(),
    display: result.value
  }
}