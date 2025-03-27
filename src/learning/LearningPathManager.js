const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const CodeAnalysisEngine = require('./CodeAnalysisEngine');
const ChallengeGenerator = require('./ChallengeGenerator');
const LearningPathView = require('./LearningPathView');

class LearningPathManager {
    constructor(context) {
        this.context = context;
        this.analysisEngine = new CodeAnalysisEngine();
        this.challengeGenerator = new ChallengeGenerator();
        this.learningPathView = new LearningPathView(context);
        
        // Setup event handlers
        this.learningPathView.onStartChallenge = this.handleStartChallenge.bind(this);
        this.learningPathView.onCompleteChallenge = this.handleCompleteChallenge.bind(this);
        this.learningPathView.onNextChallenge = this.handleNextChallenge.bind(this);
        
        // User state
        this.userProfile = null;
        this.currentChallenge = null;
        this.challengeHistory = [];
        this.lastAnalysisTime = null;
        this.analysisDebounceTimeout = null;
        
        // Load saved state if available
        this.loadState();
        
        // Set up file change listeners for continuous analysis
        this.setupFileChangeListeners();
    }
    
    setupFileChangeListeners() {
        // Listen for file changes to analyze code
        const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.{js,ts,jsx,tsx,py,java,cs}');
        
        // When files are changed, debounce the analysis to avoid too many operations
        const onFileChange = () => {
            if (this.analysisDebounceTimeout) {
                clearTimeout(this.analysisDebounceTimeout);
            }
            
            // Check if we've analyzed within the last 10 minutes
            const now = new Date();
            const shouldAnalyze = !this.lastAnalysisTime || 
                (now - this.lastAnalysisTime) > 10 * 60 * 1000; // 10 minutes
                
            if (shouldAnalyze) {
                this.analysisDebounceTimeout = setTimeout(() => {
                    this.quietAnalyzeCode();
                }, 5000); // Wait 5 seconds after last change
            }
        };
        
        // Add change handlers
        fileWatcher.onDidChange(onFileChange);
        fileWatcher.onDidCreate(onFileChange);
        fileWatcher.onDidDelete(onFileChange);
        
        // Dispose the watcher when the extension is deactivated
        this.context.subscriptions.push(fileWatcher);
    }
    
    registerCommands() {
        // Register commands with VS Code
        const disposables = [
            vscode.commands.registerCommand('whiskercode.showLearningPath', this.showLearningPath.bind(this)),
            vscode.commands.registerCommand('whiskercode.analyzeCode', this.analyzeCode.bind(this)),
            vscode.commands.registerCommand('whiskercode.startChallenge', this.startRandomChallenge.bind(this)),
            vscode.commands.registerCommand('whiskercode.resetLearningData', this.resetLearningData.bind(this))
        ];
        
        disposables.forEach(disposable => this.context.subscriptions.push(disposable));
    }
    
    async showLearningPath() {
        // If no profile exists, analyze code first
        if (!this.userProfile) {
            await this.analyzeCode();
        }
        
        // Show the learning path view (explicitly using showPanel)
        this.learningPathView.showPanel();
    }
    
    // Quiet analysis without notifications
    async quietAnalyzeCode() {
        try {
            // Analyze the workspace
            this.userProfile = await this.analysisEngine.analyzeWorkspace();
            
            // Update the learning path view without showing it
            this.learningPathView.show(this.userProfile, this.currentChallenge);
            
            // Record the analysis time
            this.lastAnalysisTime = new Date();
            
            // Save the analysis results
            this.saveState();
            
            return this.userProfile;
        } catch (error) {
            console.error('Error during quiet code analysis:', error);
        }
    }
    
