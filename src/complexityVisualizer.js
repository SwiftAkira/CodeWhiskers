const vscode = require('vscode');

/**
 * Complexity Visualizer Module for CodeWhiskers
 * Provides visualizations for code complexity metrics
 */
class ComplexityVisualizer {
    constructor() {
        this._panel = null;
        this._catThemeManager = null;
    }

    /**
     * Set the cat theme manager
     * @param {CatThemeManager} manager - The cat theme manager
     */
    setCatThemeManager(manager) {
        this._catThemeManager = manager;
    }

    /**
     * Display function complexity analysis in a webview panel
     * @param {object[]} functionAnalyses - Array of function complexity analyses
     * @param {string} fileName - Name of the file being analyzed
     */
    showComplexityAnalysis(functionAnalyses, fileName) {
        const title = `CodeWhiskers: Complexity Analysis - ${fileName}`;
        
        // Create webview panel if it doesn't exist
        if (!this._panel) {
            this._panel = vscode.window.createWebviewPanel(
                'codewhiskersComplexity',
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
        this._panel.webview.html = this._generateComplexityHTML(functionAnalyses, fileName);
        
        // Handle webview messages
        this._panel.webview.onDidReceiveMessage(message => {
            if (message.command === 'showFunctionDetail') {
                this._showFunctionDetail(message.functionName, functionAnalyses);
            }
        });
    }
    
    /**
     * Display function dependency graph in a webview panel
     * @param {object} dependencyData - Dependency graph data
     * @param {string} fileName - Name of the file being analyzed
     */
    showDependencyGraph(dependencyData, fileName) {
        const title = `CodeWhiskers: Dependency Graph - ${fileName}`;
        
        // Create webview panel if it doesn't exist
        if (!this._panel) {
            this._panel = vscode.window.createWebviewPanel(
                'codewhiskersDependency',
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
        this._panel.webview.html = this._generateDependencyGraphHTML(dependencyData, fileName);
    }
    
    /**
     * Show details for a specific function
     * @private
     */
    _showFunctionDetail(functionName, functionAnalyses) {
        const func = functionAnalyses.find(f => f.name === functionName);
        if (!func) return;
        
        vscode.window.showInformationMessage(
            `Function "${functionName}" has cyclomatic complexity ${func.cyclomaticComplexity} (${func.complexityLevel.level})`
        );
    }
    
    /**
     * Generate HTML for complexity analysis
     * @private
     */
    _generateComplexityHTML(functionAnalyses, fileName) {
        // Sort functions by complexity (highest first)
        const sortedFunctions = [...functionAnalyses].sort((a, b) => 
            b.cyclomaticComplexity - a.cyclomaticComplexity);
        
        // Calculate summary metrics
        const totalFunctions = functionAnalyses.length;
        const avgComplexity = functionAnalyses.reduce((sum, func) => 
            sum + func.cyclomaticComplexity, 0) / totalFunctions || 0;
        const maxComplexity = Math.max(...functionAnalyses.map(f => f.cyclomaticComplexity));
        const avgLineCount = functionAnalyses.reduce((sum, func) => 
            sum + func.lineCount, 0) / totalFunctions || 0;
        
        // Count complexity levels
        const complexityLevels = {
            low: functionAnalyses.filter(f => f.complexityLevel.level === 'low').length,
            moderate: functionAnalyses.filter(f => f.complexityLevel.level === 'moderate').length,
            high: functionAnalyses.filter(f => f.complexityLevel.level === 'high').length,
            veryHigh: functionAnalyses.filter(f => f.complexityLevel.level === 'very high').length
        };
        
        // Generate chart data
        const complexityChartData = sortedFunctions.map(f => ({
            name: f.name,
            value: f.cyclomaticComplexity,
            color: f.complexityLevel.color
        })).slice(0, 10); // Show top 10 most complex functions
        
        // Get cat theme elements
        const catEmoji = this._catThemeManager ? this._catThemeManager.getCatEmoji() : '🐱';
        const catAnimation = this._catThemeManager ? this._catThemeManager.getCatAnimation() : '';
        const catThemeCSS = this._catThemeManager ? this._catThemeManager.getThemeCSS() : '';
        const backgroundElements = this._catThemeManager ? this._catThemeManager.getBackgroundElements() : '';
        
        // Generate HTML
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CodeWhiskers Complexity Analysis</title>
            <style>
                :root {
                    --primary-color: var(--vscode-button-background);
                    --primary-text: var(--vscode-button-foreground);
                    --panel-bg: var(--vscode-editor-background);
                    --panel-text: var(--vscode-editor-foreground);
                    --border-color: var(--vscode-panel-border);
                    --card-bg: var(--vscode-editor-inactiveSelectionBackground);
                    --hover-bg: var(--vscode-list-hoverBackground);
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
                
                .summary-metrics {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                .metric-card {
                    background-color: var(--card-bg);
                    border-radius: 8px;
                    padding: 15px;
                    flex: 1;
                    min-width: 150px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    opacity: 0;
                    animation: slide-up 0.5s ease forwards;
                }
                
                .metric-card:nth-child(1) { animation-delay: 0.1s; }
                .metric-card:nth-child(2) { animation-delay: 0.2s; }
                .metric-card:nth-child(3) { animation-delay: 0.3s; }
                .metric-card:nth-child(4) { animation-delay: 0.4s; }
                
                .metric-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
                }
                
                .metric-value {
                    font-size: 24px;
                    font-weight: bold;
                    margin: 10px 0;
                    opacity: 0;
                    animation: count-up 1s ease forwards;
                    animation-delay: 0.7s;
                }
                
                .metric-label {
                    font-size: 14px;
                    opacity: 0.8;
                }
                
                .chart-container {
                    margin-top: 30px;
                    height: 300px;
                    opacity: 0;
                    animation: fade-in 0.5s ease forwards;
                    animation-delay: 0.5s;
                }
                
                .bar-chart {
                    display: flex;
                    height: 250px;
                    align-items: flex-end;
                    gap: 10px;
                    margin-top: 20px;
                }
                
                .bar {
                    flex: 1;
                    min-width: 30px;
                    position: relative;
                    cursor: pointer;
                    transform: scaleY(0);
                    animation: grow-bar 1s ease forwards;
                    transform-origin: bottom;
                }
                
                .bar:hover {
                    filter: brightness(1.2);
                }
                
                .bar-label {
                    transform: rotate(-45deg);
                    transform-origin: left top;
                    position: absolute;
                    bottom: -30px;
                    left: 10px;
                    font-size: 12px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 100px;
                    opacity: 0;
                    animation: fade-in 0.5s ease forwards;
                }
                
                .complexity-distribution {
                    display: flex;
                    margin-top: 30px;
                    height: 40px;
                    border-radius: 4px;
                    overflow: hidden;
                    opacity: 0;
                    animation: fade-in 0.5s ease forwards;
                    animation-delay: 0.3s;
                }
                
                .complexity-segment {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 12px;
                    width: 0%;
                    transition: width 1.5s ease-out;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 30px;
                    opacity: 0;
                    animation: fade-in 0.5s ease forwards;
                    animation-delay: 0.8s;
                }
                
                th, td {
                    text-align: left;
                    padding: 12px;
                    border-bottom: 1px solid var(--border-color);
                }
                
                th {
                    background-color: var(--card-bg);
                }
                
                tr {
                    transition: background-color 0.2s ease;
                }
                
                tr:hover {
                    background-color: var(--hover-bg);
                }
                
                .complexity-badge {
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 12px;
                    color: white;
                    font-size: 12px;
                    transition: transform 0.2s ease;
                }
                
                .complexity-badge:hover {
                    transform: scale(1.1);
                }
                
                .cat-image {
                    width: 80px;
                    margin-top: 15px;
                    font-size: 60px;
                    line-height: 1;
                    ${catAnimation}
                }
                
                .cat-container {
                    text-align: center;
                    margin-bottom: 30px;
                    opacity: 0;
                    animation: fade-in 0.5s ease forwards;
                }
                
                .section {
                    margin-top: 40px;
                    opacity: 0;
                    transform: translateY(20px);
                    animation: slide-up 0.6s ease forwards;
                }
                
                .section:nth-child(1) { animation-delay: 0.1s; }
                .section:nth-child(2) { animation-delay: 0.3s; }
                .section:nth-child(3) { animation-delay: 0.5s; }
                .section:nth-child(4) { animation-delay: 0.7s; }
                
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes grow-bar {
                    from { transform: scaleY(0); }
                    to { transform: scaleY(1); }
                }
                
                @keyframes count-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .theme-toggle {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: var(--primary-color);
                    color: var(--primary-text);
                    border: none;
                    border-radius: 4px;
                    padding: 5px 10px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: transform 0.2s ease;
                }
                
                .theme-toggle:hover {
                    transform: scale(1.05);
                }
                
                .tooltip {
                    position: fixed;
                    background-color: var(--card-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    padding: 10px;
                    font-size: 12px;
                    z-index: 100;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    max-width: 250px;
                }
                
                /* Add cat theme CSS */
                ${catThemeCSS}
            </style>
        </head>
        <body>
            ${backgroundElements}
            
            <div class="cat-container">
                <div class="cat-image">${catEmoji}</div>
                <h1>Code Complexity Analysis</h1>
                <p>File: ${fileName}</p>
            </div>
            
            <div class="section">
                <h2>Summary Metrics</h2>
                <div class="summary-metrics">
                    <div class="metric-card">
                        <div class="metric-label">Functions Analyzed</div>
                        <div class="metric-value" data-value="${totalFunctions}">${totalFunctions}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Average Complexity</div>
                        <div class="metric-value" data-value="${avgComplexity.toFixed(1)}">${avgComplexity.toFixed(1)}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Max Complexity</div>
                        <div class="metric-value" data-value="${maxComplexity}">${maxComplexity}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Average Function Length</div>
                        <div class="metric-value" data-value="${avgLineCount.toFixed(1)}">${avgLineCount.toFixed(1)} lines</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>Complexity Distribution</h2>
                <div class="complexity-distribution">
                    ${this._generateDistributionSegment(complexityLevels.low, totalFunctions, '#4CAF50', 'Low')}
                    ${this._generateDistributionSegment(complexityLevels.moderate, totalFunctions, '#FFC107', 'Moderate')}
                    ${this._generateDistributionSegment(complexityLevels.high, totalFunctions, '#FF9800', 'High')}
                    ${this._generateDistributionSegment(complexityLevels.veryHigh, totalFunctions, '#F44336', 'Very High')}
                </div>
            </div>
            
            <div class="section">
                <h2>Top Complex Functions</h2>
                <div class="chart-container">
                    <div class="bar-chart">
                        ${this._generateBarChart(complexityChartData, maxComplexity)}
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>Functions Details</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Function</th>
                            <th>Lines</th>
                            <th>Cyclomatic Complexity</th>
                            <th>Nesting Level</th>
                            <th>Parameters</th>
                            <th>Recommendation</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedFunctions.map(func => `
                        <tr>
                            <td>${func.name}</td>
                            <td>${func.lineCount}</td>
                            <td>
                                <span class="complexity-badge" style="background-color: ${func.complexityLevel.color}">
                                    ${func.cyclomaticComplexity}
                                </span>
                            </td>
                            <td>${func.nestingLevel}</td>
                            <td>${func.parameterCount}</td>
                            <td>${func.complexityLevel.description}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="tooltip" id="tooltip"></div>
            
            <script>
                (function() {
                    // Initialize
                    const vscode = acquireVsCodeApi();
                    const tooltip = document.getElementById('tooltip');
                    
                    // Apply animations after small delay
                    setTimeout(() => {
                        document.body.classList.add('loaded');
                        
                        // Set distribution widths
                        const segments = document.querySelectorAll('.complexity-segment');
                        segments.forEach(segment => {
                            const width = segment.getAttribute('data-width');
                            segment.style.width = width;
                        });
                        
                        // Animate bars with staggered delay
                        const bars = document.querySelectorAll('.bar');
                        bars.forEach((bar, index) => {
                            bar.style.animationDelay = (0.8 + index * 0.1) + 's';
                            bar.querySelector('.bar-label').style.animationDelay = (1.3 + index * 0.1) + 's';
                        });
                        
                        // Animate counting metrics
                        animateMetricCounting();
                    }, 100);
                    
                    // Function to animate metric values with counting effect
                    function animateMetricCounting() {
                        const countElements = document.querySelectorAll('.metric-value');
                        countElements.forEach(el => {
                            const value = parseFloat(el.getAttribute('data-value'));
                            const isDecimal = el.textContent.includes('.');
                            const isLines = el.textContent.includes('lines');
                            
                            let startValue = 0;
                            const duration = 1500;
                            const startTime = performance.now();
                            
                            function updateCount(timestamp) {
                                const elapsed = timestamp - startTime;
                                const progress = Math.min(elapsed / duration, 1);
                                
                                // Easing function for smoother animation
                                const easedProgress = 1 - Math.pow(1 - progress, 3);
                                
                                const currentValue = startValue + (value - startValue) * easedProgress;
                                
                                if (isDecimal) {
                                    el.textContent = isLines ? 
                                        currentValue.toFixed(1) + ' lines' : 
                                        currentValue.toFixed(1);
                                } else {
                                    el.textContent = Math.round(currentValue);
                                }
                                
                                if (progress < 1) {
                                    requestAnimationFrame(updateCount);
                                }
                            }
                            
                            requestAnimationFrame(updateCount);
                        });
                    }
                    
                    // Handle bar clicks
                    document.querySelectorAll('.bar').forEach(bar => {
                        // Add click handler
                        bar.addEventListener('click', (event) => {
                            const functionName = bar.getAttribute('data-function');
                            // Send message to extension
                            vscode.postMessage({
                                command: 'showFunctionDetail',
                                functionName: functionName
                            });
                        });
                        
                        // Add tooltip on hover
                        bar.addEventListener('mouseenter', (event) => {
                            const functionName = bar.getAttribute('data-function');
                            tooltip.textContent = functionName;
                            tooltip.style.opacity = '1';
                            updateTooltipPosition(event);
                        });
                        
                        bar.addEventListener('mousemove', updateTooltipPosition);
                        
                        bar.addEventListener('mouseleave', () => {
                            tooltip.style.opacity = '0';
                        });
                    });
                    
                    // Update tooltip position
                    function updateTooltipPosition(event) {
                        tooltip.style.left = (event.pageX + 10) + 'px';
                        tooltip.style.top = (event.pageY + 10) + 'px';
                    }
                    
                    // Add hover effects for table rows
                    document.querySelectorAll('tr').forEach(row => {
                        row.addEventListener('mouseenter', () => {
                            row.style.backgroundColor = 'var(--hover-bg)';
                        });
                        
                        row.addEventListener('mouseleave', () => {
                            row.style.backgroundColor = '';
                        });
                    });
                })();
                
                // Add theme change handler
                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.command === 'updateTheme') {
                        document.querySelector('.cat-image').innerHTML = message.catEmoji;
                        
                        // Apply new animation
                        const catImage = document.querySelector('.cat-image');
                        catImage.style.animation = '';
                        setTimeout(() => {
                            const styleSheet = document.styleSheets[0];
                            const animationCSS = message.catAnimation;
                            
                            // Add the new animation styles
                            styleSheet.insertRule(animationCSS, styleSheet.cssRules.length);
                            
                            // Get animation name from the CSS
                            const animationMatch = animationCSS.match(/animation:\s+([^\\s]+)/);
                            if (animationMatch && animationMatch[1]) {
                                catImage.style.animation = animationMatch[1] + ' 2s infinite ease-in-out';
                            }
                            
                            // Apply theme CSS
                            const themeStyle = document.createElement('style');
                            themeStyle.textContent = message.catThemeCSS;
                            document.head.appendChild(themeStyle);
                            
                            // Update background elements
                            const oldBackground = document.querySelector('.floating-elements');
                            if (oldBackground) {
                                oldBackground.remove();
                            }
                            
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = message.backgroundElements;
                            while (tempDiv.firstChild) {
                                document.body.appendChild(tempDiv.firstChild);
                            }
                        }, 100);
                    }
                });
            </script>
        </body>
        </html>
        `;
    }
    
    /**
     * Generate dependency graph HTML
     * @private
     */
    _generateDependencyGraphHTML(dependencyData, fileName) {
        // Get cat theme elements
        const catEmoji = this._catThemeManager ? this._catThemeManager.getCatEmoji() : '🐱';
        const catAnimation = this._catThemeManager ? this._catThemeManager.getCatAnimation() : '';
        const catThemeCSS = this._catThemeManager ? this._catThemeManager.getThemeCSS() : '';
        const backgroundElements = this._catThemeManager ? this._catThemeManager.getBackgroundElements() : '';
        
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>WhiskerCode Dependency Graph</title>
            <script src="https://d3js.org/d3.v7.min.js"></script>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    padding: 20px;
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    margin: 0;
                    overflow: hidden;
                }
                h1, h2 {
                    color: var(--vscode-editor-foreground);
                }
                #graph-container {
                    width: 100%;
                    height: 600px;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    overflow: hidden;
                    position: relative;
                }
                #graph {
                    width: 100%;
                    height: 100%;
                }
                .node {
                    cursor: pointer;
                }
                .node text {
                    font-size: 12px;
                    fill: var(--vscode-editor-foreground);
                    pointer-events: none;
                    user-select: none;
                }
                .link {
                    stroke: var(--vscode-editor-foreground);
                    stroke-opacity: 0.4;
                }
                .cat-image {
                    width: 80px;
                    margin-top: 15px;
                    font-size: 60px;
                    line-height: 1;
                }
                .cat-container {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .legend {
                    display: flex;
                    margin-top: 20px;
                    gap: 20px;
                    justify-content: center;
                    flex-wrap: wrap;
                }
                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .legend-color {
                    width: 15px;
                    height: 15px;
                    border-radius: 50%;
                }
                .controls {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(0, 0, 0, 0.7);
                    padding: 10px;
                    border-radius: 5px;
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    z-index: 10;
                }
                .control-btn {
                    cursor: pointer;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 3px;
                    padding: 5px 10px;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .control-btn:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .zoom-label {
                    color: white;
                    text-align: center;
                    font-size: 12px;
                    margin-top: 5px;
                }
                #node-info {
                    position: absolute;
                    bottom: 10px;
                    left: 10px;
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 10px;
                    border-radius: 5px;
                    max-width: 300px;
                    z-index: 10;
                    display: none;
                }
                
                /* Add cat theme CSS */
                ${catThemeCSS}
            </style>
        </head>
        <body>
            ${backgroundElements}
            
            <div class="cat-container">
                <div class="cat-image">${catEmoji}</div>
                <h1>Function Dependency Graph</h1>
                <p>File: ${fileName}</p>
            </div>
            
            <div id="graph-container">
                <div id="graph"></div>
                <div class="controls">
                    <button class="control-btn" id="zoom-in">➕ Zoom In</button>
                    <button class="control-btn" id="zoom-out">➖ Zoom Out</button>
                    <button class="control-btn" id="zoom-reset">🔄 Reset</button>
                    <div class="zoom-label">Double-click: Zoom In</div>
                    <div class="zoom-label">Drag: Pan View</div>
                    <div class="zoom-label">Wheel: Zoom</div>
                </div>
                <div id="node-info"></div>
            </div>
            
            <div class="legend">
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #4CAF50;"></div>
                    <span>Low Complexity (1-5)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #FFC107;"></div>
                    <span>Moderate Complexity (6-10)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #FF9800;"></div>
                    <span>High Complexity (11-20)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #F44336;"></div>
                    <span>Very High Complexity (>20)</span>
                </div>
            </div>
            
            <script>
                (function() {
                    // Graph data
                    const data = ${JSON.stringify(dependencyData)};
                    
                    // Initialize D3 graph
                    const container = document.getElementById('graph-container');
                    const width = container.clientWidth;
                    const height = container.clientHeight;
                    
                    // Color scale for node complexity
                    const getNodeColor = (complexity) => {
                        if (complexity <= 5) return '#4CAF50';
                        if (complexity <= 10) return '#FFC107';
                        if (complexity <= 20) return '#FF9800';
                        return '#F44336';
                    };
                    
                    // Create SVG with zoom support
                    const svg = d3.select('#graph')
                        .append('svg')
                        .attr('width', width)
                        .attr('height', height)
                        .attr('viewBox', [0, 0, width, height])
                        .attr('style', 'max-width: 100%; height: auto;');
                    
                    // Add zoom behavior
                    const zoom = d3.zoom()
                        .scaleExtent([0.1, 4])
                        .on('zoom', (event) => {
                            g.attr('transform', event.transform);
                            updateZoomLabel(event.transform.k);
                        });
                    
                    // Apply zoom to svg
                    svg.call(zoom);
                    
                    // Create a group for all elements that should be zoomed
                    const g = svg.append('g');
                        
                    // Create arrow marker for links
                    svg.append('defs').append('marker')
                        .attr('id', 'arrowhead')
                        .attr('viewBox', '-0 -5 10 10')
                        .attr('refX', 20)
                        .attr('refY', 0)
                        .attr('orient', 'auto')
                        .attr('markerWidth', 10)
                        .attr('markerHeight', 10)
                        .attr('xoverflow', 'visible')
                        .append('svg:path')
                        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
                        .attr('fill', '#999')
                        .style('stroke', 'none');
                    
                    // Create force simulation
                    const simulation = d3.forceSimulation(data.nodes)
                        .force('link', d3.forceLink(data.links).id(d => d.id).distance(150))
                        .force('charge', d3.forceManyBody().strength(-500))
                        .force('center', d3.forceCenter(width / 2, height / 2))
                        .force('collision', d3.forceCollide().radius(60));
                    
                    // Create links
                    const link = g.append('g')
                        .selectAll('line')
                        .data(data.links)
                        .enter().append('line')
                        .attr('class', 'link')
                        .attr('marker-end', 'url(#arrowhead)');
                    
                    // Create nodes
                    const node = g.append('g')
                        .selectAll('.node')
                        .data(data.nodes)
                        .enter().append('g')
                        .attr('class', 'node')
                        .on('mouseover', showNodeInfo)
                        .on('mouseout', hideNodeInfo)
                        .call(d3.drag()
                            .on('start', dragstarted)
                            .on('drag', dragged)
                            .on('end', dragended));
                    
                    // Add circles to nodes
                    node.append('circle')
                        .attr('r', d => Math.min(40, 15 + d.complexity))
                        .attr('fill', d => getNodeColor(d.complexity));
                    
                    // Add text to nodes
                    node.append('text')
                        .attr('dy', 4)
                        .attr('text-anchor', 'middle')
                        .text(d => d.id);
                    
                    // Update positions on simulation tick
                    simulation.on('tick', () => {
                        link
                            .attr('x1', d => d.source.x)
                            .attr('y1', d => d.source.y)
                            .attr('x2', d => d.target.x)
                            .attr('y2', d => d.target.y);
                        
                        node
                            .attr('transform', d => \`translate(\${d.x}, \${d.y})\`);
                    });
                    
                    // Add control button handlers
                    document.getElementById('zoom-in').addEventListener('click', () => {
                        svg.transition().duration(300).call(zoom.scaleBy, 1.5);
                    });
                    
                    document.getElementById('zoom-out').addEventListener('click', () => {
                        svg.transition().duration(300).call(zoom.scaleBy, 0.75);
                    });
                    
                    document.getElementById('zoom-reset').addEventListener('click', () => {
                        svg.transition().duration(300).call(
                            zoom.transform,
                            d3.zoomIdentity.translate(width / 2, height / 2)
                                .scale(0.75)
                                .translate(-width / 2, -height / 2)
                        );
                    });
                    
                    // Set initial zoom level to see the whole graph
                    svg.call(
                        zoom.transform,
                        d3.zoomIdentity.translate(width / 2, height / 2)
                            .scale(0.75)
                            .translate(-width / 2, -height / 2)
                    );
                    
                    // Update zoom label
                    function updateZoomLabel(scale) {
                        const percent = Math.round(scale * 100);
                        document.querySelector('.zoom-label').innerText = \`Zoom: \${percent}%\`;
                    }
                    
                    // Show node info
                    function showNodeInfo(event, d) {
                        const nodeInfo = document.getElementById('node-info');
                        // Get the called functions and called by functions
                        const calls = [];
                        const calledBy = [];
                        
                        data.links.forEach(link => {
                            if (link.source.id === d.id) {
                                calls.push(link.target.id);
                            }
                            if (link.target.id === d.id) {
                                calledBy.push(link.source.id);
                            }
                        });
                        
                        nodeInfo.innerHTML = \`
                            <strong>\${d.id}</strong><br>
                            <small>Complexity: \${d.complexity}</small><br>
                            \${calls.length > 0 ? \`<small>Calls: \${calls.join(', ')}</small><br>\` : ''}
                            \${calledBy.length > 0 ? \`<small>Called by: \${calledBy.join(', ')}</small>\` : ''}
                        \`;
                        nodeInfo.style.display = 'block';
                    }
                    
                    // Hide node info
                    function hideNodeInfo() {
                        document.getElementById('node-info').style.display = 'none';
                    }
                    
                    // Drag functions
                    function dragstarted(event, d) {
                        if (!event.active) simulation.alphaTarget(0.3).restart();
                        d.fx = d.x;
                        d.fy = d.y;
                    }
                    
                    function dragged(event, d) {
                        d.fx = event.x;
                        d.fy = event.y;
                    }
                    
                    function dragended(event, d) {
                        if (!event.active) simulation.alphaTarget(0);
                        // Keep the node fixed where dragged to
                        // d.fx = null;
                        // d.fy = null;
                    }
                    
                    // Enable double-click to zoom
                    svg.on('dblclick.zoom', (event) => {
                        const pt = d3.pointer(event);
                        svg.transition().duration(300).call(
                            zoom.translateTo, pt[0], pt[1]
                        ).transition().call(
                            zoom.scaleBy, 1.5
                        );
                    });
                    
                    // Listen for window resize to update the graph dimensions
                    window.addEventListener('resize', () => {
                        const newWidth = container.clientWidth;
                        const newHeight = container.clientHeight;
                        
                        svg.attr('width', newWidth)
                           .attr('height', newHeight)
                           .attr('viewBox', [0, 0, newWidth, newHeight]);
                           
                        simulation.force('center', d3.forceCenter(newWidth / 2, newHeight / 2))
                                 .alpha(0.3)
                                 .restart();
                    });
                })();
                
                // Add theme change handler
                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.command === 'updateTheme') {
                        document.querySelector('.cat-image').innerHTML = message.catEmoji;
                        
                        // Apply new animation
                        const catImage = document.querySelector('.cat-image');
                        catImage.style.animation = '';
                        setTimeout(() => {
                            const styleSheet = document.styleSheets[0];
                            const animationCSS = message.catAnimation;
                            
                            // Add the new animation styles
                            styleSheet.insertRule(animationCSS, styleSheet.cssRules.length);
                            
                            // Get animation name from the CSS
                            const animationMatch = animationCSS.match(/animation:\\s+([^\\s]+)/);
                            if (animationMatch && animationMatch[1]) {
                                catImage.style.animation = animationMatch[1] + ' 2s infinite ease-in-out';
                            }
                            
                            // Apply theme CSS
                            const themeStyle = document.createElement('style');
                            themeStyle.textContent = message.catThemeCSS;
                            document.head.appendChild(themeStyle);
                            
                            // Update background elements
                            const oldBackground = document.querySelector('.floating-elements');
                            if (oldBackground) {
                                oldBackground.remove();
                            }
                            
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = message.backgroundElements;
                            while (tempDiv.firstChild) {
                                document.body.appendChild(tempDiv.firstChild);
                            }
                        }, 100);
                    }
                });
            </script>
        </body>
        </html>
        `;
    }
    
    /**
     * Generate distribution segment
     * @private
     */
    _generateDistributionSegment(count, total, color, label) {
        const percentage = total > 0 ? (count / total * 100) : 0;
        if (percentage === 0) return '';
        return `
        <div class="complexity-segment" style="background-color: ${color};" data-width="${percentage}%">
            ${Math.round(percentage)}% ${label}
        </div>
        `;
    }
    
    /**
     * Generate bar chart HTML
     * @private
     */
    _generateBarChart(data, maxValue) {
        return data.map((item, index) => {
            const heightPercentage = (item.value / maxValue * 100);
            return `
            <div class="bar" 
                 style="height: ${heightPercentage}%; background-color: ${item.color};"
                 data-function="${item.name}" data-index="${index}">
                <div class="bar-label">${item.name}</div>
            </div>
            `;
        }).join('');
    }

    /**
     * Update the cat theme in panels
     */
    updateTheme() {
        if (!this._panel || !this._catThemeManager) return;
        
        // Send message to webview to update theme
        this._panel.webview.postMessage({
            command: 'updateTheme',
            catEmoji: this._catThemeManager.getCatEmoji(),
            catAnimation: this._catThemeManager.getCatAnimation(),
            catThemeCSS: this._catThemeManager.getThemeCSS(),
            backgroundElements: this._catThemeManager.getBackgroundElements()
        });
    }
}

module.exports = ComplexityVisualizer; 