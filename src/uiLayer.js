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
        this.initialized = false;
        this._catThemeManager = null;
        
        // Set default settings before trying to load
        this.settings = {
            explanationStyle: 'conversational',
            uiTheme: 'tabby',
            animationFrequency: 'medium',
            enableEmojis: true,
            enableAnimations: true,
            enableDecorations: true,
            enableAutoRefresh: true,
            showCatImages: true
        };
        
        try {
            // Read settings
            this.updateSettings();
            
            // Watch for settings changes
            vscode.workspace.onDidChangeConfiguration(this.updateSettings.bind(this));
            
            // Initialize UI with a slight delay to prevent startup blocking
            setTimeout(() => {
                this.initializeUI();
            }, 500);
        } catch (error) {
            console.error('Error during UILayer construction:', error);
        }
    }
    
    /**
     * Set the cat theme manager
     * @param {CatThemeManager} manager - The cat theme manager
     */
    setCatThemeManager(manager) {
        this._catThemeManager = manager;
    }
    
    /**
     * Update settings from configuration
     */
    updateSettings() {
        try {
            const config = vscode.workspace.getConfiguration('codewhiskers');
            
            // Use default values for all settings in case they're not defined
            this.settings = {
                explanationStyle: config.get('explanationStyle', 'conversational'),
                uiTheme: config.get('uiTheme', 'tabby'),
                animationFrequency: config.get('animationFrequency', 'medium'),
                enableEmojis: config.get('enableEmojis', true),
                enableAnimations: config.get('enableAnimations', true),
                enableDecorations: config.get('enableDecorations', true),
                enableAutoRefresh: config.get('enableAutoRefresh', true),
                showCatImages: config.get('showCatImages', true)
            };
        } catch (error) {
            // If settings retrieval fails, use defaults
            console.warn('Failed to load settings, using defaults', error);
            this.settings = {
                explanationStyle: 'conversational',
                uiTheme: 'tabby',
                animationFrequency: 'medium',
                enableEmojis: true,
                enableAnimations: true,
                enableDecorations: true,
                enableAutoRefresh: true,
                showCatImages: true
            };
        }
        
        // Apply settings to existing UI elements
        if (this.initialized) {
            this.applySettingsToUI();
        }
    }
    
    /**
     * Apply settings to UI elements
     */
    applySettingsToUI() {
        if (!this.initialized) {
            return;
        }
        
        try {
            // Apply settings to decorations if they exist
            if (this.decorationTypes.lowComplexity) {
                // If decorations are disabled, clear them
                if (!this.settings.enableDecorations) {
                    this._clearAllDecorations();
                }
                
                // Update decoration types based on settings
                this.decorationTypes.lowComplexity = vscode.window.createTextEditorDecorationType({
                    border: '1px solid #80deea',
                    backgroundColor: 'rgba(128, 222, 234, 0.1)',
                    before: this.settings.enableEmojis ? {
                        contentText: '😺',
                        margin: '0 5px 0 0'
                    } : {}
                });
                
                this.decorationTypes.mediumComplexity = vscode.window.createTextEditorDecorationType({
                    border: '1px solid #ffb74d',
                    backgroundColor: 'rgba(255, 183, 77, 0.1)',
                    before: this.settings.enableEmojis ? {
                        contentText: '🐱',
                        margin: '0 5px 0 0'
                    } : {}
                });
                
                this.decorationTypes.highComplexity = vscode.window.createTextEditorDecorationType({
                    border: '1px solid #ff8a65',
                    backgroundColor: 'rgba(255, 138, 101, 0.1)',
                    before: this.settings.enableEmojis ? {
                        contentText: '😾',
                        margin: '0 5px 0 0'
                    } : {}
                });
            }
        } catch (error) {
            console.error('Error applying settings to UI:', error);
        }
    }
    
    /**
     * Clear all decorations
     * @private
     */
    _clearAllDecorations() {
        try {
            if (!this.initialized || !this.decorationTypes) {
                return;
            }
            
            if (vscode.window.activeTextEditor && this.decorationTypes.lowComplexity) {
                vscode.window.activeTextEditor.setDecorations(this.decorationTypes.lowComplexity, []);
                vscode.window.activeTextEditor.setDecorations(this.decorationTypes.mediumComplexity, []);
                vscode.window.activeTextEditor.setDecorations(this.decorationTypes.highComplexity, []);
            }
        } catch (error) {
            console.error('Error clearing decorations:', error);
        }
    }
    
    /**
     * Initialize the UI components
     */
    initializeUI() {
        try {
            this.initialized = false;
            
            // Create decorations for different complexity levels
            this.decorationTypes.lowComplexity = vscode.window.createTextEditorDecorationType({
                border: '1px solid #80deea',
                backgroundColor: 'rgba(128, 222, 234, 0.1)',
                before: this.settings.enableEmojis ? {
                    contentText: '😺',
                    margin: '0 5px 0 0'
                } : {}
            });
            
            this.decorationTypes.mediumComplexity = vscode.window.createTextEditorDecorationType({
                border: '1px solid #ffb74d',
                backgroundColor: 'rgba(255, 183, 77, 0.1)',
                before: this.settings.enableEmojis ? {
                    contentText: '🐱',
                    margin: '0 5px 0 0'
                } : {}
            });
            
            this.decorationTypes.highComplexity = vscode.window.createTextEditorDecorationType({
                border: '1px solid #ff8a65',
                backgroundColor: 'rgba(255, 138, 101, 0.1)',
                before: this.settings.enableEmojis ? {
                    contentText: '😾',
                    margin: '0 5px 0 0'
                } : {}
            });
            
            // Register hover providers for JavaScript and TypeScript if needed
            this.registerHoverProviders(['javascript', 'typescript']);
            
            // Initialize sidebar providers if needed
            this.initializeSidebarProviders();
            
            // Mark initialization as complete
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing UI:', error);
            // Ensure we don't try to use uninitialized UI components
            this.initialized = false;
        }
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
        const catImage = this.settings.showCatImages ? this._getCatImage(complexity) : null;
        
        // Get the animation CSS
        const animationCSS = this.settings.enableAnimations ? this._getAnimationCSS() : '';
        
        // Format the explanation text to fix spacing issues - preserve paragraphs but clean up other spacing
        const formattedExplanation = explanation
            .split('\n\n')
            .map(paragraph => paragraph.replace(/\s+/g, ' ').trim())
            .join('\n\n');
        
        // Determine if we should show emojis
        const showCatIcon = this.settings.enableEmojis && this.settings.showCatImages;
        
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
                        ${showCatIcon ? (complexity === 'low' 
                            ? '<div class="cat-icon ' + (this.settings.enableAnimations ? 'animate-bounce' : '') + '">😺</div>' 
                            : complexity === 'medium' 
                                ? '<div class="cat-icon ' + (this.settings.enableAnimations ? 'animate-bounce' : '') + '">🐱</div>' 
                                : '<div class="cat-icon ' + (this.settings.enableAnimations ? 'animate-bounce' : '') + '">😾</div>') : ''}
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
                                <span class="button-icon">${this.settings.enableEmojis ? '🔍' : ''}</span> View Technical Details
                            </button>` : ''
                        }
                        <button class="action-button" id="docBtn">
                            <span class="button-icon">${this.settings.enableEmojis ? '📝' : ''}</span> Add Documentation
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
    
    /**
     * Show the settings UI in a WebView panel
     */
    showSettingsUI() {
        // Create WebView panel for settings
        const panel = vscode.window.createWebviewPanel(
            'codewhiskers.settings',
            'CodeWhiskers Settings',
            vscode.ViewColumn.Active,
            { 
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );
        
        // Generate HTML for the settings UI
        panel.webview.html = this._generateSettingsHTML();
        
        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'saveSettings':
                        this._saveSettings(message.settings);
                        panel.webview.postMessage({ command: 'settingsSaved' });
                        return;
                        
                    case 'resetSettings':
                        this._resetSettings();
                        panel.webview.postMessage({ 
                            command: 'settingsReset',
                            settings: this.settings
                        });
                        return;
                        
                    case 'getSettings':
                        panel.webview.postMessage({ 
                            command: 'currentSettings',
                            settings: this.settings
                        });
                        return;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }
    
    /**
     * Generate HTML for settings panel
     * @private
     */
    _generateSettingsHTML() {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>CodeWhiskers Settings</title>
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
                    .settings-section {
                        margin-bottom: 30px;
                    }
                    .settings-section h3 {
                        margin-top: 0;
                        margin-bottom: 10px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                        padding-bottom: 5px;
                    }
                    .setting-item {
                        margin-bottom: 15px;
                        display: flex;
                        flex-direction: column;
                    }
                    .setting-label {
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .setting-description {
                        margin-bottom: 8px;
                        font-size: 12px;
                        opacity: 0.8;
                    }
                    select, input[type="checkbox"] {
                        padding: 5px;
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 2px;
                    }
                    select {
                        width: 100%;
                        max-width: 300px;
                    }
                    .checkbox-container {
                        display: flex;
                        align-items: center;
                    }
                    .checkbox-container input {
                        margin-right: 8px;
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
                    }
                    .action-button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .reset-button {
                        background-color: var(--vscode-errorForeground, #f44336);
                    }
                    .success-message {
                        color: #4caf50;
                        margin-top: 10px;
                        font-weight: bold;
                        display: none;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="header-icon">⚙️</div>
                        <h2>CodeWhiskers Settings</h2>
                    </div>
                    
                    <div class="settings-form">
                        <div class="settings-section">
                            <h3>Explanation Options</h3>
                            
                            <div class="setting-item">
                                <label class="setting-label" for="explanationStyle">Explanation Style</label>
                                <div class="setting-description">Choose the level of detail for code explanations</div>
                                <select id="explanationStyle">
                                    <option value="conversational">Conversational</option>
                                    <option value="technical">Technical</option>
                                    <option value="detailed">Detailed</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h3>UI Options</h3>
                            
                            <div class="setting-item">
                                <label class="setting-label" for="uiTheme">Theme</label>
                                <div class="setting-description">Choose the kitten theme for UI elements</div>
                                <select id="uiTheme">
                                    <option value="tabby">Tabby</option>
                                    <option value="siamese">Siamese</option>
                                    <option value="calico">Calico</option>
                                    <option value="black">Black</option>
                                </select>
                            </div>
                            
                            <div class="setting-item">
                                <label class="setting-label" for="animationFrequency">Animation Frequency</label>
                                <div class="setting-description">Set how often animations should appear</div>
                                <select id="animationFrequency">
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            
                            <div class="setting-item">
                                <div class="checkbox-container">
                                    <input type="checkbox" id="enableEmojis">
                                    <label class="setting-label" for="enableEmojis">Enable Emojis</label>
                                </div>
                                <div class="setting-description">Show emoji icons in the UI</div>
                            </div>
                            
                            <div class="setting-item">
                                <div class="checkbox-container">
                                    <input type="checkbox" id="enableAnimations">
                                    <label class="setting-label" for="enableAnimations">Enable Animations</label>
                                </div>
                                <div class="setting-description">Enable UI animations</div>
                            </div>
                            
                            <div class="setting-item">
                                <div class="checkbox-container">
                                    <input type="checkbox" id="showCatImages">
                                    <label class="setting-label" for="showCatImages">Show Cat Images</label>
                                </div>
                                <div class="setting-description">Display cat images in explanation panels</div>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h3>Code Editor Options</h3>
                            
                            <div class="setting-item">
                                <div class="checkbox-container">
                                    <input type="checkbox" id="enableDecorations">
                                    <label class="setting-label" for="enableDecorations">Enable Code Decorations</label>
                                </div>
                                <div class="setting-description">Show decorations in the code editor</div>
                            </div>
                            
                            <div class="setting-item">
                                <div class="checkbox-container">
                                    <input type="checkbox" id="enableAutoRefresh">
                                    <label class="setting-label" for="enableAutoRefresh">Auto-Refresh Analysis</label>
                                </div>
                                <div class="setting-description">Automatically refresh analysis when code changes</div>
                            </div>
                        </div>
                        
                        <div class="action-buttons">
                            <button class="action-button" id="saveBtn">Save Settings</button>
                            <button class="action-button reset-button" id="resetBtn">Reset to Defaults</button>
                        </div>
                        
                        <div class="success-message" id="successMessage">
                            Settings saved successfully! 😺
                        </div>
                    </div>
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    // Request current settings from extension
                    window.addEventListener('load', () => {
                        vscode.postMessage({
                            command: 'getSettings'
                        });
                    });
                    
                    // Apply settings to the form
                    function applySettings(settings) {
                        document.getElementById('explanationStyle').value = settings.explanationStyle;
                        document.getElementById('uiTheme').value = settings.uiTheme;
                        document.getElementById('animationFrequency').value = settings.animationFrequency;
                        document.getElementById('enableEmojis').checked = settings.enableEmojis;
                        document.getElementById('enableAnimations').checked = settings.enableAnimations;
                        document.getElementById('enableDecorations').checked = settings.enableDecorations;
                        document.getElementById('enableAutoRefresh').checked = settings.enableAutoRefresh;
                        document.getElementById('showCatImages').checked = settings.showCatImages;
                    }
                    
                    // Get current settings from form
                    function getFormSettings() {
                        return {
                            explanationStyle: document.getElementById('explanationStyle').value,
                            uiTheme: document.getElementById('uiTheme').value,
                            animationFrequency: document.getElementById('animationFrequency').value,
                            enableEmojis: document.getElementById('enableEmojis').checked,
                            enableAnimations: document.getElementById('enableAnimations').checked,
                            enableDecorations: document.getElementById('enableDecorations').checked,
                            enableAutoRefresh: document.getElementById('enableAutoRefresh').checked,
                            showCatImages: document.getElementById('showCatImages').checked
                        };
                    }
                    
                    // Add event listeners to buttons
                    document.getElementById('saveBtn').addEventListener('click', () => {
                        const settings = getFormSettings();
                        vscode.postMessage({
                            command: 'saveSettings',
                            settings: settings
                        });
                    });
                    
                    document.getElementById('resetBtn').addEventListener('click', () => {
                        vscode.postMessage({
                            command: 'resetSettings'
                        });
                    });
                    
                    // Handle messages from extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        
                        switch (message.command) {
                            case 'currentSettings':
                                applySettings(message.settings);
                                break;
                                
                            case 'settingsSaved':
                                // Show success message
                                const successMessage = document.getElementById('successMessage');
                                successMessage.style.display = 'block';
                                // Hide after a delay
                                setTimeout(() => {
                                    successMessage.style.display = 'none';
                                }, 3000);
                                break;
                                
                            case 'settingsReset':
                                applySettings(message.settings);
                                break;
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
    
    /**
     * Save settings to VS Code configuration
     * @private
     */
    _saveSettings(newSettings) {
        const config = vscode.workspace.getConfiguration('codewhiskers');
        
        // Update each setting
        Object.keys(newSettings).forEach(key => {
            config.update(key, newSettings[key], vscode.ConfigurationTarget.Global);
        });
        
        // Update internal settings
        this.updateSettings();
    }
    
    /**
     * Reset settings to defaults
     * @private
     */
    _resetSettings() {
        const config = vscode.workspace.getConfiguration('codewhiskers');
        
        // Reset each setting to its default
        config.update('explanationStyle', undefined, vscode.ConfigurationTarget.Global);
        config.update('uiTheme', undefined, vscode.ConfigurationTarget.Global);
        config.update('animationFrequency', undefined, vscode.ConfigurationTarget.Global);
        config.update('enableEmojis', undefined, vscode.ConfigurationTarget.Global);
        config.update('enableAnimations', undefined, vscode.ConfigurationTarget.Global);
        config.update('enableDecorations', undefined, vscode.ConfigurationTarget.Global);
        config.update('enableAutoRefresh', undefined, vscode.ConfigurationTarget.Global);
        config.update('showCatImages', undefined, vscode.ConfigurationTarget.Global);
        
        // Update internal settings
        this.updateSettings();
    }
    
    /**
     * Show panel with generic content
     * @param {string} title - Panel title
     * @param {string} content - Content to display
     */
    showPanel(title, content) {
        const panel = vscode.window.createWebviewPanel(
            'whiskerCodePanel',
            title,
            vscode.ViewColumn.Two,
            {
                enableScripts: true
            }
        );
        
        panel.webview.html = this._getWebviewContent(title, content);
        return panel; // Add this line to return the panel object
    }
    
    /**
     * Show performance issues in a panel
     * @param {object} analysis - Performance analysis results
     * @param {string} language - Language of the analyzed code
     */
    showPerformanceIssues(analysis, language) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        
        const fileName = editor.document.fileName.split('/').pop();
        
        // Extract issues from the analysis
        const issues = analysis.issues || [];
        
        // Generate unique IDs for each issue
        const issuesWithIds = issues.map((issue, index) => {
            return {
                ...issue,
                id: `issue-${Date.now()}-${index}`
            };
        });
        
        // Save issues for reference
        this._currentIssues = issuesWithIds;
        this._currentEditor = editor;
        
        // Create webview
        const panel = this.showPanel('Performance Analysis', this._generatePerformanceHTML(issuesWithIds, fileName));
        
        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'showIssueLocation':
                    if (message.lineNumber) {
                        const position = new vscode.Position(message.lineNumber - 1, 0);
                        editor.selection = new vscode.Selection(position, position);
                        editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
                    }
                    break;
                case 'fixIssue':
                    if (message.issueId) {
                        const issue = this._currentIssues.find(i => i.id === message.issueId);
                        if (issue) {
                            try {
                                // Generate fixed code if not already available
                                if (!issue.fixedCode) {
                                    issue.fixedCode = this._generateFixedCode(issue);
                                }
                                
                                // Apply the fix
                                if (issue.fixedCode) {
                                    this._applyFix(editor, issue, issue.fixedCode);
                                    
                                    // Send success message back to webview
                                    panel.webview.postMessage({
                                        command: 'fixResult',
                                        issueId: message.issueId,
                                        success: true
                                    });
                                } else {
                                    throw new Error('Could not generate a fix for this issue');
                                }
                            } catch (error) {
                                console.error('Error fixing issue:', error);
                                
                                // Send error message back to webview
                                panel.webview.postMessage({
                                    command: 'fixResult',
                                    issueId: message.issueId,
                                    success: false,
                                    error: error.message || 'Failed to apply fix'
                                });
                            }
                        }
                    }
                    break;
            }
        });
        
        return panel;
    }
    
    /**
     * Show refactoring options for a function
     * @param {string} functionName - Name of the function
     * @param {vscode.TextEditor} editor - Current editor
     */
    showRefactoringOptions(functionName, editor) {
        const options = [
            "Extract complex logic to new functions",
            "Simplify nested conditionals",
            "Optimize loop structures",
            "Convert to more modern syntax",
            "Add proper documentation"
        ];
        
        vscode.window.showQuickPick(options, {
            placeHolder: `Select refactoring strategy for ${functionName}`
        }).then(selected => {
            if (selected) {
                vscode.window.showInformationMessage(`Selected to ${selected.toLowerCase()} for ${functionName}`);
            }
        });
    }
    
    /**
     * Show class analysis results
     * @param {string} className - Name of the class
     * @param {vscode.TextEditor} editor - Current editor
     */
    showClassAnalysis(className, editor) {
        vscode.window.showInformationMessage(`Analyzing class ${className}`);
        
        // In a real implementation, we would gather more data about the class
        // and display it in a panel
        const content = `
            <div class="class-analysis">
                <h2>Class Analysis: ${className}</h2>
                <p>Detailed analysis of class structure and methods would appear here.</p>
            </div>
        `;
        
        const panel = vscode.window.createWebviewPanel(
            'classAnalysis',
            `WhiskerCode: Class Analysis - ${className}`,
            vscode.ViewColumn.Two,
            {
                enableScripts: true
            }
        );
        
        panel.webview.html = this._getWebviewContent(`Class Analysis: ${className}`, content);
    }
    
    /**
     * Show React component analysis
     * @param {string} componentName - Name of the component
     * @param {vscode.TextEditor} editor - Current editor
     */
    showReactComponentAnalysis(componentName, editor) {
        vscode.window.showInformationMessage(`Analyzing React component ${componentName}`);
        
        // In a real implementation, we would analyze the component's hooks,
        // props, state management, etc.
        const content = `
            <div class="react-analysis">
                <h2>React Component Analysis: ${componentName}</h2>
                <p>Detailed analysis of component structure, hooks, and optimization opportunities would appear here.</p>
            </div>
        `;
        
        const panel = vscode.window.createWebviewPanel(
            'reactAnalysis',
            `WhiskerCode: React Analysis - ${componentName}`,
            vscode.ViewColumn.Two,
            {
                enableScripts: true
            }
        );
        
        panel.webview.html = this._getWebviewContent(`React Analysis: ${componentName}`, content);
    }
    
    /**
     * Show algorithmic complexity fix options
     * @param {object} issue - The performance issue
     * @param {vscode.TextEditor} editor - Current editor
     */
    showAlgorithmicComplexityFixOptions(issue, editor) {
        const options = [
            "Convert to a more efficient algorithm",
            "Use memoization to cache results",
            "Replace nested loops with a more efficient data structure",
            "Show me best practices for this pattern"
        ];
        
        vscode.window.showQuickPick(options, {
            placeHolder: `Select fix strategy for "${issue.description}"`
        }).then(selected => {
            if (selected) {
                vscode.window.showInformationMessage(`Selected to ${selected.toLowerCase()}`);
            }
        });
    }
    
    /**
     * Show performance fix options
     * @param {object} issue - The performance issue
     * @param {vscode.TextEditor} editor - Current editor
     */
    showPerformanceFixOptions(issue, editor) {
        // Create a panel to show the code preview
        const panel = vscode.window.createWebviewPanel(
            'performanceFixPreview',
            'WhiskerCode: Fix Preview',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );
        
        // Generate the suggested fix based on the issue type
        let fixedCode = this._generateFixedCode(issue);
        if (!fixedCode) {
            fixedCode = issue.match;
            vscode.window.showInformationMessage(`No automatic fix available for this issue. Manual suggestion: ${issue.suggestion}`);
            return;
        }
        
        // Create a diff view for the code comparison
        const content = `
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    padding: 20px;
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                }
                .container {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .header h2 {
                    margin: 0;
                    color: white;
                    text-shadow: 0px 1px 2px rgba(0, 0, 0, 0.5);
                }
                .cat-icon {
                    font-size: 24px;
                }
                .code-comparison {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                    margin: 20px 0;
                }
                .code-block {
                    flex: 1;
                    min-width: 300px;
                }
                .code-title {
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                pre {
                    background-color: var(--vscode-editor-inactiveSelectionBackground);
                    padding: 15px;
                    border-radius: 5px;
                    overflow: auto;
                    margin: 0;
                }
                .fix-description {
                    background-color: var(--vscode-editor-inactiveSelectionBackground);
                    padding: 15px;
                    border-radius: 5px;
                    margin: 10px 0;
                }
                .actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 15px;
                }
                button {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                }
                .apply-btn {
                    background-color: #4CAF50;
                    color: white;
                }
                .cancel-btn {
                    background-color: #f44336;
                    color: white;
                }
                .highlight {
                    background-color: rgba(76, 175, 80, 0.3);
                    font-weight: bold;
                }
                .issue-severity {
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 12px;
                    font-weight: bold;
                    text-transform: uppercase;
                    color: white;
                }
                .high { background-color: #f44336; }
                .medium { background-color: #ff9800; }
                .low { background-color: #4caf50; }
            </style>
            <div class="container">
                <div class="header">
                    <div class="cat-icon">🐱</div>
                    <h2>WhiskerCode Fix Preview</h2>
                    <div class="issue-severity ${issue.severity}">${issue.severity}</div>
                </div>
                
                <div class="fix-description">
                    <strong>Issue:</strong> ${issue.description}<br>
                    <strong>Suggestion:</strong> ${issue.suggestion}
                </div>
                
                <div class="code-comparison">
                    <div class="code-block">
                        <div class="code-title">Original Code:</div>
                        <pre><code>${this._escapeHtml(issue.match)}</code></pre>
                    </div>
                    <div class="code-block">
                        <div class="code-title">Suggested Fix:</div>
                        <pre><code>${this._highlightChanges(this._escapeHtml(issue.match), this._escapeHtml(fixedCode))}</code></pre>
                    </div>
                </div>
                
                <div class="actions">
                    <button class="apply-btn" id="apply-fix">Apply Fix</button>
                    <button class="cancel-btn" id="cancel-fix">Cancel</button>
                </div>
            </div>
            
            <script>
                (function() {
                    const vscode = acquireVsCodeApi();
                    
                    document.getElementById('apply-fix').addEventListener('click', () => {
                        vscode.postMessage({ command: 'applyFix' });
                    });
                    
                    document.getElementById('cancel-fix').addEventListener('click', () => {
                        vscode.postMessage({ command: 'cancelFix' });
                    });
                })();
            </script>
        `;
        
        panel.webview.html = content;
        
        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'applyFix':
                    this._applyFix(editor, issue, fixedCode);
                    panel.dispose();
                    break;
                case 'cancelFix':
                    panel.dispose();
                    break;
            }
        });
    }
    
    /**
     * Generate fixed code based on the issue type
     * @param {object} issue - The performance issue
     * @returns {string} The fixed code
     * @private
     */
    _generateFixedCode(issue) {
        let fixedCode = '';
        
        switch (issue.type) {
            case 'stringConcatenation':
                // Fix string concatenation in loops
                if (issue.match.includes('+=') && issue.match.includes('for')) {
                    fixedCode = issue.match.replace(
                        /let\s+(\w+)\s*=\s*["'].*;/,
                        'const parts = [];'
                    );
                    
                    // Replace string concatenation with array push
                    fixedCode = fixedCode.replace(
                        /(\w+)\s*\+=\s*(.*);/g,
                        'parts.push($2);'
                    );
                    
                    // Add join at the end
                    fixedCode = fixedCode.replace(
                        /}(?:\s*return\s*(\w+);)?/,
                        '}\nconst $1 = parts.join("");\nreturn $1;'
                    );
                }
                break;
                
            case 'nestedLoops':
                // Replace nested loops with more efficient structure
                if (issue.match.includes('for') && issue.match.includes('for')) {
                    // Use a Map or Set to avoid nested loops
                    fixedCode = issue.match.replace(
                        /for\s*\((.*?)\)\s*{\s*for\s*\((.*?)\)\s*{/g,
                        'const seen = new Set();\nfor ($1) {\n  // Process in a single loop\n  if (!seen.has(key)) {\n    seen.add(key);'
                    );
                    
                    fixedCode = fixedCode.replace(
                        /}(?:\s*})/,
                        '  }\n}'
                    );
                }
                break;
                
            case 'domOperations':
                // Fix DOM operations in loops
                if (issue.match.includes('document') && issue.match.includes('appendChild') && issue.match.includes('for')) {
                    fixedCode = issue.match.replace(
                        /for\s*\((.*?)\)\s*{/,
                        'const fragment = document.createDocumentFragment();\nfor ($1) {'
                    );
                    
                    fixedCode = fixedCode.replace(
                        /document\.body\.appendChild\((.*)\);/g,
                        'fragment.appendChild($1);'
                    );
                    
                    fixedCode = fixedCode.replace(
                        /}(?:\s*})?/,
                        '}\ndocument.body.appendChild(fragment);'
                    );
                }
                break;
                
            case 'asyncAwait':
                // Fix sequential awaits in loops
                if (issue.match.includes('for') && issue.match.includes('await')) {
                    fixedCode = `// Create an array of promises first
const promises = items.map(async (item) => {
    // Your async operation here
    return await someAsyncOperation(item);
});

// Then await all promises at once
const results = await Promise.all(promises);`;
                }
                break;
                
            default:
                // Simple direct replacement if we have a suggestion code
                if (issue.fixedCode) {
                    fixedCode = issue.fixedCode;
                } else {
                    return null;
                }
        }
        
        return fixedCode || null;
    }
    
    /**
     * Apply the fix to the editor
     * @param {vscode.TextEditor} editor - The current editor
     * @param {object} issue - The performance issue
     * @param {string} fixedCode - The fixed code
     * @private
     */
    _applyFix(editor, issue, fixedCode) {
        const document = editor.document;
        const text = document.getText();
        
        // Find the position of the issue in the document
        const issueStart = text.indexOf(issue.match);
        if (issueStart === -1) {
            vscode.window.showErrorMessage('Could not locate the issue in the document.');
            return;
        }
        
        const startPos = document.positionAt(issueStart);
        const endPos = document.positionAt(issueStart + issue.match.length);
        const range = new vscode.Range(startPos, endPos);
        
        // Apply the edit
        editor.edit(editBuilder => {
            editBuilder.replace(range, fixedCode);
        }).then(success => {
            if (success) {
                // Add a decoration to highlight the changed code
                const fixedStartPos = document.positionAt(issueStart);
                const fixedEndPos = document.positionAt(issueStart + fixedCode.length);
                const fixedRange = new vscode.Range(fixedStartPos, fixedEndPos);
                
                // Create decorations with a green background
                const highlightDecoration = vscode.window.createTextEditorDecorationType({
                    backgroundColor: 'rgba(0, 255, 0, 0.2)',
                    border: '1px solid rgba(0, 200, 0, 0.8)',
                    borderRadius: '3px',
                    after: {
                        contentText: ' 🐱 Fixed',
                        color: 'green',
                        margin: '0 0 0 20px'
                    }
                });
                
                // Apply decoration
                editor.setDecorations(highlightDecoration, [fixedRange]);
                
                // Show more prominent success message
                vscode.window.showInformationMessage(
                    '🐱 Code fix applied successfully! The fixed area is highlighted in green.',
                    'Jump to Fix'
                ).then(selection => {
                    if (selection === 'Jump to Fix') {
                        editor.revealRange(fixedRange, vscode.TextEditorRevealType.InCenter);
                        editor.selection = new vscode.Selection(fixedStartPos, fixedEndPos);
                    }
                });
                
                // Remove decoration after 8 seconds
                setTimeout(() => {
                    highlightDecoration.dispose();
                }, 8000);
            } else {
                vscode.window.showErrorMessage('Failed to apply the fix.');
            }
        });
    }
    
    /**
     * Escape HTML special characters
     * @param {string} html - The HTML string to escape
     * @returns {string} The escaped HTML
     * @private
     */
    _escapeHtml(html) {
        return html
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    /**
     * Highlight changes between original and fixed code
     * @param {string} original - The original code (HTML escaped)
     * @param {string} fixed - The fixed code (HTML escaped)
     * @returns {string} The highlighted HTML
     * @private
     */
    _highlightChanges(original, fixed) {
        // Simple highlighting approach: wrap new/changed lines in a highlight span
        // In a real implementation, you would use a proper diff algorithm
        
        const originalLines = original.split('\n');
        const fixedLines = fixed.split('\n');
        
        const highlightedLines = fixedLines.map((line, index) => {
            // If line doesn't exist in original or is different, highlight it
            if (index >= originalLines.length || line !== originalLines[index]) {
                return `<span class="highlight">${line}</span>`;
            }
            return line;
        });
        
        return highlightedLines.join('\n');
    }
    
    /**
     * Show async fix options
     * @param {object} issue - The performance issue
     * @param {vscode.TextEditor} editor - Current editor
     */
    showAsyncFixOptions(issue, editor) {
        const code = issue.match;
        const selection = editor.selection;
        
        // For sequential await in loop issue
        if (issue.description.includes("Sequential await")) {
            const fixedCode = `// Create an array of promises first
const promises = items.map(async (item) => {
    // Your async operation here
    return await someAsyncOperation(item);
});

// Then await all promises at once
const results = await Promise.all(promises);`;
            
            vscode.window.showInformationMessage(
                "Sequential awaits in loops can be slow. Consider using Promise.all.",
                "Show Fix"
            ).then(selected => {
                if (selected === "Show Fix") {
                    const panel = vscode.window.createWebviewPanel(
                        'asyncFix',
                        'WhiskerCode: Async Pattern Fix',
                        vscode.ViewColumn.Two,
                        {
                            enableScripts: true
                        }
                    );
                    
                    const content = `
                        <h2>Async Pattern Fix</h2>
                        <h3>Issue: ${issue.description}</h3>
                        <p><strong>Current Code:</strong></p>
                        <pre><code>${issue.match}</code></pre>
                        <p><strong>Suggested Fix:</strong></p>
                        <pre><code>${fixedCode}</code></pre>
                        <p>${issue.suggestion}</p>
                    `;
                    
                    panel.webview.html = this._getWebviewContent('Async Pattern Fix', content);
                }
            });
        }
    }
    
    /**
     * Show refactoring panel with options
     * @param {object} opportunity - The refactoring opportunity
     * @param {vscode.TextEditor} editor - Current editor
     */
    showRefactoringPanel(opportunity, editor) {
        const panel = vscode.window.createWebviewPanel(
            'refactoring',
            'WhiskerCode: Refactoring Suggestion',
            vscode.ViewColumn.Two,
            {
                enableScripts: true
            }
        );
        
        const content = `
            <h2>Refactoring Suggestion</h2>
            <h3>Issue: ${opportunity.description}</h3>
            <p><strong>Suggestion:</strong> ${opportunity.suggestion}</p>
            ${opportunity.pattern ? `<p><strong>Pattern:</strong> <pre><code>${opportunity.pattern}</code></pre></p>` : ''}
        `;
        
        panel.webview.html = this._getWebviewContent('Refactoring Suggestion', content);
    }
    
    /**
     * Get score CSS class based on value
     * @private
     */
    _getScoreClass(score) {
        if (score >= 80) return 'score-excellent';
        if (score >= 60) return 'score-good';
        if (score >= 40) return 'score-medium';
        return 'score-poor';
    }
    
    /**
     * Generate HTML content for webview panels
     * @param {string} title - The title of the panel
     * @param {string} content - The main content of the panel
     * @param {boolean} includeStylesheet - Whether to include stylesheet for specific views
     * @returns {string} Formatted HTML for the webview
     * @private
     */
    _getWebviewContent(title, content, includeStylesheet = false) {
        const catTheme = this.catThemeManager ? this.catThemeManager.getCurrentTheme() : 'tabby';
        const themeCss = this._getThemeCss(catTheme);
        
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                        padding: 20px;
                        color: var(--vscode-editor-foreground);
                        background-color: var(--vscode-editor-background);
                    }
                    h1, h2, h3, h4 {
                        color: var(--vscode-titleBar-activeBackground);
                        margin-top: 20px;
                        margin-bottom: 10px;
                    }
                    .container {
                        max-width: 100%;
                        margin: 0 auto;
                    }
                    pre {
                        padding: 12px;
                        border-radius: 4px;
                        background-color: var(--vscode-textCodeBlock-background);
                        overflow-x: auto;
                    }
                    code {
                        font-family: 'Fira Code', Consolas, 'Courier New', monospace;
                        font-size: 14px;
                    }
                    .severity-badge {
                        display: inline-block;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-weight: bold;
                        margin-right: 8px;
                    }
                    .critical {
                        background-color: #ff5252;
                        color: white;
                    }
                    .high {
                        background-color: #ff9800;
                        color: white;
                    }
                    .medium {
                        background-color: #ffcd38;
                        color: black;
                    }
                    .low {
                        background-color: #8bc34a;
                        color: black;
                    }
                    .positive {
                        background-color: #4caf50;
                        color: white;
                    }
                    .issue-card, .metric-card, .practice-card, .optimization-card {
                        border: 1px solid var(--vscode-editorWidget-border);
                        border-radius: 4px;
                        margin-bottom: 16px;
                        padding: 12px;
                        background-color: var(--vscode-editorWidget-background);
                    }
                    .issue-header, .performance-header {
                        display: flex;
                        align-items: center;
                        margin-bottom: 8px;
                    }
                    .issue-header h4 {
                        margin: 0;
                    }
                    .metrics-container {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                        gap: 16px;
                    }
                    .metric-value {
                        font-size: 24px;
                        font-weight: bold;
                        margin: 8px 0;
                    }
                    .score-badge {
                        display: inline-block;
                        padding: 8px 16px;
                        border-radius: 50px;
                        font-weight: bold;
                        font-size: 18px;
                        margin-left: auto;
                    }
                    .score-excellent {
                        background-color: #4caf50;
                        color: white;
                    }
                    .score-good {
                        background-color: #8bc34a;
                        color: black;
                    }
                    .score-medium {
                        background-color: #ffcd38;
                        color: black;
                    }
                    .score-poor {
                        background-color: #ff9800;
                        color: white;
                    }
                    ${themeCss}
                    ${includeStylesheet ? this._getAdditionalStyles() : ''}
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>${title}</h1>
                    ${content}
                </div>
            </body>
            </html>
        `;
    }
    
    /**
     * Get CSS based on selected cat theme
     * @param {string} theme - The theme name
     * @returns {string} CSS for theme
     * @private
     */
    _getThemeCss(theme) {
        const themeColors = {
            tabby: {
                primary: '#B87333',
                secondary: '#DEB887',
                accent: '#8B4513'
            },
            siamese: {
                primary: '#483C32',
                secondary: '#E8DAAF',
                accent: '#736357'
            },
            calico: {
                primary: '#FF7F50',
                secondary: '#FFF8DC',
                accent: '#DAA520'
            },
            black: {
                primary: '#2F4F4F',
                secondary: '#708090',
                accent: '#4682B4'
            }
        };
        
        const colors = themeColors[theme] || themeColors.tabby;
        
        return `
            :root {
                --cat-primary: ${colors.primary};
                --cat-secondary: ${colors.secondary};
                --cat-accent: ${colors.accent};
            }
            h1, h2, h3 {
                color: var(--cat-primary);
                border-bottom: 1px solid var(--cat-secondary);
                padding-bottom: 8px;
            }
            a {
                color: var(--cat-accent);
            }
            button {
                background-color: var(--cat-accent);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
            }
            button:hover {
                background-color: var(--cat-primary);
            }
        `;
    }
    
    /**
     * Get additional styles for specific views
     * @returns {string} Additional CSS
     * @private
     */
    _getAdditionalStyles() {
        return `
            .performance-container {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            .issues-container, .practices-container, .optimizations-container {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .issue-details {
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px dashed var(--vscode-editorWidget-border);
            }
        `;
    }
    
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
            <title>WhiskerCode Performance Analysis</title>
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
                    --heading-color: #FFFFFF;
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
                    color: var(--heading-color);
                    text-shadow: 0px 1px 2px rgba(0, 0, 0, 0.5);
                    font-weight: bold;
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
                
                .summary-box h3 {
                    margin-top: 0;
                    font-size: 18px;
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
                    position: relative;
                }
                
                .issue-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
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
                    font-weight: bold;
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
                
                .fix-button {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background-color: var(--primary-color);
                    color: var(--primary-text);
                    border: none;
                    border-radius: 4px;
                    padding: 6px 12px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                
                .fix-button:hover {
                    opacity: 0.9;
                    transform: scale(1.05);
                }
                
                .fix-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .fix-icon {
                    font-size: 16px;
                }
                
                .issue-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding-right: 100px; /* Make room for the fix button */
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
                
                .hidden {
                    display: none;
                }
                
                .success-message {
                    background-color: rgba(76, 175, 80, 0.2);
                    border-left: 4px solid #4CAF50;
                    padding: 10px;
                    margin: 10px 0;
                    border-radius: 4px;
                    font-weight: bold;
                    display: none;
                    animation: flash-success 1.5s ease;
                }
                
                @keyframes flash-success {
                    0%, 100% { background-color: rgba(76, 175, 80, 0.2); }
                    50% { background-color: rgba(76, 175, 80, 0.6); }
                }
                
                .error-message {
                    background-color: rgba(244, 67, 54, 0.2);
                    border-left: 4px solid #F44336;
                    padding: 10px;
                    margin: 10px 0;
                    border-radius: 4px;
                    font-weight: bold;
                    display: none;
                }
                
                .fixing-spinner {
                    display: inline-block;
                    width: 14px;
                    height: 14px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-radius: 50%;
                    border-top-color: white;
                    animation: spin 1s ease-in-out infinite;
                    margin-right: 5px;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                /* New styles for better fix visibility */
                .issue-card.fixed {
                    border-left-color: #4CAF50 !important;
                    background-color: rgba(76, 175, 80, 0.1);
                    position: relative;
                    overflow: hidden;
                }
                
                .issue-card.fixed::after {
                    content: "🐱 FIXED";
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background-color: #4CAF50;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                
                .fix-success-indicator {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background-color: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                    z-index: 1000;
                    display: none;
                    animation: pop-in 0.5s ease-out forwards;
                }
                
                @keyframes pop-in {
                    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
                
                @keyframes pop-out {
                    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
                }
                
                .fix-success-indicator.hide {
                    animation: pop-out 0.5s ease-in forwards;
                }
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
            
            <div id="feedback-container">
                <div id="success-message" class="success-message">
                    <span class="fix-icon">✓</span> Fix applied successfully!
                </div>
                <div id="error-message" class="error-message">
                    <span class="fix-icon">⚠️</span> <span id="error-text">Failed to apply fix.</span>
                </div>
            </div>
            
            <!-- Add the center screen success indicator -->
            <div id="fix-success-indicator" class="fix-success-indicator">
                <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
                <div style="font-size: 20px; margin-bottom: 5px;">Fix Applied Successfully!</div>
                <div style="font-size: 14px; opacity: 0.8;">The code has been updated</div>
            </div>
            
            <div class="section-tabs">
                <button class="tab active" data-tab="all">All Issues (${issues.length})</button>
                <button class="tab" data-tab="high">High Severity (${highSeverity.length})</button>
                <button class="tab" data-tab="medium">Medium Severity (${mediumSeverity.length})</button>
                <button class="tab" data-tab="low">Low Severity (${lowSeverity.length})</button>
            </div>
            
            <div id="all" class="tab-content active">
                ${this._generateIssueCardsWithFixButtons(issues)}
            </div>
            
            <div id="high" class="tab-content">
                ${this._generateIssueCardsWithFixButtons(highSeverity)}
            </div>
            
            <div id="medium" class="tab-content">
                ${this._generateIssueCardsWithFixButtons(mediumSeverity)}
            </div>
            
            <div id="low" class="tab-content">
                ${this._generateIssueCardsWithFixButtons(lowSeverity)}
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
                        card.addEventListener('click', (event) => {
                            // Do not handle clicks on the fix button
                            if (event.target.closest('.fix-button')) {
                                return;
                            }
                            
                            const lineNumber = card.getAttribute('data-line');
                            if (lineNumber) {
                                vscode.postMessage({
                                    command: 'showIssueLocation',
                                    lineNumber: parseInt(lineNumber)
                                });
                            }
                        });
                    });
                    
                    // Add click handlers to fix buttons
                    document.querySelectorAll('.fix-button').forEach(button => {
                        button.addEventListener('click', (event) => {
                            event.stopPropagation();
                            
                            const issueId = button.getAttribute('data-issue');
                            const issueCard = document.querySelector(\`.issue-card[data-issue="\${issueId}"]\`);
                            
                            // Show fixing state
                            button.innerHTML = '<span class="fixing-spinner"></span> Fixing...';
                            button.disabled = true;
                            
                            // Hide any previous messages
                            document.getElementById('success-message').style.display = 'none';
                            document.getElementById('error-message').style.display = 'none';
                            
                            vscode.postMessage({
                                command: 'fixIssue',
                                issueId: issueId
                            });
                        });
                    });
                    
                    // Handle messages from extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        
                        if (message.command === 'fixResult') {
                            const { issueId, success, error } = message;
                            const button = document.querySelector(\`.fix-button[data-issue="\${issueId}"]\`);
                            const issueCard = document.querySelector(\`.issue-card[data-issue="\${issueId}"]\`);
                            
                            if (success) {
                                // Show large center success indicator
                                const successIndicator = document.getElementById('fix-success-indicator');
                                successIndicator.style.display = 'block';
                                
                                // Remove it after 2 seconds
                                setTimeout(() => {
                                    successIndicator.classList.add('hide');
                                    setTimeout(() => {
                                        successIndicator.style.display = 'none';
                                        successIndicator.classList.remove('hide');
                                    }, 500);
                                }, 2000);
                                
                                // Show success message
                                const successMessage = document.getElementById('success-message');
                                successMessage.style.display = 'block';
                                
                                // Reset button state
                                button.innerHTML = '✓ Fixed';
                                button.disabled = true;
                                button.style.backgroundColor = '#4CAF50';
                                
                                // Scroll to message
                                successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                
                                // Hide success message after 3 seconds
                                setTimeout(() => {
                                    successMessage.style.display = 'none';
                                }, 3000);
                                
                                // Mark the card as fixed with visual style
                                issueCard.classList.add('fixed');
                                
                                // Add a spotlight effect around the fixed card
                                issueCard.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.8)';
                                setTimeout(() => {
                                    issueCard.style.boxShadow = '';
                                }, 3000);
                            } else {
                                // Show error message
                                const errorMessage = document.getElementById('error-message');
                                const errorText = document.getElementById('error-text');
                                errorText.textContent = error || 'Failed to apply fix.';
                                errorMessage.style.display = 'block';
                                
                                // Reset button state
                                button.innerHTML = '🐱 Fix Issue';
                                button.disabled = false;
                                
                                // Scroll to message
                                errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                
                                // Hide error message after 5 seconds
                                setTimeout(() => {
                                    errorMessage.style.display = 'none';
                                }, 5000);
                            }
                        }
                    });
                })();
            </script>
        </body>
        </html>
        `;
    }
    
    /**
     * Generate issue cards HTML with fix buttons
     * @param {object[]} issues - Array of performance issues
     * @returns {string} HTML content
     */
    _generateIssueCardsWithFixButtons(issues) {
        if (issues.length === 0) {
            return `<p>No issues found in this category.</p>`;
        }
        
        let html = '';
        
        issues.forEach((issue, index) => {
            const hasFixAvailable = this._hasFixAvailable(issue);
            
            html += `
                <div class="issue-card ${issue.severity}" data-line="${issue.lineNumber || ''}" data-issue="${issue.id || index}">
                    <div class="issue-header">
                        <div>
                            <span class="severity-badge ${issue.severity}">${issue.severity}</span>
                            <h4 class="issue-title">${issue.description}</h4>
                        </div>
                    </div>
                    <div class="issue-details">
                        <pre class="code-context"><code>${issue.context || issue.match || ''}</code></pre>
                        <p class="suggestion">${issue.suggestion}</p>
                        ${issue.lineNumber ? `<p>Line: ${issue.lineNumber}</p>` : ''}
                    </div>
                    <button class="fix-button" data-issue="${issue.id || index}" ${!hasFixAvailable ? 'disabled' : ''}>
                        <span class="fix-icon">🐱</span> Fix Issue
                    </button>
                </div>
            `;
        });
        
        return html;
    }
    
    /**
     * Check if a fix is available for the issue
     * @param {object} issue - The performance issue
     * @returns {boolean} Whether a fix is available
     */
    _hasFixAvailable(issue) {
        // If there's a fixedCode property, a fix is available
        if (issue.fixedCode) return true;
        
        // Check if we can generate a fix based on issue type
        const issueTypes = ['stringConcatenation', 'nestedLoops', 'domOperations', 'asyncAwait'];
        
        if (!issue.type) return false;
        
        if (issueTypes.includes(issue.type)) {
            // Specific checks for certain issue types
            if (issue.type === 'stringConcatenation' && issue.match && 
                issue.match.includes('+=') && issue.match.includes('for')) {
                return true;
            }
            
            if (issue.type === 'nestedLoops' && issue.match && 
                issue.match.includes('for') && issue.match.match(/for\s*\(.*\)\s*{\s*for/)) {
                return true;
            }
            
            if (issue.type === 'domOperations' && issue.match && 
                issue.match.includes('document') && issue.match.includes('appendChild') && 
                issue.match.includes('for')) {
                return true;
            }
            
            if (issue.type === 'asyncAwait' && issue.match && 
                issue.match.includes('for') && issue.match.includes('await')) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Calculate performance score based on issues
     * @param {Array} issues - Performance issues
     * @returns {number} - Performance score (0-100)
     * @private
     */
    _calculatePerformanceScore(issues) {
        if (!issues || issues.length === 0) {
            return 100;
        }
        
        // Count issues by severity
        const highCount = issues.filter(i => i.severity === 'high').length;
        const mediumCount = issues.filter(i => i.severity === 'medium').length;
        const lowCount = issues.filter(i => i.severity === 'low').length;
        
        // Calculate weighted score
        // High issues reduce score by 15 points each
        // Medium issues reduce score by 8 points each
        // Low issues reduce score by 3 points each
        const deduction = (highCount * 15) + (mediumCount * 8) + (lowCount * 3);
        
        // Ensure score doesn't go below 0
        const score = Math.max(0, 100 - deduction);
        
        // Return rounded score
        return Math.round(score);
    }

    /**
     * Show welcome wizard for first-time users
     * @param {vscode.ExtensionContext} context - Extension context
     */
    showWelcomeWizard(context) {
        // Check if this is first run
        const hasShownWelcome = context.globalState.get('whiskercode.hasShownWelcome');
        if (hasShownWelcome) {
            return;
        }

        // Create welcome panel
        const panel = vscode.window.createWebviewPanel(
            'whiskercodeWelcome',
            '😺 Welcome to WhiskerCode',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // Set HTML content
        panel.webview.html = this._generateWelcomeHTML();

        // Handle wizard navigation and feature demos
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'showFeature':
                    // Close welcome panel
                    panel.dispose();
                    
                    // Open demo for selected feature
                    if (message.feature === 'dependency') {
                        vscode.commands.executeCommand('whiskercode.visualizeDependencies');
                    } else if (message.feature === 'performance') {
                        vscode.commands.executeCommand('whiskercode.detectPerformance');
                    } else if (message.feature === 'complexity') {
                        vscode.commands.executeCommand('whiskercode.analyzeComplexity');
                    }
                    break;
                
                case 'closeWizard':
                    // Remember that we've shown the wizard
                    context.globalState.update('whiskercode.hasShownWelcome', true);
                    panel.dispose();
                    break;
            }
        });

        // Update state when panel is closed
        panel.onDidDispose(() => {
            context.globalState.update('whiskercode.hasShownWelcome', true);
        });
    }

    /**
     * Generate HTML for welcome wizard
     * @private
     */
    _generateWelcomeHTML() {
        return /*html*/`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to WhiskerCode</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe WPC', 'Segoe UI', system-ui, 'Ubuntu', 'Droid Sans', sans-serif;
                        padding: 0;
                        margin: 0;
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .logo {
                        font-size: 72px;
                        margin-bottom: 10px;
                        animation: bounce 2s infinite;
                    }
                    @keyframes bounce {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-20px); }
                    }
                    h1 {
                        font-size: 2.5em;
                        margin: 0;
                        color: var(--vscode-terminal-ansiMagenta);
                    }
                    .subtitle {
                        font-size: 1.2em;
                        color: var(--vscode-descriptionForeground);
                        margin-bottom: 30px;
                    }
                    .features {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
                        gap: 25px;
                        margin-bottom: 40px;
                    }
                    .feature-card {
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 10px;
                        padding: 20px;
                        transition: transform 0.3s, box-shadow 0.3s;
                        cursor: pointer;
                        position: relative;
                        overflow: hidden;
                    }
                    .feature-card:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                    }
                    .feature-card:hover .feature-icon {
                        transform: scale(1.2);
                    }
                    .feature-card:hover::after {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
                        z-index: 1;
                    }
                    .feature-icon {
                        font-size: 2.5em;
                        margin-bottom: 15px;
                        transition: transform 0.3s;
                    }
                    .feature-title {
                        font-size: 1.2em;
                        font-weight: bold;
                        margin-bottom: 10px;
                        color: var(--vscode-terminal-ansiCyan);
                    }
                    .feature-desc {
                        color: var(--vscode-foreground);
                        line-height: 1.5;
                    }
                    .nav-buttons {
                        display: flex;
                        justify-content: center;
                        gap: 15px;
                        margin-top: 20px;
                    }
                    button {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                        transition: background-color 0.2s;
                    }
                    button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .secondary {
                        background-color: transparent;
                        border: 1px solid var(--vscode-button-background);
                    }
                    .paw-print {
                        position: absolute;
                        font-size: 20px;
                        opacity: 0.2;
                        transform: rotate(var(--rotation));
                        z-index: 0;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 40px;
                        color: var(--vscode-descriptionForeground);
                        font-size: 0.9em;
                    }
                    .keyboard-shortcuts {
                        margin-top: 30px;
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 10px;
                        padding: 20px;
                    }
                    .shortcut {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 10px;
                    }
                    .key {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        padding: 5px 10px;
                        border-radius: 4px;
                        font-family: monospace;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">🐱</div>
                        <h1>Welcome to WhiskerCode</h1>
                        <p class="subtitle">Your purr-fect coding companion for understanding and optimizing code!</p>
                    </div>
                    
                    <div class="features">
                        <div class="feature-card" onclick="showFeature('dependency')">
                            <div class="feature-icon">🕸️</div>
                            <div class="feature-title">Function Dependency Graph</div>
                            <p class="feature-desc">Visualize relationships between functions with an interactive, cat-themed graph.</p>
                        </div>
                        
                        <div class="feature-card" onclick="showFeature('performance')">
                            <div class="feature-icon">⚡</div>
                            <div class="feature-title">Performance Analysis</div>
                            <p class="feature-desc">Identify performance hotspots and get one-click fixes.</p>
                        </div>
                        
                        <div class="feature-card" onclick="showFeature('complexity')">
                            <div class="feature-icon">🧩</div>
                            <div class="feature-title">Code Complexity</div>
                            <p class="feature-desc">Analyze code complexity and get suggestions for simplification.</p>
                        </div>
                        
                        <div class="feature-card" onclick="showFeature('explain')">
                            <div class="feature-icon">💡</div>
                            <div class="feature-title">Code Explanations</div>
                            <p class="feature-desc">Get friendly, cat-themed explanations of any code selection.</p>
                        </div>
                    </div>
                    
                    <div class="keyboard-shortcuts">
                        <h2>Keyboard Shortcuts</h2>
                        <div class="shortcut">
                            <span>Explain Selected Code</span>
                            <span class="key">Cmd+Shift+E</span>
                        </div>
                        <div class="shortcut">
                            <span>Trace Variable Usage</span>
                            <span class="key">Cmd+Shift+T</span>
                        </div>
                        <div class="shortcut">
                            <span>Analyze Code Complexity</span>
                            <span class="key">Cmd+Shift+C</span>
                        </div>
                        <div class="shortcut">
                            <span>Detect Performance Hotspots</span>
                            <span class="key">Cmd+Shift+P</span>
                        </div>
                    </div>
                    
                    <div class="nav-buttons">
                        <button onclick="skipWizard()">Skip Tour</button>
                        <button onclick="getStarted()">Get Started</button>
                    </div>
                    
                    <div class="footer">
                        <p>WhiskerCode v1.3.0 • <a href="https://github.com/SwiftAkira/WhiskerCode" target="_blank">GitHub</a></p>
                    </div>
                </div>
                
                <!-- Add some decorative paw prints -->
                <div class="paw-print" style="top: 10%; left: 5%; --rotation: 45deg;">🐾</div>
                <div class="paw-print" style="top: 30%; right: 10%; --rotation: -20deg;">🐾</div>
                <div class="paw-print" style="bottom: 20%; left: 15%; --rotation: 15deg;">🐾</div>
                <div class="paw-print" style="bottom: 30%; right: 20%; --rotation: -45deg;">🐾</div>
                
                <script>
                    function showFeature(feature) {
                        vscode.postMessage({
                            command: 'showFeature',
                            feature: feature
                        });
                    }
                    
                    function skipWizard() {
                        vscode.postMessage({
                            command: 'closeWizard'
                        });
                    }
                    
                    function getStarted() {
                        vscode.postMessage({
                            command: 'closeWizard'
                        });
                    }
                    
                    // Animation: Add random paw prints over time
                    setInterval(() => {
                        const paw = document.createElement('div');
                        paw.className = 'paw-print';
                        paw.textContent = '🐾';
                        paw.style.top = Math.random() * 100 + '%';
                        paw.style.left = Math.random() * 100 + '%';
                        paw.style.setProperty('--rotation', (Math.random() * 90 - 45) + 'deg');
                        document.body.appendChild(paw);
                        
                        // Remove after animation
                        setTimeout(() => {
                            paw.remove();
                        }, 5000);
                    }, 3000);
                    
                    // Access the VS Code API
                    const vscode = acquireVsCodeApi();
                </script>
            </body>
            </html>
        `;
    }

    /**
     * Initialize status bar with quick access menu
     */
    initializeStatusBar() {
        // Create status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        
        this.statusBarItem.text = '$(cat) WhiskerCode';
        this.statusBarItem.tooltip = 'Click for WhiskerCode quick actions';
        this.statusBarItem.command = 'whiskercode.showQuickActions';
        this.statusBarItem.show();
        
        // Register command for quick actions menu
        return vscode.commands.registerCommand('whiskercode.showQuickActions', () => {
            // Show quick actions as a dropdown menu
            const actions = [
                {
                    label: '$(light-bulb) Explain Selected Code',
                    description: 'Get a cat-friendly explanation',
                    command: 'whiskercode.explainCode'
                },
                {
                    label: '$(graph) Visualize Dependencies',
                    description: 'See function relationships',
                    command: 'whiskercode.visualizeDependencies'
                },
                {
                    label: '$(flame) Performance Analysis',
                    description: 'Find and fix bottlenecks',
                    command: 'whiskercode.detectPerformance'
                },
                {
                    label: '$(circuit-board) Analyze Complexity',
                    description: 'Check code complexity',
                    command: 'whiskercode.analyzeComplexity'
                },
                {
                    label: '$(paintcan) Change Theme',
                    description: 'Switch cat theme',
                    command: 'whiskercode.changeCatTheme'
                },
                {
                    label: '$(book) Welcome Guide',
                    description: 'Show the welcome guide',
                    command: 'whiskercode.showWelcome'
                }
            ];
            
            vscode.window.showQuickPick(actions, {
                placeHolder: 'Choose a WhiskerCode action...'
            }).then(selection => {
                if (selection) {
                    vscode.commands.executeCommand(selection.command);
                }
            });
        });
    }
}

module.exports = {
    UILayer
}; 