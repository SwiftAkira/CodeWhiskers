const vscode = require('vscode');

/**
 * UILayer for CodeWhiskers
 * Handles all UI rendering and interactions with VS Code
 */
class UILayer {
    constructor(context) {
        this.context = context;
        this.decorationTypes = {};
        this.hoverProviders = [];
        this.sidebarProviders = {};
        
        this.initializeUI();
    }
    
    /**
     * Initialize the UI components
     */
    initializeUI() {
        // Create decorations for different complexity levels
        this.decorationTypes.lowComplexity = vscode.window.createTextEditorDecorationType({
            border: '1px solid #80deea',
            backgroundColor: 'rgba(128, 222, 234, 0.1)',
            before: {
                contentText: '😺',
                margin: '0 5px 0 0'
            }
        });
        
        this.decorationTypes.mediumComplexity = vscode.window.createTextEditorDecorationType({
            border: '1px solid #ffb74d',
            backgroundColor: 'rgba(255, 183, 77, 0.1)',
            before: {
                contentText: '🐱',
                margin: '0 5px 0 0'
            }
        });
        
        this.decorationTypes.highComplexity = vscode.window.createTextEditorDecorationType({
            border: '1px solid #ff8a65',
            backgroundColor: 'rgba(255, 138, 101, 0.1)',
            before: {
                contentText: '😾',
                margin: '0 5px 0 0'
            }
        });
        
        // Register hover providers for JavaScript and TypeScript
        this.registerHoverProviders(['javascript', 'typescript']);
        
        // Initialize sidebar providers
        this.initializeSidebarProviders();
    }
    
