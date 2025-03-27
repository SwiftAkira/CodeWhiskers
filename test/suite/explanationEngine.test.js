const assert = require('assert');
const { ExplanationEngine } = require('../../src/explanationEngine');

suite('Explanation Engine Test Suite', () => {
  test('ExplanationEngine should initialize with complexity thresholds', () => {
    const engine = new ExplanationEngine();
    assert.ok(engine.complexityThresholds);
    assert.strictEqual(typeof engine.complexityThresholds.low, 'number');
    assert.strictEqual(typeof engine.complexityThresholds.medium, 'number');
    assert.strictEqual(typeof engine.complexityThresholds.high, 'number');
  });

  test('ExplanationEngine should generate explanations with all detail levels', () => {
    const engine = new ExplanationEngine();
    const mockParsedCode = {
      type: 'code_block',
      language: 'javascript',
      content: `
        function calculateTotal(items) {
          return items.reduce((sum, item) => sum + item.price, 0);
        }
      `,
      structure: {
        functions: [{ name: 'calculateTotal', position: 10 }],
        classes: [],
        loops: [],
        conditionals: [],
        variables: []
      }
    };
    
    const result = engine.generateExplanation(mockParsedCode);
    
    assert.ok(result.simple);
    assert.ok(result.detailed);
    assert.ok(result.technical);
    assert.ok(['low', 'medium', 'high'].includes(result.complexity));
  });

  test('ExplanationEngine should assess complexity correctly', () => {
    const engine = new ExplanationEngine();
    
    // Simple structure - low complexity
    const simpleStructure = {
      functions: [],
      classes: [],
      loops: [],
      conditionals: [],
      variables: [{ name: 'x' }]
    };
    
    // Complex structure - high complexity
    const complexStructure = {
      functions: [{ name: 'f1' }, { name: 'f2' }, { name: 'f3' }],
      classes: [{ name: 'Class1' }],
      loops: [{ type: 'for' }, { type: 'while' }],
      conditionals: [{ type: 'if' }, { type: 'switch' }],
      variables: [{ name: 'a' }, { name: 'b' }, { name: 'c' }]
    };
    
    assert.strictEqual(engine._assessComplexity(simpleStructure), 'low');
    assert.strictEqual(engine._assessComplexity(complexStructure), 'high');
  });

  test('ExplanationEngine should analyze function behavior', () => {
    const engine = new ExplanationEngine();
    const mockFunction = {
      name: 'getData',
      params: [{ name: 'userId' }],
      body: `
        try {
          const response = await fetch('https://api.example.com/user/' + userId);
          return await response.json();
        } catch (error) {
          console.error(error);
          return null;
        }
      `,
      position: { line: 1, character: 0 },
      range: {}
    };
    
    const result = engine.analyzeFunctionBehavior(mockFunction);
    
    assert.strictEqual(result.name, 'getData');
    assert.ok(result.analysis);
    assert.ok(result.explanation);
    assert.ok(result.analysis.sideEffects.some(effect => effect.type === 'network'));
  });
}); 