const vscode = require('vscode');

/**
 * Parser Module for CodeWhiskers
 * Analyzes code structure, identifies patterns, and extracts information
 */
class Parser {
    constructor() {
        this.supportedLanguages = ['javascript', 'typescript'];
        
        // Enhanced pattern recognition
        this.patterns = {
            // Advanced JavaScript/TypeScript patterns
            asyncAwait: /\basync\b|\bawait\b/g,
            promises: /\.then\(|\bcatch\(|\bfinally\(|new\s+Promise/g,
            destructuring: /const\s*{\s*[^}]+\s*}\s*=|let\s*{\s*[^}]+\s*}\s*=|var\s*{\s*[^}]+\s*}\s*=/g,
            spreadRest: /\.\.\.(\w+)/g,
            templateLiterals: /`[^`]*`/g,
            arrowFunctions: /(\w+|\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\))\s*=>\s*{?/g,
            classProperties: /class\s+\w+\s*{[^}]*(\w+)\s*=\s*[^;]+;/g,
            staticMethods: /static\s+(\w+)\s*\(/g,
            optionalChaining: /\w+\?\.[\w\[\.]+/g,
            nullishCoalescing: /\w+\s*\?\?\s*\w+/g,
            
            // Design patterns
            singleton: /new\s+(\w+)\(\)[\s\S]*\1\s*\.getInstance\(\)|static\s+getInstance\(\)/g,
            factory: /create(\w+)|(\w+)Factory/g,
            observer: /addEventListener|removeEventListener|addListener|subscribe|notify|publish|observer/g,
            decorator: /Object\.assign\(\{\},|Object\.create\(\w+\)|decorator/g,
            
            // Complex structures
            recursion: /function\s*\w*\s*\([^)]*\)\s*{[\s\S]*\w+\s*\([^)]*\)[\s\S]*}/g,
            higherOrderFunctions: /function\s*\w*\s*\([^)]*\)\s*{[\s\S]*return\s+function/g,
            closures: /function\s*\w*\s*\([^)]*\)\s*{[\s\S]*function\s*\w*\s*\([^)]*\)[\s\S]*}/g
        };
        
        // Enhanced language features
        this.languageFeatures = {
            javascript: {
                standards: ['ES5', 'ES6+', 'Node.js', 'Browser', 'CommonJS', 'ESM'],
                frameworks: ['React', 'Angular', 'Vue', 'Express', 'Next.js'],
                libraries: ['jQuery', 'lodash', 'moment', 'axios']
            },
            typescript: {
                standards: ['TS2.0+', 'TSX', 'Decorators', 'Namespaces', 'Modules'],
                frameworks: ['React', 'Angular', 'Vue', 'NestJS', 'Next.js'],
                libraries: ['RxJS', 'TypeORM', 'TypeGraphQL']
            }
        };
    }

    /**
     * Parse code and create an abstract representation
     * @param {string} code - Code to be parsed
     * @param {string} language - Language identifier
     * @returns {object} Parsed code structure
     */
    parseCode(code, language) {
        if (!this.supportedLanguages.includes(language)) {
            throw new Error(`Language '${language}' is not currently supported`);
        }

        // Clean up the code to remove any leading/trailing whitespace
        const cleanCode = code.trim();
        
        console.log('Parsing code:', cleanCode);

        // Enhanced analysis
        const codeStructure = this._analyzeStructure(cleanCode, language);
        const detectedFeatures = this._detectLanguageFeatures(cleanCode, language);
        const complexPatterns = this._detectComplexPatterns(cleanCode);
        const compatibilityInfo = this._assessCompatibility(cleanCode, language);
        const controlFlow = this._analyzeControlFlow(cleanCode);
        
        return {
            type: 'code_block',
            language,
            content: cleanCode,
            structure: codeStructure,
            features: detectedFeatures,
            patterns: complexPatterns,
            compatibility: compatibilityInfo,
            controlFlow: controlFlow,
            metrics: this._calculateMetrics(cleanCode, codeStructure)
        };
    }

    /**
     * Find all references to a variable in a document
     * @param {string} variableName - Name of variable to trace
     * @param {vscode.TextDocument} document - Document to search in
     * @returns {Array<object>} List of variable occurrences
     */
    traceVariable(variableName, document) {
        const text = document.getText();
        const pattern = new RegExp(`\\b${this._escapeRegExp(variableName)}\\b`, 'g');
        const occurrences = [];
        
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const pos = document.positionAt(match.index);
            const line = document.lineAt(pos.line);
            
            occurrences.push({
                range: new vscode.Range(
                    pos, 
                    document.positionAt(match.index + variableName.length)
                ),
                lineText: line.text,
                isDefinition: this._isDefinition(line.text, match.index - line.range.start.character, variableName),
                position: pos
            });
        }
        
        return occurrences;
    }

    /**
     * Find sections of code that lack proper documentation
     * @param {vscode.TextDocument} document - Document to analyze
     * @returns {Array<object>} List of undocumented code sections
     */
    findUndocumentedCode(document) {
        const text = document.getText();
        const lines = text.split('\n');
        const undocumented = [];
        
        // Simple heuristic: find function definitions without preceding comments
        const functionPattern = /function\s+(\w+)\s*\(|(\w+)\s*=\s*function\s*\(|(\w+)\s*:\s*function\s*\(|(\w+)\s*\([^)]*\)\s*{/g;
        
        let lineIndex = 0;
        for (const line of lines) {
            if (functionPattern.test(line)) {
                // Check if the previous line has a comment
                const prevLine = lineIndex > 0 ? lines[lineIndex - 1] : '';
                if (!this._isComment(prevLine)) {
                    undocumented.push({
                        range: document.lineAt(lineIndex).range,
                        text: line,
                        type: 'function',
                        suggestion: this._generateDocTemplate(line)
                    });
                }
            }
            lineIndex++;
        }
        
        return undocumented;
    }

    /**
     * Find all functions in a document
     * @param {vscode.TextDocument} document - Document to analyze
     * @returns {Array<object>} List of functions with metadata
     */
    findFunctions(document) {
        const text = document.getText();
        const language = document.languageId;
        
        // In a real implementation, we would use proper AST parsing
        // This is a simplified approach
        
        const functions = [];
        const functionPattern = /function\s+(\w+)\s*\(([^)]*)\)|const\s+(\w+)\s*=\s*(\([^)]*\))\s*=>/g;
        
        let match;
        while ((match = functionPattern.exec(text)) !== null) {
            const name = match[1] || match[3];
            const params = match[2] || match[4];
            const pos = document.positionAt(match.index);
            
            // Get context (find function body)
            let braceCount = 0;
            let foundOpen = false;
            let bodyStart = match.index;
            let bodyEnd = text.length;
            
            for (let i = match.index; i < text.length; i++) {
                if (text[i] === '{') {
                    if (!foundOpen) {
                        foundOpen = true;
                        bodyStart = i + 1;
                    }
                    braceCount++;
                } else if (text[i] === '}') {
                    braceCount--;
                    if (braceCount === 0 && foundOpen) {
                        bodyEnd = i;
                        break;
                    }
                }
            }
            
            const body = text.substring(bodyStart, bodyEnd).trim();
            
            functions.push({
                name,
                params: this._parseParams(params),
                body,
                position: pos,
                range: new vscode.Range(
                    pos,
                    document.positionAt(bodyEnd + 1)
                )
            });
        }
        
        return functions;
    }

    /**
     * Get the structure of the entire document
     * @param {vscode.TextDocument} document - Document to analyze
     * @returns {object} Hierarchical structure of the document
     */
    getCodeStructure(document) {
        const text = document.getText();
        return this._analyzeStructure(text, document.languageId);
    }

    // Private helper methods

    /**
     * Analyze code structure and identify patterns
     * @private
     */
    _analyzeStructure(code, language) {
        // This would be a complex AST-based analysis in a real implementation
        // Here's a simplified version to detect basic structures
        
        const structure = {
            blocks: [],
            loops: [],
            conditionals: [],
            functions: [],
            classes: [],
            variables: []
        };
        
        // Find loops (for, while, do-while)
        const loopPattern = /\b(for|while|do)\b/g;
        let match;
        while ((match = loopPattern.exec(code)) !== null) {
            structure.loops.push({
                type: match[1],
                position: match.index
            });
        }
        
        // Find conditionals (if, else, switch)
        const conditionalPattern = /\b(if|else|switch)\b/g;
        while ((match = conditionalPattern.exec(code)) !== null) {
            structure.conditionals.push({
                type: match[1],
                position: match.index
            });
        }
        
        // Find function declarations
        const functionPattern = /function\s+(\w+)|(\w+)\s*=\s*function/g;
        while ((match = functionPattern.exec(code)) !== null) {
            structure.functions.push({
                name: match[1] || match[2],
                position: match.index
            });
        }
        
        // Find class declarations
        const classPattern = /class\s+(\w+)/g;
        while ((match = classPattern.exec(code)) !== null) {
            structure.classes.push({
                name: match[1],
                position: match.index
            });
        }
        
        // Find variable declarations
        const varPattern = /\b(var|let|const)\s+(\w+)\b/g;
        while ((match = varPattern.exec(code)) !== null) {
            structure.variables.push({
                name: match[2],
                kind: match[1],
                position: match.index
            });
        }
        
        return structure;
    }

    /**
     * Check if the line is a comment
     * @private
     */
    _isComment(line) {
        return line.trim().startsWith('//') || 
               line.trim().startsWith('/*') || 
               line.trim().startsWith('*');
    }

    /**
     * Check if this is a variable definition
     * @private
     */
    _isDefinition(lineText, index, varName) {
        const prefix = lineText.substring(0, index);
        return /\b(var|let|const)\s+$/.test(prefix) || 
               new RegExp(`\\b(function)\\s+${varName}\\s*\\(`).test(lineText);
    }

    /**
     * Generate a documentation template
     * @private
     */
    _generateDocTemplate(functionLine) {
        // Extract function name and parameters
        const nameMatch = functionLine.match(/function\s+(\w+)|(\w+)\s*=\s*function|(\w+)\s*\(/);
        const name = nameMatch ? (nameMatch[1] || nameMatch[2] || nameMatch[3]) : 'function';
        
        // Extract parameters
        const paramsMatch = functionLine.match(/\(([^)]*)\)/);
        const params = paramsMatch ? paramsMatch[1].split(',').map(p => p.trim()).filter(p => p) : [];
        
        let template = '/**\n';
        template += ` * ${name}\n`;
        template += ` *\n`;
        
        for (const param of params) {
            template += ` * @param {any} ${param} - Description\n`;
        }
        
        template += ` * @returns {any} - Description\n`;
        template += ` */`;
        
        return template;
    }

    /**
     * Parse function parameters
     * @private
     */
    _parseParams(paramsStr) {
        if (!paramsStr) return [];
        return paramsStr.split(',')
            .map(p => p.trim())
            .filter(p => p)
            .map(p => {
                const [name, defaultValue] = p.split('=').map(s => s.trim());
                return { name, defaultValue };
            });
    }

    /**
     * Escape special characters in regex
     * @private
     */
    _escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Detect language-specific features in the code
     * @param {string} code - Code to analyze
     * @param {string} language - Language identifier
     * @returns {object} Detected language features
     * @private
     */
    _detectLanguageFeatures(code, language) {
        const features = {
            standards: [],
            frameworks: [],
            libraries: []
        };
        
        const languageSpec = this.languageFeatures[language];
        
        // Detect language standards
        if (language === 'javascript' || language === 'typescript') {
            if (code.includes('class ') || code.includes('=>') || code.includes('const ') || 
                code.includes('let ') || code.includes('...')) {
                features.standards.push('ES6+');
            } else {
                features.standards.push('ES5');
            }
            
            if (code.includes('import ') || code.includes('export ')) {
                features.standards.push('ESM');
            }
            
            if (code.includes('require(') || code.includes('module.exports')) {
                features.standards.push('CommonJS');
            }
            
            if (code.includes('window.') || code.includes('document.') || 
                code.includes('localStorage') || code.includes('sessionStorage')) {
                features.standards.push('Browser');
            }
            
            if (code.includes('process.') || code.includes('__dirname') || 
                code.includes('__filename') || code.includes('fs.')) {
                features.standards.push('Node.js');
            }
        }
        
        // Detect frameworks
        languageSpec.frameworks.forEach(framework => {
            const pattern = new RegExp(`\\b${framework.toLowerCase()}\\b|\\b${framework}\\b`, 'i');
            if (pattern.test(code)) {
                features.frameworks.push(framework);
            }
        });
        
        // Special framework detection logic
        if (code.includes('React') || code.includes('react') || 
            code.includes('jsx') || code.includes('useState') || 
            code.includes('useEffect') || code.includes('<div>') || 
            code.includes('ReactDOM')) {
            if (!features.frameworks.includes('React')) {
                features.frameworks.push('React');
            }
        }
        
        if (code.includes('Component') || code.includes('@Component') || 
            code.includes('ngOnInit') || code.includes('@Injectable')) {
            if (!features.frameworks.includes('Angular')) {
                features.frameworks.push('Angular');
            }
        }
        
        if (code.includes('Vue') || code.includes('vue') || 
            code.includes('v-for') || code.includes('v-if') || 
            code.includes('Vue.component')) {
            if (!features.frameworks.includes('Vue')) {
                features.frameworks.push('Vue');
            }
        }
        
        // Detect libraries
        languageSpec.libraries.forEach(library => {
            const pattern = new RegExp(`\\b${library.toLowerCase()}\\b|\\b${library}\\b`, 'i');
            if (pattern.test(code)) {
                features.libraries.push(library);
            }
        });
        
        return features;
    }

    /**
     * Detect complex patterns in the code
     * @param {string} code - Code to analyze
     * @returns {Array<object>} Detected patterns with descriptions
     * @private
     */
    _detectComplexPatterns(code) {
        const detectedPatterns = [];
        
        // Check for each pattern
        for (const [patternName, regex] of Object.entries(this.patterns)) {
            regex.lastIndex = 0;
            if (regex.test(code)) {
                detectedPatterns.push({
                    name: patternName,
                    description: this._getPatternDescription(patternName)
                });
            }
        }
        
        // Advanced code structure analysis
        if (this._hasNestedLoops(code)) {
            detectedPatterns.push({
                name: 'nestedLoops',
                description: 'Contains nested loops which may impact performance',
                complexity: 'high'
            });
        }
        
        if (this._hasDeepNesting(code)) {
            detectedPatterns.push({
                name: 'deepNesting',
                description: 'Contains deeply nested code blocks that may reduce readability',
                complexity: 'high'
            });
        }
        
        if (this._hasComplexRegex(code)) {
            detectedPatterns.push({
                name: 'complexRegex',
                description: 'Contains complex regular expressions',
                complexity: 'high'
            });
        }
        
        return detectedPatterns;
    }

    /**
     * Assess code compatibility with different environments
     * @param {string} code - Code to analyze
     * @param {string} language - Language identifier
     * @returns {object} Compatibility information
     * @private
     */
    _assessCompatibility(code, language) {
        const compatibility = {
            browsers: {
                modern: true,
                legacy: true,
                issues: []
            },
            node: {
                compatible: false,
                minVersion: null,
                issues: []
            }
        };
        
        // Check browser compatibility
        if (code.includes('?.') || code.includes('??')) {
            compatibility.browsers.legacy = false;
            compatibility.browsers.issues.push('Optional chaining or nullish coalescing operators not supported in IE and older browsers');
        }
        
        if (code.includes('async') || code.includes('await')) {
            compatibility.browsers.legacy = false;
            compatibility.browsers.issues.push('Async/await not supported in IE and older browsers');
        }
        
        // Check Node.js compatibility
        if (code.includes('require(') || code.includes('module.exports') || 
            code.includes('process.') || code.includes('__dirname') || 
            code.includes('fs.') || code.includes('http.') || 
            code.includes('path.')) {
            
            compatibility.node.compatible = true;
            compatibility.node.minVersion = '6.0.0';
            
            // Determine minimum Node version based on features
            if (code.includes('?.') || code.includes('??')) {
                compatibility.node.minVersion = '14.0.0';
            } else if (code.includes('...') || code.includes('=>')) {
                compatibility.node.minVersion = '8.0.0';
            }
        }
        
        return compatibility;
    }

    /**
     * Analyze control flow in the code
     * @param {string} code - Code to analyze
     * @returns {object} Control flow information
     * @private
     */
    _analyzeControlFlow(code) {
        const controlFlow = {
            branches: [],
            loops: [],
            recursion: false,
            async: false,
            errorHandling: false,
            complexity: 'low'
        };
        
        // Count conditional branches
        const ifPattern = /\bif\s*\(/g;
        let match;
        while ((match = ifPattern.exec(code)) !== null) {
            controlFlow.branches.push({
                type: 'if',
                position: match.index
            });
        }
        
        const switchPattern = /\bswitch\s*\(/g;
        while ((match = switchPattern.exec(code)) !== null) {
            controlFlow.branches.push({
                type: 'switch',
                position: match.index
            });
        }
        
        // Count loops
        const loopPattern = /\b(for|while|do)\b/g;
        while ((match = loopPattern.exec(code)) !== null) {
            controlFlow.loops.push({
                type: match[1],
                position: match.index
            });
        }
        
        // Check for recursion
        const functionNamePattern = /function\s+(\w+)\s*\(/g;
        let functionNames = [];
        while ((match = functionNamePattern.exec(code)) !== null) {
            functionNames.push(match[1]);
        }
        
        // Check if any function calls itself
        for (const name of functionNames) {
            const callPattern = new RegExp(`\\b${name}\\s*\\(`, 'g');
            let callMatch;
            while ((callMatch = callPattern.exec(code)) !== null) {
                if (callMatch.index > functionNamePattern.lastIndex) {
                    controlFlow.recursion = true;
                    break;
                }
            }
            if (controlFlow.recursion) break;
        }
        
        // Check for async control flow
        if (code.includes('async') || code.includes('await') || 
            code.includes('.then(') || code.includes('.catch(')) {
            controlFlow.async = true;
        }
        
        // Check for error handling
        if (code.includes('try') && code.includes('catch')) {
            controlFlow.errorHandling = true;
        }
        
        // Determine control flow complexity
        const branchCount = controlFlow.branches.length;
        const loopCount = controlFlow.loops.length;
        const totalComplexity = branchCount + loopCount * 2 + (controlFlow.recursion ? 3 : 0);
        
        if (totalComplexity > 10) {
            controlFlow.complexity = 'high';
        } else if (totalComplexity > 5) {
            controlFlow.complexity = 'medium';
        }
        
        return controlFlow;
    }

    /**
     * Calculate code metrics
     * @param {string} code - Code to analyze
     * @param {object} structure - Analyzed code structure
     * @returns {object} Code metrics
     * @private
     */
    _calculateMetrics(code, structure) {
        const lines = code.split('\n');
        
        // Count lines with actual code (non-empty, non-comment)
        const codeLines = lines.filter(line => {
            const trimmed = line.trim();
            return trimmed.length > 0 && 
                  !trimmed.startsWith('//') && 
                  !trimmed.startsWith('*') && 
                  !trimmed.startsWith('/*');
        }).length;
        
        // Count comments
        const commentLines = lines.filter(line => {
            const trimmed = line.trim();
            return trimmed.startsWith('//') || 
                  trimmed.startsWith('*') || 
                  trimmed.startsWith('/*');
        }).length;
        
        // Calculate cyclomatic complexity (simplified)
        const conditionals = (code.match(/\bif\b/g) || []).length;
        const loops = (code.match(/\b(for|while|do)\b/g) || []).length;
        const ternary = (code.match(/\?/g) || []).length;
        const cyclomaticComplexity = 1 + conditionals + loops + ternary;
        
        return {
            totalLines: lines.length,
            codeLines: codeLines,
            commentLines: commentLines,
            commentRatio: commentLines / lines.length,
            cyclomaticComplexity: cyclomaticComplexity,
            functions: structure.functions.length,
            classes: structure.classes.length,
            maintainabilityIndex: this._calculateMaintainabilityIndex(
                cyclomaticComplexity, 
                codeLines, 
                commentRatio
            )
        };
    }

    /**
     * Calculate maintainability index
     * @param {number} cyclomaticComplexity - Cyclomatic complexity
     * @param {number} codeLines - Lines of code
     * @param {number} commentRatio - Ratio of comments to code
     * @returns {number} Maintainability index (0-100)
     * @private
     */
    _calculateMaintainabilityIndex(cyclomaticComplexity, codeLines, commentRatio) {
        // Standard formula for maintainability index
        let mi = 171 - 5.2 * Math.log(codeLines) - 0.23 * cyclomaticComplexity - 16.2 * Math.log(codeLines * (1 - commentRatio));
        
        // Normalize to 0-100 scale
        mi = Math.max(0, Math.min(100, mi));
        
        return Math.round(mi);
    }

    /**
     * Check if code has nested loops
     * @param {string} code - Code to analyze
     * @returns {boolean} True if nested loops are detected
     * @private
     */
    _hasNestedLoops(code) {
        const loopPattern = /\b(for|while|do)\b/g;
        let match;
        let loopDepth = 0;
        let maxDepth = 0;
        
        // Convert code to a stream of tokens for simplified parsing
        const tokens = code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '')  // Remove comments
                          .replace(/(".*?"|'.*?'|`.*?`)/g, '""')    // Remove string literals
                          .split(/\s+|([{}()[\],;])/g)              // Split into tokens
                          .filter(Boolean);                         // Remove empty tokens
        
        for (const token of tokens) {
            if (token === 'for' || token === 'while' || token === 'do') {
                loopDepth++;
                maxDepth = Math.max(maxDepth, loopDepth);
            } else if (token === '}') {
                // Simple heuristic: assume closing braces reduce loop depth
                if (loopDepth > 0) loopDepth--;
            }
        }
        
        return maxDepth > 1;
    }

    /**
     * Check if code has deep nesting
     * @param {string} code - Code to analyze
     * @returns {boolean} True if deep nesting is detected
     * @private
     */
    _hasDeepNesting(code) {
        // Count braces to determine nesting depth
        let depth = 0;
        let maxDepth = 0;
        
        for (const char of code) {
            if (char === '{') {
                depth++;
                maxDepth = Math.max(maxDepth, depth);
            } else if (char === '}') {
                depth = Math.max(0, depth - 1);
            }
        }
        
        return maxDepth > 4;  // Consider depth > 4 as deep nesting
    }

    /**
     * Check if code has complex regular expressions
     * @param {string} code - Code to analyze
     * @returns {boolean} True if complex regex is detected
     * @private
     */
    _hasComplexRegex(code) {
        // Find regex literals
        const regexPattern = /\/(?![\/\*])(?:[^\\/]|\\.)*\/[gimuy]*/g;
        let match;
        
        while ((match = regexPattern.exec(code)) !== null) {
            const regex = match[0];
            
            // Consider a regex complex if it meets certain criteria
            if (regex.length > 30 ||                          // Long regex
                (regex.match(/\(/g) || []).length > 5 ||      // Many groups
                (regex.match(/\[/g) || []).length > 3 ||      // Many character classes
                regex.includes('?=') || regex.includes('?!') ||  // Lookaheads/lookbehinds
                regex.includes('{2,') || regex.includes(',}')) { // Complex quantifiers
                
                return true;
            }
        }
        
        return false;
    }

    /**
     * Get description for a detected pattern
     * @param {string} patternName - Name of the pattern
     * @returns {string} Human-readable description
     * @private
     */
    _getPatternDescription(patternName) {
        const descriptions = {
            asyncAwait: 'Uses async/await for asynchronous operations',
            promises: 'Implements Promise-based asynchronous code',
            destructuring: 'Uses object or array destructuring',
            spreadRest: 'Uses spread or rest operators',
            templateLiterals: 'Uses template literals for string interpolation',
            arrowFunctions: 'Implements arrow functions',
            classProperties: 'Uses class properties (field declarations)',
            staticMethods: 'Implements static class methods',
            optionalChaining: 'Uses optional chaining for nullish property access',
            nullishCoalescing: 'Uses nullish coalescing operator',
            singleton: 'Implements Singleton design pattern',
            factory: 'Implements Factory design pattern',
            observer: 'Implements Observer design pattern',
            decorator: 'Implements Decorator design pattern',
            recursion: 'Contains recursive function calls',
            higherOrderFunctions: 'Uses higher-order functions',
            closures: 'Implements closures'
        };
        
        return descriptions[patternName] || 'Unknown pattern';
    }
}

module.exports = {
    Parser
}; 