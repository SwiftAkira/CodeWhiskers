const vscode = require('vscode');
const Parser = require('./src/parserModule');
const explanationEngine = require('./src/explanationEngine');
const uiLayer = require('./src/uiLayer');
const ComplexityVisualizer = require('./src/complexityVisualizer');
const CatThemeManager = require('./src/catThemeManager');
const PerformanceAnalyzer = require('./src/performanceAnalyzer');
const { AdvancedParser } = require('./src/advancedParser');
const { EnhancedPerformanceAnalyzer } = require('./src/enhancedPerformance');
const { WhiskerCodeLensProvider, WhiskerCodeActionProvider } = require('./src/codeLensProvider');
const LearningPathManager = require('./src/learning/LearningPathManager');
const fs = require('fs');
const path = require('path');

// Store global instance for access from other files
let ui = null;
let catThemeManager = null;
let complexityVisualizer = null;
let learningPathManager = null;
let learningPathStatusBarItem = null;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('WhiskerCode is now active!');

    try {
        // Initialize components with error handling
        let parser, explainer, ui, complexityVisualizer, catThemeManager, performanceAnalyzer;
        let advancedParser, enhancedPerformanceAnalyzer;
        let codeLensProvider, codeActionProvider;
        let learningPathManager;
        
        try {
            parser = new Parser();
            console.log('Parser initialized successfully');
        } catch (error) {
            console.error('Error initializing Parser:', error);
            parser = null;
        }
        
        try {
            advancedParser = new AdvancedParser();
            console.log('AdvancedParser initialized successfully');
        } catch (error) {
            console.error('Error initializing AdvancedParser:', error);
            advancedParser = null;
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
        
        try {
            performanceAnalyzer = new PerformanceAnalyzer();
            console.log('PerformanceAnalyzer initialized successfully');
        } catch (error) {
            console.error('Error initializing PerformanceAnalyzer:', error);
            performanceAnalyzer = null;
        }
        
        try {
            enhancedPerformanceAnalyzer = new EnhancedPerformanceAnalyzer();
            console.log('EnhancedPerformanceAnalyzer initialized successfully');
        } catch (error) {
            console.error('Error initializing EnhancedPerformanceAnalyzer:', error);
            enhancedPerformanceAnalyzer = null;
        }
        
        try {
            codeLensProvider = new WhiskerCodeLensProvider();
            console.log('CodeLensProvider initialized successfully');
        } catch (error) {
            console.error('Error initializing CodeLensProvider:', error);
            codeLensProvider = null;
        }
        
        try {
            codeActionProvider = new WhiskerCodeActionProvider();
            console.log('CodeActionProvider initialized successfully');
        } catch (error) {
            console.error('Error initializing CodeActionProvider:', error);
            codeActionProvider = null;
        }
        
        try {
            learningPathManager = new LearningPathManager(context);
            
            // Make sure these methods exist before calling them
            if (typeof learningPathManager.registerCommands === 'function') {
                learningPathManager.registerCommands();
            }
            
            if (typeof learningPathManager.createCatImages === 'function') {
                learningPathManager.createCatImages();
            }
            
            console.log('LearningPathManager initialized successfully');
        } catch (error) {
            console.error('Error initializing LearningPathManager:', error);
            learningPathManager = null;
        }
        
        // Connect components that need references to each other
        if (complexityVisualizer && catThemeManager) {
            complexityVisualizer.setCatThemeManager(catThemeManager);
        }
        
        if (performanceAnalyzer && catThemeManager) {
            performanceAnalyzer.setCatThemeManager(catThemeManager);
        }

        // Show welcome wizard for first-time users
        ui.showWelcomeWizard(context);
        
        // Register a command to manually show the welcome wizard
        const showWelcomeCommand = vscode.commands.registerCommand('whiskercode.showWelcome', () => {
            context.globalState.update('whiskercode.hasShownWelcome', false);
            ui.showWelcomeWizard(context);
        });
        
        // Add status bar with quick actions menu
        const statusBarCommand = ui.initializeStatusBar();

        // Register commands with safety checks
        const explainCodeCommand = vscode.commands.registerCommand('whiskercode.explainCode', async () => {
            if (!parser || !explainer || !ui) {
                vscode.window.showErrorMessage('WhiskerCode is not fully initialized yet. Please try again in a moment.');
                return;
            }
            
            const loadingMessage = vscode.window.setStatusBarMessage('WhiskerCode: Analyzing code...');
            
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

        const traceVariableCommand = vscode.commands.registerCommand('whiskercode.traceVariable', async () => {
            if (!parser || !ui) {
                vscode.window.showErrorMessage('WhiskerCode is not fully initialized yet. Please try again in a moment.');
                return;
            }
            
            const loadingMessage = vscode.window.setStatusBarMessage('WhiskerCode: Tracing variable...');
            
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

        const suggestDocumentationCommand = vscode.commands.registerCommand('whiskercode.suggestDocumentation', async () => {
            if (!parser || !ui) {
                vscode.window.showErrorMessage('WhiskerCode is not fully initialized yet. Please try again in a moment.');
                return;
            }
            
            const loadingMessage = vscode.window.setStatusBarMessage('WhiskerCode: Suggesting documentation...');
            
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

        const analyzeFunctionsCommand = vscode.commands.registerCommand('whiskercode.analyzeFunctions', async () => {
            if (!parser || !explainer || !ui) {
                vscode.window.showErrorMessage('WhiskerCode is not fully initialized yet. Please try again in a moment.');
                return;
            }
            
            const loadingMessage = vscode.window.setStatusBarMessage('WhiskerCode: Analyzing functions...');
            
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

        const openSettingsCommand = vscode.commands.registerCommand('whiskercode.openSettings', function() {
            if (!ui) {
                vscode.window.showErrorMessage('WhiskerCode is not fully initialized yet. Please try again in a moment.');
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
                const config = vscode.workspace.getConfiguration('whiskercode');
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
        const analyzeComplexityCommand = vscode.commands.registerCommand('whiskercode.analyzeComplexity', async () => {
            if (!parser || !complexityVisualizer || !ui || !advancedParser) {
                vscode.window.showErrorMessage('WhiskerCode is not fully initialized yet. Please try again in a moment.');
                return;
            }
            
            const loadingMessage = vscode.window.setStatusBarMessage('WhiskerCode: Analyzing code complexity...');
            
            try {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showWarningMessage('No active editor found. Please open a file.');
                    return;
                }
                
                const document = editor.document;
                const fileContent = document.getText();
                const language = document.languageId;
                
                // Use the advanced parser for enhanced metrics
                const advancedMetrics = advancedParser.parseCode(fileContent, language);
                const refactoringOpportunities = advancedParser.findRefactoringOpportunities(fileContent, language);
                
                // Combine with traditional metrics
                const complexity = parser.analyzeFunctionComplexity(fileContent, language);
                
                // Create combined analysis
                const combinedAnalysis = {
                    functions: complexity,
                    codeMetrics: advancedMetrics.complexity,
                    patterns: advancedMetrics.patterns,
                    refactoring: refactoringOpportunities
                };
                
                // Fix: Use showComplexityAnalysis instead of visualizeComplexity
                if (complexityVisualizer && typeof complexityVisualizer.showComplexityAnalysis === 'function') {
                    complexityVisualizer.showComplexityAnalysis(combinedAnalysis.functions, document.fileName.split('/').pop());
                } else if (ui) {
                    // Fallback to a generic display method
                    ui.showPanel('Complexity Analysis', JSON.stringify(combinedAnalysis, null, 2));
                } else {
                    vscode.window.showInformationMessage(`Analyzed ${combinedAnalysis.functions.length} functions for complexity.`);
                }
            } catch (error) {
                console.error('Error analyzing complexity:', error);
                vscode.window.showErrorMessage(`Error analyzing complexity: ${error.message}`);
            } finally {
                loadingMessage.dispose();
            }
        });

        // Add command for dependency graph visualization
        const visualizeDependenciesCommand = vscode.commands.registerCommand('whiskercode.visualizeDependencies', async () => {
            const loadingMessage = vscode.window.setStatusBarMessage('WhiskerCode: Generating dependency graph...');
            
            try {
                if (!parser || !complexityVisualizer) {
                    vscode.window.showErrorMessage('WhiskerCode is not fully initialized yet. Please try again in a moment.');
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
        const changeCatThemeCommand = vscode.commands.registerCommand('whiskercode.changeCatTheme', async () => {
            try {
                if (!catThemeManager) {
                    vscode.window.showErrorMessage('WhiskerCode cat theme manager is not initialized yet. Please try again in a moment.');
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

        // Add command for performance hotspot detection
        const detectPerformanceCommand = vscode.commands.registerCommand('whiskercode.detectPerformance', async () => {
            if (!parser || !enhancedPerformanceAnalyzer || !ui) {
                vscode.window.showErrorMessage('WhiskerCode is not fully initialized yet. Please try again in a moment.');
                return;
            }
            
            const loadingMessage = vscode.window.setStatusBarMessage('WhiskerCode: Analyzing performance...');
            
            try {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showWarningMessage('No active editor found. Please open a file.');
                    return;
                }
                
                const document = editor.document;
                const fileContent = document.getText();
                const language = document.languageId;
                
                // Use both analyzers for comprehensive results
                const basicResults = performanceAnalyzer ? performanceAnalyzer.analyzePerformance(fileContent, language) : [];
                const enhancedResults = enhancedPerformanceAnalyzer.analyzePerformance(fileContent, language);
                
                // Combine results for display
                const combinedAnalysis = {
                    issues: enhancedResults.issues,
                    metrics: enhancedResults.complexityMetrics,
                    optimizations: enhancedResults.optimizations,
                    bestPractices: enhancedResults.bestPractices,
                    score: enhancedResults.overallScore
                };
                
                // Fix: Use showPerformanceIssues instead of showPerformanceAnalysis
                if (performanceAnalyzer && typeof performanceAnalyzer.showPerformanceIssues === 'function') {
                    performanceAnalyzer.showPerformanceIssues(combinedAnalysis, language);
                } else if (ui && typeof ui.showPerformanceIssues === 'function') {
                    ui.showPerformanceIssues(combinedAnalysis, language);
                } else if (ui) {
                    // Fallback to a generic display method
                    ui.showPanel('Performance Analysis', JSON.stringify(combinedAnalysis, null, 2));
                } else {
                    vscode.window.showInformationMessage(`Found ${combinedAnalysis.issues.length} performance issues.`);
                }
            } catch (error) {
                console.error('Error analyzing performance:', error);
                vscode.window.showErrorMessage(`Error analyzing performance: ${error.message}`);
            } finally {
                loadingMessage.dispose();
            }
        });

        // Register the Code Lens provider
        const supportedLanguages = ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'];
        
        if (codeLensProvider) {
            for (const language of supportedLanguages) {
                const codeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
                    { language },
                    codeLensProvider
                );
                context.subscriptions.push(codeLensProviderDisposable);
            }
            
            // Listen for document changes to refresh Code Lenses
            context.subscriptions.push(
                vscode.workspace.onDidChangeTextDocument(event => {
                    if (supportedLanguages.includes(event.document.languageId)) {
                        codeLensProvider.refresh();
                    }
                })
            );
        }
        
        // Register the Code Action provider
        if (codeActionProvider) {
            for (const language of supportedLanguages) {
                const codeActionProviderDisposable = vscode.languages.registerCodeActionsProvider(
                    { language },
                    codeActionProvider,
                    {
                        providedCodeActionKinds: [
                            vscode.CodeActionKind.QuickFix,
                            vscode.CodeActionKind.Refactor
                        ]
                    }
                );
                context.subscriptions.push(codeActionProviderDisposable);
            }
        }
        
        // Register new commands for Code Lens and Quick Fix functionality
        const showCodeMetricsCommand = vscode.commands.registerCommand('whiskercode.showCodeMetrics', async (uri, line, metricType) => {
            try {
                if (!ui) {
                    vscode.window.showErrorMessage('WhiskerCode is not fully initialized yet. Please try again in a moment.');
                    return;
                }
                
                const document = await vscode.workspace.openTextDocument(uri);
                const editor = await vscode.window.showTextDocument(document);
                
                // Highlight the relevant line
                const position = new vscode.Position(line - 1, 0);
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(new vscode.Range(position, position));
                
                // Show different metrics based on the type
                switch (metricType) {
                    case 'complexity':
                        vscode.commands.executeCommand('whiskercode.analyzeComplexity');
                        break;
                    case 'performance':
                        vscode.commands.executeCommand('whiskercode.detectPerformance');
                        break;
                    case 'refactor':
                        // Show refactoring suggestions specific to this function
                        const lineText = document.lineAt(line - 1).text;
                        const functionMatch = /function\s+(\w+)|const\s+(\w+)\s*=/.exec(lineText);
                        const functionName = functionMatch ? (functionMatch[1] || functionMatch[2]) : 'this function';
                        
                        ui.showRefactoringOptions(functionName, editor);
                        break;
                    case 'class':
                        // Show class analysis
                        const classLineText = document.lineAt(line - 1).text;
                        const classMatch = /class\s+(\w+)/.exec(classLineText);
                        const className = classMatch ? classMatch[1] : 'this class';
                        
                        ui.showClassAnalysis(className, editor);
                        break;
                    case 'react':
                        // Show React component analysis
                        const reactLineText = document.lineAt(line - 1).text;
                        const reactMatch = /function\s+(\w+)|const\s+(\w+)\s*=/.exec(reactLineText);
                        const componentName = reactMatch ? (reactMatch[1] || reactMatch[2]) : 'this component';
                        
                        ui.showReactComponentAnalysis(componentName, editor);
                        break;
                }
            } catch (error) {
                console.error('Error showing code metrics:', error);
                vscode.window.showErrorMessage(`Error showing code metrics: ${error.message}`);
            }
        });
        
        const applyQuickFixCommand = vscode.commands.registerCommand('whiskercode.applyQuickFix', async (uri, range, issue) => {
            try {
                if (!ui) {
                    vscode.window.showErrorMessage('WhiskerCode is not fully initialized yet. Please try again in a moment.');
                    return;
                }
                
                const document = await vscode.workspace.openTextDocument(uri);
                const editor = await vscode.window.showTextDocument(document);
                
                // Generate the fix based on the issue type
                let replacement = '';
                switch (issue.category) {
                    case 'algorithmicComplexity':
                        // Suggest code restructuring for algorithmic complexity issues
                        ui.showAlgorithmicComplexityFixOptions(issue, editor);
                        break;
                    case 'memoryManagement':
                        // Apply memory management fixes
                        if (issue.match.includes('push')) {
                            // Pre-allocate array fix
                            const arrayNameMatch = /const\s+(\w+)\s*=\s*\[\s*\]/.exec(issue.match);
                            if (arrayNameMatch) {
                                const arrayName = arrayNameMatch[1];
                                replacement = issue.match.replace(
                                    `const ${arrayName} = []`,
                                    `const ${arrayName} = new Array(estimatedSize)`
                                );
                                
                                await editor.edit(editBuilder => {
                                    editBuilder.replace(range, replacement);
                                });
                                
                                // Show information message with further optimization suggestions
                                vscode.window.showInformationMessage(
                                    'Array pre-allocated. Replace "estimatedSize" with the expected length.'
                                );
                            }
                        } else {
                            // Default case: show optimization panel
                            ui.showPerformanceFixOptions(issue, editor);
                        }
                        break;
                    case 'asyncPatterns':
                        // Apply async pattern fixes
                        if (issue.match.includes('for') && issue.match.includes('await')) {
                            // Sequential await in loop fix
                            ui.showAsyncFixOptions(issue, editor);
                        } else {
                            ui.showPerformanceFixOptions(issue, editor);
                        }
                        break;
                    default:
                        // Default: show options in UI
                        ui.showPerformanceFixOptions(issue, editor);
                }
            } catch (error) {
                console.error('Error applying quick fix:', error);
                vscode.window.showErrorMessage(`Error applying quick fix: ${error.message}`);
            }
        });
        
        // Add refactoring provider command
        const applyRefactoringCommand = vscode.commands.registerCommand('whiskercode.applyRefactoring', (opportunity) => {
            try {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    return;
                }
                
                // Show refactoring options through UI
                ui.showRefactoringPanel(opportunity, editor);
            } catch (error) {
                console.error('Error applying refactoring:', error);
                vscode.window.showErrorMessage(`Error applying refactoring: ${error.message}`);
            }
        });
        
        // Add Learning Path related commands to context subscriptions
        if (learningPathManager) {
            context.subscriptions.push(
                vscode.commands.registerCommand('whiskercode.showQuickLearningPath', () => {
                    learningPathManager.showLearningPath();
                })
            );
        }

        // Register all disposable items with context
        context.subscriptions.push(
            explainCodeCommand,
            traceVariableCommand,
            suggestDocumentationCommand,
            analyzeFunctionsCommand,
            openSettingsCommand,
            analyzeComplexityCommand,
            visualizeDependenciesCommand,
            changeCatThemeCommand,
            detectPerformanceCommand,
            showCodeMetricsCommand,
            applyQuickFixCommand,
            applyRefactoringCommand,
            showWelcomeCommand,
            statusBarCommand
        );
        
        // Make theme manager available to UI components
        if (ui && catThemeManager) {
            ui.setCatThemeManager(catThemeManager);
        }
        
        if (complexityVisualizer && catThemeManager) {
            complexityVisualizer.setCatThemeManager(catThemeManager);
        }

        // Register update command contribution to package.json
        updateContributionsToPackageJson();

        // Create and configure the status bar item for Learning Path
        learningPathStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        learningPathStatusBarItem.text = "$(mortar-board) Learning";
        learningPathStatusBarItem.tooltip = "WhiskerCode Learning Path";
        learningPathStatusBarItem.command = "whiskercode.showQuickLearningPath";
        learningPathStatusBarItem.show();

        // Register learning path status bar item with context
        context.subscriptions.push(learningPathStatusBarItem);
    } catch (error) {
        console.error('Error during activation:', error);
        vscode.window.showErrorMessage(`WhiskerCode activation error: ${error.message}`);
    }
}

// Helper function to update package.json contributions
function updateContributionsToPackageJson() {
    try {
        // In a real extension, we would add learning path commands to package.json
        // For this example, we're assuming they're already there or will be added manually
        console.log('Updated contributions in package.json');
    } catch (error) {
        console.error('Error updating package.json:', error);
    }
}

// This method is called when your extension is deactivated
function deactivate() {
    console.log('WhiskerCode is deactivated!');
    // Clean up resources
    try {
        // If learningPathManager exists, call its deactivate method
        const learningPathManager = global.learningPathManager;
        if (learningPathManager && typeof learningPathManager.deactivate === 'function') {
            learningPathManager.deactivate();
        }
    } catch (error) {
        console.error('Error during deactivation:', error);
    }
}

module.exports = {
    activate,
    deactivate
}; 