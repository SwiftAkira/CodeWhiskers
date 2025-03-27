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
     * @param {vscode.TextDocument} document - Document to search in
     * @returns {Array<object>} List of variable occurrences
     */
    traceVariable(variableName, document) {
        const text = document.getText();
        const language = document.languageId;
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
                isDefinition: this._isDefinition(line.text, match.index - line.range.start.character, variableName, language),
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
        const language = document.languageId;
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
                        range: document.lineAt(lineIndex).range,
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
     * @param {vscode.TextDocument} document - Document to analyze
     * @returns {Array<object>} List of functions with metadata
     */
    findFunctions(document) {
        const text = document.getText();
        const language = document.languageId;
        
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
            
            const pos = document.positionAt(match.index);
            
            // Get function body (with language-specific logic)
            let bodyStart, bodyEnd;
            
            if (language === 'python') {
                // Python uses indentation, so we need to find the indented block
                bodyStart = text.indexOf(':', match.index) + 1;
                
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
                bodyStart = match.index;
                bodyEnd = text.length;
                
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
            }
            
            const body = text.substring(bodyStart, bodyEnd).trim();
            
            functions.push({
                name,
                params: this._parseParams(params, language),
                body,
                position: pos,
                range: new vscode.Range(
                    pos,
                    document.positionAt(bodyEnd + 1)
                ),
                language: language
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
}

module.exports = {
    Parser
}; 