/**
 * ExplanationEngine for CodeWhiskers
 * Generates human-readable explanations of code
 */
class ExplanationEngine {
    constructor() {
        this.complexityThresholds = {
            low: 3,
            medium: 7,
            high: 15
        };
    }

    /**
     * Generate a human-readable explanation of code
     * @param {object} parsedCode - Code structure from Parser
     * @returns {object} Explanation with multiple detail levels
     */
    generateExplanation(parsedCode) {
        const complexity = this._assessComplexity(parsedCode.structure);
        
        return {
            simple: this._generateSimpleExplanation(parsedCode),
            detailed: this._generateDetailedExplanation(parsedCode),
            technical: this._generateTechnicalExplanation(parsedCode),
            complexity: complexity
        };
    }

    /**
     * Analyze function behavior including inputs, outputs, and side effects
     * @param {object} functionData - Function metadata from Parser
     * @returns {object} Function behavior analysis
     */
    analyzeFunctionBehavior(functionData) {
        const { name, params, body } = functionData;
        
        // This would be a complex analysis in a real implementation
        // Here's a simplified approach focused on patterns
        
        const analysis = {
            name,
            params,
            returnValue: this._findReturnValue(body),
            dependencies: this._findExternalDependencies(body),
            sideEffects: this._findSideEffects(body),
            complexity: this._assessCodeComplexity(body),
            patterns: this._detectPatterns(body)
        };
        
        return {
            ...functionData,
            analysis,
            explanation: this._explainFunctionBehavior(analysis)
        };
    }

    // Private helper methods

    /**
     * Generate a simple explanation in plain language
     * @private
     */
    _generateSimpleExplanation(parsedCode) {
        const { structure } = parsedCode;
        const selectedCode = parsedCode.content;
        
        // This would be more sophisticated in a real implementation
        // using templates based on identified patterns
        
        let explanation = "This code ";
        
        // Describe main purpose based on structure
        if (structure.functions.length === 1) {
            explanation += `defines a function called '${structure.functions[0].name}' `;
            
            if (structure.loops.length > 0) {
                explanation += `that uses a ${structure.loops[0].type} loop `;
            }
            
            if (structure.conditionals.length > 0) {
                explanation += `with some conditional logic `;
            }
        } else if (structure.functions.length > 1) {
            explanation += `defines ${structure.functions.length} functions `;
        } else if (structure.classes.length > 0) {
            explanation += `defines a class named '${structure.classes[0].name}' `;
        } else if (structure.variables.length > 0) {
            explanation += `sets up some variables `;
        }
        
        // Add more detail about operations - only for the selected code and in order of specificity
        if (selectedCode.includes("reduce(")) {
            explanation += "that performs array reduction to calculate a total. ";
        } else if (selectedCode.includes("map(")) {
            explanation += "that transforms array elements. ";
        } else if (selectedCode.includes("filter(")) {
            explanation += "that filters array elements. ";
        } else if (selectedCode.includes("fetch(") || selectedCode.includes("axios.")) {
            explanation += "and makes network requests. ";
        } else if (selectedCode.includes("localStorage") || selectedCode.includes("sessionStorage")) {
            explanation += "and interacts with browser storage. ";
        } else if (selectedCode.includes("addEventListener")) {
            explanation += "and attaches event listeners. ";
        } else {
            explanation += "to perform some operations. ";
        }
        
        return explanation;
    }

    /**
     * Generate a more detailed explanation with specifics
     * @private
     */
    _generateDetailedExplanation(parsedCode) {
        const { structure } = parsedCode;
        let explanation = this._generateSimpleExplanation(parsedCode);
        
        // Add more technical details
        if (structure.functions.length > 0) {
            explanation += "\n\nSpecifically, it ";
            
            structure.functions.forEach((func, i) => {
                if (i > 0) explanation += ", and ";
                explanation += `has a function '${func.name}' that appears to `;
                
                // Infer purpose from name
                if (func.name.startsWith("get") || func.name.startsWith("fetch")) {
                    explanation += "retrieve data";
                } else if (func.name.startsWith("set") || func.name.startsWith("update")) {
                    explanation += "modify values";
                } else if (func.name.startsWith("handle") || func.name.endsWith("Handler")) {
                    explanation += "respond to events";
                } else if (func.name.startsWith("calc") || func.name.startsWith("compute")) {
                    explanation += "perform calculations";
                } else {
                    explanation += "perform operations";
                }
            });
        }
        
        // Add info about variables
        if (structure.variables.length > 0) {
            explanation += "\n\nIt uses these key variables: ";
            structure.variables.slice(0, 3).forEach((variable, i) => {
                if (i > 0) explanation += ", ";
                explanation += `'${variable.name}' (${variable.kind})`;
            });
            
            if (structure.variables.length > 3) {
                explanation += `, and ${structure.variables.length - 3} others`;
            }
        }
        
        return explanation;
    }

