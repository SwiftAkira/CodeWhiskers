const vscode = require('vscode');
const { AdvancedParser } = require('./advancedParser');
const { EnhancedPerformanceAnalyzer } = require('./enhancedPerformance');

/**
 * Code Lens Provider for WhiskerCode
 * Shows metrics and insights directly in the editor
 */
class WhiskerCodeLensProvider {
    constructor() {
        this.advancedParser = new AdvancedParser();
        this.performanceAnalyzer = new EnhancedPerformanceAnalyzer();
        this.codeLenses = [];
        this._onDidChangeCodeLenses = new vscode.EventEmitter();
        this.onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
    }

    /**
     * Refresh code lenses when document changes
     */
    refresh() {
        this._onDidChangeCodeLenses.fire();
    }

    /**
     * Provides code lenses for the given document
     * @param {vscode.TextDocument} document - The document to provide code lenses for
     * @param {vscode.CancellationToken} token - A cancellation token
     * @returns {vscode.CodeLens[] | Promise<vscode.CodeLens[]>} An array of code lenses or a promise that resolves to an array of code lenses
     */
    provideCodeLenses(document, token) {
        if (token.isCancellationRequested) return [];
        
        const codeLenses = [];
        const text = document.getText();
        const language = document.languageId;
        
        // Only provide code lenses for supported languages
        if (!['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(language)) {
            return [];
        }
        
        try {
            // Parse the document with advanced parser
            const parseResult = this.advancedParser.parseCode(text, language);
            
            // Find functions to add code lenses
            if (parseResult.patterns && parseResult.patterns.function) {
                parseResult.patterns.function.forEach(func => {
                    // Get the first line of the function declaration
                    const position = new vscode.Position(func.line - 1, 0);
                    const range = new vscode.Range(position, position);
                    
                    // Create code lens for complexity metrics
                    const complexityLens = new vscode.CodeLens(range, {
                        title: `📊 Complexity: ${parseResult.complexity.cognitiveComplexity}`,
                        command: 'whiskercode.showCodeMetrics',
                        arguments: [document.uri, func.line, 'complexity']
                    });
                    
                    codeLenses.push(complexityLens);
                    
                    // Check if there are performance concerns with this function
                    const functionText = func.text;
                    const perfAnalysis = this.performanceAnalyzer.analyzePerformance(functionText, language);
                    
                    if (perfAnalysis.issues && perfAnalysis.issues.length > 0) {
                        // Create code lens for performance issues
                        const perfLens = new vscode.CodeLens(range, {
                            title: `⚡ Performance: ${perfAnalysis.issues.length} issue${perfAnalysis.issues.length > 1 ? 's' : ''}`,
                            command: 'whiskercode.showCodeMetrics',
                            arguments: [document.uri, func.line, 'performance']
                        });
                        
                        codeLenses.push(perfLens);
                    }
                    
                    // Check if this function has refactoring opportunities
                    const refactorOpportunities = this.advancedParser.findRefactoringOpportunities(functionText, language);
                    
                    if (refactorOpportunities && refactorOpportunities.length > 0) {
                        // Create code lens for refactoring opportunities
                        const refactorLens = new vscode.CodeLens(range, {
                            title: `♻️ Refactor: ${refactorOpportunities.length} suggestion${refactorOpportunities.length > 1 ? 's' : ''}`,
                            command: 'whiskercode.showCodeMetrics',
                            arguments: [document.uri, func.line, 'refactor']
                        });
                        
                        codeLenses.push(refactorLens);
                    }
                });
            }
            
            // Add class-level code lenses
            if (parseResult.patterns && parseResult.patterns.class) {
                parseResult.patterns.class.forEach(cls => {
                    // Get the first line of the class declaration
                    const position = new vscode.Position(cls.line - 1, 0);
                    const range = new vscode.Range(position, position);
                    
                    // Create code lens for class analysis
                    const classLens = new vscode.CodeLens(range, {
                        title: `🔍 Analyze class`,
                        command: 'whiskercode.showCodeMetrics',
                        arguments: [document.uri, cls.line, 'class']
                    });
                    
                    codeLenses.push(classLens);
                });
            }
            
            // Add React component-specific code lenses
            if (language.includes('react') && parseResult.reactAnalysis && parseResult.reactAnalysis.components) {
                parseResult.reactAnalysis.components.forEach(component => {
                    // Find the component in the patterns
                    const componentMatches = parseResult.patterns.component.filter(c => 
                        c.groups.includes(component));
                    
                    if (componentMatches.length > 0) {
                        const componentMatch = componentMatches[0];
                        const position = new vscode.Position(componentMatch.line - 1, 0);
                        const range = new vscode.Range(position, position);
                        
                        // Create code lens for React component analysis
                        const reactLens = new vscode.CodeLens(range, {
                            title: `⚛️ React component insights`,
                            command: 'whiskercode.showCodeMetrics',
                            arguments: [document.uri, componentMatch.line, 'react']
                        });
                        
                        codeLenses.push(reactLens);
                    }
                });
            }
            
            this.codeLenses = codeLenses;
            return codeLenses;
        } catch (error) {
            console.error('Error providing code lenses:', error);
            return [];
        }
    }

    /**
     * Resolves a code lens
     * @param {vscode.CodeLens} codeLens - The code lens to resolve
     * @param {vscode.CancellationToken} token - A cancellation token
     * @returns {vscode.CodeLens | Promise<vscode.CodeLens>} The resolved code lens or a promise that resolves to the code lens
     */
    resolveCodeLens(codeLens, token) {
        if (token.isCancellationRequested) return codeLens;
        
        return codeLens;
    }
}

/**
 * Code Action Provider for WhiskerCode
 * Provides quick fixes and refactoring suggestions
 */
class WhiskerCodeActionProvider {
    constructor() {
        this.advancedParser = new AdvancedParser();
        this.performanceAnalyzer = new EnhancedPerformanceAnalyzer();
    }

