const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

class LearningPathView {
    constructor(context) {
        this.context = context;
        this.panel = null;
        this.userProfile = null;
        this.currentChallenge = null;
        this.autoOpenDisabled = true; // Disable auto-opening by default
    }
    
    show(userProfile, currentChallenge = null, forceShow = false) {
        this.userProfile = userProfile;
        this.currentChallenge = currentChallenge;
        
        // If autoOpenDisabled is true and forceShow is false, don't open the panel
        if (this.autoOpenDisabled && !forceShow) {
            // Just update the content if panel exists, but don't create or reveal
            if (this.panel) {
                this.updateContent();
            }
            return;
        }
        
        if (this.panel) {
            // If panel already exists, reveal it and update content
            this.panel.reveal();
            this.updateContent();
            return;
        }
        
        // Create a new panel
        this.panel = vscode.window.createWebviewPanel(
            'whiskerCodeLearningPath',
            '🐱 WhiskerCode Learning Path',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(this.context.extensionPath, 'resources'))
                ]
            }
        );
        
        // Handle panel disposal
        this.panel.onDidDispose(() => {
            this.panel = null;
        }, null, this.context.subscriptions);
        
        // Handle webview messages
        this.panel.webview.onDidReceiveMessage(
            message => this.handleWebviewMessage(message),
            undefined,
            this.context.subscriptions
        );
        
        // Set initial content
        this.updateContent();
    }
    
    // Add method to explicitly show the panel
    showPanel() {
        return this.show(this.userProfile, this.currentChallenge, true);
    }
    
    updateContent() {
        if (!this.panel) return;
        
        this.panel.webview.html = this.getWebviewContent();
    }
    
    getWebviewContent() {
        // Create HTML for the webview
        const stylePath = this.getResourcePath('learning-path.css');
        const scriptPath = this.getResourcePath('learning-path.js');
        const logoPath = this.getResourcePath('cats/logo.svg');
        
        // Get cat character images
        const catImagePaths = {};
        if (this.userProfile && this.userProfile.learningPath) {
            for (const pathItem of this.userProfile.learningPath) {
                if (pathItem.catCharacter && pathItem.catCharacter.imageUrl) {
                    const catName = pathItem.catCharacter.name.toLowerCase().replace(/\s+/g, '-');
                    const imageName = path.basename(pathItem.catCharacter.imageUrl);
                    catImagePaths[catName] = this.getResourcePath(pathItem.catCharacter.imageUrl);
                }
            }
        }
        
        // If there's a current challenge, get its cat character
        let currentCatImage = null;
        let currentCatName = null;
        if (this.currentChallenge && this.currentChallenge.catCharacter) {
            currentCatName = this.currentChallenge.catCharacter.name;
            const catName = currentCatName.toLowerCase().replace(/\s+/g, '-');
            currentCatImage = catImagePaths[catName] || this.getResourcePath('cats/default.svg');
        }
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhiskerCode Learning Path</title>
    <link rel="stylesheet" href="${stylePath}">
    <style>
        :root {
            --background-color: ${this.getColorFromTheme('editor.background', '#1e1e1e')};
            --foreground-color: ${this.getColorFromTheme('editor.foreground', '#d4d4d4')};
            --accent-color: #7289DA;
        }
        
        body {
            background-color: var(--background-color);
            color: var(--foreground-color);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            padding: 0;
            margin: 0;
            line-height: 1.6;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            display: flex;
            align-items: center;
            margin-bottom: 30px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 20px;
        }
        
        .logo {
            width: 60px;
            height: 60px;
            margin-right: 15px;
        }
        
        .title {
            margin: 0;
            font-size: 24px;
            font-weight: 500;
        }
        
        .subtitle {
            margin: 5px 0 0;
            opacity: 0.7;
            font-size: 16px;
        }
        
        .profile-summary {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }
        
        .skill-level {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 15px;
        }
        
        .skill-level.beginner {
            background: #4e8543;
        }
        
        .skill-level.intermediate {
            background: #c27c36;
        }
        
        .skill-level.advanced {
            background: #9c27b0;
        }
        
        .strength-list, .improvement-list {
            list-style-type: none;
            padding-left: 0;
            margin: 10px 0;
        }
        
        .strength-list li, .improvement-list li {
            padding: 5px 0;
            display: flex;
            align-items: center;
        }
        
        .strength-list li:before {
            content: '✓';
            color: #4CAF50;
            font-weight: bold;
            margin-right: 10px;
        }
        
        .improvement-list li:before {
            content: '↗';
            color: #FFC107;
            font-weight: bold;
            margin-right: 10px;
        }
        
        .path-container {
            margin-top: 30px;
        }
        
        .path-heading {
            font-size: 18px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
        }
        
        .path-heading:before {
            content: '🐾';
            margin-right: 10px;
        }
        
        .learning-path {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .path-item {
            display: flex;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
            border-left: 4px solid #7289DA;
        }
        
        .path-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            cursor: pointer;
        }
        
        .path-item.code-complexity {
            border-left-color: #4CAF50;
        }
        
        .path-item.debugging-practices {
            border-left-color: #2196F3;
        }
        
        .path-item.code-documentation {
            border-left-color: #FFC107;
        }
        
        .path-item.modern-language-features {
            border-left-color: #9C27B0;
        }
        
        .cat-image {
            width: 80px;
            height: 80px;
            object-fit: cover;
        }
        
        .path-content {
            padding: 12px;
            flex: 1;
        }
        
        .path-title {
            margin: 0 0 5px;
            font-size: 16px;
            font-weight: 500;
        }
        
        .path-area {
            font-size: 12px;
            opacity: 0.7;
            margin-bottom: 8px;
        }
        
        .path-difficulty {
            font-size: 12px;
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.1);
        }
        
        .path-completed {
            margin-left: auto;
            display: flex;
            align-items: center;
            padding-right: 15px;
        }
        
        .checkmark {
            width: 24px;
            height: 24px;
            background: #4CAF50;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        
        .current-challenge {
            margin-top: 40px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .challenge-header {
            display: flex;
            align-items: center;
            padding: 15px;
            background: rgba(0, 0, 0, 0.3);
        }
        
        .challenge-cat {
            margin-right: 15px;
        }
        
        .challenge-cat img {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #7289DA;
        }
        
        .challenge-info h3 {
            margin: 0 0 5px;
            font-size: 18px;
        }
        
        .challenge-info p {
            margin: 0;
            opacity: 0.8;
            font-size: 14px;
        }
        
        .challenge-body {
            padding: 20px;
        }
        
        .challenge-description {
            margin-bottom: 20px;
        }
        
        .challenge-actions {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        
        .btn {
            padding: 8px 16px;
            border-radius: 4px;
            border: none;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .btn-primary {
            background-color: #7289DA;
            color: white;
        }
        
        .btn-secondary {
            background-color: rgba(255, 255, 255, 0.1);
            color: var(--foreground-color);
        }
        
        .btn:hover {
            opacity: 0.9;
        }
        
        .no-challenge {
            padding: 30px;
            text-align: center;
            opacity: 0.7;
        }
        
        .empty-state {
            text-align: center;
            padding: 40px 0;
            opacity: 0.7;
        }
        
        @keyframes pawAnimation {
            0% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(5deg); }
            100% { transform: translateY(0) rotate(0deg); }
        }
        
        .animated-paw {
            display: inline-block;
            animation: pawAnimation 2s infinite;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${logoPath}" alt="WhiskerCode Logo" class="logo">
            <div>
                <h1 class="title">🐱 WhiskerCode Learning Path</h1>
                <p class="subtitle">Personalized coding challenges to help you improve</p>
            </div>
        </div>
        
        ${this.userProfile ? this.renderProfileSummary() : '<div class="empty-state">No profile data available</div>'}
        
        ${this.userProfile && this.userProfile.learningPath ? this.renderLearningPath() : ''}
        
        ${this.currentChallenge ? this.renderCurrentChallenge(currentCatImage, currentCatName) : this.renderNoChallenge()}
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        // Handle button clicks
        document.addEventListener('click', (event) => {
            // Challenge item click
            if (event.target.closest('.path-item')) {
                const pathItem = event.target.closest('.path-item');
                const index = pathItem.getAttribute('data-index');
                vscode.postMessage({
                    command: 'startChallenge',
                    index: parseInt(index)
                });
            }
            
            // Start challenge button
            if (event.target.matches('#start-challenge')) {
                vscode.postMessage({
                    command: 'openChallenge'
                });
            }
            
            // View solution button
            if (event.target.matches('#view-solution')) {
                vscode.postMessage({
                    command: 'viewSolution'
                });
            }
            
            // Complete challenge button
            if (event.target.matches('#complete-challenge')) {
                vscode.postMessage({
                    command: 'completeChallenge'
                });
            }
            
            // Next challenge button
            if (event.target.matches('#next-challenge')) {
                vscode.postMessage({
                    command: 'nextChallenge'
                });
            }
        });
    </script>
</body>
</html>`;
    }
    
    renderProfileSummary() {
        const profile = this.userProfile;
        
        return `
        <div class="profile-summary">
            <div class="skill-level ${profile.skillLevel}">
                ${this.capitalizeFirstLetter(profile.skillLevel)} Level
            </div>
            
            <div>
                <h3>Your Strengths</h3>
                ${this.renderList(profile.strengths, 'strength-list')}
            </div>
            
            <div>
                <h3>Areas for Improvement</h3>
                ${this.renderList(profile.areasForImprovement, 'improvement-list')}
            </div>
        </div>`;
    }
    
    renderList(items, className) {
        if (!items || items.length === 0) {
            return '<p>None identified yet</p>';
        }
        
        return `
        <ul class="${className}">
            ${items.map(item => `<li>${item}</li>`).join('')}
        </ul>`;
    }
    
    renderLearningPath() {
        const path = this.userProfile.learningPath;
        
        if (!path || path.length === 0) {
            return '<div class="empty-state">No learning path available</div>';
        }
        
        return `
        <div class="path-container">
            <h2 class="path-heading">Your Learning Path</h2>
            <div class="learning-path">
                ${path.map((item, index) => this.renderPathItem(item, index)).join('')}
            </div>
        </div>`;
    }
    
    renderPathItem(item, index) {
        const areaClass = item.area.toLowerCase().replace(/\s+/g, '-');
        const catName = item.catCharacter?.name || 'Coding Kitty';
        const catImageUrl = item.catCharacter?.imageUrl || 'cats/default.svg';
        const catImagePath = this.getResourcePath(catImageUrl);
        
        return `
        <div class="path-item ${areaClass}" data-index="${index}">
            <img src="${catImagePath}" alt="${catName}" class="cat-image">
            <div class="path-content">
                <h3 class="path-title">${item.challenge}</h3>
                <div class="path-area">${item.area}</div>
                <div class="path-difficulty">${this.capitalizeFirstLetter(item.difficulty)}</div>
            </div>
            ${item.completed ? '<div class="path-completed"><div class="checkmark">✓</div></div>' : ''}
        </div>`;
    }
    
    renderCurrentChallenge(catImage, catName) {
        const challenge = this.currentChallenge;
        
        if (!challenge) {
            return this.renderNoChallenge();
        }
        
        return `
        <div class="current-challenge">
            <div class="challenge-header">
                <div class="challenge-cat">
                    <img src="${catImage || this.getResourcePath('cats/default.svg')}" alt="${catName || 'Coding Kitty'}">
                </div>
                <div class="challenge-info">
                    <h3>${challenge.title}</h3>
                    <p>${challenge.area} - ${this.capitalizeFirstLetter(challenge.difficulty)}</p>
                </div>
            </div>
            <div class="challenge-body">
                <div class="challenge-description">
                    ${challenge.description}
                </div>
                <div class="challenge-actions">
                    <button id="start-challenge" class="btn btn-primary">Start Challenge</button>
                    <button id="view-solution" class="btn btn-secondary">View Solution</button>
                    <button id="complete-challenge" class="btn btn-primary">Mark as Completed</button>
                    <button id="next-challenge" class="btn btn-secondary">Next Challenge</button>
                </div>
            </div>
        </div>`;
    }
    
    renderNoChallenge() {
        return `
        <div class="current-challenge">
            <div class="no-challenge">
                <p><span class="animated-paw">🐾</span> Select a challenge from your learning path to begin!</p>
            </div>
        </div>`;
    }
    
    getResourcePath(relativePath) {
        // Make sure there's no 'resources/' prefix on relativePath as we'll add it here
        const cleanPath = relativePath.startsWith('resources/') 
            ? relativePath.substring('resources/'.length) 
            : relativePath;
            
        const onDiskPath = vscode.Uri.file(path.join(this.context.extensionPath, 'resources', cleanPath));
        return this.panel.webview.asWebviewUri(onDiskPath).toString();
    }
    
    getColorFromTheme(colorId, fallback) {
        const theme = vscode.workspace.getConfiguration('workbench').get('colorTheme');
        // In a real implementation, this would use the theme to get the actual color
        // For now, we'll just return the fallback
        return fallback;
    }
    
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    async handleWebviewMessage(message) {
        switch (message.command) {
            case 'startChallenge':
                await this.startChallenge(message.index);
                break;
            case 'openChallenge':
                await this.openChallengeInEditor();
                break;
            case 'viewSolution':
                await this.viewSolution();
                break;
            case 'completeChallenge':
                await this.completeChallenge();
                break;
            case 'nextChallenge':
                await this.goToNextChallenge();
                break;
        }
    }
    
    async startChallenge(index) {
        // This would be implemented to start a specific challenge
        vscode.window.showInformationMessage(`Starting challenge at index ${index}`);
        
        // In a real implementation, this would load the challenge and update the view
        // For now, we'll just emit an event that can be handled elsewhere
        this.onStartChallenge?.({ index });
    }
    
    async openChallengeInEditor() {
        if (!this.currentChallenge) return;
        
        // Create a new untitled file with the challenge code
        const document = await vscode.workspace.openTextDocument({
            content: this.currentChallenge.code,
            language: 'javascript' // This would be determined based on the challenge
        });
        
        await vscode.window.showTextDocument(document);
    }
    
    async viewSolution() {
        if (!this.currentChallenge || !this.currentChallenge.solution) return;
        
        // Create a new untitled file with the solution code
        const document = await vscode.workspace.openTextDocument({
            content: this.currentChallenge.solution,
            language: 'javascript' // This would be determined based on the challenge
        });
        
        await vscode.window.showTextDocument(document);
    }
    
    async completeChallenge() {
        if (!this.currentChallenge) return;
        
        // This would be implemented to mark the challenge as completed
        vscode.window.showInformationMessage(`Challenge completed: ${this.currentChallenge.title}`);
        
        // In a real implementation, this would update the user profile and learning path
        // For now, we'll just emit an event that can be handled elsewhere
        this.onCompleteChallenge?.(this.currentChallenge);
    }
    
    async goToNextChallenge() {
        // This would be implemented to go to the next challenge
        vscode.window.showInformationMessage('Going to next challenge');
        
        // In a real implementation, this would load the next challenge and update the view
        // For now, we'll just emit an event that can be handled elsewhere
        this.onNextChallenge?.();
    }
    
    onStartChallenge = null;
    onCompleteChallenge = null;
    onNextChallenge = null;
}

module.exports = LearningPathView; 