    /**
     * Show an explanation of code in a WebviewPanel
     * @param {object} explanation - Explanation from ExplanationEngine
     * @param {vscode.TextEditor} editor - The active text editor
     */
    showExplanation(explanation, editor) {
        // Get active theme and animation frequency for UI customization
        const config = vscode.workspace.getConfiguration('codewhiskers');
        const uiTheme = config.get('uiTheme');
        const animationFreq = config.get('animationFrequency');
        const explanationStyle = config.get('explanationStyle');
        
        // Create webview panel
        const panel = vscode.window.createWebviewPanel(
            'codewhiskers.explanation',
            'CodeWhiskers: Code Explanation',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.context.extensionUri, 'resources')
                ]
            }
        );
        
        // Get the appropriate explanation text based on user settings
        let explanationText = explanation.simple;
        if (explanationStyle === 'detailed') {
            explanationText = explanation.detailed;
        } else if (explanationStyle === 'technical') {
            explanationText = explanation.technical;
        }
        
        // Create HTML content for explanation
        panel.webview.html = this._generateExplanationHTML(
            explanationText,
            explanation.complexity,
            uiTheme,
            animationFreq
        );
        
        // Apply decorations to show complexity in the editor
        this._applyComplexityDecorations(editor, explanation.complexity);
    }
    
    /**
     * Show variable trace visualizations in the editor
     * @param {Array<object>} variableUsages - Variable usage information
     * @param {vscode.TextEditor} editor - The active text editor
     */
    showVariableTraces(variableUsages, editor) {
        if (variableUsages.length === 0) {
            vscode.window.showInformationMessage('No usages found for this variable');
            return;
        }
        
        // Create a decoration type for variable traces with paw prints
        const variableDecoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(179, 157, 219, 0.3)',
            border: '1px solid #b39ddb',
            after: {
                contentText: '🐾',
                margin: '0 0 0 5px'
            }
        });
        
        // Create decoration type for variable definitions
        const definitionDecoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(129, 199, 132, 0.3)',
            border: '1px solid #81c784',
            after: {
                contentText: '🐈',
                margin: '0 0 0 5px'
            }
        });
        
        // Separate definitions from usages
        const definitions = variableUsages.filter(usage => usage.isDefinition);
        const usages = variableUsages.filter(usage => !usage.isDefinition);
        
        // Apply the decorations
        editor.setDecorations(
            variableDecoration, 
            usages.map(usage => usage.range)
        );
        
        editor.setDecorations(
            definitionDecoration, 
            definitions.map(def => def.range)
        );
        
        // Show summary in status bar
        vscode.window.setStatusBarMessage(
            `Found ${definitions.length} definition(s) and ${usages.length} usage(s) of this variable`, 
            5000
        );
        
        // Store the decorated ranges to remove them later
        this.currentVariableDecorations = {
            usages: variableDecoration,
            definitions: definitionDecoration
        };
        
        // Remove decorations after a delay
        setTimeout(() => {
            if (this.currentVariableDecorations) {
                editor.setDecorations(this.currentVariableDecorations.usages, []);
                editor.setDecorations(this.currentVariableDecorations.definitions, []);
                this.currentVariableDecorations = null;
            }
        }, 8000);
    }
    
    /**
     * Show documentation suggestions for undocumented code
     * @param {Array<object>} undocumentedSections - Undocumented code sections
     * @param {vscode.TextEditor} editor - The active text editor
     */
    showDocumentationSuggestions(undocumentedSections, editor) {
        if (undocumentedSections.length === 0) {
            vscode.window.showInformationMessage('All code is documented. Good job!');
            return;
        }
        
        // Create decoration for undocumented sections
        const undocumentedDecoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255, 213, 79, 0.2)',
            isWholeLine: true,
            before: {
                contentText: '📝',
                margin: '0 5px 0 0'
            }
        });
        
        // Apply decorations
        editor.setDecorations(
            undocumentedDecoration,
            undocumentedSections.map(section => section.range)
        );
        
        // Show notification with count
        vscode.window.showInformationMessage(
            `Found ${undocumentedSections.length} undocumented code sections`,
            'Add Documentation'
        ).then(selection => {
            if (selection === 'Add Documentation') {
                this._addDocumentation(undocumentedSections, editor);
            }
        });
    }
    
    /**
     * Show function behavior analysis
     * @param {Array<object>} analyzedFunctions - Functions with analysis data
     * @param {vscode.TextEditor} editor - The active text editor
     */
    showFunctionAnalysis(analyzedFunctions, editor) {
        if (analyzedFunctions.length === 0) {
            vscode.window.showInformationMessage('No functions found in this file');
            return;
        }
        
        // Create webview panel for function analysis
        const panel = vscode.window.createWebviewPanel(
            'codewhiskers.functionAnalysis',
            'CodeWhiskers: Function Analysis',
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );
        
        // Generate HTML for function analysis
        panel.webview.html = this._generateFunctionAnalysisHTML(analyzedFunctions);
        
        // Create decorations for functions based on complexity
        const lowComplexityFunctions = analyzedFunctions
            .filter(fn => fn.analysis.complexity.level === 'low')
            .map(fn => fn.range);
            
        const mediumComplexityFunctions = analyzedFunctions
            .filter(fn => fn.analysis.complexity.level === 'medium')
            .map(fn => fn.range);
            
        const highComplexityFunctions = analyzedFunctions
            .filter(fn => fn.analysis.complexity.level === 'high')
            .map(fn => fn.range);
        
        // Apply decorations
        editor.setDecorations(this.decorationTypes.lowComplexity, lowComplexityFunctions);
        editor.setDecorations(this.decorationTypes.mediumComplexity, mediumComplexityFunctions);
        editor.setDecorations(this.decorationTypes.highComplexity, highComplexityFunctions);
    }
    
    /**
     * Update whisker visualization based on code structure
     * @param {object} codeStructure - Structure from Parser
     * @param {vscode.TextEditor} editor - The active text editor
     */
    updateWhiskerVisualization(codeStructure, editor) {
        // This would be a more complex implementation in a real extension
        // For now, we'll use simple decorations to show code structure
        
        // Clear existing decorations
        this._clearWhiskerVisualizations(editor);
        
        // Create decorations for different code structures
        const loopDecoration = vscode.window.createTextEditorDecorationType({
            before: {
                contentText: '➰',
                margin: '0 5px 0 0'
            }
        });
        
        const conditionalDecoration = vscode.window.createTextEditorDecorationType({
            before: {
                contentText: '❓',
                margin: '0 5px 0 0'
            }
        });
        
        const functionDecoration = vscode.window.createTextEditorDecorationType({
            before: {
                contentText: '🔧',
                margin: '0 5px 0 0'
            }
        });
        
        // Apply decorations
        if (codeStructure.loops.length > 0) {
            const loopRanges = codeStructure.loops.map(loop => {
                const pos = editor.document.positionAt(loop.position);
                return new vscode.Range(pos, pos.translate(0, loop.type.length + 1));
            });
            
            editor.setDecorations(loopDecoration, loopRanges);
            this.currentWhiskerDecorations = this.currentWhiskerDecorations || [];
            this.currentWhiskerDecorations.push(loopDecoration);
        }
        
        if (codeStructure.conditionals.length > 0) {
            const conditionalRanges = codeStructure.conditionals.map(cond => {
                const pos = editor.document.positionAt(cond.position);
                return new vscode.Range(pos, pos.translate(0, cond.type.length + 1));
            });
            
            editor.setDecorations(conditionalDecoration, conditionalRanges);
            this.currentWhiskerDecorations = this.currentWhiskerDecorations || [];
            this.currentWhiskerDecorations.push(conditionalDecoration);
        }
        
        if (codeStructure.functions.length > 0) {
            const functionRanges = codeStructure.functions.map(func => {
                const pos = editor.document.positionAt(func.position);
                return new vscode.Range(pos, pos.translate(0, func.name.length + 10));
            });
            
            editor.setDecorations(functionDecoration, functionRanges);
            this.currentWhiskerDecorations = this.currentWhiskerDecorations || [];
            this.currentWhiskerDecorations.push(functionDecoration);
        }
    }
    
    // Private helper methods
    
    /**
     * Register hover providers for languages
     * @private
     */
    registerHoverProviders(languages) {
        languages.forEach(language => {
            const hoverProvider = vscode.languages.registerHoverProvider(language, {
                provideHover: (document, position, token) => {
                    // Get the current word under cursor
                    const range = document.getWordRangeAtPosition(position);
                    if (!range) {
                        return null;
                    }
                    
                    const word = document.getText(range);
                    
                    // Get the line text for context
                    const lineText = document.lineAt(position.line).text;
                    
                    // Create a simple hover message
                    const hoverContent = new vscode.MarkdownString();
                    
                    // Add a cat emoji based on word length (just for fun)
                    const catEmoji = word.length <= 3 ? '😺' : word.length <= 6 ? '😸' : '😻';
                    
                    hoverContent.appendMarkdown(`${catEmoji} **${word}**\n\n`);
                    
                    // Add some simple context based on the line
                    if (lineText.includes('function') || lineText.includes('=>')) {
                        hoverContent.appendMarkdown('This appears to be a function. Click to see more details.');
                        hoverContent.appendMarkdown('\n\n*Use the CodeWhiskers: Explain Selected Code command for a full explanation*');
                    } else if (lineText.includes('var') || lineText.includes('let') || lineText.includes('const')) {
                        hoverContent.appendMarkdown('This appears to be a variable. Click to trace its usage.');
                        hoverContent.appendMarkdown('\n\n*Use the CodeWhiskers: Trace Variable command to see all usages*');
                    } else if (lineText.includes('if') || lineText.includes('else') || lineText.includes('switch')) {
                        hoverContent.appendMarkdown('This appears to be a conditional. CodeWhiskers can help you understand the logic flow.');
                    }
                    
                    return new vscode.Hover(hoverContent, range);
                }
            });
            
            this.hoverProviders.push(hoverProvider);
            this.context.subscriptions.push(hoverProvider);
        });
    }
    
    /**
     * Initialize sidebar providers
     * @private
     */
    initializeSidebarProviders() {
        // This would be a more complex implementation in a real extension
        // For now, we'll create a simple TreeDataProvider for the code explorer
        
        // Code Explorer TreeDataProvider could be implemented here
        // Documentation Hints TreeDataProvider could be implemented here
    }
    
    /**
     * Clear whisker visualizations
     * @private
     */
    _clearWhiskerVisualizations(editor) {
        if (this.currentWhiskerDecorations && this.currentWhiskerDecorations.length > 0) {
            this.currentWhiskerDecorations.forEach(decoration => {
                editor.setDecorations(decoration, []);
            });
            this.currentWhiskerDecorations = [];
        }
    }
    
    /**
     * Apply complexity decorations
     * @private
     */
    _applyComplexityDecorations(editor, complexity) {
        // Clear existing decorations
        editor.setDecorations(this.decorationTypes.lowComplexity, []);
        editor.setDecorations(this.decorationTypes.mediumComplexity, []);
        editor.setDecorations(this.decorationTypes.highComplexity, []);
        
        // Get the selection
        const selection = editor.selection;
        
        // Apply the appropriate decoration
        if (complexity === 'low') {
            editor.setDecorations(this.decorationTypes.lowComplexity, [selection]);
        } else if (complexity === 'medium') {
            editor.setDecorations(this.decorationTypes.mediumComplexity, [selection]);
        } else {
            editor.setDecorations(this.decorationTypes.highComplexity, [selection]);
        }
    }
    
    /**
     * Generate HTML for explanation panel
     * @private
     */
    _generateExplanationHTML(explanation, complexity, uiTheme, animationFreq) {
        // Get cat image based on theme and complexity
        const catImage = this._getCatImage(uiTheme, complexity);
        
        // Get animation CSS based on frequency
        const animationCSS = this._getAnimationCSS(animationFreq);
        
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>CodeWhiskers Explanation</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe WPC', 'Segoe UI', system-ui, 'Ubuntu', 'Droid Sans', sans-serif;
                        padding: 0;
                        margin: 0;
                        color: var(--vscode-editor-foreground);
                        background-color: var(--vscode-editor-background);
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        display: flex;
                        align-items: center;
                        margin-bottom: 20px;
                    }
                    .cat-image {
                        width: 80px;
                        height: 80px;
                        margin-right: 20px;
                    }
                    .complexity-badge {
                        display: inline-block;
                        padding: 5px 10px;
                        border-radius: 15px;
                        font-size: 12px;
                        font-weight: bold;
                        margin-left: 10px;
                    }
                    .complexity-low {
                        background-color: #a5d6a7;
                        color: #1b5e20;
                    }
                    .complexity-medium {
                        background-color: #fff59d;
                        color: #f57f17;
                    }
                    .complexity-high {
                        background-color: #ef9a9a;
                        color: #b71c1c;
                    }
                    .whiskers {
                        position: relative;
                        height: 2px;
                        background-color: #b0bec5;
                        margin: 10px 0;
                        width: 0;
                        transition: width 1s ease-in-out;
                    }
                    .whiskers.visible {
                        width: 100%;
                    }
                    .explanation {
                        background-color: var(--vscode-editor-inactiveSelectionBackground, #f5f5f5);
                        color: var(--vscode-editor-foreground, #333333);
                        padding: 15px;
                        border-radius: 5px;
                        margin-top: 20px;
                        line-height: 1.5;
                    }
                    ${animationCSS}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="${catImage}" alt="CodeWhiskers Cat" class="cat-image">
                        <div>
                            <h2>CodeWhiskers Explanation</h2>
                            <span>Complexity: 
                                <span class="complexity-badge complexity-${complexity}">
                                    ${complexity.toUpperCase()}
                                </span>
                            </span>
                        </div>
                    </div>
                    
                    <div class="whiskers whisker-left"></div>
                    <div class="whiskers whisker-right"></div>
                    
                    <div class="explanation">
                        ${explanation.replace(/\n/g, '<br>')}
                    </div>
                </div>
                
                <script>
                    // Animate whiskers on load
                    document.addEventListener('DOMContentLoaded', () => {
                        setTimeout(() => {
                            document.querySelectorAll('.whiskers').forEach(whisker => {
                                whisker.classList.add('visible');
                            });
                        }, 300);
                    });
                </script>
            </body>
            </html>
        `;
    }
    
    /**
     * Generate HTML for function analysis panel
     * @private
     */
    _generateFunctionAnalysisHTML(analyzedFunctions) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>CodeWhiskers Function Analysis</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe WPC', 'Segoe UI', system-ui, 'Ubuntu', 'Droid Sans', sans-serif;
                        padding: 0;
                        margin: 0;
                        color: var(--vscode-editor-foreground);
                        background-color: var(--vscode-editor-background);
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        margin-bottom: 20px;
                        display: flex;
                        align-items: center;
                    }
                    .header img {
                        width: 40px;
                        height: 40px;
                        margin-right: 10px;
                    }
                    .function-card {
                        background-color: var(--vscode-editor-inactiveSelectionBackground, #f5f5f5);
                        color: var(--vscode-editor-foreground, #333333);
                        border-radius: 5px;
                        padding: 15px;
                        margin-bottom: 15px;
                        border-left: 5px solid #78909c;
                    }
                    .function-card.low-complexity {
                        border-left-color: #a5d6a7;
                    }
                    .function-card.medium-complexity {
                        border-left-color: #fff59d;
                    }
                    .function-card.high-complexity {
                        border-left-color: #ef9a9a;
                    }
                    .function-name {
                        font-weight: bold;
                        font-size: 16px;
                        margin-bottom: 10px;
                        display: flex;
                        align-items: center;
                    }
                    .function-name::before {
                        content: "🐱";
                        margin-right: 5px;
                    }
                    .complexity-badge {
                        display: inline-block;
                        padding: 2px 8px;
                        border-radius: 10px;
                        font-size: 12px;
                        margin-left: 10px;
                    }
                    .complexity-low {
                        background-color: #a5d6a7;
                        color: #1b5e20;
                    }
                    .complexity-medium {
                        background-color: #fff59d;
                        color: #f57f17;
                    }
                    .complexity-high {
                        background-color: #ef9a9a;
                        color: #b71c1c;
                    }
                    .function-params {
                        font-family: monospace;
                        margin-bottom: 10px;
                        color: var(--vscode-editor-foreground, #333333);
                    }
                    .function-explanation {
                        line-height: 1.5;
                        color: var(--vscode-editor-foreground, #333333);
                    }
                    .patterns-list {
                        margin-top: 10px;
                        display: flex;
                        flex-wrap: wrap;
                    }
                    .pattern-tag {
                        background-color: var(--vscode-badge-background, #e0e0e0);
                        color: var(--vscode-badge-foreground, #333333);
                        padding: 3px 8px;
                        border-radius: 10px;
                        margin-right: 5px;
                        margin-bottom: 5px;
                        font-size: 12px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="https://raw.githubusercontent.com/microsoft/vscode-codicons/main/src/icons/symbol-function.svg" alt="Function">
                        <h2>Function Analysis - ${analyzedFunctions.length} functions found</h2>
                    </div>
                    
                    <div class="functions-container">
                        ${analyzedFunctions.map(fn => `
                            <div class="function-card ${fn.analysis.complexity.level}-complexity">
                                <div class="function-name">
                                    ${fn.name}
                                    <span class="complexity-badge complexity-${fn.analysis.complexity.level}">
                                        ${fn.analysis.complexity.level.toUpperCase()}
                                    </span>
                                </div>
                                <div class="function-params">
                                    Parameters: ${fn.params.length > 0 
                                        ? fn.params.map(p => p.name).join(', ') 
                                        : 'none'}
                                </div>
                                <div class="function-explanation">
                                    ${fn.explanation}
                                </div>
                                ${fn.analysis.patterns.length > 0 ? `
                                    <div class="patterns-list">
                                        ${fn.analysis.patterns.map(p => `
                                            <span class="pattern-tag">${p.name}</span>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </body>
            </html>
        `;
    }
    
    /**
     * Add documentation to undocumented sections
     * @private
     */
    _addDocumentation(undocumentedSections, editor) {
        // Create an array of edits
        const edits = undocumentedSections.map(section => {
            return new vscode.TextEdit(
                new vscode.Range(
                    new vscode.Position(section.range.start.line, 0),
                    new vscode.Position(section.range.start.line, 0)
                ),
                section.suggestion + '\n'
            );
        });
        
        // Apply the edits
        const workspaceEdit = new vscode.WorkspaceEdit();
        workspaceEdit.set(editor.document.uri, edits);
        vscode.workspace.applyEdit(workspaceEdit).then(success => {
            if (success) {
                vscode.window.showInformationMessage('Documentation added successfully! 😺');
            } else {
                vscode.window.showErrorMessage('Failed to add documentation 😿');
            }
        });
    }
    
    /**
     * Get cat image based on theme and complexity
     * @private
     */
    _getCatImage(uiTheme, complexity) {
        // In a real extension, these would be actual SVG or PNG files included with the extension
        // For now, we'll use placeholder URLs based on theme and complexity
        
        const baseImageUrl = 'https://raw.githubusercontent.com/microsoft/vscode-codicons/main/src/icons/';
        
        // We would use different cat images based on theme and complexity
        // but for now we'll just use different VS Code icons as placeholders
        switch (uiTheme) {
            case 'tabby':
                return `${baseImageUrl}${complexity === 'high' ? 'warning' : 'info'}.svg`;
            case 'siamese':
                return `${baseImageUrl}${complexity === 'high' ? 'warning' : 'info'}.svg`;
            case 'calico':
                return `${baseImageUrl}${complexity === 'high' ? 'warning' : 'info'}.svg`;
            case 'black':
                return `${baseImageUrl}${complexity === 'high' ? 'warning' : 'info'}.svg`;
            default:
                return `${baseImageUrl}info.svg`;
        }
    }
    
    /**
     * Get animation CSS based on frequency setting
     * @private
     */
    _getAnimationCSS(animationFreq) {
        switch (animationFreq) {
            case 'low':
                return '';
            case 'medium':
                return `
                    @keyframes whiskerWiggle {
                        0% { transform: rotate(0deg); }
                        25% { transform: rotate(1deg); }
                        50% { transform: rotate(0deg); }
                        75% { transform: rotate(-1deg); }
                        100% { transform: rotate(0deg); }
                    }
                    .whiskers.visible {
                        animation: whiskerWiggle 3s infinite;
                    }
                `;
            case 'high':
                return `
                    @keyframes whiskerWiggle {
                        0% { transform: rotate(0deg); }
                        25% { transform: rotate(2deg); }
                        50% { transform: rotate(0deg); }
                        75% { transform: rotate(-2deg); }
                        100% { transform: rotate(0deg); }
                    }
                    .whiskers.visible {
                        animation: whiskerWiggle 2s infinite;
                    }
                    .cat-image {
                        transition: transform 0.3s ease;
                    }
                    .cat-image:hover {
                        transform: scale(1.1) rotate(5deg);
                    }
                `;
            default:
                return '';
        }
    }
}

module.exports = {
    UILayer
}; 