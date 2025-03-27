/**
 * Performance Test File for CodeWhiskers
 * This file contains examples of various performance patterns to test detection
 */

// Good performance example - O(n) complexity
function efficientSearch(array, target) {
  for (let i = 0; i < array.length; i++) {
    if (array[i] === target) {
      return i;
    }
  }
  return -1;
}

// Bad performance example - O(n²) complexity with nested loops
function inefficientSearch(array, target) {
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array.length; j++) {
      if (array[i] === target && i !== j) {
        console.log(`Found ${target} at ${i}, comparing with ${j}`);
      }
    }
  }
}

// String concatenation inside loop - inefficient
function buildString(items) {
  let result = "";
  for (let i = 0; i < items.length; i++) {
    result += `Item ${i}: ${items[i]}\n`; // String interpolation in loop
  }
  return result;
}

// More efficient alternative using array join
function buildStringEfficient(items) {
  const lines = items.map((item, i) => `Item ${i}: ${item}`);
  return lines.join('\n');
}

// Object creation inside loop - can cause memory churn
function createObjectsInLoop(count) {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(new Object({ id: i, value: `value-${i}` }));
  }
  return results;
}

// DOM operations inside loop - performance issue
function updateDomElements(items) {
  for (let i = 0; i < items.length; i++) {
    const element = document.createElement('div');
    element.textContent = items[i];
    document.body.appendChild(element);
  }
}

// Better approach using DocumentFragment
function updateDomElementsEfficient(items) {
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < items.length; i++) {
    const element = document.createElement('div');
    element.textContent = items[i];
    fragment.appendChild(element);
  }
  document.body.appendChild(fragment);
}

// Memory leak potential - event listeners without cleanup
function setupEventListeners() {
  const button = document.querySelector('#myButton');
  button.addEventListener('click', handleClick);
  // Missing: button.removeEventListener('click', handleClick);
}

function handleClick() {
  console.log('Button clicked');
}

// Inefficient array operations
function inefficientArrayOperations(array) {
  for (let i = 0; i < array.length; i++) {
    // Using splice inside loop is inefficient
    if (array[i] % 2 === 0) {
      array.splice(i, 1);
      i--; // Adjust for removed element
    }
  }
  return array;
}

// Sequential async operations in loop - slow
async function sequentialFetch(urls) {
  const results = [];
  for (let i = 0; i < urls.length; i++) {
    const response = await fetch(urls[i]); // Sequential await in loop
    const data = await response.json();
    results.push(data);
  }
  return results;
}

// Parallel async operations - more efficient
async function parallelFetch(urls) {
  const promises = urls.map(url => 
    fetch(url).then(response => response.json())
  );
  return await Promise.all(promises);
}

// Deep clone using JSON - inefficient for large objects
function deepCloneJSON(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Regular expressions with catastrophic backtracking
function catastrophicRegex(text) {
  // This regex can cause exponential backtracking
  const regex = /^(a+)+b$/;
  return regex.test(text);
}

// Multiple DOM queries without caching
function inefficientDomQueries() {
  document.querySelector('#header').style.color = 'red';
  document.querySelector('#header').textContent = 'Updated Header';
  document.querySelector('#header').classList.add('active');
  // Better to cache: const header = document.querySelector('#header');
}

// Triple nested loop - O(n³) complexity
function tripleNestedLoop(matrix) {
  const result = [];
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      for (let k = 0; k < matrix[i][j].length; k++) {
        result.push(matrix[i][j][k] * 2);
      }
    }
  }
  return result;
}

// Function with too many parameters
function tooManyParams(param1, param2, param3, param4, param5, param6, param7, param8, param9, param10, param11, param12) {
  return param1 + param2 + param3 + param4 + param5 + param6 + param7 + param8 + param9 + param10 + param11 + param12;
}

// Large array literal
const largeArray = [
  /* imagine 1000+ items here */
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  /* ... hundreds more ... */
];

// Excessive console logging
function debugFunction() {
  console.log('Debug 1');
  console.log('Debug 2');
  console.log('Debug 3');
  console.log('Debug 4');
  console.log('Debug 5');
  console.log('Debug 6');
  console.log('Variables:', { a: 1, b: 2, c: 3 });
}

// Interval without cleanup
function startInterval() {
  setInterval(() => {
    console.log('This runs every second');
  }, 1000);
  // Missing: clearInterval()
}

// React-like component example (for testing React patterns)
function UserProfile(props) {
  // Missing React.memo() for optimization
  const [, setState] = setState({ 
    name: props.name, 
    email: props.email,
    preferences: props.preferences
  }); // Object in useState

  useEffect(() => {
    console.log('Component rendered');
    // Missing dependencies array
  });

  return (
    <div>
      {props.items.map(item => (
        <div key={item.id}>
          <ItemComponent item={item} onClick={() => console.log(item)} />
        </div>
      ))}
    </div>
  );
}

// Example component with object creation during render
function ProductList({ products }) {
  return (
    <div>
      {products.map(product => (
        <div key={product.id}>
          <ProductList 
            product={product} 
            formatter={new PriceFormatter('USD')} // New object during render
            options={{ showDiscount: true }}     // New object during render
          />
        </div>
      ))}
    </div>
  );
}

// Exported functions for testing
module.exports = {
  efficientSearch,
  inefficientSearch,
  buildString,
  buildStringEfficient,
  createObjectsInLoop,
  updateDomElements,
  updateDomElementsEfficient,
  setupEventListeners,
  inefficientArrayOperations,
  sequentialFetch,
  parallelFetch,
  deepCloneJSON,
  catastrophicRegex,
  inefficientDomQueries,
  tripleNestedLoop,
  tooManyParams
}; 