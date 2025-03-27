const vscode = require('vscode');
const parserModule = require('./src/parserModule');
const explanationEngine = require('./src/explanationEngine');
const uiLayer = require('./src/uiLayer');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('CodeWhiskers is now active!');

    try {
        // Initialize components with error handling
        let parser, explainer, ui;
        
        try {
            parser = new parserModule.Parser();
            console.log('Parser initialized successfully');
        } catch (error) {
            console.error('Error initializing Parser:', error);
            parser = null;
        }
        
        try {
            explainer = new explanationEngine.ExplanationEngine();
            console.log('ExplanationEngine initialized successfully');
        } catch (error) {
            console.error('Error initializing ExplanationEngine:', error);
            explainer = null;
        }
        
        try {
            ui = new uiLayer.UILayer(context);
            console.log('UILayer initialized successfully');
        } catch (error) {
            console.error('Error initializing UILayer:', error);
            ui = null;
        }

        // Register commands with safety checks
        const explainCodeCommand = vscode.commands.registerCommand('codewhiskers.explainCode', function () {
            if (!parser || !explainer || !ui) {
                vscode.window.showErrorMessage('CodeWhiskers is not fully initialized yet. Please try again in a moment.');
                return;
            }
            
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const selection = editor.selection;
                const text = editor.document.getText(selection);
                
                if (text.length === 0) {
                    vscode.window.showInformationMessage('Please select some code to explain');
                    return;
                }
                
                const language = editor.document.languageId;
                try {
                    const parsedCode = parser.parseCode(text, language);
                    const explanation = explainer.generateExplanation(parsedCode);
                    ui.showExplanation(explanation, editor);
                } catch (error) {
                    vscode.window.showErrorMessage(`Error explaining code: ${error.message}`);
                    console.error('Error in explainCode:', error);
                }
            }
        });

        const traceVariableCommand = vscode.commands.registerCommand('codewhiskers.traceVariable', function () {
            if (!parser || !ui) {
                vscode.window.showErrorMessage('CodeWhiskers is not fully initialized yet. Please try again in a moment.');
                return;
            }
            
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const selection = editor.selection;
                const text = editor.document.getText(selection);
                
                if (text.length === 0) {
                    vscode.window.showInformationMessage('Please select a variable to trace');
                    return;
                }
                
                try {
                    const variableUsages = parser.traceVariable(text, editor.document);
                    ui.showVariableTraces(variableUsages, editor);
                } catch (error) {
                    vscode.window.showErrorMessage(`Error tracing variable: ${error.message}`);
                }
            }
        });

        const suggestDocumentationCommand = vscode.commands.registerCommand('codewhiskers.suggestDocumentation', function () {
            if (!parser || !ui) {
                vscode.window.showErrorMessage('CodeWhiskers is not fully initialized yet. Please try again in a moment.');
                return;
            }
            
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                try {
                    const undocumentedSections = parser.findUndocumentedCode(editor.document);
                    ui.showDocumentationSuggestions(undocumentedSections, editor);
                } catch (error) {
                    vscode.window.showErrorMessage(`Error suggesting documentation: ${error.message}`);
                }
            }
        });

        const analyzeFunctionsCommand = vscode.commands.registerCommand('codewhiskers.analyzeFunctions', function () {
            if (!parser || !explainer || !ui) {
                vscode.window.showErrorMessage('CodeWhiskers is not fully initialized yet. Please try again in a moment.');
                return;
            }
            
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                try {
                    const functions = parser.findFunctions(editor.document);
                    const analyzedFunctions = functions.map(fn => explainer.analyzeFunctionBehavior(fn));
                    ui.showFunctionAnalysis(analyzedFunctions, editor);
                } catch (error) {
                    vscode.window.showErrorMessage(`Error analyzing functions: ${error.message}`);
                }
            }
        });

        const openSettingsCommand = vscode.commands.registerCommand('codewhiskers.openSettings', function() {
            if (!ui) {
                vscode.window.showErrorMessage('CodeWhiskers is not fully initialized yet. Please try again in a moment.');
                return;
            }
            
            try {
                ui.showSettingsUI();
            } catch (error) {
                vscode.window.showErrorMessage(`Error opening settings: ${error.message}`);
                console.error('Error in openSettings:', error);
            }
        });

        // Register text editor change handler for real-time analysis with safety checks
        const changeHandler = vscode.window.onDidChangeTextEditorSelection((event) => {
            if (!parser || !ui) {
                return; // Silently skip if not initialized
            }
            
            try {
                // Only execute if the configuration allows real-time analysis
                const config = vscode.workspace.getConfiguration('codewhiskers');
                const animationFrequency = config.get('animationFrequency');
                
                if (animationFrequency === 'low') {
                    return; // Skip real-time analysis for low animation frequency
                }
                
                const editor = event.textEditor;
                const document = editor.document;
                
                // Only analyze JavaScript and TypeScript files
                if (document.languageId !== 'javascript' && document.languageId !== 'typescript') {
                    return;
                }
                
                ui.updateWhiskerVisualization(
                    parser.getCodeStructure(document),
                    editor
                );
            } catch (error) {
                // Silent fail for real-time analysis
                console.error('Error in real-time analysis:', error);
            }
        });

        // Add to subscriptions
        context.subscriptions.push(explainCodeCommand);
        context.subscriptions.push(traceVariableCommand);
        context.subscriptions.push(suggestDocumentationCommand);
        context.subscriptions.push(analyzeFunctionsCommand);
        context.subscriptions.push(openSettingsCommand);
        context.subscriptions.push(changeHandler);
    } catch (error) {
        console.error('Fatal error during CodeWhiskers activation:', error);
        vscode.window.showErrorMessage('CodeWhiskers could not be activated properly. Some features may not work.');
    }
}

function deactivate() {
    console.log('CodeWhiskers is deactivating...');
}

module.exports = {
    activate,
    deactivate
}; 