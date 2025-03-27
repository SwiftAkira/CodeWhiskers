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
     * Show an explanation of code in a menu-style QuickPick
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
        
        // Create menu-style explanation using QuickPick
        const quickPick = vscode.window.createQuickPick();
        quickPick.title = `CodeWhiskers: ${explanation.complexity.toUpperCase()} Complexity`;
        
        // Convert explanation to items
        const explanationLines = explanationText.split('\n').filter(line => line.trim() !== '');
        
        // Create items for QuickPick
        const items = [
            {
                label: '$(cat) CodeWhiskers Explanation',
                kind: vscode.QuickPickItemKind.Separator
            },
            {
                label: explanationLines[0],
                detail: 'Main explanation'
            }
        ];
        
        // Add additional items for detailed explanations
        if (explanationLines.length > 1) {
            for (let i = 1; i < explanationLines.length; i++) {
                items.push({
                    label: explanationLines[i],
                    detail: `Detail ${i}`
                });
            }
        }
        
        // Add action buttons
        if (explanation.technical) {
            items.push({
                label: '$(code) View Technical Details',
                detail: 'Show full technical breakdown',
                action: 'technical'
            });
        }
        
        items.push({
            label: '$(pencil) Add Documentation',
            detail: 'Generate documentation for this code',
            action: 'document'
        });
        
        quickPick.items = items;
        quickPick.canSelectMany = false;
        
        // Handle selection
        quickPick.onDidAccept(() => {
            const selected = quickPick.selectedItems[0];
            if (selected && selected.action) {
                if (selected.action === 'technical') {
                    this._showTechnicalExplanation(explanation.technical, editor);
                } else if (selected.action === 'document') {
                    this._suggestInlineDocumentation(editor);
                }
            }
            quickPick.hide();
        });
        
        quickPick.show();
    }
    
    /**
     * Show a technical explanation in a separate QuickPick
     * @private
     */
    _showTechnicalExplanation(technicalExplanation, editor) {
        const quickPick = vscode.window.createQuickPick();
        quickPick.title = 'CodeWhiskers: Technical Details';
        
        const lines = technicalExplanation.split('\n').filter(line => line.trim() !== '');
        
        const items = lines.map(line => {
            // Format markdown headings
            if (line.startsWith('##')) {
                return {
                    label: `$(star-full) ${line.replace(/^##\s+/, '')}`,
                    kind: vscode.QuickPickItemKind.Separator
                };
            } else if (line.startsWith('#')) {
                return {
                    label: `$(star) ${line.replace(/^#\s+/, '')}`,
                    kind: vscode.QuickPickItemKind.Separator
                };
            } else if (line.startsWith('-')) {
                return {
                    label: `$(circle-small) ${line.replace(/^-\s+/, '')}`,
                    detail: 'Detail'
                };
            } else {
                return {
                    label: line,
                    detail: 'Information'
                };
            }
        });
        
        quickPick.items = items;
        quickPick.show();
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
        
        // Show the documentation template
        const quickPick = vscode.window.createQuickPick();
        quickPick.title = 'CodeWhiskers: Suggested Documentation';
        quickPick.placeholder = 'Choose an action';
        
        quickPick.items = [
            {
                label: '$(code) Documentation Template',
                detail: docTemplate,
                kind: vscode.QuickPickItemKind.Separator
            },
            {
                label: '$(add) Insert Documentation',
                detail: 'Add this documentation above the selected code',
                action: 'insert'
            },
            {
                label: '$(clipboard) Copy to Clipboard',
                detail: 'Copy documentation to clipboard',
                action: 'copy'
            }
        ];
        
        quickPick.onDidAccept(() => {
            const selected = quickPick.selectedItems[0];
            if (selected && selected.action) {
                if (selected.action === 'insert') {
                    const position = new vscode.Position(selection.start.line, 0);
                    editor.edit(editBuilder => {
                        editBuilder.insert(position, docTemplate);
                    });
                    vscode.window.showInformationMessage('Documentation added! 😺');
                } else if (selected.action === 'copy') {
                    vscode.env.clipboard.writeText(docTemplate);
                    vscode.window.showInformationMessage('Documentation copied to clipboard 📋');
                }
            }
            quickPick.hide();
        });
        
        quickPick.show();
    }
    
    /**
     * Show variable traces using a menu-style QuickPick
     * @param {Array<object>} variableUsages - Array of variable usage objects
     * @param {vscode.TextEditor} editor - The active text editor
     */
    showVariableTraces(variableUsages, editor) {
        if (variableUsages.length === 0) {
            vscode.window.showInformationMessage('No usages found for this variable');
            return;
        }
        
        // Create QuickPick for variable traces
        const quickPick = vscode.window.createQuickPick();
        quickPick.title = `CodeWhiskers: Variable Traces for '${variableUsages[0].name}'`;
        quickPick.placeholder = 'Select a variable usage to view details';
        
        // Create items for each usage with line numbers and context
        const items = variableUsages.map(usage => {
            const linePrefix = usage.line < 10 ? ' ' : '';
            return {
                label: `Line ${linePrefix}${usage.line}: ${usage.type}`,
                description: usage.context.trim(),
                detail: `${usage.description}`,
                usage: usage
            };
        });
        
        quickPick.items = items;
        
        // Handle item selection (jump to location)
        quickPick.onDidAccept(() => {
            const selected = quickPick.selectedItems[0];
            if (selected && selected.usage) {
                // Jump to the location of the variable usage
                const position = new vscode.Position(selected.usage.line - 1, selected.usage.column);
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(
                    new vscode.Range(position, position),
                    vscode.TextEditorRevealType.InCenter
                );
                
                // Apply decoration to highlight the usage
                const range = new vscode.Range(
                    new vscode.Position(selected.usage.line - 1, selected.usage.column),
                    new vscode.Position(selected.usage.line - 1, selected.usage.column + selected.usage.name.length)
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
            quickPick.hide();
        });
        
        quickPick.show();
    }
    
    /**
     * Show documentation suggestions using a menu-style QuickPick
     * @param {Array<object>} undocumentedSections - Array of code sections needing documentation
     * @param {vscode.TextEditor} editor - The active text editor
     */
    showDocumentationSuggestions(undocumentedSections, editor) {
        if (undocumentedSections.length === 0) {
            vscode.window.showInformationMessage('No undocumented code sections found 😺');
            return;
        }
        
        // Create QuickPick for documentation suggestions
        const quickPick = vscode.window.createQuickPick();
        quickPick.title = 'CodeWhiskers: Documentation Suggestions';
        quickPick.placeholder = 'Select a section to add documentation';
        
        // Create items for each undocumented section
        const items = undocumentedSections.map(section => {
            return {
                label: `$(pencil) ${section.type}`,
                description: `Line ${section.start.line + 1}`,
                detail: section.code.substring(0, 80) + (section.code.length > 80 ? '...' : ''),
                section
            };
        });
        
        quickPick.items = items;
        
        // Handle selection
        quickPick.onDidAccept(() => {
            const selected = quickPick.selectedItems[0];
            if (selected && selected.section) {
                this._addDocumentation([selected.section], editor);
            }
            quickPick.hide();
        });
        
        quickPick.show();
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
        
        // Apply decorations for functions based on complexity
        this._applyFunctionDecorations(analyzedFunctions, editor);
        
        // Show function selection QuickPick
        const quickPick = vscode.window.createQuickPick();
        quickPick.title = 'CodeWhiskers: Function Analysis';
        quickPick.placeholder = 'Select a function to see detailed analysis';
        
        const items = analyzedFunctions.map(fn => {
            return {
                label: `$(symbol-method) ${fn.name}`,
                description: fn.params.length > 0 
                    ? `(${fn.params.map(p => p.name).join(', ')})`
                    : '(no parameters)',
                detail: `Complexity: ${fn.analysis.complexity.level.toUpperCase()}`,
                function: fn
            };
        });
        
        quickPick.items = items;
        
        quickPick.onDidAccept(() => {
            const selected = quickPick.selectedItems[0];
            if (selected && selected.function) {
                this._showFunctionDetails(selected.function, editor);
            }
            quickPick.hide();
        });
        
        quickPick.show();
    }
    
    /**
     * Show detailed function analysis
     * @private
     */
    _showFunctionDetails(functionData, editor) {
        const quickPick = vscode.window.createQuickPick();
        quickPick.title = `CodeWhiskers: ${functionData.name} Analysis`;
        
        const items = [
            {
                label: `$(symbol-method) ${functionData.name}`,
                kind: vscode.QuickPickItemKind.Separator
            },
            {
                label: 'Explanation',
                detail: functionData.explanation
            }
        ];
        
        // Add parameters
        if (functionData.params.length > 0) {
            items.push({
                label: 'Parameters',
                kind: vscode.QuickPickItemKind.Separator
            });
            
            functionData.params.forEach(param => {
                items.push({
                    label: `$(symbol-parameter) ${param.name}`,
                    detail: param.defaultValue ? `Default: ${param.defaultValue}` : 'No default value'
                });
            });
        }
        
        // Add return value
        if (functionData.analysis.returnValue.exists) {
            items.push({
                label: 'Return Value',
                kind: vscode.QuickPickItemKind.Separator
            });
            
            items.push({
                label: `$(arrow-right) ${functionData.analysis.returnValue.value}`,
                detail: functionData.analysis.returnValue.isVariable ? 'Variable' : 'Expression'
            });
        }
        
        // Add patterns
        if (functionData.analysis.patterns.length > 0) {
            items.push({
                label: 'Patterns',
                kind: vscode.QuickPickItemKind.Separator
            });
            
            functionData.analysis.patterns.forEach(pattern => {
                items.push({
                    label: `$(lightbulb) ${pattern.name}`,
                    detail: `Type: ${pattern.type}`
                });
            });
        }
        
        // Add side effects
        if (functionData.analysis.sideEffects.length > 0) {
            items.push({
                label: 'Side Effects',
                kind: vscode.QuickPickItemKind.Separator
            });
            
            functionData.analysis.sideEffects.forEach(effect => {
                items.push({
                    label: `$(warning) ${effect.description}`,
                    detail: `Type: ${effect.type}`
                });
            });
        }
        
        // Add actions
        items.push({
            label: 'Actions',
            kind: vscode.QuickPickItemKind.Separator
        });
        
        items.push({
            label: '$(pencil) Generate Documentation',
            detail: 'Create JSDoc documentation for this function',
            action: 'document'
        });
        
        quickPick.items = items;
        
        quickPick.onDidAccept(() => {
            const selected = quickPick.selectedItems[0];
            if (selected && selected.action) {
                if (selected.action === 'document') {
                    this._generateFunctionDocumentation(functionData, editor);
                }
                quickPick.hide();
            }
        });
        
        quickPick.show();
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
        
        // Show QuickPick for documentation options
        const quickPick = vscode.window.createQuickPick();
        quickPick.title = 'Function Documentation';
        quickPick.placeholder = 'Choose an action';
        
        quickPick.items = [
            {
                label: '$(code) Documentation Template',
                detail: docTemplate,
                kind: vscode.QuickPickItemKind.Separator
            },
            {
                label: '$(add) Insert Documentation',
                detail: 'Add this documentation above the function',
                action: 'insert'
            },
            {
                label: '$(clipboard) Copy to Clipboard',
                detail: 'Copy documentation to clipboard',
                action: 'copy'
            }
        ];
        
        quickPick.onDidAccept(() => {
            const selected = quickPick.selectedItems[0];
            if (selected && selected.action) {
                if (selected.action === 'insert') {
                    const position = new vscode.Position(functionData.position.line, 0);
                    editor.edit(editBuilder => {
                        editBuilder.insert(position, docTemplate);
                    });
                    vscode.window.showInformationMessage('Documentation added! 😺');
                } else if (selected.action === 'copy') {
                    vscode.env.clipboard.writeText(docTemplate);
                    vscode.window.showInformationMessage('Documentation copied to clipboard 📋');
                }
            }
            quickPick.hide();
        });
        
        quickPick.show();
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
}

module.exports = {
    UILayer
}; 