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
     * Show an explanation of code in a WebView panel
     * @param {object} explanation - Explanation from ExplanationEngine
     * @param {vscode.TextEditor} editor - The active text editor
     */
    showExplanation(explanation, editor) {
        // Get active theme and explanation preference
        const config = vscode.workspace.getConfiguration('codewhiskers');
        const explanationStyle = config.get('explanationStyle');
        
        // Get the appropriate explanation text based on user settings
        let explanationText = explanation.simple;
        if (explanationStyle === 'detailed') {
            explanationText = explanation.detailed;
        } else if (explanationStyle === 'technical') {
            explanationText = explanation.technical;
        }
        
        // Apply decorations to show complexity in the editor
        this._applyComplexityDecorations(editor, explanation.complexity);
        
        // Create WebView panel for explanation
        const panel = vscode.window.createWebviewPanel(
            'codewhiskers.explanation',
            'CodeWhiskers: Code Explanation',
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );
        
        // Generate HTML for the explanation
        panel.webview.html = this._generateExplanationHTML(
            explanationText,
            explanation.complexity,
            explanation.technical
        );
        
        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'showTechnical':
                        if (explanation.technical) {
                            panel.webview.html = this._generateExplanationHTML(
                                explanation.technical,
                                explanation.complexity,
                                null,
                                true
                            );
                        }
                        return;
                        
                    case 'addDocumentation':
                        this._suggestInlineDocumentation(editor);
                        return;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }
    
    /**
     * Generate HTML for explanation panel
     * @private
     */
    _generateExplanationHTML(explanation, complexity, technicalDetails, isTechnical = false) {
        // Get the cat image based on complexity
        const catImage = this._getCatImage(complexity);
        
        // Get the animation CSS
        const animationCSS = this._getAnimationCSS();
        
        // Format the explanation text to fix spacing issues - preserve paragraphs but clean up other spacing
        const formattedExplanation = explanation
            .split('\n\n')
            .map(paragraph => paragraph.replace(/\s+/g, ' ').trim())
            .join('\n\n');
        
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
                        margin-bottom: 20px;
                        display: flex;
                        align-items: center;
                    }
                    .cat-icon {
                        font-size: 42px;
                        margin-right: 15px;
                        width: 42px;
                        height: 42px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .explanation-box {
                        background-color: var(--vscode-editor-inactiveSelectionBackground, #f5f5f5);
                        color: var(--vscode-editor-foreground, #333333);
                        border-radius: 5px;
                        padding: 20px;
                        margin-bottom: 15px;
                        font-size: 14px;
                        line-height: 1.6;
                    }
                    .explanation-text {
                        margin: 0;
                        padding: 0;
                        white-space: normal;
                    }
                    .explanation-text p {
                        margin-bottom: 12px;
                    }
                    .complexity-badge {
                        display: inline-block;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: bold;
                        margin-left: 10px;
                        text-transform: uppercase;
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
                    .button-container {
                        display: flex;
                        margin-top: 20px;
                        gap: 10px;
                    }
                    .action-button {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 13px;
                        display: flex;
                        align-items: center;
                    }
                    .action-button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .button-icon {
                        margin-right: 6px;
                        font-size: 16px;
                    }
                    
                    ${animationCSS}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        ${complexity === 'low' 
                            ? '<div class="cat-icon animate-bounce">😺</div>' 
                            : complexity === 'medium' 
                                ? '<div class="cat-icon animate-bounce">🐱</div>' 
                                : '<div class="cat-icon animate-bounce">😾</div>'}
                        <h2>
                            ${isTechnical ? 'Technical Details' : 'Code Explanation'} 
                            <span class="complexity-badge complexity-${complexity}">
                                ${complexity}
                            </span>
                        </h2>
                    </div>
                    
                    <div class="explanation-box">
                        <div class="explanation-text">
                            ${formattedExplanation.split('\n\n').map(p => `<p>${p}</p>`).join('')}
                        </div>
                    </div>
                    
                    <div class="button-container">
                        ${!isTechnical && technicalDetails ? 
                            `<button class="action-button" id="technicalBtn">
                                <span class="button-icon">🔍</span> View Technical Details
                            </button>` : ''
                        }
                        <button class="action-button" id="docBtn">
                            <span class="button-icon">📝</span> Add Documentation
                        </button>
                    </div>
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    // Add event listeners to buttons
                    document.getElementById('docBtn').addEventListener('click', () => {
                        vscode.postMessage({
                            command: 'addDocumentation'
                        });
                    });
                    
                    ${!isTechnical && technicalDetails ? 
                        `document.getElementById('technicalBtn').addEventListener('click', () => {
                            vscode.postMessage({
                                command: 'showTechnical'
                            });
                        });` : ''
                    }
                </script>
            </body>
            </html>
        `;
    }
    
    /**
     * Get cat image based on complexity
     * @private
     */
    _getCatImage(complexity) {
        // Instead of SVG data URIs, use direct emoji references
        switch (complexity) {
            case 'low':
                return 'https://raw.githubusercontent.com/microsoft/vscode-codicons/main/src/icons/check.svg';
            case 'medium':
                return 'https://raw.githubusercontent.com/microsoft/vscode-codicons/main/src/icons/warning.svg';
            case 'high':
                return 'https://raw.githubusercontent.com/microsoft/vscode-codicons/main/src/icons/error.svg';
            default:
                return 'https://raw.githubusercontent.com/microsoft/vscode-codicons/main/src/icons/info.svg';
        }
    }
    
    /**
     * Get CSS for cat animations
     * @private
     */
    _getAnimationCSS() {
        return `
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            
            .animate-bounce {
                animation: bounce 2s infinite ease-in-out;
            }
        `;
    }
    
    /**
     * Show variable traces using a WebView panel
     * @param {Array<object>} variableUsages - Array of variable usage objects
     * @param {vscode.TextEditor} editor - The active text editor
     */
    showVariableTraces(variableUsages, editor) {
        if (variableUsages.length === 0) {
            vscode.window.showInformationMessage('No usages found for this variable');
            return;
        }
        
        // Create a WebView panel for variable traces
        const panel = vscode.window.createWebviewPanel(
            'codewhiskers.variableTraces',
            `Variable Traces: ${variableUsages[0].name}`,
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );
        
        // Generate HTML for the variable traces
        panel.webview.html = this._generateVariableTracesHTML(variableUsages);
        
        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'jumpToLocation':
                        const line = parseInt(message.line);
                        const column = parseInt(message.column);
                        
                        if (!isNaN(line) && !isNaN(column)) {
                            // Jump to the location of the variable usage
                            const position = new vscode.Position(line - 1, column);
                            editor.selection = new vscode.Selection(position, position);
                            editor.revealRange(
                                new vscode.Range(position, position),
                                vscode.TextEditorRevealType.InCenter
                            );
                            
                            // Apply decoration to highlight the usage
                            const usage = variableUsages.find(u => u.line === line && u.column === column);
                            if (usage) {
                                const range = new vscode.Range(
                                    new vscode.Position(usage.line - 1, usage.column),
                                    new vscode.Position(usage.line - 1, usage.column + usage.name.length)
                                );
                                
                                const decoration = vscode.window.createTextEditorDecorationType({
                                    backgroundColor: 'rgba(255, 222, 173, 0.5)',
                                    border: '1px solid #ffd700'
                                });
                                
                                editor.setDecorations(decoration, [range]);
                                
                                // Remove decoration after a delay
                                setTimeout(() => {
                                    decoration.dispose();
                                }, 3000);
                            }
                        }
                        return;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }
    
    /**
     * Generate HTML for variable traces panel
     * @private
     */
    _generateVariableTracesHTML(variableUsages) {
        // Separate definitions from usages
        const definitions = variableUsages.filter(usage => 
            usage.type === 'definition' || usage.type === 'declaration'
        );
        const usages = variableUsages.filter(usage => 
            usage.type !== 'definition' && usage.type !== 'declaration'
        );
        
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Variable Traces</title>
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
                    .header-icon {
                        font-size: 24px;
                        margin-right: 10px;
                    }
                    h2 {
                        margin: 0;
                    }
                    .section-title {
                        margin-top: 20px;
                        margin-bottom: 10px;
                        font-weight: bold;
                        font-size: 16px;
                        color: var(--vscode-editor-foreground);
                        border-bottom: 1px solid var(--vscode-panel-border);
                        padding-bottom: 5px;
                    }
                    .trace-card {
                        background-color: var(--vscode-editor-inactiveSelectionBackground, #f5f5f5);
                        color: var(--vscode-editor-foreground, #333333);
                        border-radius: 5px;
                        padding: 12px;
                        margin-bottom: 10px;
                        cursor: pointer;
                        border-left: 3px solid #78909c;
                        transition: background-color 0.2s;
                    }
                    .trace-card:hover {
                        background-color: var(--vscode-list-hoverBackground, #e0e0e0);
                    }
                    .trace-card.definition {
                        border-left-color: #81c784;
                    }
                    .trace-card.read {
                        border-left-color: #64b5f6;
                    }
                    .trace-card.write {
                        border-left-color: #ffb74d;
                    }
                    .location {
                        font-family: monospace;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .context {
                        font-family: monospace;
                        white-space: pre-wrap;
                        padding: 5px;
                        background-color: var(--vscode-editor-background);
                        border-radius: 3px;
                        margin-top: 5px;
                    }
                    .location::before {
                        content: "📍";
                        margin-right: 5px;
                    }
                    .usage-type {
                        display: inline-block;
                        padding: 2px 6px;
                        border-radius: 10px;
                        font-size: 11px;
                        margin-left: 8px;
                        text-transform: uppercase;
                    }
                    .type-definition {
                        background-color: #81c784;
                        color: #1b5e20;
                    }
                    .type-read {
                        background-color: #64b5f6;
                        color: #0d47a1;
                    }
                    .type-write {
                        background-color: #ffb74d;
                        color: #e65100;
                    }
                    .type-update {
                        background-color: #ba68c8;
                        color: #4a148c;
                    }
                    .variable-name {
                        color: var(--vscode-symbolIcon-variableForeground, #75beff);
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="header-icon">🔍</div>
                        <h2>Variable Traces: <span class="variable-name">${variableUsages[0].name}</span></h2>
                    </div>
                    
                    <div class="summary">
                        Found ${definitions.length} definition(s) and ${usages.length} usage(s).
                    </div>
                    
                    ${definitions.length > 0 ? `
                        <div class="section-title">Definitions</div>
                        <div class="definitions-container">
                            ${definitions.map(def => `
                                <div class="trace-card definition" data-line="${def.line}" data-column="${def.column}">
                                    <div class="location">
                                        Line ${def.line}
                                        <span class="usage-type type-definition">${def.type}</span>
                                    </div>
                                    <div class="description">${def.description || ''}</div>
                                    <div class="context">${def.context.trim()}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    ${usages.length > 0 ? `
                        <div class="section-title">Usages</div>
                        <div class="usages-container">
                            ${usages.map(usage => `
                                <div class="trace-card ${usage.type === 'read' ? 'read' : 'write'}" data-line="${usage.line}" data-column="${usage.column}">
                                    <div class="location">
                                        Line ${usage.line}
                                        <span class="usage-type type-${usage.type}">${usage.type}</span>
                                    </div>
                                    <div class="description">${usage.description || ''}</div>
                                    <div class="context">${usage.context.trim()}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    // Add click handlers to all trace cards
                    document.querySelectorAll('.trace-card').forEach(card => {
                        card.addEventListener('click', () => {
                            const line = card.getAttribute('data-line');
                            const column = card.getAttribute('data-column');
                            
                            vscode.postMessage({
                                command: 'jumpToLocation',
                                line: line,
                                column: column
                            });
                        });
                    });
                </script>
            </body>
            </html>
        `;
    }
    
    /**
     * Show documentation suggestions in a WebView panel
     * @param {Array<object>} undocumentedSections - Array of code sections needing documentation
     * @param {vscode.TextEditor} editor - The active text editor
     */
    showDocumentationSuggestions(undocumentedSections, editor) {
        if (undocumentedSections.length === 0) {
            vscode.window.showInformationMessage('No undocumented code sections found 😺');
            return;
        }
        
        // Create WebView panel for documentation suggestions
        const panel = vscode.window.createWebviewPanel(
            'codewhiskers.documentationSuggestions',
            'CodeWhiskers: Documentation Suggestions',
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );
        
        // Generate HTML for documentation suggestions
        panel.webview.html = this._generateDocumentationSuggestionsHTML(undocumentedSections);
        
        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'addDocumentation':
                        const sectionIndex = parseInt(message.sectionIndex);
                        if (!isNaN(sectionIndex) && sectionIndex >= 0 && sectionIndex < undocumentedSections.length) {
                            const section = undocumentedSections[sectionIndex];
                            const docTemplate = this._generateDocTemplate(section);
                            
                            // Add documentation to the section
                            const position = new vscode.Position(section.start.line, 0);
                            editor.edit(editBuilder => {
                                editBuilder.insert(position, docTemplate);
                            }).then(success => {
                                if (success) {
                                    panel.webview.postMessage({ 
                                        command: 'documentationAdded', 
                                        sectionIndex: sectionIndex 
                                    });
                                    vscode.window.showInformationMessage('Documentation added! 😺');
                                }
                            });
                        }
                        return;
                        
                    case 'jumpToSection':
                        const index = parseInt(message.sectionIndex);
                        if (!isNaN(index) && index >= 0 && index < undocumentedSections.length) {
                            const section = undocumentedSections[index];
                            
                            // Jump to the section
                            const position = new vscode.Position(section.start.line, section.start.character);
                            editor.selection = new vscode.Selection(position, position);
                            editor.revealRange(
                                new vscode.Range(position, position),
                                vscode.TextEditorRevealType.InCenter
                            );
                        }
                        return;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }
    
    /**
     * Generate HTML for documentation suggestions panel
     * @private
     */
    _generateDocumentationSuggestionsHTML(undocumentedSections) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Documentation Suggestions</title>
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
                    .header-icon {
                        font-size: 24px;
                        margin-right: 10px;
                    }
                    h2 {
                        margin: 0;
                    }
                    .summary {
                        margin-bottom: 20px;
                    }
                    .section-card {
                        background-color: var(--vscode-editor-inactiveSelectionBackground, #f5f5f5);
                        color: var(--vscode-editor-foreground, #333333);
                        border-radius: 5px;
                        padding: 15px;
                        margin-bottom: 15px;
                        border-left: 3px solid #ffb74d;
                    }
                    .section-card.documented {
                        border-left-color: #81c784;
                        opacity: 0.7;
                    }
                    .section-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 10px;
                    }
                    .section-title {
                        font-weight: bold;
                        cursor: pointer;
                    }
                    .section-title:hover {
                        text-decoration: underline;
                    }
                    .section-location {
                        font-family: monospace;
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                    }
                    .code-preview {
                        font-family: monospace;
                        white-space: pre-wrap;
                        padding: 10px;
                        background-color: var(--vscode-editor-background);
                        border-radius: 3px;
                        margin-top: 10px;
                        margin-bottom: 10px;
                        max-height: 150px;
                        overflow-y: auto;
                    }
                    .action-buttons {
                        display: flex;
                        gap: 8px;
                    }
                    .action-button {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 6px 10px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    }
                    .action-button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .action-button:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }
                    .success-badge {
                        background-color: #81c784;
                        color: #1b5e20;
                        padding: 3px 8px;
                        border-radius: 10px;
                        font-size: 11px;
                        margin-left: 8px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="header-icon">📝</div>
                        <h2>Documentation Suggestions</h2>
                    </div>
                    
                    <div class="summary">
                        Found ${undocumentedSections.length} code sections that could use documentation.
                    </div>
                    
                    <div class="sections-container">
                        ${undocumentedSections.map((section, index) => `
                            <div class="section-card" id="section-${index}">
                                <div class="section-header">
                                    <div class="section-title" data-index="${index}">${section.type}: ${section.name || 'Unnamed'}</div>
                                    <div class="section-location">Line ${section.start.line + 1}</div>
                                </div>
                                <div class="code-preview">${section.code}</div>
                                <div class="action-buttons">
                                    <button class="action-button add-doc-button" data-index="${index}">Add Documentation</button>
                                    <button class="action-button jump-button" data-index="${index}">Jump to Code</button>
                                    <span class="success-message" style="display: none;">Documentation added! 😺</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    // Add event listeners to buttons
                    document.querySelectorAll('.add-doc-button').forEach(button => {
                        button.addEventListener('click', () => {
                            const sectionIndex = button.getAttribute('data-index');
                            vscode.postMessage({
                                command: 'addDocumentation',
                                sectionIndex: sectionIndex
                            });
                        });
                    });
                    
                    document.querySelectorAll('.jump-button').forEach(button => {
                        button.addEventListener('click', () => {
                            const sectionIndex = button.getAttribute('data-index');
                            vscode.postMessage({
                                command: 'jumpToSection',
                                sectionIndex: sectionIndex
                            });
                        });
                    });
                    
                    document.querySelectorAll('.section-title').forEach(title => {
                        title.addEventListener('click', () => {
                            const sectionIndex = title.getAttribute('data-index');
                            vscode.postMessage({
                                command: 'jumpToSection',
                                sectionIndex: sectionIndex
                            });
                        });
                    });
                    
                    // Handle messages from extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        
                        switch (message.command) {
                            case 'documentationAdded':
                                const sectionCard = document.getElementById('section-' + message.sectionIndex);
                                if (sectionCard) {
                                    sectionCard.classList.add('documented');
                                    const addButton = sectionCard.querySelector('.add-doc-button');
                                    if (addButton) {
                                        addButton.disabled = true;
                                    }
                                    const successMessage = sectionCard.querySelector('.success-message');
                                    if (successMessage) {
                                        successMessage.style.display = 'inline';
                                    }
                                }
                                break;
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
    
    /**
     * Show function behavior analysis in a WebView panel
     * @param {Array<object>} analyzedFunctions - Functions with analysis data
     * @param {vscode.TextEditor} editor - The active text editor
     */
    showFunctionAnalysis(analyzedFunctions, editor) {
        if (analyzedFunctions.length === 0) {
            vscode.window.showInformationMessage('No functions found in this file');
            return;
        }
        
        // Apply decorations for functions based on complexity
        this._applyFunctionDecorations(analyzedFunctions, editor);
        
        // Create webview panel for function analysis
        const panel = vscode.window.createWebviewPanel(
            'codewhiskers.functionAnalysis',
            'CodeWhiskers: Function Analysis',
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );
        
        // Generate HTML for function analysis
        panel.webview.html = this._generateFunctionAnalysisHTML(analyzedFunctions);
        
        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'generateDocumentation':
                        const functionData = analyzedFunctions.find(fn => fn.name === message.functionName);
                        if (functionData) {
                            this._generateFunctionDocumentation(functionData, editor);
                        }
                        return;
                        
                    case 'jumpToFunction':
                        const fnData = analyzedFunctions.find(fn => fn.name === message.functionName);
                        if (fnData && fnData.position) {
                            const position = new vscode.Position(fnData.position.line, fnData.position.character);
                            editor.selection = new vscode.Selection(position, position);
                            editor.revealRange(
                                new vscode.Range(position, position),
                                vscode.TextEditorRevealType.InCenter
                            );
                        }
                        return;
                }
            },
            undefined,
            this.context.subscriptions
        );
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
                        cursor: pointer;
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
                    .action-buttons {
                        margin-top: 10px;
                        display: flex;
                        gap: 8px;
                    }
                    .action-button {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 6px 10px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    }
                    .action-button:hover {
                        background-color: var(--vscode-button-hoverBackground);
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
                                <div class="function-name" data-function="${fn.name}">
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
                                <div class="action-buttons">
                                    <button class="action-button doc-button" data-function="${fn.name}">Generate Documentation</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    // Jump to function when name is clicked
                    document.querySelectorAll('.function-name').forEach(element => {
                        element.addEventListener('click', () => {
                            const functionName = element.getAttribute('data-function');
                            vscode.postMessage({
                                command: 'jumpToFunction',
                                functionName: functionName
                            });
                        });
                    });
                    
                    // Add event listeners to documentation buttons
                    document.querySelectorAll('.doc-button').forEach(button => {
                        button.addEventListener('click', () => {
                            const functionName = button.getAttribute('data-function');
                            vscode.postMessage({
                                command: 'generateDocumentation',
                                functionName: functionName
                            });
                        });
                    });
                </script>
            </body>
            </html>
        `;
    }
    
    /**
     * Show detailed function analysis in a message panel
     * @private
     */
    _showFunctionDetailsPanel(functionData, editor) {
        // Create a summary of function details
        const complexityEmoji = functionData.analysis.complexity.level === 'low' ? '😺' :
                               functionData.analysis.complexity.level === 'medium' ? '🐱' : '😾';
        
        // Prepare actions for the detail panel
        const detailActions = [
            { title: '📋 Copy Explanation', id: 'copy' },
            { title: '📝 Generate Documentation', id: 'document' }
        ];
        
        // If the function has patterns or side effects, add more detail options
        if (functionData.analysis.patterns.length > 0) {
            detailActions.push({ title: '💡 View Patterns', id: 'patterns' });
        }
        
        if (functionData.analysis.sideEffects.length > 0) {
            detailActions.push({ title: '⚠️ View Side Effects', id: 'effects' });
        }
        
        // Show function details
        vscode.window.showInformationMessage(
            `${complexityEmoji} ${functionData.name}: ${functionData.explanation}`,
            { modal: false },
            ...detailActions
        ).then(selection => {
            if (!selection) return;
            
            switch (selection.id) {
                case 'copy':
                    vscode.env.clipboard.writeText(functionData.explanation);
                    vscode.window.showInformationMessage('Function explanation copied to clipboard! 😺');
                    break;
                    
                case 'document':
                    this._generateFunctionDocumentation(functionData, editor);
                    break;
                    
                case 'patterns':
                    if (functionData.analysis.patterns.length > 0) {
                        const patternText = functionData.analysis.patterns
                            .map(p => `${p.name}: ${p.type}`)
                            .join('\n');
                        
                        vscode.window.showInformationMessage(
                            `Patterns in ${functionData.name}:\n${patternText}`,
                            { modal: false },
                            { title: '📋 Copy', id: 'copy-patterns' }
                        ).then(action => {
                            if (action && action.id === 'copy-patterns') {
                                vscode.env.clipboard.writeText(patternText);
                                vscode.window.showInformationMessage('Patterns copied to clipboard! 😺');
                            }
                        });
                    }
                    break;
                    
                case 'effects':
                    if (functionData.analysis.sideEffects.length > 0) {
                        const effectsText = functionData.analysis.sideEffects
                            .map(e => `${e.type}: ${e.description}`)
                            .join('\n');
                        
                        vscode.window.showInformationMessage(
                            `Side Effects in ${functionData.name}:\n${effectsText}`,
                            { modal: false },
                            { title: '📋 Copy', id: 'copy-effects' }
                        ).then(action => {
                            if (action && action.id === 'copy-effects') {
                                vscode.env.clipboard.writeText(effectsText);
                                vscode.window.showInformationMessage('Side effects copied to clipboard! 😺');
                            }
                        });
                    }
                    break;
            }
        });
    }
    
    /**
     * Apply decorations for functions based on complexity
     * @private
     */
    _applyFunctionDecorations(analyzedFunctions, editor) {
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
     * Generate function documentation
     * @private
     */
    _generateFunctionDocumentation(functionData, editor) {
        const { name, params, analysis } = functionData;
        
        let docTemplate = '/**\n';
        docTemplate += ` * ${name}\n`;
        docTemplate += ` *\n`;
        
        // Add parameter documentation
        params.forEach(param => {
            docTemplate += ` * @param {any} ${param.name} - Description\n`;
        });
        
        // Add return documentation
        if (analysis.returnValue.exists) {
            docTemplate += ` * @returns {any} - ${analysis.returnValue.value}\n`;
        } else {
            docTemplate += ` * @returns {void}\n`;
        }
        
        docTemplate += ` */\n`;
        
        // Create WebView panel for documentation preview
        const panel = vscode.window.createWebviewPanel(
            'codewhiskers.documentationPreview',
            `Documentation: ${name}`,
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );
        
        // Generate HTML for the documentation preview
        panel.webview.html = this._generateDocumentationPreviewHTML(name, docTemplate, functionData);
        
        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'insertDocumentation':
                        const position = new vscode.Position(functionData.position.line, 0);
                        editor.edit(editBuilder => {
                            editBuilder.insert(position, docTemplate);
                        }).then(success => {
                            if (success) {
                                panel.webview.postMessage({ command: 'documentationInserted' });
                                vscode.window.showInformationMessage('Documentation added! 😺');
                            }
                        });
                        return;
                        
                    case 'copyDocumentation':
                        vscode.env.clipboard.writeText(docTemplate);
                        vscode.window.showInformationMessage('Documentation copied to clipboard 📋');
                        return;
                        
                    case 'jumpToFunction':
                        if (functionData.position) {
                            const position = new vscode.Position(functionData.position.line, functionData.position.character || 0);
                            editor.selection = new vscode.Selection(position, position);
                            editor.revealRange(
                                new vscode.Range(position, position),
                                vscode.TextEditorRevealType.InCenter
                            );
                        }
                        return;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }
    
    /**
     * Generate HTML for documentation preview panel
     * @private
     */
    _generateDocumentationPreviewHTML(functionName, docTemplate, functionData) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Documentation Preview</title>
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
                    .header-icon {
                        font-size: 24px;
                        margin-right: 10px;
                    }
                    h2 {
                        margin: 0;
                    }
                    .function-info {
                        margin-bottom: 20px;
                    }
                    .function-name {
                        font-weight: bold;
                        color: var(--vscode-symbolIcon-functionForeground, #B180D7);
                        cursor: pointer;
                    }
                    .function-name:hover {
                        text-decoration: underline;
                    }
                    .doc-preview {
                        font-family: monospace;
                        white-space: pre-wrap;
                        padding: 15px;
                        background-color: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 5px;
                        margin-bottom: 20px;
                    }
                    .action-buttons {
                        display: flex;
                        gap: 10px;
                        margin-top: 20px;
                    }
                    .action-button {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 13px;
                        display: flex;
                        align-items: center;
                    }
                    .action-button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .action-button:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }
                    .button-icon {
                        margin-right: 6px;
                        font-size: 16px;
                    }
                    .success-message {
                        color: #4caf50;
                        margin-top: 10px;
                        font-weight: bold;
                        display: none;
                    }
                    .hint {
                        margin-top: 20px;
                        padding: 10px;
                        background-color: rgba(100, 181, 246, 0.1);
                        border-left: 3px solid #64b5f6;
                        border-radius: 2px;
                    }
                    .hint h3 {
                        margin-top: 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="header-icon">📝</div>
                        <h2>Documentation Preview</h2>
                    </div>
                    
                    <div class="function-info">
                        Function: <span class="function-name">${functionName}</span>
                    </div>
                    
                    <h3>Documentation Template</h3>
                    <div class="doc-preview">${docTemplate.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                    
                    <div class="hint">
                        <h3>JSDoc Tips</h3>
                        <ul>
                            <li>Add detailed descriptions for each parameter</li>
                            <li>Specify accurate types (e.g., {string}, {number}, {boolean})</li>
                            <li>Describe what the function returns</li>
                            <li>Consider adding @example with a usage sample</li>
                        </ul>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="action-button" id="insertBtn">
                            <span class="button-icon">📄</span> Insert Documentation
                        </button>
                        <button class="action-button" id="copyBtn">
                            <span class="button-icon">📋</span> Copy to Clipboard
                        </button>
                    </div>
                    
                    <div class="success-message" id="successMessage">
                        Documentation added successfully! 😺
                    </div>
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    // Add event listeners to buttons
                    document.getElementById('insertBtn').addEventListener('click', () => {
                        vscode.postMessage({
                            command: 'insertDocumentation'
                        });
                    });
                    
                    document.getElementById('copyBtn').addEventListener('click', () => {
                        vscode.postMessage({
                            command: 'copyDocumentation'
                        });
                    });
                    
                    document.querySelector('.function-name').addEventListener('click', () => {
                        vscode.postMessage({
                            command: 'jumpToFunction'
                        });
                    });
                    
                    // Handle messages from extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        
                        if (message.command === 'documentationInserted') {
                            // Show success message
                            document.getElementById('successMessage').style.display = 'block';
                            
                            // Disable insert button
                            document.getElementById('insertBtn').disabled = true;
                        }
                    });
                </script>
            </body>
            </html>
        `;
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
     * Suggest documentation template based on code
     * @private
     */
    _suggestInlineDocumentation(editor) {
        const document = editor.document;
        const selection = editor.selection;
        const text = document.getText(selection);
        
        // Simple heuristic to generate documentation
        let docTemplate = '/**\n';
        
        // Check if it's a function
        const functionMatch = text.match(/function\s+(\w+)\s*\(([^)]*)\)/);
        if (functionMatch) {
            const name = functionMatch[1];
            const params = functionMatch[2].split(',').map(p => p.trim()).filter(p => p);
            
            docTemplate += ` * ${name} function\n`;
            docTemplate += ` *\n`;
            
            params.forEach(param => {
                docTemplate += ` * @param {any} ${param} - Description\n`;
            });
            
            docTemplate += ` * @returns {any} - Return value description\n`;
        } else {
            docTemplate += ` * Description of this code block\n`;
        }
        
        docTemplate += ` */\n`;
        
        // Create WebView panel for documentation preview
        const panel = vscode.window.createWebviewPanel(
            'codewhiskers.inlineDocumentation',
            'CodeWhiskers: Suggested Documentation',
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );
        
        // Generate HTML for the documentation preview
        panel.webview.html = this._generateInlineDocumentationHTML(docTemplate, text);
        
        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'insertDocumentation':
                        const position = new vscode.Position(selection.start.line, 0);
                        editor.edit(editBuilder => {
                            editBuilder.insert(position, docTemplate);
                        }).then(success => {
                            if (success) {
                                panel.webview.postMessage({ command: 'documentationInserted' });
                                vscode.window.showInformationMessage('Documentation added! 😺');
                            }
                        });
                        return;
                        
                    case 'copyDocumentation':
                        vscode.env.clipboard.writeText(docTemplate);
                        vscode.window.showInformationMessage('Documentation copied to clipboard 📋');
                        return;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }
    
    /**
     * Generate HTML for inline documentation panel
     * @private
     */
    _generateInlineDocumentationHTML(docTemplate, selectedCode) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Suggested Documentation</title>
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
                    .header-icon {
                        font-size: 24px;
                        margin-right: 10px;
                    }
                    h2 {
                        margin: 0;
                    }
                    .code-section {
                        margin-bottom: 20px;
                    }
                    h3 {
                        margin-top: 20px;
                        margin-bottom: 10px;
                    }
                    .code-preview, .doc-preview {
                        font-family: monospace;
                        white-space: pre-wrap;
                        padding: 15px;
                        background-color: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 5px;
                        margin-bottom: 20px;
                        font-size: 14px;
                        line-height: 1.5;
                    }
                    .action-buttons {
                        display: flex;
                        gap: 10px;
                        margin-top: 20px;
                    }
                    .action-button {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 13px;
                        display: flex;
                        align-items: center;
                    }
                    .action-button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .action-button:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }
                    .button-icon {
                        margin-right: 6px;
                        font-size: 16px;
                    }
                    .success-message {
                        color: #4caf50;
                        margin-top: 10px;
                        font-weight: bold;
                        display: none;
                    }
                    .cat-image {
                        width: 40px;
                        height: 40px;
                        margin-right: 15px;
                        opacity: 0.8;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="header-icon">📝</div>
                        <h2>Suggested Documentation</h2>
                    </div>
                    
                    <div class="code-section">
                        <h3>Selected Code</h3>
                        <div class="code-preview">${selectedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                        
                        <h3>Documentation Template</h3>
                        <div class="doc-preview">${docTemplate.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="action-button" id="insertBtn">
                            <span class="button-icon">📄</span> Add Documentation
                        </button>
                        <button class="action-button" id="copyBtn">
                            <span class="button-icon">📋</span> Copy to Clipboard
                        </button>
                    </div>
                    
                    <div class="success-message" id="successMessage">
                        Documentation added successfully! 😺
                    </div>
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    // Add event listeners to buttons
                    document.getElementById('insertBtn').addEventListener('click', () => {
                        vscode.postMessage({
                            command: 'insertDocumentation'
                        });
                    });
                    
                    document.getElementById('copyBtn').addEventListener('click', () => {
                        vscode.postMessage({
                            command: 'copyDocumentation'
                        });
                    });
                    
                    // Handle messages from extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        
                        if (message.command === 'documentationInserted') {
                            // Show success message
                            document.getElementById('successMessage').style.display = 'block';
                            
                            // Disable insert button
                            document.getElementById('insertBtn').disabled = true;
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
    
    /**
     * Generate documentation template based on code section
     * @private
     */
    _generateDocTemplate(section) {
        let docTemplate = '/**\n';
        
        // Generate appropriate documentation based on section type
        if (section.type === 'function' || section.type === 'method') {
            const name = section.name || 'function';
            docTemplate += ` * ${name}\n`;
            docTemplate += ` *\n`;
            
            // Add parameter documentation if available
            if (section.params && section.params.length > 0) {
                section.params.forEach(param => {
                    docTemplate += ` * @param {any} ${param} - Description\n`;
                });
            }
            
            // Add return documentation
            docTemplate += ` * @returns {any} - Description\n`;
        } else if (section.type === 'class') {
            docTemplate += ` * ${section.name || 'Class'} class\n`;
            docTemplate += ` * @class\n`;
            docTemplate += ` * @description Class description\n`;
        } else if (section.type === 'variable' || section.type === 'constant') {
            docTemplate += ` * ${section.name || 'Variable'} description\n`;
            docTemplate += ` * @type {any}\n`;
        } else {
            // Default documentation
            docTemplate += ` * Description\n`;
        }
        
        docTemplate += ` */\n`;
        return docTemplate;
    }

    /**
     * Add documentation to selected code sections using WebView
     * @private
     */
    _addDocumentation(undocumentedSections, editor) {
        if (undocumentedSections.length === 0) return;
        
        const section = undocumentedSections[0];
        const docTemplate = this._generateDocTemplate(section);
        
        // Create WebView panel for documentation preview
        const panel = vscode.window.createWebviewPanel(
            'codewhiskers.sectionDocumentation',
            `Documentation: ${section.type}`,
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );
        
        // Generate HTML for the documentation preview
        panel.webview.html = this._generateSectionDocumentationHTML(section, docTemplate, undocumentedSections.length > 1);
        
        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'insertDocumentation':
                        const position = new vscode.Position(section.start.line, 0);
                        editor.edit(editBuilder => {
                            editBuilder.insert(position, docTemplate);
                        }).then(success => {
                            if (success) {
                                panel.webview.postMessage({ command: 'documentationInserted' });
                                vscode.window.showInformationMessage('Documentation added! 😺');
                                
                                // If there are more sections, update the UI
                                if (undocumentedSections.length > 1) {
                                    panel.webview.postMessage({ 
                                        command: 'moreDocumentations',
                                        count: undocumentedSections.length - 1
                                    });
                                }
                            }
                        });
                        return;
                        
                    case 'copyDocumentation':
                        vscode.env.clipboard.writeText(docTemplate);
                        vscode.window.showInformationMessage('Documentation copied to clipboard 📋');
                        return;
                        
                    case 'continueDocumentation':
                        // Process next section
                        if (undocumentedSections.length > 1) {
                            this._addDocumentation(undocumentedSections.slice(1), editor);
                            panel.dispose(); // Close the current panel
                        }
                        return;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }

    /**
     * Generate HTML for section documentation panel
     * @private
     */
    _generateSectionDocumentationHTML(section, docTemplate, hasMore) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Documentation Preview</title>
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
                    .header-icon {
                        font-size: 24px;
                        margin-right: 10px;
                    }
                    h2 {
                        margin: 0;
                    }
                    .section-info {
                        margin-bottom: 20px;
                    }
                    .section-type {
                        font-weight: bold;
                        color: var(--vscode-symbolIcon-functionForeground, #B180D7);
                    }
                    .code-preview, .doc-preview {
                        font-family: monospace;
                        white-space: pre-wrap;
                        padding: 15px;
                        background-color: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 5px;
                        margin-bottom: 20px;
                        font-size: 14px;
                        line-height: 1.5;
                    }
                    .action-buttons {
                        display: flex;
                        gap: 10px;
                        margin-top: 20px;
                    }
                    .action-button {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 13px;
                        display: flex;
                        align-items: center;
                    }
                    .action-button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .action-button:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }
                    .success-message {
                        color: #4caf50;
                        margin-top: 10px;
                        font-weight: bold;
                        display: none;
                    }
                    .continue-section {
                        margin-top: 20px;
                        padding: 15px;
                        background-color: rgba(100, 181, 246, 0.1);
                        border-radius: 5px;
                        display: ${hasMore ? 'block' : 'none'};
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="header-icon">📝</div>
                        <h2>Documentation for ${section.type}</h2>
                    </div>
                    
                    <div class="section-info">
                        <p>Type: <span class="section-type">${section.type}</span> at Line ${section.start.line + 1}</p>
                    </div>
                    
                    <h3>Code</h3>
                    <div class="code-preview">${section.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                    
                    <h3>Suggested Documentation</h3>
                    <div class="doc-preview">${docTemplate.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                    
                    <div class="action-buttons">
                        <button class="action-button" id="insertBtn">
                            <span class="button-icon">📄</span> Add Documentation
                        </button>
                        <button class="action-button" id="copyBtn">
                            <span class="button-icon">📋</span> Copy to Clipboard
                        </button>
                    </div>
                    
                    <div class="success-message" id="successMessage">
                        Documentation added successfully! 😺
                    </div>
                    
                    <div class="continue-section" id="continueSection">
                        <p>There are more undocumented sections in your code.</p>
                        <button class="action-button" id="continueBtn">
                            Continue to Next Section
                        </button>
                        <span id="remainingCount">${hasMore ? undocumentedSections.length - 1 : 0} more remaining</span>
                    </div>
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    // Add event listeners to buttons
                    document.getElementById('insertBtn').addEventListener('click', () => {
                        vscode.postMessage({
                            command: 'insertDocumentation'
                        });
                    });
                    
                    document.getElementById('copyBtn').addEventListener('click', () => {
                        vscode.postMessage({
                            command: 'copyDocumentation'
                        });
                    });
                    
                    // Add continue button if there are more sections
                    const continueBtn = document.getElementById('continueBtn');
                    if (continueBtn) {
                        continueBtn.addEventListener('click', () => {
                            vscode.postMessage({
                                command: 'continueDocumentation'
                            });
                        });
                    }
                    
                    // Handle messages from extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        
                        if (message.command === 'documentationInserted') {
                            // Show success message
                            document.getElementById('successMessage').style.display = 'block';
                            
                            // Disable insert button
                            document.getElementById('insertBtn').disabled = true;
                        } else if (message.command === 'moreDocumentations') {
                            // Update remaining count
                            const remainingCount = document.getElementById('remainingCount');
                            if (remainingCount) {
                                remainingCount.textContent = message.count + ' more remaining';
                            }
                            
                            // Show continue section
                            const continueSection = document.getElementById('continueSection');
                            if (continueSection) {
                                continueSection.style.display = 'block';
                            }
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
}

module.exports = {
    UILayer
}; 