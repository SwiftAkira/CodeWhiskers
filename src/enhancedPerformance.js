const vscode = require('vscode');
const { AdvancedParser } = require('./advancedParser');

/**
 * Enhanced Performance Analyzer Module for WhiskerCode
 * Advanced detection of performance issues, optimizations, and best practices
 */
class EnhancedPerformanceAnalyzer {
    constructor() {
        this.advancedParser = new AdvancedParser();
        
        // Advanced performance patterns
        this.advancedPatterns = {
            javascript: {
                algorithmicComplexity: [
                    {
                        pattern: /for\s*\([^)]*\)\s*{[^}]*for\s*\([^)]*\)\s*{[^}]*for\s*\([^)]*\)\s*{/g,
                        description: "O(n³) complexity detected - triple nested loops",
                        severity: "critical",
                        suggestion: "This will perform poorly on large datasets. Consider algorithm redesign."
                    },
                    {
                        pattern: /for\s*\([^)]*\)\s*{[^}]*for\s*\([^)]*\)\s*{[^}]*}/g,
                        description: "O(n²) complexity detected - nested loops",
                        severity: "high", 
                        suggestion: "For large datasets, consider a more efficient algorithm or data structure."
                    }
                ],
                memoryManagement: [
                    {
                        pattern: /const\s+\w+\s*=\s*\[\s*\];\s*(?:[\s\S]*?)for\s*\([^)]*\)\s*{[^}]*\1\.push/g,
                        description: "Array pre-allocation opportunity",
                        severity: "medium",
                        suggestion: "Pre-allocate array with known size to avoid reallocation: new Array(size)"
                    },
                    {
                        pattern: /(?:map|filter|reduce|forEach)\([^)]*\)\.\s*(?:map|filter|reduce|forEach)\(/g,
                        description: "Chained array methods creating intermediate arrays",
                        severity: "medium",
                        suggestion: "Consider combining operations into a single pass with reduce()"
                    },
                    {
                        pattern: /new\s+(?:Map|Set|WeakMap|WeakSet)\s*\(\s*\)/g,
                        description: "Using proper data structures",
                        severity: "positive",
                        suggestion: "Good use of efficient data structures for lookups/unique values"
                    }
                ],
                asyncPatterns: [
                    {
                        pattern: /Promise\.all\(\s*\[\s*[^\]]*\]\s*\)/g,
                        description: "Efficient parallel async operations",
                        severity: "positive",
                        suggestion: "Good use of Promise.all for parallel execution"
                    },
                    {
                        pattern: /async\s+function\s*\w*\s*\([^)]*\)\s*{[^}]*await\s+Promise\.all\(/g,
                        description: "Optimal async/await with Promise.all",
                        severity: "positive",
                        suggestion: "Excellent pattern for parallel async operations"
                    },
                    {
                        pattern: /async\s+function\s*\w*\s*\([^)]*\)\s*{[^{}]*for\s*\([^)]*\)\s*{[^{}]*await\s+[^;]*;[^{}]*}/g,
                        description: "Sequential await in loop",
                        severity: "high",
                        suggestion: "Create an array of promises and use Promise.all instead"
                    }
                ],
                resourceManagement: [
                    {
                        pattern: /const\s+\w+\s*=\s*document\.querySelector[All]*\s*\(\s*['"][^'"]*['"]\s*\)[^;]*;\s*(?:[\s\S]{0,100}?)const\s+\w+\s*=\s*document\.querySelector[All]*\s*\(\s*['"][^'"]*['"]\s*\)/g,
                        description: "Multiple DOM queries",
                        severity: "medium",
                        suggestion: "Cache DOM queries at the beginning of your function"
                    },
                    {
                        pattern: /(canvas|ctx|context).(?:createLinearGradient|createPattern|createRadialGradient|drawImage|getImageData|putImageData)/g, 
                        description: "Expensive canvas operations",
                        severity: "medium",
                        suggestion: "Consider caching results of canvas operations when possible"
                    },
                    {
                        pattern: /new\s+Worker\s*\(/g,
                        description: "Web Worker usage",
                        severity: "positive",
                        suggestion: "Good use of Web Workers for CPU-intensive tasks"
                    }
                ],
                modernJavaScript: [
                    {
                        pattern: /const\s+\{[^}]*\}\s*=\s*\w+/g,
                        description: "Object destructuring",
                        severity: "positive",
                        suggestion: "Good use of modern JavaScript for cleaner code"
                    },
                    {
                        pattern: /(?:\w+)\.(?:map|filter|reduce|some|every|find|findIndex)/g,
                        description: "Functional array methods",
                        severity: "positive",
                        suggestion: "Good use of declarative array methods"
                    },
                    {
                        pattern: /new\s+RegExp\s*\(\s*['"][^'"]*['"]\s*,\s*['"]g['"]\s*\)/g,
                        description: "RegExp with global flag",
                        severity: "medium",
                        suggestion: "Be careful with global RegExp and reset lastIndex when reusing"
                    }
                ]
            },
            react: {
                rendering: [
                    {
                        pattern: /React\.memo\s*\(\s*(?:function|const\s+\w+\s*=\s*(?:function|\([^)]*\)\s*=>))/g,
                        description: "Memoized component",
                        severity: "positive",
                        suggestion: "Good use of memoization to prevent unnecessary renders"
                    },
                    {
                        pattern: /const\s+\w+\s*=\s*useMemo\s*\(\s*\(\s*\)\s*=>/g,
                        description: "Computed value caching",
                        severity: "positive",
                        suggestion: "Good use of useMemo to cache expensive calculations"
                    },
                    {
                        pattern: /const\s+\w+\s*=\s*useState\s*\(\s*\{[^}]*\}\s*\)/g, 
                        description: "Complex state object",
                        severity: "medium",
                        suggestion: "Consider splitting into multiple state variables for more targeted renders"
                    },
                    {
                        pattern: /(?:onClick|onMouseMove|onScroll)=\{[^}]*setTimeout\(/g,
                        description: "Debouncing needed for event handler",
                        severity: "medium",
                        suggestion: "Use a proper debounce function for better performance"
                    }
                ],
                hooks: [
                    {
                        pattern: /useEffect\s*\(\s*\(\s*\)\s*=>\s*{[^}]*}\s*\)/g,
                        description: "useEffect without dependency array",
                        severity: "high",
                        suggestion: "Add dependency array to prevent infinite renders"
                    },
                    {
                        pattern: /const\s+\w+\s*=\s*useCallback\s*\(\s*(?:function|\([^)]*\)\s*=>)[^}]*},\s*\[\s*\]\s*\)/g,
                        description: "Empty dependency array in useCallback",
                        severity: "medium",
                        suggestion: "Ensure all dependencies are properly listed to prevent stale closures"
                    },
                    {
                        pattern: /useEffect\s*\(\s*\(\s*\)\s*=>\s*{[^}]*fetch\s*\([^)]*\)[^}]*},\s*\[\s*\]\s*\)/g,
                        description: "Data fetching in useEffect with empty dependency array",
                        severity: "positive",
                        suggestion: "Good pattern for one-time data fetching on component mount"
                    }
                ]
            }
        };
        
        // Additional patterns for other languages
        this.advancedPatterns.typescript = { ...this.advancedPatterns.javascript };
        this.advancedPatterns.javascriptreact = { 
            ...this.advancedPatterns.javascript,
            ...this.advancedPatterns.react
        };
        this.advancedPatterns.typescriptreact = { 
            ...this.advancedPatterns.javascript,
            ...this.advancedPatterns.react,
            ...this.advancedPatterns.typescript
        };
    }
    
    /**
     * Perform a comprehensive performance analysis
     * @param {string} code - Code to analyze
     * @param {string} language - Language of the code
     * @returns {object} Detailed performance analysis
     */
    analyzePerformance(code, language) {
        // Use advanced parser first
        const parserResults = this.advancedParser.parseCode(code, language);
        
        // Find performance issues using pattern matching
        const issues = this._findPerformanceIssues(code, language);
        
        // Calculate algorithmic complexity metrics
        const complexityMetrics = this._calculateComplexityMetrics(code, parserResults);
        
        // Find optimization opportunities
        const optimizations = this._findOptimizationOpportunities(code, language, parserResults);
        
        // Find best practices
        const bestPractices = this._evaluateBestPractices(code, language, parserResults);
        
        return {
            issues,
            complexityMetrics,
            optimizations,
            bestPractices,
            overallScore: this._calculatePerformanceScore(issues, complexityMetrics, bestPractices)
        };
    }
    
    /**
     * Find performance issues using advanced pattern matching
     * @private
     */
    _findPerformanceIssues(code, language) {
        const normalizedLanguage = this._normalizeLanguage(language);
        const patterns = this.advancedPatterns[normalizedLanguage] || this.advancedPatterns.javascript;
        const issues = [];
        
        // Check each pattern category
        for (const [category, categoryPatterns] of Object.entries(patterns)) {
            for (const patternInfo of categoryPatterns) {
                const { pattern, description, severity, suggestion } = patternInfo;
                
                // Skip "positive" patterns when looking for issues
                if (severity === 'positive') continue;
                
                // Reset pattern for new search
                pattern.lastIndex = 0;
                
                // Find matches
                let match;
                while ((match = pattern.exec(code)) !== null) {
                    // Calculate line number and context
                    const upToMatch = code.substring(0, match.index);
                    const lineNumber = upToMatch.split('\n').length;
                    
                    // Get context (line of code)
                    const lines = code.split('\n');
                    const contextLine = lines[lineNumber - 1].trim();
                    
                    // Determine issue type based on pattern or category
                    let issueType = category;
                    
                    // More specific type mapping for fix button functionality
                    if (match[0].includes('for') && match[0].includes('+=')) {
                        issueType = 'stringConcatenation';
                    } else if (match[0].includes('for') && match[0].match(/for\s*\(.*\)\s*{\s*for/)) {
                        issueType = 'nestedLoops';
                    } else if (match[0].includes('document') && match[0].includes('appendChild')) {
                        issueType = 'domOperations';
                    } else if (match[0].includes('for') && match[0].includes('await')) {
                        issueType = 'asyncAwait';
                    }
                    
                    issues.push({
                        category,
                        type: issueType, // Add type property for fix button logic
                        description,
                        severity,
                        suggestion,
                        lineNumber,
                        context: contextLine,
                        match: match[0]
                    });
                }
            }
        }
        
        return issues;
    }
    
    /**
     * Calculate algorithmic complexity metrics
     * @private
     */
    _calculateComplexityMetrics(code, parserResults) {
        const metrics = {
            cyclomaticComplexity: parserResults.complexity.cognitiveComplexity,
            nestingDepth: parserResults.complexity.branchingDepth,
            timeComplexity: this._estimateTimeComplexity(code, parserResults),
            spaceComplexity: this._estimateSpaceComplexity(code)
        };
        
        return metrics;
    }
    
    /**
     * Estimate time complexity of the code
     * @private
     */
    _estimateTimeComplexity(code, parserResults) {
        // Count nested loops to estimate time complexity
        const singleLoopPattern = /\b(for|while|do)\b(?![^{]*\b(for|while|do)\b)/g;
        const doubleLoopPattern = /\b(for|while|do)\b[^{]*{[^{}]*\b(for|while|do)\b/g;
        const tripleLoopPattern = /\b(for|while|do)\b[^{]*{[^{}]*\b(for|while|do)\b[^{]*{[^{}]*\b(for|while|do)\b/g;
        
        const hasTripleNested = tripleLoopPattern.test(code);
        const hasDoubleNested = doubleLoopPattern.test(code);
        const hasSingleLoop = singleLoopPattern.test(code);
        
        // Simple heuristic for time complexity
        if (hasTripleNested) {
            return { notation: 'O(n³)', description: 'Cubic time complexity' };
        } else if (hasDoubleNested) {
            return { notation: 'O(n²)', description: 'Quadratic time complexity' };
        } else if (hasSingleLoop) {
            return { notation: 'O(n)', description: 'Linear time complexity' };
        } else {
            return { notation: 'O(1)', description: 'Constant time complexity' };
        }
    }
    
    /**
     * Estimate space complexity of the code
     * @private
     */
    _estimateSpaceComplexity(code) {
        // Check for array creation in loops
        const arrayInLoopPattern = /\b(for|while|do)\b[^{]*{[^{}]*new Array|{[^{}]*\[\s*\]|{[^{}]*\.push/g;
        const hasArrayInLoop = arrayInLoopPattern.test(code);
        
        // Check for potential recursive calls
        const recursivePattern = /function\s+(\w+)[^{]*{[^{}]*\1\s*\(/g;
        const hasRecursion = recursivePattern.test(code);
        
        if (hasRecursion) {
            return { notation: 'O(n)', description: 'Potentially recursive, linear space complexity' };
        } else if (hasArrayInLoop) {
            return { notation: 'O(n)', description: 'Creates data structures proportional to input size' };
        } else {
            return { notation: 'O(1)', description: 'Constant space complexity' };
        }
    }
    
    /**
     * Find optimization opportunities
     * @private
     */
    _findOptimizationOpportunities(code, language, parserResults) {
        const normalizedLanguage = this._normalizeLanguage(language);
        const patterns = this.advancedPatterns[normalizedLanguage] || this.advancedPatterns.javascript;
        const opportunities = [];
        
        // Look for positive patterns that aren't used but could be
        const positivePatterns = [];
        for (const [category, categoryPatterns] of Object.entries(patterns)) {
            positivePatterns.push(...categoryPatterns.filter(p => p.severity === 'positive'));
        }
        
        // React-specific optimizations
        if (normalizedLanguage === 'javascriptreact' || normalizedLanguage === 'typescriptreact') {
            // Check for components that could be memoized
            const componentWithPropsPattern = /function\s+([A-Z]\w*)\s*\(\s*{\s*([^}]*)\s*}\s*\)/g;
            let match;
            
            componentWithPropsPattern.lastIndex = 0;
            while ((match = componentWithPropsPattern.exec(code)) !== null) {
                const componentName = match[1];
                const props = match[2].split(',').map(p => p.trim()).filter(Boolean);
                
                // If component has props and isn't memoized, suggest it
                if (props.length > 0 && !code.includes(`React.memo(${componentName}`)) {
                    opportunities.push({
                        type: 'component_memoization',
                        description: `Component ${componentName} could benefit from memoization`,
                        suggestion: `Wrap ${componentName} with React.memo() to prevent unnecessary renders`,
                        code: match[0]
                    });
                }
            }
        }
        
        // Check for loops that could use cached values
        const repeatCompPattern = /\b(for|while)\b[^{]*{[^{}]*(\w+(\.\w+)*\([^(]*\))[^{}]*\2/g;
        repeatCompPattern.lastIndex = 0;
        let compMatch;
        
        while ((compMatch = repeatCompPattern.exec(code)) !== null) {
            opportunities.push({
                type: 'calculation_caching',
                description: 'Repeated calculation in loop body',
                suggestion: 'Cache the result of the calculation before the loop',
                code: compMatch[0]
            });
        }
        
        return opportunities;
    }
    
    /**
     * Evaluate adherence to performance best practices
     * @private
     */
    _evaluateBestPractices(code, language, parserResults) {
        const normalizedLanguage = this._normalizeLanguage(language);
        const patterns = this.advancedPatterns[normalizedLanguage] || this.advancedPatterns.javascript;
        const practices = [];
        
        // Check for positive patterns
        for (const [category, categoryPatterns] of Object.entries(patterns)) {
            for (const patternInfo of categoryPatterns) {
                const { pattern, description, severity, suggestion } = patternInfo;
                
                // Only include positive patterns here
                if (severity !== 'positive') continue;
                
                // Reset pattern
                pattern.lastIndex = 0;
                
                // Find matches
                if (pattern.test(code)) {
                    practices.push({
                        category,
                        description,
                        suggestion,
                        positive: true
                    });
                }
            }
        }
        
        return practices;
    }
    
    /**
     * Calculate an overall performance score
     * @private
     */
    _calculatePerformanceScore(issues, complexityMetrics, bestPractices) {
        // Base score
        let score = 100;
        
        // Deduct points for issues
        const severityWeights = {
            'critical': 20,
            'high': 10,
            'medium': 5,
            'low': 2
        };
        
        for (const issue of issues) {
            score -= severityWeights[issue.severity] || 0;
        }
        
        // Deduct for complexity
        if (complexityMetrics.timeComplexity.notation === 'O(n³)') {
            score -= 30;
        } else if (complexityMetrics.timeComplexity.notation === 'O(n²)') {
            score -= 15;
        } else if (complexityMetrics.timeComplexity.notation === 'O(n)') {
            score -= 5;
        }
        
        // Add points for best practices
        score += bestPractices.length * 3;
        
        // Ensure score is within range
        return Math.max(0, Math.min(100, score));
    }
    
    /**
     * Normalize language identifier
     * @private
     */
    _normalizeLanguage(language) {
        if (!language) {
            return 'javascript';
        }
        
        if (this.advancedPatterns[language]) {
            return language;
        }
        
        if (language === 'javascriptreact') {
            return 'javascriptreact';
        }
        
        if (language === 'typescriptreact') {
            return 'typescriptreact';
        }
        
        if (language === 'typescript') {
            return 'typescript';
        }
        
        return 'javascript';
    }
}

module.exports = { EnhancedPerformanceAnalyzer }; 