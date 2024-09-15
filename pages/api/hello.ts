import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Hello API route hit!');
  res.status(200).json({ message: 'Hello from API' })
}