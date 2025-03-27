const vscode = require('vscode');

/**
 * Complexity Visualizer Module for CodeWhiskers
 * Provides visualizations for code complexity metrics
 */
class ComplexityVisualizer {
    constructor() {
        this._panel = null;
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
        
        // Generate HTML
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CodeWhiskers Complexity Analysis</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    padding: 20px;
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                }
                h1, h2, h3 {
                    color: var(--vscode-editor-foreground);
                }
                .summary-metrics {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .metric-card {
                    background-color: var(--vscode-editor-inactiveSelectionBackground);
                    border-radius: 8px;
                    padding: 15px;
                    flex: 1;
                    min-width: 150px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                .metric-value {
                    font-size: 24px;
                    font-weight: bold;
                    margin: 10px 0;
                }
                .metric-label {
                    font-size: 14px;
                    opacity: 0.8;
                }
                .chart-container {
                    margin-top: 30px;
                    height: 300px;
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
                    transition: all 0.3s ease;
                    cursor: pointer;
                }
                .bar:hover {
                    opacity: 0.8;
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
                }
                .complexity-distribution {
                    display: flex;
                    margin-top: 30px;
                    height: 40px;
                    border-radius: 4px;
                    overflow: hidden;
                }
                .complexity-segment {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 12px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 30px;
                }
                th, td {
                    text-align: left;
                    padding: 12px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                th {
                    background-color: var(--vscode-editor-inactiveSelectionBackground);
                }
                tr:hover {
                    background-color: var(--vscode-list-hoverBackground);
                }
                .complexity-badge {
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 12px;
                    color: white;
                    font-size: 12px;
                }
                .cat-image {
                    width: 80px;
                    margin-top: 15px;
                }
                .cat-container {
                    text-align: center;
                    margin-bottom: 20px;
                }
            </style>
        </head>
        <body>
            <div class="cat-container">
                <img class="cat-image" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iNzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPvCfkLo8L3RleHQ+PC9zdmc+" alt="Code Inspector Cat" />
                <h1>Code Complexity Analysis</h1>
                <p>File: ${fileName}</p>
            </div>
            
            <div class="summary-metrics">
                <div class="metric-card">
                    <div class="metric-label">Functions Analyzed</div>
                    <div class="metric-value">${totalFunctions}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Average Complexity</div>
                    <div class="metric-value">${avgComplexity.toFixed(1)}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Max Complexity</div>
                    <div class="metric-value">${maxComplexity}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Average Function Length</div>
                    <div class="metric-value">${avgLineCount.toFixed(1)} lines</div>
                </div>
            </div>
            
            <h2>Complexity Distribution</h2>
            <div class="complexity-distribution">
                ${this._generateDistributionSegment(complexityLevels.low, totalFunctions, '#4CAF50', 'Low')}
                ${this._generateDistributionSegment(complexityLevels.moderate, totalFunctions, '#FFC107', 'Moderate')}
                ${this._generateDistributionSegment(complexityLevels.high, totalFunctions, '#FF9800', 'High')}
                ${this._generateDistributionSegment(complexityLevels.veryHigh, totalFunctions, '#F44336', 'Very High')}
            </div>
            
            <h2>Top Complex Functions</h2>
            <div class="chart-container">
                <div class="bar-chart">
                    ${this._generateBarChart(complexityChartData, maxComplexity)}
                </div>
            </div>
            
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
            
            <script>
                (function() {
                    // Function to handle bar click
                    const bars = document.querySelectorAll('.bar');
                    bars.forEach(bar => {
                        bar.addEventListener('click', (event) => {
                            const functionName = bar.getAttribute('data-function');
                            // Send message to extension
                            vscode.postMessage({
                                command: 'showFunctionDetail',
                                functionName: functionName
                            });
                        });
                    });
                    
                    // Initialize webview
                    const vscode = acquireVsCodeApi();
                })();
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
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CodeWhiskers Dependency Graph</title>
            <script src="https://d3js.org/d3.v7.min.js"></script>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    padding: 20px;
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                }
                h1, h2 {
                    color: var(--vscode-editor-foreground);
                }
                #graph {
                    width: 100%;
                    height: 600px;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    overflow: hidden;
                }
                .node {
                    cursor: pointer;
                }
                .node text {
                    font-size: 12px;
                }
                .link {
                    stroke: var(--vscode-editor-foreground);
                    stroke-opacity: 0.4;
                }
                .cat-image {
                    width: 80px;
                    margin-top: 15px;
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
            </style>
        </head>
        <body>
            <div class="cat-container">
                <img class="cat-image" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iNzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPvCfkLo8L3RleHQ+PC9zdmc+" alt="Code Inspector Cat" />
                <h1>Function Dependency Graph</h1>
                <p>File: ${fileName}</p>
            </div>
            
            <div id="graph"></div>
            
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
                    // Initialize D3 graph
                    const width = document.getElementById('graph').clientWidth;
                    const height = document.getElementById('graph').clientHeight;
                    
                    const data = ${JSON.stringify(dependencyData)};
                    
                    // Color scale for node complexity
                    const getNodeColor = (complexity) => {
                        if (complexity <= 5) return '#4CAF50';
                        if (complexity <= 10) return '#FFC107';
                        if (complexity <= 20) return '#FF9800';
                        return '#F44336';
                    };
                    
                    // Create SVG
                    const svg = d3.select('#graph')
                        .append('svg')
                        .attr('width', width)
                        .attr('height', height);
                        
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
                        .force('link', d3.forceLink(data.links).id(d => d.id).distance(100))
                        .force('charge', d3.forceManyBody().strength(-300))
                        .force('center', d3.forceCenter(width / 2, height / 2))
                        .force('collision', d3.forceCollide().radius(50));
                    
                    // Create links
                    const link = svg.append('g')
                        .selectAll('line')
                        .data(data.links)
                        .enter().append('line')
                        .attr('class', 'link')
                        .attr('marker-end', 'url(#arrowhead)');
                    
                    // Create nodes
                    const node = svg.append('g')
                        .selectAll('.node')
                        .data(data.nodes)
                        .enter().append('g')
                        .attr('class', 'node')
                        .call(d3.drag()
                            .on('start', dragstarted)
                            .on('drag', dragged)
                            .on('end', dragended));
                    
                    // Add circles to nodes
                    node.append('circle')
                        .attr('r', d => Math.min(30, 10 + d.complexity))
                        .attr('fill', d => getNodeColor(d.complexity));
                    
                    // Add text to nodes
                    node.append('text')
                        .attr('dx', d => -(d.id.length * 3))
                        .attr('dy', 4)
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
                        d.fx = null;
                        d.fy = null;
                    }
                })();
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
        <div class="complexity-segment" style="width: ${percentage}%; background-color: ${color};">
            ${Math.round(percentage)}% ${label}
        </div>
        `;
    }
    
    /**
     * Generate bar chart HTML
     * @private
     */
    _generateBarChart(data, maxValue) {
        return data.map(item => {
            const heightPercentage = (item.value / maxValue * 100);
            return `
            <div class="bar" 
                 style="height: ${heightPercentage}%; background-color: ${item.color};"
                 data-function="${item.name}">
                <div class="bar-label">${item.name}</div>
            </div>
            `;
        }).join('');
    }
}

module.exports = ComplexityVisualizer; 