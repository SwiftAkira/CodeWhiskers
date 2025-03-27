import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/**
 * React Performance Test File for CodeWhiskers
 * This file contains examples of various React performance patterns
 */

// Missing dependency array - causes unnecessary re-renders
export const ComponentWithMissingDeps: React.FC = () => {
  const [count, setCount] = useState(0);
  
  // Missing dependency array causes this effect to run on every render
  useEffect(() => {
    console.log('Effect running, count:', count);
    document.title = `Count: ${count}`;
  });
  
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
};

// Unnecessary re-renders with anonymous functions
export const ComponentWithAnonymousFunctions: React.FC<{ items: string[] }> = ({ items }) => {
  return (
    <div>
      <h1>Items</h1>
      <ul>
        {items.map((item, index) => (
          <li key={index} onClick={() => console.log(`Clicked ${item}`)}>
            {item}
          </li>
        ))}
      </ul>
      <button onClick={() => console.log('Button clicked')}>Click Me</button>
    </div>
  );
};

// Better approach using useCallback
export const OptimizedComponent: React.FC<{ items: string[] }> = ({ items }) => {
  const handleItemClick = useCallback((item: string) => {
    console.log(`Clicked ${item}`);
  }, []);
  
  const handleButtonClick = useCallback(() => {
    console.log('Button clicked');
  }, []);
  
  return (
    <div>
      <h1>Items</h1>
      <ul>
        {items.map((item, index) => (
          <li key={index} onClick={() => handleItemClick(item)}>
            {item}
          </li>
        ))}
      </ul>
      <button onClick={handleButtonClick}>Click Me</button>
    </div>
  );
};

// Using object state with useState - can cause unnecessary re-renders
export const ComponentWithObjectState: React.FC = () => {
  // Object in useState
  const [user, setUser] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    preferences: {
      theme: 'dark',
      notifications: true
    }
  });
  
  const updateName = () => {
    // This causes a complete re-render even though only name changes
    setUser({
      ...user,
      name: 'Jane Doe'
    });
  };
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <button onClick={updateName}>Update Name</button>
    </div>
  );
};

// Better approach using multiple state variables
export const ComponentWithSplitState: React.FC = () => {
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john@example.com');
  const [preferences, setPreferences] = useState({
    theme: 'dark',
    notifications: true
  });
  
  return (
    <div>
      <h1>{name}</h1>
      <p>{email}</p>
      <button onClick={() => setName('Jane Doe')}>Update Name</button>
    </div>
  );
};

// Creating new objects during render
export const ComponentWithObjectCreation: React.FC<{ products: any[] }> = ({ products }) => {
  return (
    <div>
      {products.map(product => (
        <div 
          key={product.id}
          style={{ margin: '10px', padding: '10px' }} // New object on each render
        >
          <h2>{product.name}</h2>
          <p>{product.description}</p>
          <button onClick={() => console.log(product)}>
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  );
};

// Expensive calculation without memoization
export const ComponentWithExpensiveCalculation: React.FC<{ numbers: number[] }> = ({ numbers }) => {
  // This calculation runs on every render
  const sum = numbers.reduce((total, num) => total + num, 0);
  const average = sum / numbers.length;
  
  return (
    <div>
      <h1>Statistics</h1>
      <p>Sum: {sum}</p>
      <p>Average: {average}</p>
    </div>
  );
};

// Better approach using useMemo
export const OptimizedCalculationComponent: React.FC<{ numbers: number[] }> = ({ numbers }) => {
  // Calculation only runs when numbers change
  const stats = useMemo(() => {
    const sum = numbers.reduce((total, num) => total + num, 0);
    return {
      sum,
      average: sum / numbers.length
    };
  }, [numbers]);
  
  return (
    <div>
      <h1>Statistics</h1>
      <p>Sum: {stats.sum}</p>
      <p>Average: {stats.average}</p>
    </div>
  );
};

// Non-memoized component in a list
export const ParentWithNonMemoizedChildren: React.FC<{ items: { id: number; name: string }[] }> = ({ items }) => {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      
      <div>
        {items.map(item => (
          // ChildComponent will re-render on every count change even though items didn't change
          <ChildComponent key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

// Non-memoized child component
const ChildComponent: React.FC<{ item: { id: number; name: string } }> = ({ item }) => {
  console.log(`Rendering child component for ${item.name}`);
  
  return (
    <div>
      <h2>{item.name}</h2>
    </div>
  );
};

// Better approach with memoized component
export const ParentWithMemoizedChildren: React.FC<{ items: { id: number; name: string }[] }> = ({ items }) => {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      
      <div>
        {items.map(item => (
          // MemoizedChild only re-renders when item changes
          <MemoizedChild key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

// Memoized child component
const MemoizedChild = React.memo(({ item }: { item: { id: number; name: string } }) => {
  console.log(`Rendering memoized child for ${item.name}`);
  
  return (
    <div>
      <h2>{item.name}</h2>
    </div>
  );
});

// DOM manipulation instead of React state
export const ComponentWithDomManipulation: React.FC = () => {
  const headerRef = useRef<HTMLHeadingElement>(null);
  
  // Anti-pattern: direct DOM manipulation in React
  const updateHeader = () => {
    if (headerRef.current) {
      headerRef.current.textContent = 'Updated Header';
    }
  };
  
  return (
    <div>
      <h1 ref={headerRef}>Original Header</h1>
      <button onClick={updateHeader}>Update Header</button>
    </div>
  );
};

// Complex JSX nesting without extraction
export const ComponentWithComplexJSX: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="container">
      <header className="header">
        <h1>{data.title}</h1>
        <nav>
          <ul>
            {data.navItems.map(item => (
              <li key={item.id}>
                <a href={item.link}>
                  {item.icon && <span className="icon">{item.icon}</span>}
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main>
        <section className="content">
          {data.sections.map(section => (
            <div key={section.id} className="section">
              <h2>{section.title}</h2>
              <p>{section.description}</p>
              {section.items.map(item => (
                <div key={item.id} className="item">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <button onClick={() => console.log(item)}>
                    View Details
                  </button>
                </div>
              ))}
            </div>
          ))}
        </section>
        <aside className="sidebar">
          <h2>Related</h2>
          <ul>
            {data.related.map(item => (
              <li key={item.id}>{item.title}</li>
            ))}
          </ul>
        </aside>
      </main>
    </div>
  );
}; 