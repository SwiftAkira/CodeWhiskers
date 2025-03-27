const vscode = require('vscode');

/**
 * Performance Analyzer Module for CodeWhiskers
 * Identifies potential performance bottlenecks in code
 */
class PerformanceAnalyzer {
    constructor() {
        this._panel = null;
        this._catThemeManager = null;
        
        // Define performance patterns to search for
        this.performancePatterns = {
            javascript: {
                inefficientLoops: [
                    { 
                        pattern: /for\s*\([^)]*\)\s*{[^}]*\$\{[^}]*\}/g, 
                        description: "String interpolation inside loops is inefficient",
                        severity: "high",
                        suggestion: "Move string interpolation outside the loop if possible"
                    },
                    { 
                        pattern: /for\s*\([^)]*\)\s*{[^}]*\s+new\s+/g, 
                        description: "Object instantiation inside loops can cause memory churn",
                        severity: "medium",
                        suggestion: "Try to move object creation outside the loop"
                    },
                    { 
                        pattern: /for\s*\([^)]*\)\s*{[^}]*\s+splice\s*\(/g, 
                        description: "Array splice inside loops can be slow",
                        severity: "medium",
                        suggestion: "Consider alternative data manipulation approaches"
                    }
                ],
                expensiveOperations: [
                    { 
                        pattern: /document\.querySelectorAll\([^)]*\)/g, 
                        description: "querySelectorAll can be expensive on large DOM trees",
                        severity: "medium",
                        suggestion: "Cache DOM queries outside of frequently called functions"
                    },
                    { 
                        pattern: /\.forEach\([^)]*=>\s*{[^}]*document\./g, 
                        description: "DOM operations inside loops can cause reflows",
                        severity: "high",
                        suggestion: "Batch DOM operations or use DocumentFragment"
                    },
                    { 
                        pattern: /JSON\.parse\([^)]*JSON\.stringify\([^)]*\)/g, 
                        description: "Deep cloning with JSON is inefficient",
                        severity: "medium",
                        suggestion: "Consider structured cloning or libraries like lodash.cloneDeep"
                    }
                ],
                memoryLeaks: [
                    { 
                        pattern: /setInterval\([^)]*,\s*\d+\)/g, 
                        description: "Potential memory leak from uncleaned intervals",
                        severity: "high",
                        suggestion: "Ensure intervals are cleared with clearInterval when no longer needed"
                    },
                    { 
                        pattern: /addEventListener\([^)]*\)/g, 
                        description: "Potential memory leak from event listeners",
                        severity: "medium",
                        suggestion: "Remove event listeners with removeEventListener when no longer needed"
                    }
                ],
                asyncIssues: [
                    { 
                        pattern: /await\s+Promise\.all\(\s*\[\s*[^\]]*\]\s*\)/g, 
                        description: "Inefficient Promise.all batch",
                        severity: "low",
                        suggestion: "Ensure promises are created before calling Promise.all"
                    },
                    { 
                        pattern: /for\s*\([^)]*\)\s*{[^}]*await\s+/g, 
                        description: "Sequential await in loop is slow",
                        severity: "high",
                        suggestion: "Use Promise.all to parallelize async operations"
                    }
                ]
            },
            typescript: {
                // Inherit JavaScript patterns
                // Add TypeScript specific patterns
                inefficientLoops: null,
                expensiveOperations: [
                    { 
                        pattern: /as\s+[A-Za-z]+\[\]/g, 
                        description: "Type assertions in critical path",
                        severity: "low",
                        suggestion: "Use proper typing to avoid runtime assertions"
                    }
                ],
                memoryLeaks: null,
                asyncIssues: null
            },
            react: {
                inefficientHooks: [
                    { 
                        pattern: /useEffect\(\s*\(\s*\)\s*=>\s*{\s*[^}]*\s*}\s*\)/g, 
                        description: "useEffect without dependencies array",
                        severity: "medium",
                        suggestion: "Add dependencies array to prevent unnecessary re-renders"
                    },
                    { 
                        pattern: /useState\(\s*{[^}]*}\s*\)/g, 
                        description: "useState with object state",
                        severity: "low",
                        suggestion: "Consider splitting into multiple state variables"
                    }
                ],
                rerenderIssues: [
                    { 
                        pattern: />\s*{[^}]*\.map\([^)]*=>\s*<[^>]*>\s*{/g, 
                        description: "Nested component in map without memoization",
                        severity: "medium",
                        suggestion: "Use React.memo or extract to a memoized component"
                    },
                    {
                        pattern: /new\s+[A-Z][A-Za-z]*\(/g,
                        description: "Creating new objects during render",
                        severity: "medium",
                        suggestion: "Move object creation outside component or use useMemo"
                    }
                ]
            }
        };
        
        // Initialize TypeScript patterns by copying JavaScript ones
        this.performancePatterns.typescript.inefficientLoops = [...this.performancePatterns.javascript.inefficientLoops];
        this.performancePatterns.typescript.memoryLeaks = [...this.performancePatterns.javascript.memoryLeaks];
        this.performancePatterns.typescript.asyncIssues = [...this.performancePatterns.javascript.asyncIssues];
    }
    
    /**
     * Set the cat theme manager
     * @param {CatThemeManager} manager - The cat theme manager
     */
    setCatThemeManager(manager) {
        this._catThemeManager = manager;
    }
    
    /**
     * Analyze code for performance issues
     * @param {string} code - Code to analyze
     * @param {string} language - Language of the code
     * @returns {object[]} Array of detected performance issues
     */
    analyzePerformance(code, language) {
        // Normalize language
        let effectiveLanguage = language;
        if (['javascriptreact', 'typescriptreact'].includes(language)) {
            effectiveLanguage = language.replace('react', '');
        }
        
        if (!this.performancePatterns[effectiveLanguage]) {
            effectiveLanguage = 'javascript'; // Fallback to JavaScript
        }
        
        const issues = [];
        const patterns = this.performancePatterns[effectiveLanguage];
        
        // Check each pattern category
        for (const [category, categoryPatterns] of Object.entries(patterns)) {
            if (!categoryPatterns) continue;
            
            for (const patternInfo of categoryPatterns) {
                const { pattern, description, severity, suggestion } = patternInfo;
                
                // Reset regex last index to ensure fresh search
                pattern.lastIndex = 0;
                
                // Find all matches
                let match;
                while ((match = pattern.exec(code)) !== null) {
                    // Calculate line number and context
                    const upToMatch = code.substring(0, match.index);
                    const lineNumber = upToMatch.split('\n').length;
                    
                    // Get context (the specific code line)
                    const lines = code.split('\n');
                    const contextLine = lines[lineNumber - 1];
                    
                    issues.push({
                        category,
                        description,
                        severity,
                        suggestion,
                        lineNumber,
                        context: contextLine.trim(),
                        match: match[0]
                    });
                }
            }
        }
        
        // Check React patterns if applicable
        if (['javascriptreact', 'typescriptreact'].includes(language)) {
            const reactPatterns = this.performancePatterns.react;
            
            for (const [category, categoryPatterns] of Object.entries(reactPatterns)) {
                for (const patternInfo of categoryPatterns) {
                    const { pattern, description, severity, suggestion } = patternInfo;
                    
                    // Reset regex last index
                    pattern.lastIndex = 0;
                    
                    // Find all matches
                    let match;
                    while ((match = pattern.exec(code)) !== null) {
                        // Calculate line number and context
                        const upToMatch = code.substring(0, match.index);
                        const lineNumber = upToMatch.split('\n').length;
                        
                        // Get context (the specific code line)
                        const lines = code.split('\n');
                        const contextLine = lines[lineNumber - 1];
                        
                        issues.push({
                            category: 'react_' + category,
                            description,
                            severity,
                            suggestion,
                            lineNumber,
                            context: contextLine.trim(),
                            match: match[0]
                        });
                    }
                }
            }
        }
        
        // Add additional deep analysis for specific cases
        this._addPerformanceMetrics(issues, code, language);
        
        return issues;
    }
    
    /**
     * Display performance issues in a webview panel
     * @param {object[]} issues - Array of performance issues
     * @param {string} fileName - Name of the file being analyzed
     */
    showPerformanceAnalysis(issues, fileName) {
        const title = `CodeWhiskers: Performance Analysis - ${fileName}`;
        
        // Create webview panel if it doesn't exist
        if (!this._panel) {
            this._panel = vscode.window.createWebviewPanel(
                'codewhiskersPerformance',
                title,
                vscode.ViewColumn.Two,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );
            
            // Handle panel disposal
            this._panel.onDidDispose(() => {
                this._panel = null;
            });
        } else {
            this._panel.title = title;
        }
        
        // Set panel HTML content
        this._panel.webview.html = this._generatePerformanceHTML(issues, fileName);
        
        // Handle webview messages
        this._panel.webview.onDidReceiveMessage(message => {
            if (message.command === 'showIssueLocation') {
                this._navigateToIssue(message.lineNumber);
            }
        });
    }
    
    /**
     * Navigate to a specific line in the editor
     * @private
     */
    _navigateToIssue(lineNumber) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        
        const position = new vscode.Position(lineNumber - 1, 0);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(
            new vscode.Range(position, position),
            vscode.TextEditorRevealType.InCenter
        );
    }
    
    /**
     * Add deeper performance metrics analysis
     * @private
     */
    _addPerformanceMetrics(issues, code, language) {
        // Count total loops
        const loopMatches = code.match(/for\s*\(|while\s*\(|do\s*{/g) || [];
        const totalLoops = loopMatches.length;
        
        // Count nested loops (a simple heuristic)
        const nestedLoopPattern = /for\s*\([^{]*{[^}]*for\s*\(/g;
        const nestedLoopMatches = code.match(nestedLoopPattern) || [];
        const nestedLoops = nestedLoopMatches.length;
        
        if (nestedLoops > 0) {
            // Add an issue for each nested loop
            issues.push({
                category: 'performance_metric',
                description: `Found ${nestedLoops} nested loops which can lead to O(n²) complexity`,
                severity: nestedLoops > 2 ? 'high' : 'medium',
                suggestion: 'Consider restructuring to avoid nested loops or use more efficient algorithms',
                metric: { type: 'nested_loops', count: nestedLoops }
            });
        }
        
        // Check for large array literals
        const largeArrayPattern = /\[[^\]]{1000,}\]/g;
        const largeArrayMatches = code.match(largeArrayPattern) || [];
        if (largeArrayMatches.length > 0) {
            issues.push({
                category: 'performance_metric',
                description: 'Large array literals can impact load and parse time',
                severity: 'medium',
                suggestion: 'Consider loading large datasets dynamically or chunking',
                metric: { type: 'large_arrays', count: largeArrayMatches.length }
            });
        }
        
        // Check for excessive function parameters
        const functionParamPattern = /function\s+\w+\s*\([^)]{50,}\)/g;
        const excessiveParamsMatches = code.match(functionParamPattern) || [];
        if (excessiveParamsMatches.length > 0) {
            issues.push({
                category: 'performance_metric',
                description: 'Functions with many parameters can be inefficient',
                severity: 'low',
                suggestion: 'Use object parameters instead of many individual parameters',
                metric: { type: 'excessive_params', count: excessiveParamsMatches.length }
            });
        }
        
        // Check React specific metrics
        if (['javascriptreact', 'typescriptreact'].includes(language)) {
            // Find components without memoization
            const componentPattern = /function\s+([A-Z]\w+)\s*\([^)]*\)\s*{/g;
            let match;
            let componentCount = 0;
            let nonMemoizedCount = 0;
            
            while ((match = componentPattern.exec(code)) !== null) {
                componentCount++;
                const componentName = match[1];
                // Check if component is exported with memo
                if (!code.includes(`export default memo(${componentName})`) && 
                    !code.includes(`export default React.memo(${componentName})`)) {
                    nonMemoizedCount++;
                }
            }
            
            if (nonMemoizedCount > 2) {
                issues.push({
                    category: 'react_optimization',
                    description: `${nonMemoizedCount} of ${componentCount} components are not memoized`,
                    severity: 'medium',
                    suggestion: 'Use React.memo for components that render often with the same props',
                    metric: { 
                        type: 'non_memoized', 
                        count: nonMemoizedCount,
                        total: componentCount
                    }
                });
            }
        }
    }
    
    /**
     * Generate HTML for performance analysis
     * @private
     */
    _generatePerformanceHTML(issues, fileName) {
        // Group issues by severity
        const highSeverity = issues.filter(issue => issue.severity === 'high');
        const mediumSeverity = issues.filter(issue => issue.severity === 'medium');
        const lowSeverity = issues.filter(issue => issue.severity === 'low');
        
        // Get cat theme elements
        const catEmoji = this._catThemeManager ? this._catThemeManager.getCatEmoji() : '🐱';
        const catAnimation = this._catThemeManager ? this._catThemeManager.getCatAnimation() : '';
        const catThemeCSS = this._catThemeManager ? this._catThemeManager.getThemeCSS() : '';
        const backgroundElements = this._catThemeManager ? this._catThemeManager.getBackgroundElements() : '';
        
        // Generate performance score
        const performanceScore = this._calculatePerformanceScore(issues);
        const scoreColor = performanceScore > 80 ? '#4CAF50' : 
                          performanceScore > 60 ? '#FFC107' : '#F44336';
        
        // Generate HTML
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CodeWhiskers Performance Analysis</title>
            <style>
                :root {
                    --primary-color: var(--vscode-button-background);
                    --primary-text: var(--vscode-button-foreground);
                    --panel-bg: var(--vscode-editor-background);
                    --panel-text: var(--vscode-editor-foreground);
                    --border-color: var(--vscode-panel-border);
                    --card-bg: var(--vscode-editor-inactiveSelectionBackground);
                    --hover-bg: var(--vscode-list-hoverBackground);
                    --high-severity: #F44336;
                    --medium-severity: #FFC107;
                    --low-severity: #4CAF50;
                    --animation-duration: 800ms;
                }
                
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    padding: 20px;
                    color: var(--panel-text);
                    background-color: var(--panel-bg);
                    opacity: 0;
                    transform: translateY(20px);
                    transition: opacity var(--animation-duration) ease, transform var(--animation-duration) ease;
                }
                
                body.loaded {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                h1, h2, h3 {
                    color: var(--panel-text);
                }
                
                .cat-container {
                    display: flex;
                    align-items: center;
                    margin-bottom: 20px;
                }
                
                .cat-image {
                    font-size: 50px;
                    margin-right: 20px;
                }
                
                .performance-score {
                    position: relative;
                    width: 100px;
                    height: 100px;
                    margin: 20px auto;
                }
                
                .score-circle {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: conic-gradient(
                        ${scoreColor} ${performanceScore * 3.6}deg, 
                        var(--card-bg) 0deg
                    );
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                
                .score-circle::before {
                    content: '';
                    position: absolute;
                    width: 80%;
                    height: 80%;
                    border-radius: 50%;
                    background: var(--panel-bg);
                }
                
                .score-value {
                    position: relative;
                    font-size: 24px;
                    font-weight: bold;
                    z-index: 1;
                }
                
                .summary-box {
                    background-color: var(--card-bg);
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                
                .issue-card {
                    background-color: var(--card-bg);
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    border-left: 4px solid;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    opacity: 0;
                    animation: slide-in 0.4s ease forwards;
                }
                
                .issue-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
                    cursor: pointer;
                }
                
                .issue-card.high {
                    border-left-color: var(--high-severity);
                }
                
                .issue-card.medium {
                    border-left-color: var(--medium-severity);
                }
                
                .issue-card.low {
                    border-left-color: var(--low-severity);
                }
                
                .severity-badge {
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 12px;
                    color: white;
                    font-size: 12px;
                    margin-bottom: 8px;
                }
                
                .severity-badge.high {
                    background-color: var(--high-severity);
                }
                
                .severity-badge.medium {
                    background-color: var(--medium-severity);
                }
                
                .severity-badge.low {
                    background-color: var(--low-severity);
                }
                
                .issue-title {
                    font-size: 16px;
                    margin: 8px 0;
                }
                
                .code-context {
                    background-color: var(--panel-bg);
                    padding: 10px;
                    border-radius: 4px;
                    font-family: 'Courier New', Courier, monospace;
                    margin: 10px 0;
                    white-space: pre;
                    overflow-x: auto;
                }
                
                .suggestion {
                    margin-top: 10px;
                    font-style: italic;
                }
                
                .section-tabs {
                    display: flex;
                    margin-bottom: 20px;
                }
                
                .tab {
                    padding: 10px 15px;
                    background-color: var(--card-bg);
                    border: none;
                    cursor: pointer;
                    color: var(--panel-text);
                    transition: background-color 0.2s ease;
                }
                
                .tab.active {
                    background-color: var(--primary-color);
                    color: var(--primary-text);
                }
                
                .tab-content {
                    display: none;
                }
                
                .tab-content.active {
                    display: block;
                }
                
                @keyframes slide-in {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                ${catThemeCSS}
            </style>
        </head>
        <body>
            ${backgroundElements}
            
            <div class="cat-container">
                <div class="cat-image">${catEmoji}</div>
                <div>
                    <h1>Performance Analysis</h1>
                    <p>File: ${fileName}</p>
                </div>
            </div>
            
            <div class="performance-score">
                <div class="score-circle">
                    <div class="score-value">${performanceScore}</div>
                </div>
            </div>
            
            <div class="summary-box">
                <h3>Performance Summary</h3>
                <p>Found ${issues.length} potential performance issues:</p>
                <ul>
                    <li>${highSeverity.length} high severity issues</li>
                    <li>${mediumSeverity.length} medium severity issues</li>
                    <li>${lowSeverity.length} low severity issues</li>
                </ul>
            </div>
            
            <div class="section-tabs">
                <button class="tab active" data-tab="all">All Issues (${issues.length})</button>
                <button class="tab" data-tab="high">High Severity (${highSeverity.length})</button>
                <button class="tab" data-tab="medium">Medium Severity (${mediumSeverity.length})</button>
                <button class="tab" data-tab="low">Low Severity (${lowSeverity.length})</button>
            </div>
            
            <div id="all" class="tab-content active">
                ${this._generateIssueCards(issues)}
            </div>
            
            <div id="high" class="tab-content">
                ${this._generateIssueCards(highSeverity)}
            </div>
            
            <div id="medium" class="tab-content">
                ${this._generateIssueCards(mediumSeverity)}
            </div>
            
            <div id="low" class="tab-content">
                ${this._generateIssueCards(lowSeverity)}
            </div>
            
            <script>
                (function() {
                    // Initialize
                    const vscode = acquireVsCodeApi();
                    let animationDelay = 0.1;
                    
                    // Apply animations after small delay
                    setTimeout(() => {
                        document.body.classList.add('loaded');
                    }, 100);
                    
                    // Set animation delay for each card
                    document.querySelectorAll('.issue-card').forEach((card, index) => {
                        card.style.animationDelay = (animationDelay + index * 0.05) + 's';
                    });
                    
                    // Add click handlers to tabs
                    document.querySelectorAll('.tab').forEach(tab => {
                        tab.addEventListener('click', () => {
                            // Hide all tab contents
                            document.querySelectorAll('.tab-content').forEach(content => {
                                content.classList.remove('active');
                            });
                            
                            // Deactivate all tabs
                            document.querySelectorAll('.tab').forEach(t => {
                                t.classList.remove('active');
                            });
                            
                            // Activate clicked tab
                            tab.classList.add('active');
                            
                            // Show corresponding content
                            const tabId = tab.getAttribute('data-tab');
                            document.getElementById(tabId).classList.add('active');
                            
                            // Reset animation delay for newly visible cards
                            document.querySelectorAll('#' + tabId + ' .issue-card').forEach((card, index) => {
                                card.style.animationDelay = (0.1 + index * 0.05) + 's';
                            });
                        });
                    });
                    
                    // Add click handlers to issue cards
                    document.querySelectorAll('.issue-card').forEach(card => {
                        card.addEventListener('click', () => {
                            const lineNumber = card.getAttribute('data-line');
                            if (lineNumber) {
                                vscode.postMessage({
                                    command: 'showIssueLocation',
                                    lineNumber: parseInt(lineNumber)
                                });
                            }
                        });
                    });
                })();
            </script>
        </body>
        </html>
        `;
    }
    
    /**
     * Generate HTML for issue cards
     * @private
     */
    _generateIssueCards(issues) {
        if (issues.length === 0) {
            return '<p>No issues found in this category.</p>';
        }
        
        return issues.map((issue, index) => {
            // Don't show line number for metric-based issues
            const hasLineNumber = issue.lineNumber !== undefined;
            const lineDisplay = hasLineNumber ? `Line ${issue.lineNumber}: ` : '';
            
            return `
            <div class="issue-card ${issue.severity}" data-line="${issue.lineNumber || ''}" data-index="${index}">
                <span class="severity-badge ${issue.severity}">${issue.severity.toUpperCase()}</span>
                <h3 class="issue-title">${lineDisplay}${issue.description}</h3>
                ${issue.context ? `<div class="code-context">${issue.context}</div>` : ''}
                <div class="suggestion">💡 ${issue.suggestion}</div>
            </div>
            `;
        }).join('');
    }
    
    /**
     * Calculate overall performance score based on issues
     * @private
     */
    _calculatePerformanceScore(issues) {
        if (issues.length === 0) return 100;
        
        // Count by severity
        const highCount = issues.filter(i => i.severity === 'high').length;
        const mediumCount = issues.filter(i => i.severity === 'medium').length;
        const lowCount = issues.filter(i => i.severity === 'low').length;
        
        // Calculate weighted penalty
        const highPenalty = highCount * 15;
        const mediumPenalty = mediumCount * 5;
        const lowPenalty = lowCount * 2;
        
        // Calculate score (100 - penalties)
        let score = 100 - (highPenalty + mediumPenalty + lowPenalty);
        
        // Ensure score stays in 0-100 range
        return Math.max(0, Math.min(100, score));
    }
}

module.exports = PerformanceAnalyzer; 