import { executeRCode } from './r-execution';

async function testSimpleFunction() {
  console.log('Running testSimpleFunction:');
  const result = await executeRCode(JSON.stringify({
    inputVariableNames: [],
    files: [],
    outputVariableName: 'simpleResult',
    rFunction: 'function() { return(1 + 1) }'
  }));
  console.log('Simple function result:', result);
  return JSON.parse(result).simpleResult[0] === 2;
}

async function testRandomWalk() {
  console.log('Running testRandomWalk:');
  const rCode = `
    function() {
      set.seed(123)  # for reproducibility
      n <- 100
      steps <- rnorm(n)
      position <- cumsum(steps)
      return(list(steps = steps, position = position))
    }
  `;

  const input = JSON.stringify({
    inputVariableNames: [],
    files: [],
    outputVariableName: 'randomWalk',
    rFunction: rCode
  });

  console.log('Executing R code...');
  const result = await executeRCode(input);
  console.log('Execution result:', result);
  const parsedResult = JSON.parse(result);
  return Array.isArray(parsedResult.randomWalk.steps) && parsedResult.randomWalk.steps.length === 100;
}

async function testPlotting() {
  console.log('Running testPlotting:');
  const rCode = `
    function() {
      x <- 1:10
      y <- x^2
      plot(x, y, main="Square Function")
      return(list(x=x, y=y))
    }
  `;

  const input = JSON.stringify({
    inputVariableNames: [],
    files: [],
    outputVariableName: 'plotResult',
    rFunction: rCode
  });

  const result = await executeRCode(input);
  console.log('Plotting result:', result);
  const parsedResult = JSON.parse(result);
  return Array.isArray(parsedResult.plotResult.x) && parsedResult.plotResult.x.length === 10;
}

async function testErrorHandling() {
  console.log('Running testErrorHandling:');
  const rCode = `
    function() {
      stop("This is a deliberate error")
    }
  `;

  const input = JSON.stringify({
    inputVariableNames: [],
    files: [],
    outputVariableName: 'errorResult',
    rFunction: rCode
  });

  const result = await executeRCode(input);
  console.log('Error handling result:', result);
  const parsedResult = JSON.parse(result);
  return parsedResult.error && parsedResult.error.includes("This is a deliberate error");
}

async function runTests() {
  console.log('Starting tests...');
  const testResults = await Promise.all([
    testSimpleFunction(),
    testRandomWalk(),
    testPlotting(),
    testErrorHandling()
  ]);

  console.log('\nTest Results:');
  console.log('Simple Function Test:', testResults[0] ? 'Passed' : 'Failed');
  console.log('Random Walk Test:', testResults[1] ? 'Passed' : 'Failed');
  console.log('Plotting Test:', testResults[2] ? 'Passed' : 'Failed');
  console.log('Error Handling Test:', testResults[3] ? 'Passed' : 'Failed');

  const allTestsPassed = testResults.every(result => result);
  console.log('\nAll tests passed:', allTestsPassed ? 'Yes' : 'No');

  if (!allTestsPassed) {
    process.exit(1); // Exit with error code if any test failed
  }
}

runTests().catch(error => {
  console.error('An error occurred while running tests:', error);
  process.exit(1);
});