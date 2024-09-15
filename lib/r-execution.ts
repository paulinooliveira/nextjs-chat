import { OpenCPU, r } from '../opencpu-wrapper/opencpu.js';

// Initialize OpenCPU
const ocpu = new OpenCPU('https://cloud.opencpu.org');

// Define the structure of the input expected by the R execution function
interface RExecutionInput {
  inputVariableNames: string[]; // Names of input variables from previous executions
  files: string[]; // List of files to be processed
  outputVariableName: string; // Name of the variable to store the result
  rFunction: string; // R function code to be executed
}

/**
 * Executes R code based on the provided input
 * @param input - A JSON string containing the R execution parameters
 * @returns A promise that resolves to a JSON string containing the execution result
 */
export async function executeRCode(input: string): Promise<string> {
  try {
    // Parse the input JSON string into an object
    const parsedInput: RExecutionInput = JSON.parse(input);
    const { inputVariableNames, files, outputVariableName, rFunction } = parsedInput;

    console.log('Executing R code with input:', parsedInput);
    
    // Prepare the R function
    const rCode = `
      function(${inputVariableNames.join(', ')}) {
        ${rFunction}
      }
    `;

    // Execute the R function
    const result = await ocpu.execute(rCode, inputVariableNames);

    // Prepare the output
    const output = {
      [outputVariableName]: result,
      console: result.console || 'No console output',
      files: files.length > 0 ? `Processed files: ${files.join(', ')}` : 'No files processed'
    };

    return JSON.stringify(output);
  } catch (error) {
    console.error('Error executing R code:', error);
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Parses the result of an R code execution
 * @param result - A JSON string containing the R execution result
 * @returns The parsed result object or an error object if parsing fails
 */
export function parseRResult(result: string): any {
  try {
    return JSON.parse(result);
  } catch (error) {
    console.error('Error parsing R result:', error);
    return { error: 'Failed to parse R result' };
  }
}