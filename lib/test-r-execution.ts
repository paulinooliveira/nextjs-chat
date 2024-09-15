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

  try {
    const result = await executeRCode(input);
    console.log('Error handling result:', result);
  } catch (error) {
    console.log('Caught expected error:', error);
  }
}

async function testDataFrame() {
  console.log('Running testDataFrame:');
  const rCode = `
    function() {
      df <- data.frame(
        name = c("Alice", "Bob", "Charlie"),
        age = c(25, 30, 35),
        height = c(165, 180, 175)
      )
      return(df)
    }
  `;

  const input = JSON.stringify({
    inputVariableNames: [],
    files: [],
    outputVariableName: 'dataFrameResult',
    rFunction: rCode
  });

  const result = await executeRCode(input);
  console.log('Data frame result:', result);
}

async function runTests() {
  console.log('Starting tests...');
  await testSimpleFunction();
  console.log('\n');
  await testRandomWalk();
  console.log('\n');
  await testPlotting();
  console.log('\n');
  await testErrorHandling();
  console.log('\n');
  await testDataFrame();
  console.log('All tests completed.');
}

runTests().catch(console.error);