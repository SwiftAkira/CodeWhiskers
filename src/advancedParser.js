const vscode = require('vscode');

/**
 * Advanced Parser Module for WhiskerCode
 * Extends parsing capabilities to handle more complex patterns and language features
 */
class AdvancedParser {
    constructor() {
        // Enhanced language patterns for more accurate parsing
        this.enhancedPatterns = {
            javascript: {
                // Improved function detection with arrow functions, generators, and async functions
                function: /(?:async\s+)?function\s*(?:\*\s*)?(\w+)\s*\(([^)]*)\)|const\s+(\w+)\s*=\s*(?:async\s*)?\s*(?:\([^)]*\)|[^=]+)\s*=>|(\w+)\s*=\s*(?:async\s*)?function\s*(?:\*\s*)?\s*\(/g,
                
                // Detect destructuring patterns
                destructuring: /const\s*{([^}]*)}\s*=|let\s*{([^}]*)}\s*=|var\s*{([^}]*)}\s*=|const\s*\[([^\]]*)\]\s*=|let\s*\[([^\]]*)\]\s*=|var\s*\[([^\]]*)\]\s*=/g,
                
                // Advanced class detection including inheritance and static methods
                class: /class\s+(\w+)(?:\s+extends\s+(\w+))?\s*{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*}/gs,
                
                // Detect modern JS features
                spreadOperator: /\.\.\.(\w+)/g,
                optionalChaining: /(\w+(?:\.\w+)*)(?:\?\.)(?:\w+|\[\w+\])/g,
                nullishCoalescing: /(\w+(?:\.\w+)*)\s*\?\?\s*/g,
                
                // Detect complex logic patterns
                ternaryNesting: /\?[^:?]*\?/g,
                callbackNesting: /\([^()]*=>\s*{[^{}]*\([^()]*=>/g,
                promiseChaining: /\.then\([^)]*\)\.then\(/g
            },
            typescript: {
                // TypeScript-specific patterns
                interface: /interface\s+(\w+)(?:\s+extends\s+(?:\w+(?:\s*,\s*\w+)*))?/g,
                type: /type\s+(\w+)(?:\s*<[^>]*>)?\s*=/g,
                genericType: /<(?:[^<>]|<[^<>]*>)*>/g,
                decorator: /@(\w+)(?:\([^)]*\))?/g,
                typeCasting: /as\s+(?:const|[A-Za-z][\w\.<>]*|\([^)]*\))/g,
                enumDeclaration: /enum\s+(\w+)\s*{[^}]*}/g
            },
            react: {
                // React-specific patterns
                hook: /use[A-Z]\w*/g,
                component: /function\s+([A-Z]\w*)\s*\([^)]*\)|const\s+([A-Z]\w*)\s*=\s*(?:React\.)?memo\(/g,
                jsx: /<[A-Z]\w*[^>]*>[^<]*<\/[A-Z]\w*>|<[A-Z]\w*[^>]*\/>/g,
                contextApi: /(?:React\.)?createContext|useContext\(/g,
                propsDestructuring: /\(\s*{\s*([^}]*)\s*}\s*\)/g
            }
        };
        
        // Advanced code quality metrics
        this.complexityMetrics = {
            branchingDepth: code => {
                // Measure the deepest nesting of conditional statements
                const lines = code.split('\n');
                let maxDepth = 0;
                let currentDepth = 0;
                
                const indentPattern = /^\s*/;
                let prevIndentLevel = 0;
                
                lines.forEach(line => {
                    if (line.trim() === '') return;
                    
                    const indentMatch = line.match(indentPattern);
                    const indentLevel = indentMatch ? indentMatch[0].length : 0;
                    
                    // Detect increase in indentation
                    if (indentLevel > prevIndentLevel) {
                        currentDepth += Math.floor((indentLevel - prevIndentLevel) / 2);
                    }
                    // Detect decrease in indentation
                    else if (indentLevel < prevIndentLevel) {
                        currentDepth -= Math.floor((prevIndentLevel - indentLevel) / 2);
                    }
                    
                    prevIndentLevel = indentLevel;
                    maxDepth = Math.max(maxDepth, currentDepth);
                });
                
                return maxDepth;
            },
            
            cognitiveComplexity: code => {
                // A simplified measure of cognitive complexity
                let complexity = 0;
                
                // Count control flow structures
                const controlFlow = (code.match(/if|else|for|while|do|switch|case|catch|return|break|continue/g) || []).length;
                complexity += controlFlow;
                
                // Count logical operators (each one is a decision point)
                const logicalOps = (code.match(/&&|\|\||\?\./g) || []).length;
                complexity += logicalOps;
                
                // Count nested function declarations and lambda expressions
                const nestedFuncs = (code.match(/function|=>/g) || []).length - 1; // -1 to account for the main function
                complexity += nestedFuncs * 2; // Nested functions add more complexity
                
                // Count the ? operator in ternary expressions
                const ternary = (code.match(/\?(?!\.)/g) || []).length;
                complexity += ternary;
                
                return complexity;
            }
        };
    }
    
    /**
     * Parse code with enhanced pattern detection
     * @param {string} code - The code to parse
     * @param {string} language - Language of the code
     * @returns {object} Enhanced parsing results
     */
    parseCode(code, language) {
        // Determine appropriate pattern set
        let patterns = this.enhancedPatterns.javascript;
        if (language === 'typescript' || language === 'typescriptreact') {
            patterns = {...this.enhancedPatterns.javascript, ...this.enhancedPatterns.typescript};
        }
        
        // React patterns for JSX files
        const isReact = language === 'javascriptreact' || language === 'typescriptreact';
        if (isReact) {
            patterns = {...patterns, ...this.enhancedPatterns.react};
        }
        
        const results = {
            language,
            complexity: {
                branchingDepth: this.complexityMetrics.branchingDepth(code),
                cognitiveComplexity: this.complexityMetrics.cognitiveComplexity(code)
            },
            patterns: {}
        };
        
        // Detect patterns
        for (const [name, pattern] of Object.entries(patterns)) {
            pattern.lastIndex = 0;
            const matches = [];
            let match;
            
            while ((match = pattern.exec(code)) !== null) {
                // Calculate line number
                const upToMatch = code.substring(0, match.index);
                const lineNumber = upToMatch.split('\n').length;
                
                matches.push({
                    text: match[0],
                    groups: match.slice(1).filter(Boolean),
                    position: match.index,
                    line: lineNumber
                });
            }
            
            results.patterns[name] = matches;
        }
        
        // Additional analysis for specific language features
        if (isReact) {
            results.reactAnalysis = this._analyzeReactCode(code, results.patterns);
        }
        
        if (language === 'typescript' || language === 'typescriptreact') {
            results.typeAnalysis = this._analyzeTypeScript(code, results.patterns);
        }
        
        return results;
    }
    
    /**
     * Analyze React-specific code patterns
     * @private
     */
    _analyzeReactCode(code, patterns) {
        const analysis = {
            hooks: [],
            components: [],
            propUsage: {}
        };
        
        // Extract hooks
        if (patterns.hook) {
            patterns.hook.forEach(match => {
                analysis.hooks.push(match.text);
            });
        }
        
        // Extract components
        if (patterns.component) {
            patterns.component.forEach(match => {
                const componentName = match.groups[0];
                analysis.components.push(componentName);
                
                // Find props usage for this component
                const componentIndex = match.position;
                const componentEnd = code.indexOf(')', componentIndex);
                const componentParams = code.substring(componentIndex, componentEnd);
                
                // Look for destructured props
                const propsMatch = componentParams.match(/{([^}]*)}/);
                if (propsMatch) {
                    const props = propsMatch[1].split(',').map(p => p.trim()).filter(Boolean);
                    analysis.propUsage[componentName] = props;
                }
            });
        }
        
        return analysis;
    }
    
    /**
     * Analyze TypeScript-specific code patterns
     * @private
     */
    _analyzeTypeScript(code, patterns) {
        const analysis = {
            interfaces: [],
            types: [],
            genericTypes: [],
            typeAssertions: []
        };
        
        // Extract interfaces
        if (patterns.interface) {
            patterns.interface.forEach(match => {
                analysis.interfaces.push({
                    name: match.groups[0],
                    line: match.line
                });
            });
        }
        
        // Extract types
        if (patterns.type) {
            patterns.type.forEach(match => {
                analysis.types.push({
                    name: match.groups[0],
                    line: match.line
                });
            });
        }
        
        // Extract type assertions
        if (patterns.typeCasting) {
            patterns.typeCasting.forEach(match => {
                analysis.typeAssertions.push({
                    text: match.text,
                    line: match.line
                });
            });
        }
        
        return analysis;
    }
    
    /**
     * Analyze code for potential refactoring opportunities
     * @param {string} code - The code to analyze
     * @param {string} language - Language of the code
     * @returns {object[]} List of refactoring suggestions
     */
    findRefactoringOpportunities(code, language) {
        const opportunities = [];
        
        // Parse code with enhanced patterns
        const parseResult = this.parseCode(code, language);
        
        // Check for complex functions
        if (parseResult.complexity.cognitiveComplexity > 15) {
            opportunities.push({
                type: 'high_complexity',
                severity: 'high',
                description: 'Function has high cognitive complexity',
                suggestion: 'Consider breaking down into smaller functions',
                complexity: parseResult.complexity.cognitiveComplexity
            });
        }
        
        // Check for deep nesting
        if (parseResult.complexity.branchingDepth > 3) {
            opportunities.push({
                type: 'deep_nesting',
                severity: 'medium',
                description: `Code has deep nesting (depth: ${parseResult.complexity.branchingDepth})`,
                suggestion: 'Refactor to reduce nesting using early returns or extraction',
                depth: parseResult.complexity.branchingDepth
            });
        }
        
        // Check for duplicated code patterns
        const duplicatedPatterns = this._findDuplicatedPatterns(code);
        if (duplicatedPatterns.length > 0) {
            duplicatedPatterns.forEach(pattern => {
                opportunities.push({
                    type: 'duplicated_code',
                    severity: 'medium',
                    description: `Duplicated code pattern (${pattern.count} instances)`,
                    suggestion: 'Extract to a reusable function or constant',
                    pattern: pattern.text.substring(0, 50) + (pattern.text.length > 50 ? '...' : '')
                });
            });
        }
        
        // Language-specific opportunities
        if (language === 'javascriptreact' || language === 'typescriptreact') {
            if (parseResult.patterns.promiseChaining && parseResult.patterns.promiseChaining.length > 0) {
                opportunities.push({
                    type: 'promise_chaining',
                    severity: 'medium',
                    description: 'Multiple promise chain detected',
                    suggestion: 'Consider using async/await for better readability',
                    count: parseResult.patterns.promiseChaining.length
                });
            }
        }
        
        return opportunities;
    }
    
    /**
     * Find duplicated code patterns in the source
     * @private
     */
    _findDuplicatedPatterns(code) {
        const minLength = 30; // Minimum characters to consider a duplication
        const patterns = [];
        const lines = code.split('\n');
        
        // Build a map of potential patterns
        const patternMap = new Map();
        
        // Analyze consecutive lines as potential patterns
        for (let i = 0; i < lines.length - 1; i++) {
            for (let end = i + 1; end < Math.min(i + 5, lines.length); end++) {
                const pattern = lines.slice(i, end + 1).join('\n').trim();
                if (pattern.length >= minLength) {
                    if (patternMap.has(pattern)) {
                        patternMap.set(pattern, patternMap.get(pattern) + 1);
                    } else {
                        patternMap.set(pattern, 1);
                    }
                }
            }
        }
        
        // Filter for actual duplications
        for (const [pattern, count] of patternMap.entries()) {
            if (count > 1) {
                patterns.push({
                    text: pattern,
                    count
                });
            }
        }
        
        return patterns;
    }
}

module.exports = { AdvancedParser }; 