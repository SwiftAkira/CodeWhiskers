const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

class CodeAnalysisEngine {
    constructor() {
        this.codeMetrics = {
            languages: {},
            patterns: {},
            complexityScores: {},
            bestPractices: {},
            securityIssues: {},
            performanceIssues: {}
        };
        this.userProfile = {
            skillLevel: 'beginner', // beginner, intermediate, advanced
            strengths: [],
            areasForImprovement: [],
            completedChallenges: [],
            learningPath: []
        };
        this.analysisHistory = [];
    }

    async analyzeWorkspace() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return;

        for (const folder of workspaceFolders) {
            await this.analyzeFolder(folder.uri.fsPath);
        }
        
        this.generateUserProfile();
        return this.userProfile;
    }

    async analyzeFolder(folderPath) {
        const files = await this.getFilesInFolder(folderPath);
        
        for (const file of files) {
            if (this.isCodeFile(file)) {
                await this.analyzeFile(file);
            }
        }
    }

    async getFilesInFolder(folderPath) {
        // List all files in the folder
        const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });
        
        let files = [];
        for (const entry of entries) {
            const fullPath = path.join(folderPath, entry.name);
            
            if (entry.isDirectory() && !this.isIgnoredDirectory(entry.name)) {
                const subFiles = await this.getFilesInFolder(fullPath);
                files.push(...subFiles);
            } else if (entry.isFile()) {
                files.push(fullPath);
            }
        }
        
        return files;
    }

    isIgnoredDirectory(dirName) {
        const ignoredDirs = ['node_modules', 'dist', 'build', '.git', '.vscode'];
        return ignoredDirs.includes(dirName);
    }

    isCodeFile(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const supportedExtensions = [
            '.js', '.ts', '.jsx', '.tsx',  // JavaScript/TypeScript
            '.py',                         // Python
            '.java',                       // Java
            '.cs',                         // C#
            '.html', '.css',               // Web
            '.go',                         // Go
            '.php',                        // PHP
            '.rb'                          // Ruby
        ];
        
        return supportedExtensions.includes(ext);
    }

    async analyzeFile(filePath) {
        const content = await fs.promises.readFile(filePath, 'utf8');
        const ext = path.extname(filePath).toLowerCase();
        
        // Track language usage
        this.trackLanguageUsage(ext);
        
        // Analyze content based on language
        this.analyzeContent(content, ext);
    }

    trackLanguageUsage(extension) {
        const langMap = {
            '.js': 'JavaScript',
            '.ts': 'TypeScript',
            '.jsx': 'React (JS)',
            '.tsx': 'React (TS)',
            '.py': 'Python',
            '.java': 'Java',
            '.cs': 'C#',
            '.html': 'HTML',
            '.css': 'CSS',
            '.go': 'Go',
            '.php': 'PHP',
            '.rb': 'Ruby'
        };
        
        const lang = langMap[extension] || 'Other';
        this.codeMetrics.languages[lang] = (this.codeMetrics.languages[lang] || 0) + 1;
    }

    analyzeContent(content, extension) {
        // Detect patterns based on language
        switch (extension) {
            case '.js':
            case '.jsx':
            case '.ts':
            case '.tsx':
                this.analyzeJavaScript(content, extension);
                break;
            case '.py':
                this.analyzePython(content);
                break;
            case '.java':
                this.analyzeJava(content);
                break;
            // Add more language analyzers as needed
            default:
                // Generic analysis for other languages
                this.analyzeGeneric(content);
        }
    }

    analyzeJavaScript(content, extension) {
        // Track common JavaScript patterns
        const patterns = {
            // ES6 features
            arrowFunctions: (content.match(/=>/g) || []).length,
            destructuring: (content.match(/\{[\s\w,]+\}\s*=/g) || []).length,
            templateLiterals: (content.match(/`[^`]*`/g) || []).length,
            asyncAwait: (content.match(/async|await/g) || []).length,
            
            // Best practices
            consoleLog: (content.match(/console\.log/g) || []).length,
            todoComments: (content.match(/\/\/\s*TODO/g) || []).length,
            
            // React patterns (for JSX/TSX)
            reactHooks: extension.includes('sx') ? (content.match(/use[A-Z]\w+/g) || []).length : 0,
            reactComponents: extension.includes('sx') ? (content.match(/function\s+[A-Z]\w+|class\s+[A-Z]\w+\s+extends/g) || []).length : 0,
            
            // Potential issues
            nestedCallbacks: (content.match(/\)\s*=>\s*\{[^\}]*=>/g) || []).length,
            longFunctions: 0, // Calculated below
        };
        
        // Calculate long functions
        const functionMatches = content.match(/function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/g) || [];
        for (const func of functionMatches) {
            if (func.split('\n').length > 30) {
                patterns.longFunctions++;
            }
        }
        
        // Update metrics
        Object.keys(patterns).forEach(key => {
            this.codeMetrics.patterns[key] = (this.codeMetrics.patterns[key] || 0) + patterns[key];
        });
    }

    analyzePython(content) {
        // Python-specific analysis
        const patterns = {
            listComprehensions: (content.match(/\[\s*[\w\s\._]+\s+for\s+[\w\s\._]+\s+in\s+[\w\s\._]+\s*\]/g) || []).length,
            decorators: (content.match(/@[\w\.]+/g) || []).length,
            fStrings: (content.match(/f['"][^'"]*['"]/g) || []).length,
            // Add more Python patterns
        };
        
        // Update metrics
        Object.keys(patterns).forEach(key => {
            this.codeMetrics.patterns[key] = (this.codeMetrics.patterns[key] || 0) + patterns[key];
        });
    }

    analyzeJava(content) {
        // Java-specific analysis
        const patterns = {
            streamAPI: (content.match(/\.stream\(\)/g) || []).length,
            lambdaExpressions: (content.match(/\s->\s/g) || []).length,
            // Add more Java patterns
        };
        
        // Update metrics
        Object.keys(patterns).forEach(key => {
            this.codeMetrics.patterns[key] = (this.codeMetrics.patterns[key] || 0) + patterns[key];
        });
    }

    analyzeGeneric(content) {
        // Generic code metrics for any language
        const lines = content.split('\n').length;
        const comments = (content.match(/\/\/|\/\*|\*/g) || []).length;
        const commentRatio = comments / lines;
        
        // Update metrics
        this.codeMetrics.complexityScores['lineCount'] = (this.codeMetrics.complexityScores['lineCount'] || 0) + lines;
        this.codeMetrics.complexityScores['commentRatio'] = (this.codeMetrics.complexityScores['commentRatio'] || 0) + commentRatio;
    }

    generateUserProfile() {
        // Determine skill level based on code metrics
        this.determineSkillLevel();
        
        // Identify strengths
        this.identifyStrengths();
        
        // Identify areas for improvement
        this.identifyAreasForImprovement();
        
        // Generate learning path
        this.generateLearningPath();
        
        // Save analysis for historical tracking
        this.analysisHistory.push({
            timestamp: new Date(),
            metrics: { ...this.codeMetrics },
            profile: { ...this.userProfile }
        });
    }

    determineSkillLevel() {
        // Simple algorithm to determine skill level based on patterns
        let score = 0;
        
        // Advanced patterns increase score
        const advancedPatterns = ['asyncAwait', 'destructuring', 'arrowFunctions', 'listComprehensions', 'streamAPI'];
        advancedPatterns.forEach(pattern => {
            score += (this.codeMetrics.patterns[pattern] || 0);
        });
        
        // Best practices increase score
        const bestPracticeMetrics = ['commentRatio'];
        bestPracticeMetrics.forEach(metric => {
            if ((this.codeMetrics.complexityScores[metric] || 0) > 0.1) {
                score += 5;
            }
        });
        
        // Issues decrease score
        const issuePatterns = ['nestedCallbacks', 'longFunctions', 'consoleLog'];
        issuePatterns.forEach(pattern => {
            score -= (this.codeMetrics.patterns[pattern] || 0);
        });
        
        // Set skill level based on score
        if (score > 20) {
            this.userProfile.skillLevel = 'advanced';
        } else if (score > 5) {
            this.userProfile.skillLevel = 'intermediate';
        } else {
            this.userProfile.skillLevel = 'beginner';
        }
    }

    identifyStrengths() {
        this.userProfile.strengths = [];
        
        // Identify language strengths
        const languages = Object.keys(this.codeMetrics.languages)
            .sort((a, b) => this.codeMetrics.languages[b] - this.codeMetrics.languages[a])
            .slice(0, 2); // Top 2 languages
            
        languages.forEach(lang => {
            if (this.codeMetrics.languages[lang] > 3) {
                this.userProfile.strengths.push(`${lang} Development`);
            }
        });
        
        // Identify pattern strengths
        const patternStrengths = {
            'Modern JavaScript': ['arrowFunctions', 'destructuring', 'templateLiterals', 'asyncAwait'],
            'React Development': ['reactHooks', 'reactComponents'],
            'Python Idioms': ['listComprehensions', 'decorators', 'fStrings'],
            'Java Modern Features': ['streamAPI', 'lambdaExpressions']
        };
        
        Object.keys(patternStrengths).forEach(strength => {
            const patterns = patternStrengths[strength];
            const patternScore = patterns.reduce((sum, pattern) => sum + (this.codeMetrics.patterns[pattern] || 0), 0);
            
            if (patternScore > 5) {
                this.userProfile.strengths.push(strength);
            }
        });
    }

    identifyAreasForImprovement() {
        this.userProfile.areasForImprovement = [];
        
        // Identify code quality issues
        const qualityIssues = {
            'Code Complexity': ['longFunctions', 'nestedCallbacks'],
            'Debugging Practices': ['consoleLog'],
            'Code Documentation': ['commentRatio'],
            'Modern Features': ['asyncAwait', 'destructuring', 'arrowFunctions', 'listComprehensions']
        };
        
        // Check for quality issues
        if ((this.codeMetrics.patterns['longFunctions'] || 0) > 2 || 
            (this.codeMetrics.patterns['nestedCallbacks'] || 0) > 3) {
            this.userProfile.areasForImprovement.push('Code Complexity');
        }
        
        if ((this.codeMetrics.patterns['consoleLog'] || 0) > 5) {
            this.userProfile.areasForImprovement.push('Debugging Practices');
        }
        
        if ((this.codeMetrics.complexityScores['commentRatio'] || 0) < 0.05) {
            this.userProfile.areasForImprovement.push('Code Documentation');
        }
        
        // Check for missing modern features
        const modernFeatures = ['asyncAwait', 'destructuring', 'arrowFunctions', 'listComprehensions'];
        const usesModernFeatures = modernFeatures.some(feature => (this.codeMetrics.patterns[feature] || 0) > 0);
        
        if (!usesModernFeatures && this.userProfile.skillLevel !== 'advanced') {
            this.userProfile.areasForImprovement.push('Modern Language Features');
        }
    }

    generateLearningPath() {
        this.userProfile.learningPath = [];
        
        // Generate learning challenges based on areas for improvement
        const improvementAreas = this.userProfile.areasForImprovement;
        const skillLevel = this.userProfile.skillLevel;
        
        // Map of learning challenges by area and skill level
        const learningChallenges = {
            'Code Complexity': {
                beginner: ['Refactor a simple function', 'Extract helper methods'],
                intermediate: ['Apply single responsibility principle', 'Use pure functions'],
                advanced: ['Implement design patterns', 'Apply functional programming concepts']
            },
            'Debugging Practices': {
                beginner: ['Use breakpoints instead of console.log', 'Debug with VS Code tools'],
                intermediate: ['Create reusable debugging utilities', 'Implement error boundaries'],
                advanced: ['Write unit tests for debugging', 'Implement logging strategy']
            },
            'Code Documentation': {
                beginner: ['Add function comments', 'Document public APIs'],
                intermediate: ['Generate documentation', 'Create README files'],
                advanced: ['Implement style guides', 'Create architecture diagrams']
            },
            'Modern Language Features': {
                beginner: ['Use template literals', 'Apply array methods'],
                intermediate: ['Implement async/await', 'Use destructuring'],
                advanced: ['Apply advanced patterns', 'Use newest language features']
            }
        };
        
        // Generate challenges based on areas for improvement
        improvementAreas.forEach(area => {
            if (learningChallenges[area] && learningChallenges[area][skillLevel]) {
                learningChallenges[area][skillLevel].forEach(challenge => {
                    this.userProfile.learningPath.push({
                        area,
                        challenge,
                        difficulty: skillLevel,
                        completed: false,
                        catCharacter: this.getCatCharacterForChallenge(area)
                    });
                });
            }
        });
        
        // Add some challenges from strengths to build confidence
        if (this.userProfile.strengths.length > 0) {
            const strengthArea = this.userProfile.strengths[0];
            let matchedArea = null;
            
            // Find matching area in learning challenges
            Object.keys(learningChallenges).forEach(area => {
                if (strengthArea.includes(area)) {
                    matchedArea = area;
                }
            });
            
            if (matchedArea && learningChallenges[matchedArea]) {
                const nextLevel = this.getNextSkillLevel(skillLevel);
                if (learningChallenges[matchedArea][nextLevel]) {
                    // Add one challenge from the next skill level for a strength area
                    this.userProfile.learningPath.push({
                        area: matchedArea,
                        challenge: learningChallenges[matchedArea][nextLevel][0],
                        difficulty: nextLevel,
                        completed: false,
                        catCharacter: this.getCatCharacterForChallenge(matchedArea)
                    });
                }
            }
        }
    }
    
    getNextSkillLevel(currentLevel) {
        if (currentLevel === 'beginner') return 'intermediate';
        if (currentLevel === 'intermediate') return 'advanced';
        return 'advanced';
    }
    
    getCatCharacterForChallenge(area) {
        // Map areas to cat characters with personalities
        const catCharacters = {
            'Code Complexity': {
                name: 'Professor Paws',
                personality: 'Wise and methodical',
                imageUrl: 'cats/professor.svg'
            },
            'Debugging Practices': {
                name: 'Detective Whiskers',
                personality: 'Curious and thorough',
                imageUrl: 'cats/detective.svg'
            },
            'Code Documentation': {
                name: 'Scribe Kitty',
                personality: 'Organized and meticulous',
                imageUrl: 'cats/scribe.svg'
            },
            'Modern Language Features': {
                name: 'Tech Tabby',
                personality: 'Innovative and playful',
                imageUrl: 'cats/tech.svg'
            }
        };
        
        return catCharacters[area] || {
            name: 'Coding Kitty',
            personality: 'Friendly and helpful',
            imageUrl: 'cats/default.svg'
        };
    }
}

module.exports = CodeAnalysisEngine; 