    /**
     * Generate a technical explanation for developers
     * @private
     */
    _generateTechnicalExplanation(parsedCode) {
        const { structure } = parsedCode;
        let explanation = "## Technical Overview\n\n";
        
        // Structure summary
        explanation += "### Structure\n";
        explanation += `- Functions: ${structure.functions.length}\n`;
        explanation += `- Classes: ${structure.classes.length}\n`;
        explanation += `- Variables: ${structure.variables.length}\n`;
        explanation += `- Loops: ${structure.loops.length}\n`;
        explanation += `- Conditionals: ${structure.conditionals.length}\n\n`;
        
        // Functions details
        if (structure.functions.length > 0) {
            explanation += "### Functions\n";
            structure.functions.forEach(func => {
                explanation += `- \`${func.name}\`: `;
                
                // Infer purpose from name and position
                if (func.name.startsWith("get") || func.name.startsWith("fetch")) {
                    explanation += "Data retrieval function";
                } else if (func.name.startsWith("set") || func.name.startsWith("update")) {
                    explanation += "State modification function";
                } else if (func.name.startsWith("handle") || func.name.endsWith("Handler")) {
                    explanation += "Event handler";
                } else if (func.name.startsWith("calc") || func.name.startsWith("compute")) {
                    explanation += "Computation function";
                } else if (func.name.startsWith("render") || func.name.startsWith("display")) {
                    explanation += "UI rendering function";
                } else {
                    explanation += "General utility function";
                }
                explanation += "\n";
            });
        }
        
        // Classes details
        if (structure.classes.length > 0) {
            explanation += "\n### Classes\n";
            structure.classes.forEach(cls => {
                explanation += `- \`${cls.name}\`: `;
                explanation += "Class definition";
                explanation += "\n";
            });
        }
        
        // Add code patterns detected
        explanation += "\n### Patterns\n";
        
        if (parsedCode.content.includes("async") && parsedCode.content.includes("await")) {
            explanation += "- Uses async/await for asynchronous operations\n";
        }
        
        if (parsedCode.content.includes("try") && parsedCode.content.includes("catch")) {
            explanation += "- Implements error handling with try/catch\n";
        }
        
        if (parsedCode.content.includes("map(") || parsedCode.content.includes("filter(") || 
            parsedCode.content.includes("reduce(")) {
            explanation += "- Uses functional array methods (map/filter/reduce)\n";
        }
        
        if (parsedCode.content.includes("=>")) {
            explanation += "- Uses arrow functions\n";
        }
        
        if (parsedCode.content.includes("...")) {
            explanation += "- Uses spread/rest operators\n";
        }
        
        return explanation;
    }

    /**
     * Assess code complexity based on various factors
     * @private
     */
    _assessComplexity(structure) {
        // Simple complexity score based on structural elements
        const score = 
            structure.functions.length * 2 + 
            structure.classes.length * 3 + 
            structure.loops.length * 2 + 
            structure.conditionals.length + 
            structure.variables.length * 0.5;
        
        if (score <= this.complexityThresholds.low) {
            return "low";
        } else if (score <= this.complexityThresholds.medium) {
            return "medium";
        } else {
            return "high";
        }
    }

    /**
     * Find the return value of a function
     * @private
     */
    _findReturnValue(functionBody) {
        // Simple regex to find return statements
        const returnMatch = functionBody.match(/return\s+([^;]+)/);
        if (returnMatch) {
            return {
                exists: true,
                value: returnMatch[1].trim(),
                isVariable: !returnMatch[1].includes(" ") && !returnMatch[1].startsWith("{") && !returnMatch[1].startsWith("[")
            };
        }
        
        return {
            exists: false
        };
    }

    /**
     * Find external dependencies used by the function
     * @private
     */
    _findExternalDependencies(functionBody) {
        // This would be more accurate with scope analysis in a real implementation
        const dependencies = [];
        
        // Check for imports or requires
        const importMatches = functionBody.match(/import\s+.*?from\s+['"]([^'"]+)['"]/g);
        if (importMatches) {
            importMatches.forEach(match => {
                const module = match.match(/from\s+['"]([^'"]+)['"]/)[1];
                dependencies.push({ type: 'import', name: module });
            });
        }
        
        const requireMatches = functionBody.match(/require\(['"]([^'"]+)['"]\)/g);
        if (requireMatches) {
            requireMatches.forEach(match => {
                const module = match.match(/require\(['"]([^'"]+)['"]\)/)[1];
                dependencies.push({ type: 'require', name: module });
            });
        }
        
        return dependencies;
    }

