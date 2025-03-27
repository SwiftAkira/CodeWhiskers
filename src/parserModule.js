const vscode = require('vscode');

/**
 * Parser Module for CodeWhiskers
 * Analyzes code structure, identifies patterns, and extracts information
 */
class Parser {
    constructor() {
        this.supportedLanguages = ['javascript', 'typescript'];
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

        // In a real implementation, this would use TypeScript Compiler API or similar
        // For now, we'll use a simplified implementation
        return {
            type: 'code_block',
            language,
            content: code,
            structure: this._analyzeStructure(code, language),
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
}

module.exports = {
    Parser
}; 