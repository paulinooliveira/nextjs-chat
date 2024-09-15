import { r as opencpuR, initializeFetch, OpenCPU } from '../opencpu-wrapper/opencpu';
import fs from 'fs/promises';

// Initialize fetch for OpenCPU
initializeFetch();

// Create an OpenCPU instance with default settings
const opencpu = new OpenCPU();

async function log(message: string) {
  await fs.appendFile('r-execution-log.txt', message + '\n');
  console.log(message);
}

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
    await log('executeRCode started');
    // Parse the input JSON string into an object
    const parsedInput: RExecutionInput = JSON.parse(input);
    const { inputVariableNames, files, outputVariableName, rFunction } = parsedInput;

    await log('Executing R code with input: ' + JSON.stringify(parsedInput));
    
    // Prepare arguments
    const args = inputVariableNames.reduce((acc, name) => {
      acc[name] = (global as any)[name]; // Assuming global variables are used
      return acc;
    }, {} as Record<string, any>);

    await log('Prepared arguments: ' + JSON.stringify(args));
    await log('Calling opencpuR with rCode: ' + rFunction);

    // Execute the R code using the opencpu instance
    const result = await opencpu.call("do.call", { what: rFunction, args: args });

    await log('Raw result from OpenCPU: ' + JSON.stringify(result));

    if (result.error) {
      throw new Error(`OpenCPU error: ${result.error}`);
    }

    // Prepare the output
    const output = {
      [outputVariableName]: await result.getObject(),
      console: await result.getConsole(),
      files: result.output.filter(line => line.startsWith('files/')).map(line => line.split('/')[1])
    };

    await log('Processed output: ' + JSON.stringify(output));

    return JSON.stringify(output);
  } catch (error) {
    await log('Error executing R code: ' + (error instanceof Error ? error.stack : String(error)));
    return JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      details: error
    });
  }
}

// Log the OpenCPU wrapper initialization
log('OpenCPU wrapper initialized with default settings');