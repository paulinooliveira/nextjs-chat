import { nanoid } from 'nanoid'
import { Message } from '@/lib/types'
import { executeRCode } from '@/lib/functions/r-execution'
import { createVegaLiteChart } from '@/lib/functions/vega-lite'
import { createD3Chart } from '@/lib/functions/d3-charts'
import { createLeafletMap } from '@/lib/functions/leaflet-maps'
import { performWebScraping } from '@/lib/functions/web-scraping'
import { processData } from '@/lib/functions/data-processing'

export async function handleMessage(content: string): Promise<Message> {
  let response: string

  // Handle different types of requests
  if (content.toLowerCase().startsWith('r:')) {
    const rCode = content.slice(2).trim()
    response = await executeRCode(rCode)
  } else if (content.toLowerCase().startsWith('vega:')) {
    const spec = JSON.parse(content.slice(5).trim())
    response = await createVegaLiteChart(spec)
  } else if (content.toLowerCase().startsWith('d3:')) {
    const data = JSON.parse(content.slice(3).trim())
    response = await createD3Chart(data)
  } else if (content.toLowerCase().startsWith('map:')) {
    const mapData = JSON.parse(content.slice(4).trim())
    response = await createLeafletMap(mapData)
  } else if (content.toLowerCase().startsWith('scrape:')) {
    const url = content.slice(7).trim()
    response = await performWebScraping(url)
  } else if (content.toLowerCase().startsWith('process:')) {
    const data = JSON.parse(content.slice(8).trim())
    response = await processData(data)
  } else {
    response = `Received request: "${content}". Please start your message with 'r:', 'vega:', 'd3:', 'map:', 'scrape:', or 'process:' to use specific functionality.`
  }

  return {
    id: nanoid(),
    role: 'assistant',
    content: response
  }
}