    /**
     * Provides code actions for the given document and range
     * @param {vscode.TextDocument} document - The document to provide code actions for
     * @param {vscode.Range | vscode.Selection} range - The range or selection to provide code actions for
     * @param {vscode.CodeActionContext} context - The code action context
     * @param {vscode.CancellationToken} token - A cancellation token
     * @returns {vscode.CodeAction[] | Promise<vscode.CodeAction[]>} An array of code actions or a promise that resolves to an array of code actions
     */
    provideCodeActions(document, range, context, token) {
        if (token.isCancellationRequested) return [];
        
        const text = document.getText(range);
        const language = document.languageId;
        
        // Only provide code actions for supported languages
        if (!['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(language)) {
            return [];
        }
        
        const codeActions = [];
        
        try {
            // Analyze the selected code
            const perfAnalysis = this.performanceAnalyzer.analyzePerformance(text, language);
            
            // Find performance issues that can be fixed
            if (perfAnalysis.issues && perfAnalysis.issues.length > 0) {
                perfAnalysis.issues.forEach(issue => {
                    if (issue.suggestion && issue.match) {
                        // Create code action for performance issue
                        const action = new vscode.CodeAction(
                            `🔧 Fix: ${issue.description}`,
                            vscode.CodeActionKind.QuickFix
                        );
                        
                        // Generate fix based on the issue
                        action.command = {
                            title: 'Apply fix',
                            command: 'whiskercode.applyQuickFix',
                            arguments: [document.uri, range, issue]
                        };
                        
                        action.isPreferred = issue.severity === 'critical' || issue.severity === 'high';
                        codeActions.push(action);
                    }
                });
            }
            
            // Find refactoring opportunities
            const refactorOpportunities = this.advancedParser.findRefactoringOpportunities(text, language);
            
            if (refactorOpportunities && refactorOpportunities.length > 0) {
                refactorOpportunities.forEach(opportunity => {
                    if (opportunity.suggestion) {
                        // Create code action for refactoring opportunity
                        const action = new vscode.CodeAction(
                            `♻️ Refactor: ${opportunity.description}`,
                            vscode.CodeActionKind.Refactor
                        );
                        
                        // Generate refactoring command
                        action.command = {
                            title: 'Apply refactoring',
                            command: 'whiskercode.applyRefactoring',
                            arguments: [document.uri, range, opportunity]
                        };
                        
                        action.isPreferred = opportunity.severity === 'high';
                        codeActions.push(action);
                    }
                });
            }
            
            return codeActions;
        } catch (error) {
            console.error('Error providing code actions:', error);
            return [];
        }
    }
}

module.exports = {
    WhiskerCodeLensProvider,
    WhiskerCodeActionProvider
}; 