    async analyzeCode() {
        // Show progress notification
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "WhiskerCode: Analyzing your code...",
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0 });
            
            try {
                // Analyze the workspace
                this.userProfile = await this.analysisEngine.analyzeWorkspace();
                
                // Record the analysis time
                this.lastAnalysisTime = new Date();
                
                // Save the analysis results
                this.saveState();
                
                progress.report({ increment: 100, message: "Analysis complete!" });
                
                // Show success message
                vscode.window.showInformationMessage(
                    `WhiskerCode has analyzed your coding patterns! ${this.getSkillLevelEmoji()} You're at the ${this.userProfile.skillLevel} level.`
                );
                
                return this.userProfile;
            } catch (error) {
                vscode.window.showErrorMessage(`Error analyzing code: ${error.message}`);
                console.error(error);
                throw error;
            }
        });
        
        return this.userProfile;
    }
    
    getSkillLevelEmoji() {
        if (!this.userProfile) return '😺';
        
        switch (this.userProfile.skillLevel) {
            case 'beginner': return '😺';
            case 'intermediate': return '😸';
            case 'advanced': return '😻';
            default: return '😺';
        }
    }
    
    async startRandomChallenge() {
        // If no profile exists, analyze code first
        if (!this.userProfile) {
            await this.analyzeCode();
        }
        
        // Generate a challenge
        const challenge = this.challengeGenerator.generateChallenge(this.userProfile.learningPath);
        
        if (challenge) {
            this.currentChallenge = challenge;
            this.saveState();
            
            // Show the challenge in the learning path view
            this.learningPathView.show(this.userProfile, this.currentChallenge);
        } else {
            vscode.window.showWarningMessage('No challenges available in your learning path.');
        }
    }
    
    async handleStartChallenge(data) {
        const { index } = data;
        
        if (!this.userProfile || !this.userProfile.learningPath || 
            index < 0 || index >= this.userProfile.learningPath.length) {
            return;
        }
        
        // Get the path item at the given index
        const pathItem = this.userProfile.learningPath[index];
        
        // Generate a challenge for this path item
        const learningPath = [pathItem]; // Create a single-item array for the generator
        const challenge = this.challengeGenerator.generateChallenge(learningPath);
        
        if (challenge) {
            this.currentChallenge = challenge;
            this.saveState();
            
            // Update the learning path view
            this.learningPathView.currentChallenge = this.currentChallenge;
            this.learningPathView.updateContent();
        }
    }
    
    async handleCompleteChallenge(challenge) {
        if (!this.userProfile || !challenge) {
            return;
        }
        
        // Find the learning path item that corresponds to this challenge
        const pathItem = this.userProfile.learningPath.find(
            item => item.area === challenge.area && item.challenge === challenge.title
        );
        
        if (pathItem) {
            // Mark the path item as completed
            pathItem.completed = true;
            
            // Add to challenge history
            this.challengeHistory.push({
                ...challenge,
                completedAt: new Date().toISOString()
            });
            
            // Save state
            this.saveState();
            
            // Show celebration message with cat emoji
            vscode.window.showInformationMessage(
                `🎉 Purr-fect! You've completed the "${challenge.title}" challenge! 😸`
            );
            
            // Update the learning path view
            this.learningPathView.updateContent();
        }
    }
    
    async handleNextChallenge() {
        // If there's no current challenge, start a random one
        if (!this.currentChallenge) {
            await this.startRandomChallenge();
            return;
        }
        
        // Find completed challenges in the learning path
        const completedChallenges = this.userProfile.learningPath
            .filter(item => item.completed)
            .map(item => item.challenge);
        
        // Find incomplete challenges
        const incompleteChallenges = this.userProfile.learningPath
            .filter(item => !item.completed);
        
        if (incompleteChallenges.length === 0) {
            vscode.window.showInformationMessage('Congratulations! You\'ve completed all challenges. Analyzing your code again to generate new challenges...');
            await this.analyzeCode();
            await this.startRandomChallenge();
            return;
        }
        
        // Generate a challenge from the first incomplete item
        const challenge = this.challengeGenerator.generateChallenge([incompleteChallenges[0]]);
        
        if (challenge) {
            this.currentChallenge = challenge;
            this.saveState();
            
            // Update the learning path view
            this.learningPathView.currentChallenge = this.currentChallenge;
            this.learningPathView.updateContent();
        }
    }
    
    async resetLearningData() {
        // Ask for confirmation
        const confirmation = await vscode.window.showWarningMessage(
            'Are you sure you want to reset all WhiskerCode learning data? This will delete your profile and challenge history.',
            { modal: true },
            'Yes', 'No'
        );
        
        if (confirmation !== 'Yes') {
            return;
        }
        
        // Reset all data
        this.userProfile = null;
        this.currentChallenge = null;
        this.challengeHistory = [];
        
        // Delete saved state
        this.context.globalState.update('whiskercode.userProfile', undefined);
        this.context.globalState.update('whiskercode.currentChallenge', undefined);
        this.context.globalState.update('whiskercode.challengeHistory', undefined);
        
        vscode.window.showInformationMessage('WhiskerCode learning data has been reset.');
    }
    
    loadState() {
        // Load state from extension storage
        this.userProfile = this.context.globalState.get('whiskercode.userProfile');
        this.currentChallenge = this.context.globalState.get('whiskercode.currentChallenge');
        this.challengeHistory = this.context.globalState.get('whiskercode.challengeHistory') || [];
    }
    
    saveState() {
        // Save state to extension storage
        this.context.globalState.update('whiskercode.userProfile', this.userProfile);
        this.context.globalState.update('whiskercode.currentChallenge', this.currentChallenge);
        this.context.globalState.update('whiskercode.challengeHistory', this.challengeHistory);
    }
    
    createCatImages() {
        // Ensure the resources directory exists
        const resourcesPath = path.join(this.context.extensionPath, 'resources');
        const catsPath = path.join(resourcesPath, 'cats');
        
        if (!fs.existsSync(catsPath)) {
            fs.mkdirSync(catsPath, { recursive: true });
        }
        
        // Define cat SVG images
        const catSvgs = {
            'professor.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
                <!-- Professor Pawsley with glasses and graduation cap -->
                <circle cx="100" cy="100" r="80" fill="#E0AD5B" />
                <!-- Face -->
                <circle cx="75" cy="90" r="10" fill="#FFF" />
                <circle cx="125" cy="90" r="10" fill="#FFF" />
                <circle cx="75" cy="90" r="5" fill="#000" />
                <circle cx="125" cy="90" r="5" fill="#000" />
                <!-- Glasses -->
                <rect x="65" y="85" width="20" height="10" rx="5" fill="none" stroke="#000" stroke-width="2" />
                <rect x="115" y="85" width="20" height="10" rx="5" fill="none" stroke="#000" stroke-width="2" />
                <line x1="85" y1="90" x2="115" y2="90" stroke="#000" stroke-width="2" />
                <!-- Whiskers -->
                <line x1="40" y1="110" x2="70" y2="105" stroke="#000" stroke-width="1" />
                <line x1="40" y1="120" x2="70" y2="115" stroke="#000" stroke-width="1" />
                <line x1="160" y1="110" x2="130" y2="105" stroke="#000" stroke-width="1" />
                <line x1="160" y1="120" x2="130" y2="115" stroke="#000" stroke-width="1" />
                <!-- Mouth -->
                <path d="M90,115 Q100,125 110,115" fill="none" stroke="#000" stroke-width="2" />
                <!-- Graduation Cap -->
                <rect x="65" y="45" width="70" height="10" fill="#000" />
                <polygon points="100,20 65,55 135,55" fill="#000" />
                <circle cx="100" cy="20" r="5" fill="#FFF" />
                <rect x="95" y="20" width="30" height="5" fill="#000" transform="rotate(45, 100, 20)" />
                <!-- Ears -->
                <polygon points="60,40 45,20 75,30" fill="#E0AD5B" stroke="#000" />
                <polygon points="140,40 155,20 125,30" fill="#E0AD5B" stroke="#000" />
            </svg>`,
            
            'detective.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
                <!-- Detective Whiskers with magnifying glass and detective hat -->
                <circle cx="100" cy="100" r="80" fill="#808080" />
                <!-- Face -->
                <circle cx="75" cy="90" r="10" fill="#FFF" />
                <circle cx="125" cy="90" r="10" fill="#FFF" />
                <circle cx="75" cy="88" r="5" fill="#000" />
                <circle cx="125" cy="88" r="5" fill="#000" />
                <!-- Whiskers -->
                <line x1="40" y1="110" x2="70" y2="105" stroke="#000" stroke-width="1" />
                <line x1="40" y1="120" x2="70" y2="115" stroke="#000" stroke-width="1" />
                <line x1="160" y1="110" x2="130" y2="105" stroke="#000" stroke-width="1" />
                <line x1="160" y1="120" x2="130" y2="115" stroke="#000" stroke-width="1" />
                <!-- Thinking expression -->
                <path d="M90,115 Q100,120 110,115" fill="none" stroke="#000" stroke-width="2" />
                <!-- Detective Hat -->
                <path d="M55,50 L145,50 L135,70 L65,70 Z" fill="#3A3A3A" />
                <ellipse cx="100" cy="50" rx="50" ry="10" fill="#3A3A3A" />
                <!-- Ears -->
                <polygon points="60,50 45,20 75,40" fill="#808080" stroke="#000" />
                <polygon points="140,50 155,20 125,40" fill="#808080" stroke="#000" />
                <!-- Magnifying Glass -->
                <circle cx="150" cy="135" r="20" fill="none" stroke="#000" stroke-width="3" />
                <line x1="136" y1="121" x2="115" y2="100" stroke="#000" stroke-width="3" />
                <rect x="114" y="97" width="15" height="5" fill="#000" transform="rotate(45, 114, 97)" />
            </svg>`,
            
            'scribe.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
                <!-- Scribe Mittens with quill pen and scroll -->
                <circle cx="100" cy="100" r="80" fill="#E8D0B3" />
                <!-- Face -->
                <circle cx="75" cy="90" r="10" fill="#FFF" />
                <circle cx="125" cy="90" r="10" fill="#FFF" />
                <circle cx="75" cy="90" r="5" fill="#000" />
                <circle cx="125" cy="90" r="5" fill="#000" />
                <!-- Whiskers -->
                <line x1="40" y1="110" x2="70" y2="105" stroke="#000" stroke-width="1" />
                <line x1="40" y1="120" x2="70" y2="115" stroke="#000" stroke-width="1" />
                <line x1="160" y1="110" x2="130" y2="105" stroke="#000" stroke-width="1" />
                <line x1="160" y1="120" x2="130" y2="115" stroke="#000" stroke-width="1" />
                <!-- Focused expression -->
                <path d="M90,115 Q100,118 110,115" fill="none" stroke="#000" stroke-width="2" />
                <!-- Ears -->
                <polygon points="60,40 45,20 75,30" fill="#E8D0B3" stroke="#000" />
                <polygon points="140,40 155,20 125,30" fill="#E8D0B3" stroke="#000" />
                <!-- Scroll -->
                <path d="M40,140 L70,140 Q75,140 75,145 L75,165 Q75,170 70,170 L40,170 Q35,170 35,165 L35,145 Q35,140 40,140 Z" fill="#F5F5DC" stroke="#8B4513" stroke-width="2" />
                <path d="M40,140 C35,130 45,130 40,140" fill="#F5F5DC" stroke="#8B4513" stroke-width="2" />
                <path d="M70,140 C75,130 65,130 70,140" fill="#F5F5DC" stroke="#8B4513" stroke-width="2" />
                <line x1="45" y1="150" x2="65" y2="150" stroke="#8B4513" stroke-width="1" />
                <line x1="45" y1="155" x2="65" y2="155" stroke="#8B4513" stroke-width="1" />
                <line x1="45" y1="160" x2="65" y2="160" stroke="#8B4513" stroke-width="1" />
                <!-- Quill Pen -->
                <path d="M130,150 L160,120" stroke="#000" stroke-width="2" />
                <path d="M160,120 L170,110 L165,115 L160,105 L160,120" fill="#FFF" stroke="#000" stroke-width="1" />
            </svg>`,
            
            'tech.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
                <!-- Tech Tabby with headphones and digital elements -->
                <circle cx="100" cy="100" r="80" fill="#FF8C00" />
                <!-- Tabby stripes -->
                <path d="M70,60 Q100,80 130,60" fill="none" stroke="#8B4513" stroke-width="8" />
                <path d="M60,80 Q100,100 140,80" fill="none" stroke="#8B4513" stroke-width="8" />
                <path d="M50,100 Q100,120 150,100" fill="none" stroke="#8B4513" stroke-width="8" />
                <path d="M60,120 Q100,140 140,120" fill="none" stroke="#8B4513" stroke-width="8" />
                <!-- Face -->
                <circle cx="75" cy="90" r="10" fill="#FFF" />
                <circle cx="125" cy="90" r="10" fill="#FFF" />
                <circle cx="75" cy="90" r="5" fill="#000" />
                <circle cx="125" cy="90" r="5" fill="#000" />
                <!-- Whiskers -->
                <line x1="40" y1="110" x2="70" y2="105" stroke="#000" stroke-width="1" />
                <line x1="40" y1="120" x2="70" y2="115" stroke="#000" stroke-width="1" />
                <line x1="160" y1="110" x2="130" y2="105" stroke="#000" stroke-width="1" />
                <line x1="160" y1="120" x2="130" y2="115" stroke="#000" stroke-width="1" />
                <!-- Playful smile -->
                <path d="M90,115 Q100,125 110,115" fill="none" stroke="#000" stroke-width="2" />
                <!-- Ears -->
                <polygon points="60,40 45,20 75,30" fill="#FF8C00" stroke="#000" />
                <polygon points="140,40 155,20 125,30" fill="#FF8C00" stroke="#000" />
                <!-- Headphones -->
                <path d="M60,60 C30,60 30,100 30,100" fill="none" stroke="#000" stroke-width="3" />
                <path d="M140,60 C170,60 170,100 170,100" fill="none" stroke="#000" stroke-width="3" />
                <circle cx="30" cy="100" r="10" fill="#333" />
                <circle cx="170" cy="100" r="10" fill="#333" />
                <!-- Digital elements -->
                <rect x="80" y="140" width="40" height="20" rx="5" fill="#00BFFF" />
                <rect x="85" y="145" width="5" height="10" fill="#FFF" />
                <rect x="95" y="145" width="5" height="10" fill="#FFF" />
                <rect x="105" y="145" width="5" height="10" fill="#FFF" />
                <rect x="115" y="145" width="5" height="10" fill="#FFF" />
            </svg>`,
            
            'default.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
                <!-- Coding Kitty - Default friendly cat -->
                <circle cx="100" cy="100" r="80" fill="#F5A623" />
                <!-- Face -->
                <circle cx="75" cy="90" r="10" fill="#FFF" />
                <circle cx="125" cy="90" r="10" fill="#FFF" />
                <circle cx="75" cy="90" r="5" fill="#000" />
                <circle cx="125" cy="90" r="5" fill="#000" />
                <!-- Whiskers -->
                <line x1="40" y1="110" x2="70" y2="105" stroke="#000" stroke-width="1" />
                <line x1="40" y1="120" x2="70" y2="115" stroke="#000" stroke-width="1" />
                <line x1="160" y1="110" x2="130" y2="105" stroke="#000" stroke-width="1" />
                <line x1="160" y1="120" x2="130" y2="115" stroke="#000" stroke-width="1" />
                <!-- Smile -->
                <path d="M90,115 Q100,125 110,115" fill="none" stroke="#000" stroke-width="2" />
                <!-- Ears -->
                <polygon points="60,40 45,20 75,30" fill="#F5A623" stroke="#000" />
                <polygon points="140,40 155,20 125,30" fill="#F5A623" stroke="#000" />
                <!-- Code symbols -->
                <text x="80" y="150" font-family="monospace" font-size="20" fill="#000">{}</text>
                <text x="105" y="150" font-family="monospace" font-size="20" fill="#000">;</text>
            </svg>`,
            
            'logo.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
                <!-- WhiskerCode Logo -->
                <circle cx="100" cy="100" r="90" fill="#7289DA" />
                <circle cx="100" cy="100" r="80" fill="#FFF" />
                <!-- Cat face -->
                <circle cx="100" cy="105" r="60" fill="#F5A623" />
                <!-- Eyes -->
                <circle cx="80" cy="90" r="10" fill="#FFF" />
                <circle cx="120" cy="90" r="10" fill="#FFF" />
                <circle cx="80" cy="90" r="5" fill="#000" />
                <circle cx="120" cy="90" r="5" fill="#000" />
                <!-- Ears -->
                <polygon points="65,60 50,30 80,45" fill="#F5A623" stroke="#000" />
                <polygon points="135,60 150,30 120,45" fill="#F5A623" stroke="#000" />
                <!-- Nose -->
                <path d="M95,105 L105,105 L100,110 Z" fill="#FF6B6B" />
                <!-- Whiskers -->
                <line x1="50" y1="105" x2="80" y2="105" stroke="#000" stroke-width="1.5" />
                <line x1="50" y1="115" x2="80" y2="115" stroke="#000" stroke-width="1.5" />
                <line x1="150" y1="105" x2="120" y2="105" stroke="#000" stroke-width="1.5" />
                <line x1="150" y1="115" x2="120" y2="115" stroke="#000" stroke-width="1.5" />
                <!-- Smile -->
                <path d="M85,120 Q100,135 115,120" fill="none" stroke="#000" stroke-width="2" />
                <!-- Code brackets -->
                <text x="75" y="155" font-family="monospace" font-weight="bold" font-size="25" fill="#000">&lt;/&gt;</text>
            </svg>`
        };
        
        // Create each SVG file
        Object.entries(catSvgs).forEach(([filename, content]) => {
            const svgPath = path.join(catsPath, filename);
            
            // Check if file exists first
            if (!fs.existsSync(svgPath)) {
                console.log(`Creating SVG: ${filename}`);
                fs.writeFileSync(svgPath, content);
            }
        });

        // Update the cat references in CodeAnalysisEngine to use SVG files
        this.updateCatImageReferences();
    }
    
    updateCatImageReferences() {
        // Update references to cat images to use SVG instead of PNG
        try {
            const enginePath = path.join(this.context.extensionPath, 'src', 'learning', 'CodeAnalysisEngine.js');
            if (fs.existsSync(enginePath)) {
                let content = fs.readFileSync(enginePath, 'utf8');
                
                // Update image references from .png to .svg
                content = content.replace(/imageUrl: 'resources\/cats\/(.+)\.png'/g, "imageUrl: 'resources/cats/$1.svg'");
                
                fs.writeFileSync(enginePath, content);
            }
            
            // Also update the LearningPathView to handle SVG files
            const viewPath = path.join(this.context.extensionPath, 'src', 'learning', 'LearningPathView.js');
            if (fs.existsSync(viewPath)) {
                let content = fs.readFileSync(viewPath, 'utf8');
                
                // Replace any references to .png with .svg
                content = content.replace(/getResourcePath\('cats\/(.+)\.png'\)/g, "getResourcePath('cats/$1.svg')");
                
                fs.writeFileSync(viewPath, content);
            }
        } catch (error) {
            console.error('Error updating cat image references:', error);
        }
    }
    
    deactivate() {
        // Save state before deactivation
        this.saveState();
    }
}

module.exports = LearningPathManager; 