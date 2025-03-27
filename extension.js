const vscode = require('vscode');
const Parser = require('./src/parserModule');
const explanationEngine = require('./src/explanationEngine');
const uiLayer = require('./src/uiLayer');
const ComplexityVisualizer = require('./src/complexityVisualizer');
const CatThemeManager = require('./src/catThemeManager');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('CodeWhiskers is now active!');

    try {
        // Initialize components with error handling
        let parser, explainer, ui, complexityVisualizer, catThemeManager;
        
        try {
            parser = new Parser();
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
        
        try {
            complexityVisualizer = new ComplexityVisualizer();
            console.log('ComplexityVisualizer initialized successfully');
        } catch (error) {
            console.error('Error initializing ComplexityVisualizer:', error);
            complexityVisualizer = null;
        }
        
        try {
            catThemeManager = new CatThemeManager(context);
            console.log('CatThemeManager initialized successfully');
        } catch (error) {
            console.error('Error initializing CatThemeManager:', error);
            catThemeManager = null;
        }

        // Register commands with safety checks
        const explainCodeCommand = vscode.commands.registerCommand('codewhiskers.explainCode', async () => {
            if (!parser || !explainer || !ui) {
                vscode.window.showErrorMessage('CodeWhiskers is not fully initialized yet. Please try again in a moment.');
                return;
            }
            
            const loadingMessage = vscode.window.setStatusBarMessage('CodeWhiskers: Analyzing code...');
            
            try {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showWarningMessage('No active editor found. Please open a file.');
                    return;
                }
                
                const selection = editor.selection;
                const text = editor.document.getText(selection);
                
                if (!text) {
                    vscode.window.showWarningMessage('No code selected. Please select some code to explain.');
                    return;
                }
                
                const language = editor.document.languageId;
                
                // Use setTimeout to prevent UI blocking
                setTimeout(async () => {
                    try {
                        const parsedCode = parser.parseCode(text, language);
                        const explanation = await explainer.generateExplanation(parsedCode);
                        ui.showExplanation(explanation, editor);
                    } catch (error) {
                        console.error('Error explaining code:', error);
                        vscode.window.showErrorMessage(`Error explaining code: ${error.message}`);
                    } finally {
                        loadingMessage.dispose();
                    }
                }, 0);
            } catch (error) {
                loadingMessage.dispose();
                console.error('Error in explain command:', error);
                vscode.window.showErrorMessage(`Error: ${error.message}`);
            }
        });

        const traceVariableCommand = vscode.commands.registerCommand('codewhiskers.traceVariable', async () => {
            if (!parser || !ui) {
                vscode.window.showErrorMessage('CodeWhiskers is not fully initialized yet. Please try again in a moment.');
                return;
            }
            
            const loadingMessage = vscode.window.setStatusBarMessage('CodeWhiskers: Tracing variable...');
            
            try {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showWarningMessage('No active editor found. Please open a file.');
                    return;
                }
                
                const selection = editor.selection;
                const text = editor.document.getText(selection);
                
                if (!text) {
                    vscode.window.showWarningMessage('No variable selected. Please select a variable to trace.');
                    return;
                }
                
                const document = editor.document;
                const fileContent = document.getText();
                const language = document.languageId;
                
                const trace = parser.traceVariable(text, fileContent, language);
                ui.showVariableTraces(trace, text);
            } catch (error) {
                console.error('Error tracing variable:', error);
                vscode.window.showErrorMessage(`Error tracing variable: ${error.message}`);
            } finally {
                loadingMessage.dispose();
            }
        });

        const suggestDocumentationCommand = vscode.commands.registerCommand('codewhiskers.suggestDocumentation', async () => {
            if (!parser || !ui) {
                vscode.window.showErrorMessage('CodeWhiskers is not fully initialized yet. Please try again in a moment.');
                return;
            }
            
            const loadingMessage = vscode.window.setStatusBarMessage('CodeWhiskers: Suggesting documentation...');
            
            try {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showWarningMessage('No active editor found. Please open a file.');
                    return;
                }
                
                const document = editor.document;
                const fileContent = document.getText();
                const language = document.languageId;
                
                const undocumented = parser.findUndocumentedCode(fileContent, language);
                ui.showDocumentationSuggestions(undocumented, language);
            } catch (error) {
                console.error('Error suggesting documentation:', error);
                vscode.window.showErrorMessage(`Error suggesting documentation: ${error.message}`);
            } finally {
                loadingMessage.dispose();
            }
        });

        const analyzeFunctionsCommand = vscode.commands.registerCommand('codewhiskers.analyzeFunctions', async () => {
            if (!parser || !explainer || !ui) {
                vscode.window.showErrorMessage('CodeWhiskers is not fully initialized yet. Please try again in a moment.');
                return;
            }
            
            const loadingMessage = vscode.window.setStatusBarMessage('CodeWhiskers: Analyzing functions...');
            
            try {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showWarningMessage('No active editor found. Please open a file.');
                    return;
                }
                
                const document = editor.document;
                const fileContent = document.getText();
                const language = document.languageId;
                
                const functions = parser.findFunctions(fileContent, language);
                const analyzedFunctions = functions.map(fn => explainer.analyzeFunctionBehavior(fn));
                ui.showFunctionAnalysis(analyzedFunctions, language);
            } catch (error) {
                console.error('Error analyzing functions:', error);
                vscode.window.showErrorMessage(`Error analyzing functions: ${error.message}`);
            } finally {
                loadingMessage.dispose();
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

        // Add command for code complexity analysis
        const analyzeComplexityCommand = vscode.commands.registerCommand('codewhiskers.analyzeComplexity', async () => {
            const loadingMessage = vscode.window.setStatusBarMessage('CodeWhiskers: Analyzing code complexity...');
            
            try {
                if (!parser || !complexityVisualizer) {
                    vscode.window.showErrorMessage('CodeWhiskers is not fully initialized yet. Please try again in a moment.');
                    return;
                }
                
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showWarningMessage('No active editor found. Please open a file.');
                    return;
                }
                
                const document = editor.document;
                const fileContent = document.getText();
                const language = document.languageId;
                const fileName = document.fileName.split('/').pop();
                
                // Use setTimeout to prevent UI blocking
                setTimeout(async () => {
                    try {
                        const functionAnalyses = parser.analyzeFunctionComplexity(fileContent, language);
                        
                        if (functionAnalyses.length === 0) {
                            vscode.window.showInformationMessage('No functions found to analyze complexity.');
                            return;
                        }
                        
                        complexityVisualizer.showComplexityAnalysis(functionAnalyses, fileName);
                    } catch (error) {
                        console.error('Error analyzing complexity:', error);
                        vscode.window.showErrorMessage(`Error analyzing complexity: ${error.message}`);
                    } finally {
                        loadingMessage.dispose();
                    }
                }, 0);
            } catch (error) {
                loadingMessage.dispose();
                console.error('Error in complexity analysis command:', error);
                vscode.window.showErrorMessage(`Error: ${error.message}`);
            }
        });

        // Add command for dependency graph visualization
        const visualizeDependenciesCommand = vscode.commands.registerCommand('codewhiskers.visualizeDependencies', async () => {
            const loadingMessage = vscode.window.setStatusBarMessage('CodeWhiskers: Generating dependency graph...');
            
            try {
                if (!parser || !complexityVisualizer) {
                    vscode.window.showErrorMessage('CodeWhiskers is not fully initialized yet. Please try again in a moment.');
                    return;
                }
                
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showWarningMessage('No active editor found. Please open a file.');
                    return;
                }
                
                const document = editor.document;
                const fileContent = document.getText();
                const language = document.languageId;
                const fileName = document.fileName.split('/').pop();
                
                // Use setTimeout to prevent UI blocking
                setTimeout(async () => {
                    try {
                        const dependencyData = parser.analyzeDependencies(fileContent, language);
                        
                        if (dependencyData.nodes.length <= 1) {
                            vscode.window.showInformationMessage('Not enough functions found to create a dependency graph.');
                            return;
                        }
                        
                        complexityVisualizer.showDependencyGraph(dependencyData, fileName);
                    } catch (error) {
                        console.error('Error generating dependency graph:', error);
                        vscode.window.showErrorMessage(`Error generating dependency graph: ${error.message}`);
                    } finally {
                        loadingMessage.dispose();
                    }
                }, 0);
            } catch (error) {
                loadingMessage.dispose();
                console.error('Error in dependency visualization command:', error);
                vscode.window.showErrorMessage(`Error: ${error.message}`);
            }
        });

        // Add command to change cat theme
        let changeCatThemeCommand = vscode.commands.registerCommand('codewhiskers.changeCatTheme', async () => {
            try {
                if (!catThemeManager) {
                    vscode.window.showErrorMessage('CodeWhiskers cat theme manager is not initialized yet. Please try again in a moment.');
                    return;
                }
                
                // Show theme picker
                await catThemeManager.showThemePicker();
                
                // Play a sound when theme changes
                catThemeManager.playSound('meow');
            } catch (error) {
                console.error('Error changing cat theme:', error);
                vscode.window.showErrorMessage(`Error changing cat theme: ${error.message}`);
            }
        });

        // Add to subscriptions
        context.subscriptions.push(explainCodeCommand);
        context.subscriptions.push(traceVariableCommand);
        context.subscriptions.push(suggestDocumentationCommand);
        context.subscriptions.push(analyzeFunctionsCommand);
        context.subscriptions.push(openSettingsCommand);
        context.subscriptions.push(changeHandler);
        context.subscriptions.push(analyzeComplexityCommand);
        context.subscriptions.push(visualizeDependenciesCommand);
        context.subscriptions.push(changeCatThemeCommand);
        
        // Make theme manager available to UI components
        if (ui && catThemeManager) {
            ui.setCatThemeManager(catThemeManager);
        }
        
        if (complexityVisualizer && catThemeManager) {
            complexityVisualizer.setCatThemeManager(catThemeManager);
        }

    } catch (error) {
        console.error('Fatal error during CodeWhiskers activation:', error);
        vscode.window.showErrorMessage(`Fatal error initializing CodeWhiskers: ${error.message}`);
    }
}

function deactivate() {
    console.log('CodeWhiskers is deactivating...');
}

module.exports = {
    activate,
    deactivate
}; 