import { executeRCode, parseRResult } from './r-execution';
import * as assert from 'assert';

async function testRExecution() {
  console.log('Testing R Execution...');

  // Test case 1: Basic execution
  const testInput1 = {
    inputVariableNames: ['x', 'y'],
    files: ['data.csv'],
    outputVariableName: 'result',
    rFunction: `
      function(x, y) {
        # This is a mock R function
        result <- x + y
        return(result)
      }
    `
  };

  // Test case 2: Empty input variables and files
  const testInput2 = {
    inputVariableNames: [],
    files: [],
    outputVariableName: 'emptyResult',
    rFunction: `
      function() {
        # This is a mock R function with no inputs
        result <- 42
        return(result)
      }
    `
  };

  try {
    // Test case 1
    const result1 = await executeRCode(JSON.stringify(testInput1));
    console.log('Execution result 1:', result1);
    const parsedResult1 = parseRResult(result1);
    console.log('Parsed result 1:', parsedResult1);

    // Assertions for test case 1
    assert.strictEqual(typeof parsedResult1.result, 'string', 'Result should be a string');
    assert.ok(parsedResult1.result.includes('Mock result for result'), 'Result should contain mock output');
    assert.ok(parsedResult1.console.includes('Executed R function with inputs: x, y'), 'Console output should mention input variables');
    assert.ok(parsedResult1.files.includes('data.csv'), 'Files processed should include data.csv');

    // Test case 2
    const result2 = await executeRCode(JSON.stringify(testInput2));
    console.log('Execution result 2:', result2);
    const parsedResult2 = parseRResult(result2);
    console.log('Parsed result 2:', parsedResult2);

    // Assertions for test case 2
    assert.strictEqual(typeof parsedResult2.result, 'string', 'Result should be a string');
    assert.ok(parsedResult2.result.includes('Mock result for emptyResult'), 'Result should contain mock output for emptyResult');
    assert.ok(parsedResult2.console.includes('Executed R function with inputs:'), 'Console output should not mention any input variables');
    assert.strictEqual(parsedResult2.files, 'No files processed', 'No files should be processed');

    console.log('All tests passed successfully!');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testRExecution();