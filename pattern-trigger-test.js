/**
 * Performance Pattern Trigger Test
 * This file is designed to trigger all patterns detected by the performanceAnalyzer
 */

// String interpolation inside loops
function triggerStringInterpolation() {
  const items = ['apple', 'banana', 'orange', 'grape', 'kiwi'];
  let result = '';
  for (let i = 0; i < items.length; i++) {
    result += `Item ${i}: ${items[i]}\n`;
  }
  return result;
}

// Object instantiation inside loops
function triggerObjectInstantiation() {
  const results = [];
  for (let i = 0; i < 100; i++) {
    results.push(new Object({ id: i, value: `value-${i}` }));
  }
  return results;
}

// Array splice inside loops
function triggerArraySplice() {
  const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] % 2 === 0) {
      arr.splice(i, 1);
      i--;
    }
  }
  return arr;
}

// querySelectorAll in performance-critical code
function triggerQuerySelectorAll() {
  const elements = document.querySelectorAll('.item');
  return elements.length;
}

// DOM operations inside loops
function triggerDomOperationsInLoop() {
  const items = ['item1', 'item2', 'item3', 'item4', 'item5'];
  items.forEach(item => {
    const div = document.createElement('div');
    div.textContent = item;
    document.body.appendChild(div);
  });
}

// Deep cloning with JSON
function triggerJsonCloning() {
  const obj = { 
    complex: { 
      nested: { 
        structure: [1, 2, 3, { more: 'data' }] 
      }
    }
  };
  return JSON.parse(JSON.stringify(obj));
}

// Potential memory leak from uncleaned intervals
function triggerUnclearedInterval() {
  setInterval(() => {
    console.log('This interval is never cleared');
  }, 1000);
}

// Potential memory leak from event listeners
function triggerUnclearedEventListeners() {
  const button = document.getElementById('btn');
  button.addEventListener('click', () => {
    console.log('Button clicked');
  });
}

// Inefficient Promise.all batch
async function triggerInefficientPromiseAll() {
  const urls = ['url1', 'url2', 'url3'];
  return await Promise.all([
    fetch(urls[0]).then(r => r.json()),
    fetch(urls[1]).then(r => r.json()),
    fetch(urls[2]).then(r => r.json())
  ]);
}

// Sequential await in loop
async function triggerSequentialAwait() {
  const urls = ['url1', 'url2', 'url3', 'url4', 'url5'];
  const results = [];
  for (let i = 0; i < urls.length; i++) {
    const response = await fetch(urls[i]);
    const data = await response.json();
    results.push(data);
  }
  return results;
}

// Type assertions in critical path (TypeScript-like code in JavaScript)
function triggerTypeAssertions() {
  const data = getDataFromServer();
  // Simulate TypeScript-like assertion
  const items = data.items;
  return items;
}

// useEffect without dependencies array (React-like code)
function triggerUseEffectWithoutDeps() {
  // Simulate React useEffect
  useEffect(() => {
    console.log('This effect runs on every render');
    document.title = 'Updated';
  });
}

// useState with object state (React-like code)
function triggerUseStateWithObject() {
  // Simulate React useState
  const [state, setState] = useState({
    name: 'John',
    email: 'john@example.com',
    preferences: { theme: 'dark' }
  });
}

// Nested component in map without memoization (React-like code)
function triggerNestedComponentInMap() {
  // Simulate React component
  return (
    <div>
      {items.map(item => (
        <div key={item.id}>
          <NestedComponent item={item} />
        </div>
      ))}
    </div>
  );
}

// Creating new objects during render (React-like code)
function triggerObjectsInRender() {
  // Simulate React component
  return (
    <Button 
      style={{ color: 'blue', margin: '10px' }}
      options={{ animate: true }}
      onClick={() => handleClick()}
    />
  );
}

// Nested loops (O(n²) time complexity)
function triggerNestedLoops() {
  const matrix = [[1, 2], [3, 4], [5, 6]];
  const result = [];
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      result.push(matrix[i][j] * 2);
    }
  }
  return result;
}

// Multiple function calls inside loop
function triggerMultipleFunctionCallsInLoop() {
  const items = [1, 2, 3, 4, 5];
  for (let i = 0; i < items.length; i++) {
    processItem(items[i]);
    validateItem(items[i]);
    saveItem(items[i]);
    logItem(items[i]);
    notifyItemProcessed(items[i]);
  }
}

// Complex regular expression
function triggerComplexRegex() {
  const pattern = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.)+[a-zA-Z]{2,}(\/[a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=]*)?$/;
  return pattern.test('https://example.com');
}

// Excessive string concatenation
function triggerExcessiveStringConcat() {
  let result = '';
  result += 'This ';
  result += 'is ';
  result += 'a ';
  result += 'very ';
  result += 'long ';
  result += 'string ';
  result += 'concatenated ';
  result += 'many ';
  result += 'times.';
  return result;
}

// Large array/object literals
const triggerLargeObjectLiteral = {
  item1: 'value1',
  item2: 'value2',
  item3: 'value3',
  // ... imagine hundreds more
  item100: 'value100',
  nestedObject: {
    subItem1: 'subValue1',
    subItem2: 'subValue2',
    // ... imagine more nested items
    subItem50: 'subValue50'
  }
};

// Global event listeners without cleanup
document.addEventListener('scroll', function() {
  console.log('Scrolling');
});

// Synchronous XMLHttpRequest
function triggerSyncXHR() {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://example.com/api', false); // false = synchronous
  xhr.send();
}

// Excessive console statements
function triggerExcessiveConsole() {
  console.log('Log 1');
  console.log('Log 2');
  console.log('Log 3');
  console.log('Log 4');
  console.log('Log 5');
  console.log('Log 6');
  console.log('Log 7');
  console.info('Info 1');
  console.warn('Warning 1');
  console.error('Error 1');
}

// Function with too many parameters
function triggerTooManyParams(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15) {
  return p1 + p2 + p3 + p4 + p5;
}

// Triple nested loops - O(n³) complexity
function triggerTripleNestedLoop() {
  const cube = [[[1, 2], [3, 4]], [[5, 6], [7, 8]]];
  const result = [];
  for (let i = 0; i < cube.length; i++) {
    for (let j = 0; j < cube[i].length; j++) {
      for (let k = 0; k < cube[i][j].length; k++) {
        result.push(cube[i][j][k]);
      }
    }
  }
  return result;
}

// Helper functions for the examples above
function processItem(item) { return item * 2; }
function validateItem(item) { return item > 0; }
function saveItem(item) { /* Simulated save */ }
function logItem(item) { console.log(item); }
function notifyItemProcessed(item) { /* Simulated notification */ }
function getDataFromServer() { return { items: [1, 2, 3] }; }
function useEffect(callback, deps) { /* Simulated React hook */ }
function useState(initialState) { /* Simulated React hook */ return [initialState, () => {}]; } 