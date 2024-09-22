import { nanoid } from 'nanoid'
import { Message } from '@/lib/types'

// This function is now a placeholder for future server-side processing
// It's not used in our current client-side implementation
export async function submitUserMessage(content: string): Promise<Message[]> {
  console.log('Server-side submitUserMessage called with:', content)

  const userMessage: Message = {
    id: nanoid(),
    role: 'user',
    content
  }

  // Simulate AI response
  const assistantMessage: Message = {
    id: nanoid(),
    role: 'assistant',
    content: `This is a simulated AI response to: "${content}"`
  }

  return [userMessage, assistantMessage]
}

// Keep this function for future use if needed
function getSystemInstruction() {
  return `Você é um modelo de linguagem avançado com ferramentas para análise de dados. Suas respostas devem ser precisas e factuais, citando fontes quando necessário.

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
}