    /**
     * Find potential side effects in the function
     * @private
     */
    _findSideEffects(functionBody) {
        const sideEffects = [];
        
        // DOM modifications
        if (functionBody.includes("document.") || 
            functionBody.includes("window.") || 
            functionBody.includes("element.")) {
            sideEffects.push({ type: 'DOM', description: 'Modifies the DOM' });
        }
        
        // Network requests
        if (functionBody.includes("fetch(") || 
            functionBody.includes("axios.") || 
            functionBody.includes("XMLHttpRequest")) {
            sideEffects.push({ type: 'network', description: 'Makes network requests' });
        }
        
        // Storage
        if (functionBody.includes("localStorage") || 
            functionBody.includes("sessionStorage") || 
            functionBody.includes("cookies")) {
            sideEffects.push({ type: 'storage', description: 'Accesses browser storage' });
        }
        
        // Timer functions
        if (functionBody.includes("setTimeout") || 
            functionBody.includes("setInterval")) {
            sideEffects.push({ type: 'timer', description: 'Uses timer functions' });
        }
        
        return sideEffects;
    }

    /**
     * Assess complexity of code snippet
     * @private
     */
    _assessCodeComplexity(code) {
        // Count various complexity indicators
        const loopCount = (code.match(/for\s*\(|while\s*\(|do\s*{/g) || []).length;
        const conditionalCount = (code.match(/if\s*\(|switch\s*\(|case\s+:/g) || []).length;
        const functionCount = (code.match(/function\s+\w+\s*\(|=>\s*{/g) || []).length;
        
        const score = loopCount * 2 + conditionalCount + functionCount;
        
        if (score <= this.complexityThresholds.low) {
            return { level: "low", score };
        } else if (score <= this.complexityThresholds.medium) {
            return { level: "medium", score };
        } else {
            return { level: "high", score };
        }
    }

    /**
     * Detect common programming patterns
     * @private
     */
    _detectPatterns(code) {
        const patterns = [];
        
        // Asynchronous patterns
        if (code.includes("async") && code.includes("await")) {
            patterns.push({ type: 'async', name: 'Async/Await Pattern' });
        } else if (code.includes(".then(") && code.includes(".catch(")) {
            patterns.push({ type: 'promise', name: 'Promise Chain Pattern' });
        } else if (code.includes("callback") || (code.match(/function\s*\([^)]*\)\s*{/) && code.includes("("))) {
            patterns.push({ type: 'callback', name: 'Callback Pattern' });
        }
        
        // Functional patterns
        if ((code.includes(".map(") || code.includes(".filter(") || code.includes(".reduce(")) && 
             code.includes("=>")) {
            patterns.push({ type: 'functional', name: 'Functional Programming Pattern' });
        }
        
        // Module patterns
        if (code.includes("module.exports") || code.includes("export default") || 
            code.includes("export const")) {
            patterns.push({ type: 'module', name: 'Module Pattern' });
        }
        
        // Data handling patterns
        if (code.includes("JSON.parse") || code.includes("JSON.stringify")) {
            patterns.push({ type: 'serialization', name: 'Data Serialization Pattern' });
        }
        
        return patterns;
    }

    /**
     * Generate a human-readable explanation of function behavior
     * @private
     */
    _explainFunctionBehavior(analysis) {
        const { name, params, returnValue, sideEffects, patterns } = analysis;
        
        let explanation = `The function \`${name}\` `;
        
        // Describe parameters
        if (params.length === 0) {
            explanation += "takes no parameters ";
        } else {
            explanation += `takes ${params.length} parameter${params.length > 1 ? 's' : ''} `;
            if (params.length <= 3) {
                explanation += "(";
                params.forEach((param, i) => {
                    if (i > 0) explanation += ", ";
                    explanation += param.name;
                });
                explanation += ") ";
            }
        }
        
        // Describe return value
        if (returnValue.exists) {
            explanation += `and returns ${returnValue.value}. `;
        } else {
            explanation += "and doesn't explicitly return a value. ";
        }
        
        // Describe side effects
        if (sideEffects.length > 0) {
            explanation += "It has side effects including: ";
            sideEffects.forEach((effect, i) => {
                if (i > 0) explanation += ", ";
                explanation += effect.description.toLowerCase();
            });
            explanation += ". ";
        }
        
        // Describe patterns
        if (patterns.length > 0) {
            explanation += "The function uses these patterns: ";
            patterns.forEach((pattern, i) => {
                if (i > 0) explanation += ", ";
                explanation += pattern.name;
            });
            explanation += ".";
        }
        
        return explanation;
    }
}

module.exports = {
    ExplanationEngine
}; 