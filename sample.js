// Sample JavaScript file for testing CodeWhiskers

function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

const processData = async (userId) => {
  try {
    const response = await fetch(`https://api.example.com/users/${userId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
};

let counter = 0;

function incrementCounter() {
  counter++;
  return counter;
}

// A more complex function to test analysis
function processArray(arr) {
  if (!Array.isArray(arr)) {
    throw new Error("Input must be an array");
  }

  let result = [];
  
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    
    if (typeof item === 'number') {
      result.push(item * 2);
    } else if (typeof item === 'string') {
      result.push(item.toUpperCase());
    } else {
      result.push(null);
    }
  }
  
  return result;
} 