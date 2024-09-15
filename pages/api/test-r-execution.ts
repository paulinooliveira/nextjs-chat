import type { NextApiRequest, NextApiResponse } from 'next'
import { executeRCode } from '../../lib/r-execution'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const rCode = `
    function() {
      set.seed(123)  # for reproducibility
      n <- 100
      steps <- rnorm(n)
      position <- cumsum(steps)
      plot(1:n, position, type="l", main="Random Walk", xlab="Step", ylab="Position")
      return(list(steps = steps, position = position))
    }
  `;

  const input = JSON.stringify({
    inputVariableNames: [],
    files: [],
    outputVariableName: 'randomWalk',
    rFunction: rCode
  });

  try {
    const result = await executeRCode(input);
    res.status(200).json({ result: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred during R code execution', details: error instanceof Error ? error.message : String(error) });
  }
}