const vscode = require('vscode');
const parserModule = require('./src/parserModule');
const explanationEngine = require('./src/explanationEngine');
const uiLayer = require('./src/uiLayer');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('CodeWhiskers is now active!');

    // Initialize components
    const parser = new parserModule.Parser();
    const explainer = new explanationEngine.ExplanationEngine();
    const ui = new uiLayer.UILayer(context);

    // Register commands
    const explainCodeCommand = vscode.commands.registerCommand('codewhiskers.explainCode', function () {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            const text = editor.document.getText(selection);
            
            if (text.length === 0) {
                vscode.window.showInformationMessage('Please select some code to explain');
                return;
            }
            
            console.log('Selected code for explanation:', text);
            
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

    // Register text editor change handler for real-time analysis
    const changeHandler = vscode.window.onDidChangeTextEditorSelection((event) => {
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
        
        try {
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
    context.subscriptions.push(changeHandler);
}

function deactivate() {
    // Clean up
}

module.exports = {
    activate,
    deactivate
}; 