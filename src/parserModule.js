const vscode = require('vscode');

/**
 * Parser Module for CodeWhiskers
 * Analyzes code structure, identifies patterns, and extracts information
 */
class Parser {
    constructor() {
        this.supportedLanguages = ['javascript', 'typescript', 'python', 'java', 'csharp', 'javascriptreact', 'typescriptreact'];
        
        // Define language-specific patterns for parsing
        this.languagePatterns = {
            javascript: {
                function: /function\s+(\w+)\s*\(([^)]*)\)|const\s+(\w+)\s*=\s*(\([^)]*\))\s*=>|(\w+)\s*=\s*function\s*\(/g,
                class: /class\s+(\w+)/g,
                loop: /\b(for|while|do)\b/g,
                conditional: /\b(if|else|switch)\b/g,
                variable: /\b(var|let|const)\s+(\w+)\b/g,
                comment: /\/\/.*|\/\*[\s\S]*?\*\//g,
                docComment: /\/\*\*[\s\S]*?\*\//g
            },
            typescript: {
                function: /function\s+(\w+)\s*\(([^)]*)\)|const\s+(\w+)\s*=\s*(\([^)]*\))\s*=>|(\w+)\s*=\s*function\s*\(/g,
                class: /class\s+(\w+)/g,
                interface: /interface\s+(\w+)/g,
                loop: /\b(for|while|do)\b/g,
                conditional: /\b(if|else|switch)\b/g,
                variable: /\b(var|let|const)\s+(\w+)\b/g,
                type: /type\s+(\w+)\s*=/g,
                comment: /\/\/.*|\/\*[\s\S]*?\*\//g,
                docComment: /\/\*\*[\s\S]*?\*\//g
            },
            // Adding React (JSX) patterns
            javascriptreact: {
                function: /function\s+(\w+)\s*\(([^)]*)\)|const\s+(\w+)\s*=\s*(\([^)]*\))\s*=>|(\w+)\s*=\s*function\s*\(/g,
                component: /const\s+(\w+)\s*=\s*(?:React\.)?(?:memo\()?(?:forwardRef\()?(?:function|React\.FC|\(\{[^}]*\}\))/g,
                hooks: /use[A-Z]\w+/g,
                jsx: /<([A-Z]\w*)/g, // Component JSX tags start with capital letters
                props: /\{([^{}]+)\}/g,
                class: /class\s+(\w+)(?:\s+extends\s+(?:React\.)?Component)?/g,
                loop: /\b(for|while|do|map|forEach|filter)\b/g,
                conditional: /\b(if|else|switch|&&|\?)\b/g,
                variable: /\b(var|let|const)\s+(\w+)\b/g,
                comment: /\/\/.*|\/\*[\s\S]*?\*\//g,
                docComment: /\/\*\*[\s\S]*?\*\//g
            },
            // Adding TypeScript React (TSX) patterns
            typescriptreact: {
                function: /function\s+(\w+)\s*\(([^)]*)\)|const\s+(\w+)\s*=\s*(\([^)]*\))\s*=>|(\w+)\s*=\s*function\s*\(/g,
                component: /const\s+(\w+)\s*=\s*(?:React\.)?(?:memo\()?(?:forwardRef\()?(?:function|React\.FC<[^>]*>|\(\{[^}]*\}(?::\s*[^)]+)?\))/g,
                hooks: /use[A-Z]\w+/g,
                jsx: /<([A-Z]\w*)/g,
                props: /\{([^{}]+)\}/g,
                interface: /interface\s+(\w+)(?:Props)?\s*(?:extends\s+[^{]+)?/g,
                type: /type\s+(\w+)(?:Props)?\s*=/g,
                class: /class\s+(\w+)(?:\s+extends\s+(?:React\.)?Component<[^,>]+(?:,\s*[^>]+)?>)?/g,
                loop: /\b(for|while|do|map|forEach|filter)\b/g,
                conditional: /\b(if|else|switch|&&|\?)\b/g,
                variable: /\b(var|let|const)\s+(\w+)\b/g,
                comment: /\/\/.*|\/\*[\s\S]*?\*\//g,
                docComment: /\/\*\*[\s\S]*?\*\//g
            },
            python: {
                function: /def\s+(\w+)\s*\(([^)]*)\):/g,
                class: /class\s+(\w+)(?:\(([^)]*)\))?:/g,
                loop: /\b(for|while)\b/g,
                conditional: /\b(if|elif|else)\b/g,
                variable: /(\w+)\s*=/g,
                comment: /#.*/g,
                docComment: /\"\"\"[\s\S]*?\"\"\"/g,
                indentation: /^(\s+)/gm
            },
            java: {
                function: /(?:public|private|protected|static|\s)+[\w\<\>\[\]]+\s+(\w+)\s*\(([^)]*)\)\s*(?:\{|throws)/g,
                class: /class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?/g,
                interface: /interface\s+(\w+)/g,
                loop: /\b(for|while|do)\b/g,
                conditional: /\b(if|else|switch)\b/g,
                variable: /(?:(?:final|static)\s+)?(?:[\w\<\>\[\]]+)\s+(\w+)\s*(?:=|;)/g,
                comment: /\/\/.*|\/\*[\s\S]*?\*\//g,
                docComment: /\/\*\*[\s\S]*?\*\//g
            },
            csharp: {
                function: /(?:public|private|protected|internal|static|\s)+[\w\<\>\[\]]+\s+(\w+)\s*\(([^)]*)\)\s*(?:\{|=>)/g,
                class: /class\s+(\w+)(?:\s*:\s*([^{]+))?/g,
                interface: /interface\s+(\w+)/g,
                loop: /\b(for|foreach|while|do)\b/g,
                conditional: /\b(if|else|switch)\b/g,
                variable: /(?:(?:readonly|const|static)\s+)?(?:[\w\<\>\[\]]+)\s+(\w+)\s*(?:=|;)/g,
                comment: /\/\/.*|\/\*[\s\S]*?\*\//g,
                docComment: /\/\/\/.*|\/\*\*[\s\S]*?\*\//g
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
        
        console.log(`Parsing ${language} code:`, cleanCode.substring(0, 50) + (cleanCode.length > 50 ? '...' : ''));

        // Analyze code structure based on language-specific patterns
        const structure = this._analyzeStructure(cleanCode, language);
        
        // Determine code complexity and features based on language
        const complexity = this._determineComplexity(structure, language);
        const features = this._detectLanguageFeatures(cleanCode, language);
        
        return {
            type: 'code_block',
            language,
            content: cleanCode,
            structure: structure,
            complexity: complexity,
            features: features
        };
    }

    /**
     * Find all references to a variable in a document
     * @param {string} variableName - Name of variable to trace
     * @param {string|vscode.TextDocument} documentOrText - Document or text content to search in
     * @param {string} language - Language of the code
     * @returns {Array<object>} List of variable occurrences
     */
    traceVariable(variableName, documentOrText, language) {
        let text;
        
        // Handle either document object or direct text input
        if (typeof documentOrText === 'string') {
            text = documentOrText;
        } else if (documentOrText && typeof documentOrText.getText === 'function') {
            text = documentOrText.getText();
            if (!language) {
                language = documentOrText.languageId;
            }
        } else {
            throw new Error('Invalid document or text provided');
        }

        if (!language) {
            throw new Error('Language must be specified');
        }
        
        let pattern;
        
        // Use language-specific patterns for variable detection
        if (language === 'python') {
            // In Python, variable usage doesn't typically have type declarations
            pattern = new RegExp(`\\b${this._escapeRegExp(variableName)}\\b(?!\\s*\\()`, 'g');
        } else if (language === 'java' || language === 'csharp') {
            // For Java and C#, ignore usage in comments
            pattern = new RegExp(`(?<!//|/\\*)\\b${this._escapeRegExp(variableName)}\\b(?!\\s*\\()`, 'g');
        } else {
            // Default for JS/TS
            pattern = new RegExp(`\\b${this._escapeRegExp(variableName)}\\b`, 'g');
        }
        
        const occurrences = [];
        const lines = text.split('\n');
        
        let match;
        while ((match = pattern.exec(text)) !== null) {
            // Calculate line and character position
            let lineIndex = 0;
            let charPosition = match.index;
            
            // Find the line number and character position
            for (let i = 0; i < lines.length; i++) {
                if (charPosition <= lines[i].length) {
                    lineIndex = i;
                    break;
                }
                // +1 for the newline character
                charPosition -= (lines[i].length + 1);
            }
            
            const lineText = lines[lineIndex];
            
            occurrences.push({
                position: {
                    line: lineIndex,
                    character: charPosition
                },
                lineText: lineText,
                isDefinition: this._isDefinition(lineText, charPosition, variableName, language)
            });
        }
        
        return occurrences;
    }

    /**
     * Find sections of code that lack proper documentation
     * @param {string|vscode.TextDocument} documentOrText - Document or text content to analyze
     * @param {string} language - Language of the code
     * @returns {Array<object>} List of undocumented code sections
     */
    findUndocumentedCode(documentOrText, language) {
        let text;
        
        // Handle either document object or direct text input
        if (typeof documentOrText === 'string') {
            text = documentOrText;
        } else if (documentOrText && typeof documentOrText.getText === 'function') {
            text = documentOrText.getText();
            if (!language) {
                language = documentOrText.languageId;
            }
        } else {
            throw new Error('Invalid document or text provided');
        }

        if (!language) {
            throw new Error('Language must be specified');
        }
        
        const lines = text.split('\n');
        const undocumented = [];
        
        // Get language-specific patterns
        const patterns = this.languagePatterns[language] || this.languagePatterns.javascript;
        const functionPattern = patterns.function;
        
        let lineIndex = 0;
        for (const line of lines) {
            // Reset lastIndex to avoid issues with global regex
            functionPattern.lastIndex = 0;
            
            if (functionPattern.test(line)) {
                // Check if the previous line(s) have a comment
                let isDocumented = false;
                
                // Look for documentation in previous lines
                for (let i = 1; i <= 3; i++) {
                    if (lineIndex - i < 0) break;
                    
                    const prevLine = lines[lineIndex - i];
                    if (this._isComment(prevLine, language)) {
                        isDocumented = true;
                        break;
                    }
                }
                
                if (!isDocumented) {
                    undocumented.push({
                        line: lineIndex,
                        text: line,
                        type: 'function',
                        suggestion: this._generateDocTemplate(line, language)
                    });
                }
            }
            lineIndex++;
        }
        
        return undocumented;
    }

    /**
     * Find all functions in a document
     * @param {string|vscode.TextDocument} documentOrText - Document or text content to analyze
     * @param {string} language - Language of the code
     * @returns {Array<object>} List of functions with metadata
     */
    findFunctions(documentOrText, language) {
        let text;
        
        // Handle either document object or direct text input
        if (typeof documentOrText === 'string') {
            text = documentOrText;
        } else if (documentOrText && typeof documentOrText.getText === 'function') {
            text = documentOrText.getText();
            if (!language) {
                language = documentOrText.languageId;
            }
        } else {
            throw new Error('Invalid document or text provided');
        }

        if (!language) {
            throw new Error('Language must be specified');
        }
        
        // Get language-specific function pattern
        const patterns = this.languagePatterns[language] || this.languagePatterns.javascript;
        const functionPattern = patterns.function;
        
        const functions = [];
        let match;
        
        // Reset lastIndex to ensure we start from the beginning
        functionPattern.lastIndex = 0;
        
        while ((match = functionPattern.exec(text)) !== null) {
            // Extract name and parameters based on language
            let name, params;
            
            if (language === 'python') {
                name = match[1];
                params = match[2];
            } else if (language === 'java' || language === 'csharp') {
                name = match[1];
                params = match[2];
            } else {
                // JavaScript/TypeScript
                name = match[1] || match[3] || match[5];
                params = match[2] || match[4];
            }
            
            // Get function body (with language-specific logic)
            let bodyStart, bodyEnd;
            const matchIndex = match.index;
            
            if (language === 'python') {
                // Python uses indentation, so we need to find the indented block
                bodyStart = text.indexOf(':', matchIndex) + 1;
                
                // Find the end of the indented block
                const indentationMatch = /^(\s+)/m.exec(text.substring(bodyStart));
                if (indentationMatch) {
                    const indentation = indentationMatch[1];
                    const nextLineWithLessIndentation = new RegExp(`\\n(?!${indentation}|\\s{${indentation.length},})`, 'g');
                    nextLineWithLessIndentation.lastIndex = bodyStart;
                    
                    const endMatch = nextLineWithLessIndentation.exec(text);
                    bodyEnd = endMatch ? endMatch.index : text.length;
                } else {
                    bodyEnd = text.length;
                }
            } else {
                // For languages with braces
                let braceCount = 0;
                let foundOpen = false;
                bodyStart = matchIndex;
                bodyEnd = text.length;
                
                for (let i = matchIndex; i < text.length; i++) {
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
            }
            
            const body = text.substring(bodyStart, bodyEnd).trim();
            
            // Calculate line numbers for the function
            const textBeforeMatch = text.substring(0, matchIndex);
            const startLine = (textBeforeMatch.match(/\n/g) || []).length;
            const textBeforeEnd = text.substring(0, bodyEnd);
            const endLine = (textBeforeEnd.match(/\n/g) || []).length;
            
            functions.push({
                name,
                params: this._parseParams(params, language),
                body,
                position: {
                    line: startLine,
                    character: matchIndex - textBeforeMatch.lastIndexOf('\n') - 1
                },
                range: {
                    start: matchIndex,
                    end: bodyEnd
                },
                lineRange: {
                    start: startLine,
                    end: endLine
                },
                language
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
        // Get language-specific patterns
        const patterns = this.languagePatterns[language] || this.languagePatterns.javascript;
        
        const structure = {
            blocks: [],
            loops: [],
            conditionals: [],
            functions: [],
            classes: [],
            variables: []
        };
        
        // Special handling for React-based languages
        if (language === 'javascriptreact' || language === 'typescriptreact') {
            structure.components = [];
            structure.hooks = [];
            structure.jsxElements = [];
            
            // Find React components
            const componentPattern = patterns.component;
            componentPattern.lastIndex = 0;
            let match;
            while ((match = componentPattern.exec(code)) !== null) {
                structure.components.push({
                    name: match[1],
                    position: match.index
                });
            }
            
            // Find React hooks
            const hooksPattern = patterns.hooks;
            hooksPattern.lastIndex = 0;
            while ((match = hooksPattern.exec(code)) !== null) {
                structure.hooks.push({
                    name: match[0],
                    position: match.index
                });
            }
            
            // Find JSX elements
            const jsxPattern = patterns.jsx;
            jsxPattern.lastIndex = 0;
            while ((match = jsxPattern.exec(code)) !== null) {
                structure.jsxElements.push({
                    name: match[1],
                    position: match.index
                });
            }
        }
        
        // Find loops
        const loopPattern = patterns.loop;
        loopPattern.lastIndex = 0;
        let match;
        while ((match = loopPattern.exec(code)) !== null) {
            structure.loops.push({
                type: match[1],
                position: match.index
            });
        }
        
        // Find conditionals
        const conditionalPattern = patterns.conditional;
        conditionalPattern.lastIndex = 0;
        while ((match = conditionalPattern.exec(code)) !== null) {
            structure.conditionals.push({
                type: match[1],
                position: match.index
            });
        }
        
        // Find function declarations
        const functionPattern = patterns.function;
        functionPattern.lastIndex = 0;
        while ((match = functionPattern.exec(code)) !== null) {
            // Extract name based on language
            let name;
            if (language === 'python') {
                name = match[1];
            } else if (language === 'java' || language === 'csharp') {
                name = match[1];
            } else {
                name = match[1] || match[3] || match[5];
            }
            
            structure.functions.push({
                name,
                position: match.index
            });
        }
        
        // Find class declarations
        const classPattern = patterns.class;
        classPattern.lastIndex = 0;
        while ((match = classPattern.exec(code)) !== null) {
            structure.classes.push({
                name: match[1],
                position: match.index
            });
        }
        
        // Find variable declarations
        const varPattern = patterns.variable;
        varPattern.lastIndex = 0;
        while ((match = varPattern.exec(code)) !== null) {
            // Extract variable name based on language
            let name, kind;
            
            if (language === 'python') {
                name = match[1];
                kind = 'variable';
            } else if (language === 'java' || language === 'csharp') {
                name = match[1];
                kind = match[0].includes('final') || match[0].includes('const') ? 'constant' : 'variable';
            } else {
                // JavaScript/TypeScript/React
                name = match[2];
                kind = match[1];
            }
            
            structure.variables.push({
                name,
                kind,
                position: match.index
            });
        }
        
        return structure;
    }

    /**
     * Determine complexity of the code
     * @private
     */
    _determineComplexity(structure, language) {
        // Special handling for React-based code
        if (language === 'javascriptreact' || language === 'typescriptreact') {
            const totalItems = 
                structure.loops.length + 
                structure.conditionals.length * 0.5 + 
                structure.functions.length * 0.3 + 
                structure.classes.length * 0.7 +
                (structure.components ? structure.components.length * 0.8 : 0) +
                (structure.hooks ? structure.hooks.length * 0.5 : 0);
            
            if (totalItems > 12) {
                return 'high';
            } else if (totalItems > 6) {
                return 'medium';
            } else {
                return 'low';
            }
        } else {
            const totalItems = 
                structure.loops.length + 
                structure.conditionals.length * 0.5 + 
                structure.functions.length * 0.3 + 
                structure.classes.length * 0.7;
            
            if (totalItems > 10) {
                return 'high';
            } else if (totalItems > 5) {
                return 'medium';
            } else {
                return 'low';
            }
        }
    }

    /**
     * Detect language-specific features
     * @private
     */
    _detectLanguageFeatures(code, language) {
        const features = [];
        
        if (language === 'javascript' || language === 'typescript') {
            if (code.includes('async') && code.includes('await')) features.push('async/await');
            if (code.includes('=>')) features.push('arrow functions');
            if (code.includes('...')) features.push('spread/rest');
            if (code.match(/`[^`]*`/)) features.push('template literals');
            if (language === 'typescript') {
                if (code.includes('interface ')) features.push('interfaces');
                if (code.includes('<') && code.includes('>')) features.push('generics');
            }
        } else if (language === 'javascriptreact' || language === 'typescriptreact') {
            // React specific features
            if (code.includes('useState(') || code.includes('React.useState(')) features.push('hooks:state');
            if (code.includes('useEffect(') || code.includes('React.useEffect(')) features.push('hooks:effects');
            if (code.includes('useContext(') || code.includes('React.useContext(')) features.push('hooks:context');
            if (code.includes('useRef(') || code.includes('React.useRef(')) features.push('hooks:refs');
            if (code.includes('useCallback(') || code.includes('React.useCallback(')) features.push('hooks:callback');
            if (code.includes('useMemo(') || code.includes('React.useMemo(')) features.push('hooks:memo');
            if (code.includes('<') && code.includes('/>')) features.push('JSX');
            if (code.includes('props')) features.push('props');
            if (code.includes('Fragment') || code.includes('<>')) features.push('fragment');
            if (code.includes('React.memo') || code.includes('memo(')) features.push('memoization');
            if (code.includes('styled')) features.push('styled-components');
            if (code.includes('StyleSheet')) features.push('react-native:stylesheet');
            if (code.includes('Animated.')) features.push('react-native:animated');
            if (code.includes('<View') || code.includes('<Text') || code.includes('<ScrollView')) features.push('react-native:components');
            
            // Also include basic JS features
            if (code.includes('async') && code.includes('await')) features.push('async/await');
            if (code.includes('=>')) features.push('arrow functions');
            if (code.includes('...')) features.push('spread/rest');
            if (code.match(/`[^`]*`/)) features.push('template literals');
            
            if (language === 'typescriptreact') {
                if (code.includes('interface ')) features.push('interfaces');
                if (code.includes('<') && code.includes('>') && code.includes('type ')) features.push('generics');
                if (code.includes('Props')) features.push('typescript:props');
            }
        } else if (language === 'python') {
            if (code.includes('async def') && code.includes('await')) features.push('async/await');
            if (code.includes('yield')) features.push('generators');
            if (code.includes('with')) features.push('context managers');
            if (code.includes('lambda')) features.push('lambda functions');
            if (code.includes('comprehension')) features.push('list comprehensions');
        } else if (language === 'java') {
            if (code.includes('@Override')) features.push('annotations');
            if (code.includes('extends')) features.push('inheritance');
            if (code.includes('implements')) features.push('interfaces');
            if (code.includes('<') && code.includes('>')) features.push('generics');
            if (code.includes('try') && code.includes('catch')) features.push('exception handling');
        } else if (language === 'csharp') {
            if (code.includes('async') && code.includes('await')) features.push('async/await');
            if (code.includes('LINQ')) features.push('LINQ');
            if (code.includes('=>')) features.push('lambda expressions');
            if (code.includes('<') && code.includes('>')) features.push('generics');
            if (code.includes('yield')) features.push('iterators');
        }
        
        return features;
    }

    /**
     * Check if the given line is a comment
     * @private
     */
    _isComment(line, language = 'javascript') {
        if (language === 'python') {
            return line.trim().startsWith('#') || line.trim().startsWith('"""');
        } else if (language === 'java' || language === 'csharp' || language === 'javascript' || language === 'typescript') {
            return line.trim().startsWith('//') || 
                   line.trim().startsWith('/*') || 
                   line.trim().startsWith('*') ||
                   line.trim().startsWith('/**');
        }
        return false;
    }

    /**
     * Check if this is a variable definition
     * @private
     */
    _isDefinition(lineText, index, varName, language = 'javascript') {
        const prefix = lineText.substring(0, index);
        
        if (language === 'python') {
            return prefix.endsWith('=') || prefix.includes(varName + ' =');
        } else if (language === 'java' || language === 'csharp') {
            return /\b(int|float|double|String|boolean|var|object|class|struct|interface)\s+$/.test(prefix) ||
                   new RegExp(`\\b(public|private|protected)\\s+[\\w<>\\[\\]]+\\s+${varName}\\s*`).test(lineText);
        } else {
            // JavaScript/TypeScript
            return /\b(var|let|const)\s+$/.test(prefix) || 
                   new RegExp(`\\b(function)\\s+${varName}\\s*\\(`).test(lineText);
        }
    }

    /**
     * Generate a documentation template
     * @private
     */
    _generateDocTemplate(functionLine, language = 'javascript') {
        let name, params = [];
        
        if (language === 'python') {
            const match = functionLine.match(/def\s+(\w+)\s*\(([^)]*)\):/);
            if (match) {
                name = match[1];
                params = match[2].split(',').map(p => p.trim()).filter(p => p);
            }
            
            let template = '"""\n';
            template += `${name}\n\n`;
            
            for (const param of params) {
                const paramName = param.split('=')[0].trim();
                template += `Args:\n    ${paramName}: Description\n`;
            }
            
            template += '\nReturns:\n    Description\n"""\n';
            return template;
            
        } else if (language === 'java') {
            const match = functionLine.match(/(?:public|private|protected|static|\s)+[\w\<\>\[\]]+\s+(\w+)\s*\(([^)]*)\)/);
            if (match) {
                name = match[1];
                params = match[2].split(',').map(p => p.trim()).filter(p => p);
            }
            
            let template = '/**\n';
            template += ` * ${name}\n`;
            template += ` *\n`;
            
            for (const param of params) {
                const paramParts = param.split(' ');
                const paramName = paramParts[paramParts.length - 1];
                template += ` * @param ${paramName} Description\n`;
            }
            
            template += ` * @return Description\n`;
            template += ` */`;
            return template;
            
        } else if (language === 'csharp') {
            const match = functionLine.match(/(?:public|private|protected|internal|static|\s)+[\w\<\>\[\]]+\s+(\w+)\s*\(([^)]*)\)/);
            if (match) {
                name = match[1];
                params = match[2].split(',').map(p => p.trim()).filter(p => p);
            }
            
            let template = '/// <summary>\n';
            template += `/// ${name}\n`;
            template += '/// </summary>\n';
            
            for (const param of params) {
                const paramParts = param.split(' ');
                const paramName = paramParts[paramParts.length - 1];
                template += `/// <param name="${paramName}">Description</param>\n`;
            }
            
            template += '/// <returns>Description</returns>';
            return template;
            
        } else if (language === 'javascriptreact' || language === 'typescriptreact') {
            // Check if this is a React component
            const componentMatch = functionLine.match(/const\s+(\w+)\s*=\s*(?:React\.)?(?:memo\()?(?:forwardRef\()?(?:function|React\.FC)/);
            if (componentMatch) {
                name = componentMatch[1];
                
                let template = '/**\n';
                template += ` * ${name} Component\n`;
                template += ` *\n`;
                
                if (language === 'typescriptreact') {
                    template += ` * @param {${name}Props} props - Component props\n`;
                } else {
                    template += ` * @param {Object} props - Component props\n`;
                }
                
                template += ` * @returns {JSX.Element} - Rendered component\n`;
                template += ` */`;
                
                return template;
            } else {
                // Regular function
                return this._generateDocTemplate(functionLine, 'javascript');
            }
        } else {
            // JavaScript/TypeScript
            const nameMatch = functionLine.match(/function\s+(\w+)|(\w+)\s*=\s*function|(\w+)\s*\(/);
            const name = nameMatch ? (nameMatch[1] || nameMatch[2] || nameMatch[3]) : 'function';
            
            const paramsMatch = functionLine.match(/\(([^)]*)\)/);
            const params = paramsMatch ? paramsMatch[1].split(',').map(p => p.trim()).filter(p => p) : [];
            
            let template = '/**\n';
            template += ` * ${name}\n`;
            template += ` *\n`;
            
            for (const param of params) {
                // Extract just the parameter name, ignoring type annotations
                const paramName = param.split(':')[0].split('=')[0].trim();
                template += ` * @param {any} ${paramName} - Description\n`;
            }
            
            template += ` * @returns {any} - Description\n`;
            template += ` */`;
            
            return template;
        }
    }

    /**
     * Parse function parameters
     * @private
     */
    _parseParams(paramsStr, language = 'javascript') {
        if (!paramsStr) return [];
        
        if (language === 'python') {
            return paramsStr.split(',')
                .map(p => p.trim())
                .filter(p => p)
                .map(p => {
                    const [nameAndType, defaultValue] = p.split('=').map(s => s.trim());
                    const [name, type] = nameAndType.split(':').map(s => s.trim());
                    return { name, type, defaultValue };
                });
        } else if (language === 'java' || language === 'csharp') {
            return paramsStr.split(',')
                .map(p => p.trim())
                .filter(p => p)
                .map(p => {
                    const parts = p.split(' ');
                    // Last part is the name, everything before is the type
                    const name = parts[parts.length - 1];
                    const type = parts.slice(0, parts.length - 1).join(' ');
                    return { name, type };
                });
        } else {
            // JavaScript/TypeScript
            return paramsStr.split(',')
                .map(p => p.trim())
                .filter(p => p)
                .map(p => {
                    // Handle TypeScript parameter syntax
                    let [name, type] = p.split(':').map(s => s.trim());
                    // Handle default values
                    const [paramName, defaultValue] = name.split('=').map(s => s.trim());
                    return { name: paramName, type, defaultValue };
                });
        }
    }

    /**
     * Escape special characters in regex
     * @private
     */
    _escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Calculate cyclomatic complexity for a function
     * @param {string} code - Function code
     * @param {string} language - Programming language
     * @returns {object} Complexity metrics
     */
    calculateCyclomaticComplexity(code, language) {
        if (!this.supportedLanguages.includes(language)) {
            throw new Error(`Language '${language}' is not currently supported`);
        }

        let complexity = 1; // Base complexity starts at 1
        let lines = code.split('\n');
        let lineCount = lines.length;
        
        // Get language-specific patterns
        const patterns = this.languagePatterns[language] || this.languagePatterns.javascript;
        
        // Count decision points based on language
        const decisionPoints = this._countDecisionPoints(code, language);
        console.log('Decision points:', decisionPoints);
        
        complexity += decisionPoints.total;
        console.log('Calculated complexity:', complexity);
        
        // Calculate cognitive complexity factors
        const nestingLevel = this._calculateNestingLevel(code, language);
        const numberOfParameters = this._countParameters(code, language);
        
        const result = {
            cyclomaticComplexity: complexity,
            lineCount: lineCount,
            decisionPoints: decisionPoints,
            nestingLevel: nestingLevel,
            parameterCount: numberOfParameters,
            complexityLevel: this._determineComplexityLevel(complexity)
        };
        
        console.log('Final complexity result:', result);
        return result;
    }
    
    /**
     * Analyze all functions in a file and compute complexity metrics
     * @param {string} code - File content
     * @param {string} language - Programming language
     * @returns {object[]} Array of function analyses
     */
    analyzeFunctionComplexity(code, language) {
        if (!this.supportedLanguages.includes(language)) {
            throw new Error(`Language '${language}' is not currently supported`);
        }
        
        const functions = this.findFunctions(code, language);
        const functionAnalyses = [];
        
        for (const func of functions) {
            // Extract function code
            const startLine = code.substring(0, func.range.start).split('\n').length - 1;
            const endLine = code.substring(0, func.range.end).split('\n').length - 1;
            const functionCode = code.substring(func.range.start, func.range.end);
            
            // Calculate metrics
            const complexity = this.calculateCyclomaticComplexity(functionCode, language);
            
            functionAnalyses.push({
                name: func.name,
                lineRange: { start: startLine, end: endLine },
                lineCount: complexity.lineCount,
                cyclomaticComplexity: complexity.cyclomaticComplexity,
                nestingLevel: complexity.nestingLevel,
                parameterCount: complexity.parameterCount,
                complexityLevel: complexity.complexityLevel,
                decisionPoints: complexity.decisionPoints
            });
        }
        
        return functionAnalyses;
    }
    
    /**
     * Analyze dependencies between functions in code
     * @param {string} code - File content
     * @param {string} language - Programming language
     * @returns {object} Dependency graph data
     */
    analyzeDependencies(code, language) {
        if (!this.supportedLanguages.includes(language)) {
            throw new Error(`Language '${language}' is not currently supported`);
        }

        const functions = this.findFunctions(code, language);
        const dependencies = {};
        
        // Initialize dependency object for each function
        for (const func of functions) {
            dependencies[func.name] = {
                calls: [],
                calledBy: []
            };
        }
        
        // Find call relationships
        for (const caller of functions) {
            const callerCode = code.substring(caller.range.start, caller.range.end);
            
            for (const callee of functions) {
                // Skip self references
                if (caller.name === callee.name) continue;
                
                // Check if caller calls callee
                const calleePattern = new RegExp(`\\b${callee.name}\\s*\\(`, 'g');
                if (calleePattern.test(callerCode)) {
                    dependencies[caller.name].calls.push(callee.name);
                    dependencies[callee.name].calledBy.push(caller.name);
                }
            }
        }
        
        // Generate nodes and links for visualization
        const nodes = functions.map(func => {
            const funcCode = code.substring(func.range.start, func.range.end);
            const complexityResult = this.calculateCyclomaticComplexity(funcCode, language);
            
            console.log(`Function ${func.name} complexity: ${complexityResult.cyclomaticComplexity}`);
            
            return {
                id: func.name,
                complexity: complexityResult.cyclomaticComplexity
            };
        });
        
        const links = [];
        for (const [caller, deps] of Object.entries(dependencies)) {
            for (const callee of deps.calls) {
                links.push({
                    source: caller,
                    target: callee
                });
            }
        }
        
        return {
            nodes,
            links,
            dependencies
        };
    }

    /**
     * Count the number of decision points in code
     * @private
     */
    _countDecisionPoints(code, language) {
        let conditionals = 0;
        let loops = 0;
        let switches = 0;
        let catchBlocks = 0;
        let logicalOperators = 0;
        let ternaryOperators = 0;

        // Common patterns across languages
        const commonPatterns = {
            logicalOperators: /&&|\|\|/g,
            ternaryOperators: /\?.*:/g,
        };

        // Count based on language
        if (language === 'javascript' || language === 'typescript' || 
            language === 'javascriptreact' || language === 'typescriptreact') {
            conditionals = (code.match(/\bif\b/g) || []).length;
            loops = (code.match(/\bfor\b|\bwhile\b|\bdo\b/g) || []).length;
            switches = (code.match(/\bswitch\b/g) || []).length;
            catchBlocks = (code.match(/\bcatch\b/g) || []).length;
            logicalOperators = (code.match(commonPatterns.logicalOperators) || []).length;
            ternaryOperators = (code.match(commonPatterns.ternaryOperators) || []).length;
        } else if (language === 'python') {
            conditionals = (code.match(/\bif\b|\belif\b/g) || []).length;
            loops = (code.match(/\bfor\b|\bwhile\b/g) || []).length;
            catchBlocks = (code.match(/\bexcept\b/g) || []).length;
            logicalOperators = (code.match(/\band\b|\bor\b/g) || []).length;
        } else if (language === 'java' || language === 'csharp') {
            conditionals = (code.match(/\bif\b/g) || []).length;
            loops = (code.match(/\bfor\b|\bwhile\b|\bdo\b|\bforeach\b/g) || []).length;
            switches = (code.match(/\bswitch\b/g) || []).length;
            catchBlocks = (code.match(/\bcatch\b/g) || []).length;
            logicalOperators = (code.match(commonPatterns.logicalOperators) || []).length;
            ternaryOperators = (code.match(commonPatterns.ternaryOperators) || []).length;
        }

        const total = conditionals + loops + switches + catchBlocks + 
                     Math.floor(logicalOperators / 2) + ternaryOperators;

        return {
            conditionals,
            loops,
            switches,
            catchBlocks,
            logicalOperators,
            ternaryOperators,
            total
        };
    }

    /**
     * Calculate the nesting level of code
     * @private
     */
    _calculateNestingLevel(code, language) {
        const lines = code.split('\n');
        let maxNestingLevel = 0;
        let currentLevel = 0;
        
        if (language === 'python') {
            // For Python, we count indentation level
            let previousIndentation = 0;
            
            for (const line of lines) {
                if (line.trim() === '') continue;
                
                const indentation = line.search(/\S|$/);
                
                if (indentation > previousIndentation) {
                    currentLevel += Math.floor((indentation - previousIndentation) / 4); // Assuming 4 spaces per level
                } else if (indentation < previousIndentation) {
                    currentLevel -= Math.floor((previousIndentation - indentation) / 4);
                }
                
                maxNestingLevel = Math.max(maxNestingLevel, currentLevel);
                previousIndentation = indentation;
            }
        } else {
            // For C-like languages, we count braces
            for (const line of lines) {
                // Count opening braces
                const openBraces = (line.match(/{/g) || []).length;
                // Count closing braces
                const closeBraces = (line.match(/}/g) || []).length;
                
                currentLevel += openBraces - closeBraces;
                maxNestingLevel = Math.max(maxNestingLevel, currentLevel);
            }
        }
        
        return maxNestingLevel;
    }

    /**
     * Count parameters in a function
     * @private
     */
    _countParameters(code, language) {
        let parameterCount = 0;
        
        if (language === 'javascript' || language === 'typescript' || 
            language === 'javascriptreact' || language === 'typescriptreact') {
            const paramMatch = code.match(/function\s+\w*\s*\(([^)]*)\)|(\w+|\([^)]*\))\s*=>\s*{/);
            if (paramMatch) {
                const params = paramMatch[1] || '';
                parameterCount = params.split(',').filter(p => p.trim()).length;
            }
        } else if (language === 'python') {
            const paramMatch = code.match(/def\s+\w+\s*\(([^)]*)\)/);
            if (paramMatch) {
                const params = paramMatch[1] || '';
                parameterCount = params.split(',').filter(p => p.trim()).length;
            }
        } else if (language === 'java' || language === 'csharp') {
            const paramMatch = code.match(/\w+\s+\w+\s*\(([^)]*)\)/);
            if (paramMatch) {
                const params = paramMatch[1] || '';
                parameterCount = params.split(',').filter(p => p.trim()).length;
            }
        }
        
        return parameterCount;
    }

    /**
     * Determine complexity level based on cyclomatic complexity
     * @private
     */
    _determineComplexityLevel(complexity) {
        if (complexity <= 5) {
            return { level: 'low', color: '#4CAF50', description: 'Easy to maintain' };
        } else if (complexity <= 10) {
            return { level: 'moderate', color: '#FFC107', description: 'Moderately complex' };
        } else if (complexity <= 20) {
            return { level: 'high', color: '#FF9800', description: 'Complex, consider refactoring' };
        } else {
            return { level: 'very high', color: '#F44336', description: 'Highly complex, difficult to maintain, refactoring recommended' };
        }
    }

    /**
     * Detect performance hotspots in code
     * @param {string} code - File content
     * @param {string} language - Programming language
     * @returns {object[]} Array of performance hotspots
     */
    detectPerformanceHotspots(code, language) {
        if (!this.supportedLanguages.includes(language)) {
            throw new Error(`Language '${language}' is not currently supported`);
        }
        
        // Define performance hotspot patterns
        const hotspots = [];
        
        // Analyze functions for performance issues
        const functions = this.findFunctions(code, language);
        
        for (const func of functions) {
            const functionCode = code.substring(func.range.start, func.range.end);
            const functionName = func.name;
            const hotspotInfo = this._analyzeCodePerformance(functionCode, functionName, language);
            
            if (hotspotInfo.length > 0) {
                // Calculate absolute line numbers for the hotspots
                const functionStartLine = code.substring(0, func.range.start).split('\n').length;
                
                hotspotInfo.forEach(hotspot => {
                    // Adjust line number to be absolute in the file
                    hotspot.line += functionStartLine - 1;
                    hotspots.push(hotspot);
                });
            }
        }
        
        // Add global scope analysis
        const globalHotspots = this._analyzeGlobalPerformance(code, language);
        hotspots.push(...globalHotspots);
        
        return hotspots;
    }
    
    /**
     * Analyze code for performance issues
     * @private
     */
    _analyzeCodePerformance(code, functionName, language) {
        const hotspots = [];
        const lines = code.split('\n');
        
        // Check for nested loops (O(n²) or worse time complexity)
        const nestedLoopPattern = /for\s*\([^{]*{[^}]*for\s*\(/g;
        let match;
        
        while ((match = nestedLoopPattern.exec(code)) !== null) {
            // Calculate line number
            const upToMatch = code.substring(0, match.index);
            const lineNumber = upToMatch.split('\n').length;
            
            hotspots.push({
                type: 'nested_loop',
                severity: 'high',
                description: 'Nested loop detected (potential O(n²) time complexity)',
                suggestion: 'Consider restructuring to avoid nested loops',
                function: functionName,
                line: lineNumber,
                code: match[0].substring(0, 50) + '...'
            });
        }
        
        // Check for inefficient operations inside loops
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check if this line contains a loop start
            if (/\b(for|while)\s*\(/.test(line)) {
                // Look for inefficient operations in the next few lines
                const endIndex = Math.min(i + 10, lines.length);
                let braceCount = 0;
                let loopBody = '';
                
                // Collect the loop body
                for (let j = i; j < endIndex; j++) {
                    loopBody += lines[j] + '\n';
                    braceCount += (lines[j].match(/{/g) || []).length;
                    braceCount -= (lines[j].match(/}/g) || []).length;
                    
                    // If braces are balanced, we've reached the end of the loop
                    if (braceCount === 0 && j > i) {
                        break;
                    }
                }
                
                // Check for DOM operations inside loop
                if (/document\.querySelector|document\.getElementById|document\.getElement/.test(loopBody)) {
                    hotspots.push({
                        type: 'dom_in_loop',
                        severity: 'high',
                        description: 'DOM operation inside loop',
                        suggestion: 'Cache DOM elements outside the loop',
                        function: functionName,
                        line: i + 1,
                        code: line.trim()
                    });
                }
                
                // Check for array resizing operations inside loop
                if (/\.push\(|\.splice\(|\.shift\(|\.unshift\(/.test(loopBody)) {
                    hotspots.push({
                        type: 'array_resize_in_loop',
                        severity: 'medium',
                        description: 'Array resizing operation inside loop',
                        suggestion: 'Pre-allocate arrays when possible',
                        function: functionName,
                        line: i + 1,
                        code: line.trim()
                    });
                }
                
                // Check for object creation inside loop
                if (/new\s+[A-Z][a-zA-Z]*\(/.test(loopBody)) {
                    hotspots.push({
                        type: 'object_creation_in_loop',
                        severity: 'medium',
                        description: 'Object instantiation inside loop',
                        suggestion: 'Move object creation outside the loop or reuse objects',
                        function: functionName,
                        line: i + 1,
                        code: line.trim()
                    });
                }
                
                // Check for function calls inside loop
                const functionCallsInLoop = loopBody.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/g) || [];
                if (functionCallsInLoop.length > 3) {
                    hotspots.push({
                        type: 'many_function_calls_in_loop',
                        severity: 'low',
                        description: 'Multiple function calls inside loop',
                        suggestion: 'Consider inlining or optimizing function calls',
                        function: functionName,
                        line: i + 1,
                        code: line.trim()
                    });
                }
            }
        }
        
        // Check for potentially slow regular expressions
        const regexPattern = /\/(?!\/)(.*?[+*{}|].*?)\/[gimuy]*/g;
        while ((match = regexPattern.exec(code)) !== null) {
            // Check if it's a complex regex
            if (match[1].length > 20 || /[+*]{2,}/.test(match[1])) {
                // Calculate line number
                const upToMatch = code.substring(0, match.index);
                const lineNumber = upToMatch.split('\n').length;
                
                hotspots.push({
                    type: 'complex_regex',
                    severity: 'medium',
                    description: 'Complex regular expression',
                    suggestion: 'Simplify regex or use regex caching',
                    function: functionName,
                    line: lineNumber,
                    code: match[0]
                });
            }
        }
        
        // Check for excessive string concatenation
        const concatPattern = /(\s*\+=\s*['"][^'"]*['"]){3,}/g;
        while ((match = concatPattern.exec(code)) !== null) {
            // Calculate line number
            const upToMatch = code.substring(0, match.index);
            const lineNumber = upToMatch.split('\n').length;
            
            hotspots.push({
                type: 'string_concat',
                severity: 'low',
                description: 'Excessive string concatenation with += operator',
                suggestion: 'Use array.join() or template literals instead',
                function: functionName,
                line: lineNumber,
                code: match[0].substring(0, 50) + '...'
            });
        }
        
        return hotspots;
    }
    
    /**
     * Analyze global scope for performance issues
     * @private
     */
    _analyzeGlobalPerformance(code, language) {
        const hotspots = [];
        
        // Check for large array/object literals
        const largeObjectPattern = /[{[]([^}{\][]|\[[^}{\][]]*]*){100,}[}\]]/g;
        let match;
        
        while ((match = largeObjectPattern.exec(code)) !== null) {
            // Calculate line number
            const upToMatch = code.substring(0, match.index);
            const lineNumber = upToMatch.split('\n').length;
            
            hotspots.push({
                type: 'large_literal',
                severity: 'medium',
                description: 'Large array/object literal',
                suggestion: 'Consider loading data dynamically or chunking',
                function: 'global',
                line: lineNumber,
                code: match[0].substring(0, 50) + '...'
            });
        }
        
        // Check for global event listeners without cleanup
        const eventListenerPattern = /addEventListener\(['"]([^'"]+)['"]/g;
        const removeListenerPattern = /removeEventListener\(['"]([^'"]+)['"]/g;
        
        const addEvents = [];
        const removeEvents = [];
        
        while ((match = eventListenerPattern.exec(code)) !== null) {
            addEvents.push(match[1]);
        }
        
        while ((match = removeListenerPattern.exec(code)) !== null) {
            removeEvents.push(match[1]);
        }
        
        // Find uncleaned event listeners
        if (addEvents.length > removeEvents.length) {
            // Simple heuristic: if there are more adds than removes
            hotspots.push({
                type: 'uncleaned_event_listeners',
                severity: 'medium',
                description: 'Potential memory leak: more event listeners added than removed',
                suggestion: 'Ensure all event listeners are removed when no longer needed',
                function: 'global',
                line: 1,
                code: 'addEventListener detected without matching removeEventListener'
            });
        }
        
        // Check for synchronous XMLHttpRequest
        if (/new\s+XMLHttpRequest\([^)]*\);\s*[^]*?\.open\([^)]*false[^)]*\)/g.test(code)) {
            hotspots.push({
                type: 'sync_xhr',
                severity: 'high',
                description: 'Synchronous XMLHttpRequest detected',
                suggestion: 'Use asynchronous requests to avoid blocking the main thread',
                function: 'global',
                line: 1,
                code: 'XMLHttpRequest with synchronous flag'
            });
        }
        
        // Check for console.log statements in production code
        const consolePattern = /console\.(log|debug|info|warn|error)\(/g;
        let consoleCount = 0;
        
        while ((match = consolePattern.exec(code)) !== null) {
            consoleCount++;
        }
        
        if (consoleCount > 5) {
            hotspots.push({
                type: 'excessive_console',
                severity: 'low',
                description: `${consoleCount} console statements detected`,
                suggestion: 'Remove console statements from production code',
                function: 'global',
                line: 1,
                code: 'console.* statements'
            });
        }
        
        return hotspots;
    }
}

module.exports = Parser; 