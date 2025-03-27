const assert = require('assert');
const { Parser } = require('../../src/parserModule');

suite('Parser Module Test Suite', () => {
  test('Parser should initialize with supported languages', () => {
    const parser = new Parser();
    assert.ok(parser.supportedLanguages.includes('javascript'));
    assert.ok(parser.supportedLanguages.includes('typescript'));
  });

  test('Parser should analyze JavaScript structure correctly', () => {
    const parser = new Parser();
    const sampleCode = `
      function testFunction() {
        const x = 10;
        if (x > 5) {
          return true;
        }
        return false;
      }
    `;
    
    const result = parser.parseCode(sampleCode, 'javascript');
    
    assert.strictEqual(result.language, 'javascript');
    assert.strictEqual(result.type, 'code_block');
    assert.ok(result.structure.functions.some(fn => fn.name === 'testFunction'));
    assert.ok(result.structure.conditionals.length > 0);
    assert.ok(result.structure.variables.some(v => v.name === 'x'));
  });

  test('Parser should throw error for unsupported languages', () => {
    const parser = new Parser();
    assert.throws(() => {
      parser.parseCode('code', 'java');
    }, /not currently supported/);
  });

  test('Parser should detect function structure correctly', () => {
    const parser = new Parser();
    const sampleCode = `
      function sum(a, b) {
        return a + b;
      }
      
      const multiply = function(a, b) {
        return a * b;
      };
      
      const divide = (a, b) => a / b;
    `;
    
    const result = parser._analyzeStructure(sampleCode, 'javascript');
    
    assert.ok(result.functions.some(fn => fn.name === 'sum'));
    assert.ok(result.functions.some(fn => fn.name === 'multiply'));
  });
}); 