const vscode = require('vscode');

/**
 * Cat Theme Manager for CodeWhiskers
 * Manages cute cat themes and animations
 */
class CatThemeManager {
    constructor(context) {
        this._context = context;
        this._currentTheme = 'default';
        this._isSoundEnabled = false;
        
        // Load settings
        this._loadSettings();
        
        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('codewhiskers.catTheme') || 
                e.affectsConfiguration('codewhiskers.enableCatSounds')) {
                this._loadSettings();
            }
        });
        
        // Check for seasonal themes
        this._checkForSeasonalTheme();
    }
    
    /**
     * Load settings from VS Code configuration
     * @private
     */
    _loadSettings() {
        const config = vscode.workspace.getConfiguration('codewhiskers');
        this._currentTheme = config.get('catTheme', 'default');
        this._isSoundEnabled = config.get('enableCatSounds', false);
    }
    
    /**
     * Check for seasonal themes based on current date
     * @private
     */
    _checkForSeasonalTheme() {
        const currentDate = new Date();
        const month = currentDate.getMonth();
        const day = currentDate.getDate();
        
        // Halloween (October)
        if (month === 9) {
            this._seasonalTheme = 'halloween';
        }
        // Winter/Christmas (December)
        else if (month === 11) {
            this._seasonalTheme = 'winter';
        }
        // Valentine's Day (February 14)
        else if (month === 1 && day === 14) {
            this._seasonalTheme = 'valentine';
        }
        // St. Patrick's Day (March 17)
        else if (month === 2 && day === 17) {
            this._seasonalTheme = 'stpatrick';
        }
        // 4th of July
        else if (month === 6 && day === 4) {
            this._seasonalTheme = 'patriotic';
        } 
        else {
            this._seasonalTheme = null;
        }
    }
    
    /**
     * Get cat emoji for current theme
     * @returns {string} Cat emoji
     */
    getCatEmoji() {
        const theme = this._currentTheme;
        
        // If there's a seasonal theme and user hasn't explicitly changed the theme
        if (this._seasonalTheme && theme === 'default') {
            return this._getSeasonalEmoji(this._seasonalTheme);
        }
        
        // Regular themes
        switch (theme) {
            case 'grumpy': return '😾';
            case 'sleepy': return '😸';
            case 'surprise': return '😺';
            case 'love': return '😻';
            case 'sassy': return '🙀';
            case 'nerd': return '🐱‍👓';
            case 'cool': return '😎';
            case 'ninja': return '🥷';
            default: return '🐱';
        }
    }
    
    /**
     * Get seasonal emoji
     * @private
     */
    _getSeasonalEmoji(season) {
        switch (season) {
            case 'halloween': return '🎃';
            case 'winter': return '🐱❄️';
            case 'valentine': return '😻';
            case 'stpatrick': return '🍀';
            case 'patriotic': return '🇺🇸';
            default: return '🐱';
        }
    }
    
    /**
     * Get cat animation CSS for current theme
     * @returns {string} CSS animation string
     */
    getCatAnimation() {
        const theme = this._currentTheme;
        
        // If there's a seasonal theme and user hasn't explicitly changed the theme
        if (this._seasonalTheme && theme === 'default') {
            return this._getSeasonalAnimation(this._seasonalTheme);
        }
        
        // Regular theme animations
        switch (theme) {
            case 'grumpy': 
                return `
                @keyframes grumpyShake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px) rotate(-5deg); }
                    75% { transform: translateX(5px) rotate(5deg); }
                }
                animation: grumpyShake 2s infinite ease-in-out;
                `;
            case 'sleepy':
                return `
                @keyframes sleepyBounce {
                    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-10px); }
                    60% { transform: translateY(-5px); }
                }
                animation: sleepyBounce 4s infinite ease-in-out;
                `;
            case 'surprise':
                return `
                @keyframes surprisePop {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }
                animation: surprisePop 1s infinite ease-in-out;
                `;
            case 'love':
                return `
                @keyframes loveFloat {
                    0%, 100% { transform: translateY(0) rotate(0); }
                    25% { transform: translateY(-10px) rotate(5deg); }
                    50% { transform: translateY(0) rotate(0); }
                    75% { transform: translateY(-10px) rotate(-5deg); }
                }
                animation: loveFloat 3s infinite ease-in-out;
                `;
            case 'sassy':
                return `
                @keyframes sassySpin {
                    0% { transform: rotate(0); }
                    25% { transform: rotate(20deg); }
                    75% { transform: rotate(-20deg); }
                    100% { transform: rotate(0); }
                }
                animation: sassySpin 2.5s infinite ease-in-out;
                `;
            case 'nerd':
                return `
                @keyframes nerdBounce {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-15px) scale(0.9); }
                }
                animation: nerdBounce 2s infinite ease-in-out;
                `;
            case 'cool':
                return `
                @keyframes coolSlide {
                    0% { transform: translateX(-10px) rotate(-5deg); }
                    50% { transform: translateX(10px) rotate(5deg); }
                    100% { transform: translateX(-10px) rotate(-5deg); }
                }
                animation: coolSlide 3s infinite ease-in-out;
                `;
            case 'ninja':
                return `
                @keyframes ninjaFlip {
                    0%, 100% { transform: rotateY(0); }
                    50% { transform: rotateY(180deg); }
                }
                animation: ninjaFlip 2s infinite ease-in-out;
                `;
            default:
                return `
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                animation: bounce 2s infinite ease-in-out;
                `;
        }
    }
    
    /**
     * Get seasonal animation
     * @private
     */
    _getSeasonalAnimation(season) {
        switch (season) {
            case 'halloween':
                return `
                @keyframes spookyFloat {
                    0%, 100% { transform: translateY(0) rotate(0); }
                    33% { transform: translateY(-10px) rotate(5deg); }
                    66% { transform: translateY(5px) rotate(-5deg); }
                }
                animation: spookyFloat 3s infinite ease-in-out;
                `;
            case 'winter':
                return `
                @keyframes snowfall {
                    0%, 100% { transform: translateY(0) translateX(0) rotate(0); }
                    25% { transform: translateY(-5px) translateX(-5px) rotate(5deg); }
                    50% { transform: translateY(-10px) translateX(0) rotate(0); }
                    75% { transform: translateY(-5px) translateX(5px) rotate(-5deg); }
                }
                animation: snowfall 4s infinite ease-in-out;
                `;
            case 'valentine':
                return `
                @keyframes heartbeat {
                    0%, 100% { transform: scale(1); }
                    10% { transform: scale(1.1); }
                    20% { transform: scale(1); }
                    30% { transform: scale(1.1); }
                    40% { transform: scale(1); }
                }
                animation: heartbeat 2s infinite ease-in-out;
                `;
            case 'stpatrick':
                return `
                @keyframes lucky {
                    0%, 100% { transform: translateY(0) rotate(0); }
                    25% { transform: translateY(-10px) rotate(10deg); }
                    50% { transform: translateY(0) rotate(0); }
                    75% { transform: translateY(-10px) rotate(-10deg); }
                }
                animation: lucky 2.5s infinite ease-in-out;
                `;
            case 'patriotic':
                return `
                @keyframes patriotic {
                    0%, 100% { transform: scale(1) rotate(0); }
                    25% { transform: scale(1.1) rotate(5deg); }
                    50% { transform: scale(1) rotate(0); }
                    75% { transform: scale(1.1) rotate(-5deg); }
                }
                animation: patriotic 3s infinite ease-in-out;
                `;
            default:
                return `
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                animation: bounce 2s infinite ease-in-out;
                `;
        }
    }
    
    /**
     * Get background elements for theme (e.g., falling snowflakes, floating hearts)
     * @returns {string} HTML for background elements
     */
    getBackgroundElements() {
        // If there's a seasonal theme and user hasn't explicitly changed the theme
        if (this._seasonalTheme && this._currentTheme === 'default') {
            switch (this._seasonalTheme) {
                case 'halloween':
                    return this._generateFloatingElements('🦇', 8);
                case 'winter':
                    return this._generateFloatingElements('❄️', 15);
                case 'valentine':
                    return this._generateFloatingElements('❤️', 10);
                case 'stpatrick':
                    return this._generateFloatingElements('☘️', 8);
                case 'patriotic':
                    return this._generateFloatingElements('🎆', 6);
            }
        }
        
        return '';
    }
    
    /**
     * Generate floating background elements
     * @private
     */
    _generateFloatingElements(emoji, count) {
        let elements = '<div class="floating-elements">';
        
        for (let i = 0; i < count; i++) {
            const delay = Math.random() * 5;
            const duration = 5 + Math.random() * 10;
            const size = 10 + Math.random() * 20;
            const left = Math.random() * 100;
            
            elements += `
            <div class="floating-element" 
                 style="animation-delay: ${delay}s; 
                        animation-duration: ${duration}s;
                        left: ${left}%;
                        font-size: ${size}px;">
                ${emoji}
            </div>`;
        }
        
        elements += `
        <style>
            .floating-elements {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: -1;
                overflow: hidden;
            }
            
            .floating-element {
                position: absolute;
                top: -30px;
                animation: float-down linear infinite;
            }
            
            @keyframes float-down {
                from { transform: translateY(0) rotate(0); }
                to { transform: translateY(calc(100vh + 50px)) rotate(360deg); }
            }
        </style>`;
        
        return elements;
    }
    
    /**
     * Play cat sound if enabled
     * @param {string} type - Type of sound to play (e.g., 'purr', 'meow', 'hiss')
     */
    playSound(type) {
        if (!this._isSoundEnabled) return;
        
        // Create audio element and play sound
        // This could be done by messaging the webview to play the sound
        // For now, we'll just log it
        console.log(`Cat sound: ${type}`);
    }
    
    /**
     * Get CSS styles for cat theme
     * @returns {string} CSS styles for current theme
     */
    getThemeCSS() {
        const theme = this._currentTheme;
        
        // If there's a seasonal theme and user hasn't explicitly changed the theme
        if (this._seasonalTheme && theme === 'default') {
            return this._getSeasonalCSS(this._seasonalTheme);
        }
        
        // Regular theme styles
        switch (theme) {
            case 'grumpy':
                return `
                .cat-image { filter: hue-rotate(280deg); }
                `;
            case 'cool':
                return `
                .cat-image { filter: hue-rotate(210deg) saturate(1.5); }
                .cat-container h1 { color: #66aaff; }
                `;
            case 'love':
                return `
                .cat-image { filter: hue-rotate(320deg) saturate(1.5); }
                .cat-container { color: #ff6688; }
                `;
            case 'nerd':
                return `
                .cat-image { position: relative; }
                .cat-image::after {
                    content: "🤓";
                    position: absolute;
                    font-size: 20px;
                    top: 40%;
                    left: 60%;
                    transform: translate(-50%, -50%);
                }
                `;
            default:
                return '';
        }
    }
    
    /**
     * Get seasonal CSS styles
     * @private
     */
    _getSeasonalCSS(season) {
        switch (season) {
            case 'halloween':
                return `
                .cat-container h1 { color: #ff6600; }
                .cat-container { text-shadow: 0 0 5px #ff6600; }
                `;
            case 'winter':
                return `
                .cat-container h1 { color: #66aaff; }
                .cat-container { text-shadow: 0 0 10px #66aaff; }
                `;
            case 'valentine':
                return `
                .cat-container h1 { color: #ff6688; }
                .cat-container { text-shadow: 0 0 5px #ff6688; }
                `;
            case 'stpatrick':
                return `
                .cat-container h1 { color: #00cc66; }
                .cat-container { text-shadow: 0 0 5px #00cc66; }
                `;
            case 'patriotic':
                return `
                .cat-container h1 { 
                    background: linear-gradient(90deg, #ff0000, #ffffff, #0000ff);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                }
                `;
            default:
                return '';
        }
    }
    
    /**
     * Get all available themes
     * @returns {object[]} List of available themes
     */
    getAvailableThemes() {
        const themes = [
            { id: 'default', name: 'Default Cat', emoji: '🐱' },
            { id: 'grumpy', name: 'Grumpy Cat', emoji: '😾' },
            { id: 'sleepy', name: 'Sleepy Cat', emoji: '😸' },
            { id: 'surprise', name: 'Surprised Cat', emoji: '😺' },
            { id: 'love', name: 'Loving Cat', emoji: '😻' },
            { id: 'sassy', name: 'Sassy Cat', emoji: '🙀' },
            { id: 'nerd', name: 'Nerd Cat', emoji: '🐱‍👓' },
            { id: 'cool', name: 'Cool Cat', emoji: '😎' },
            { id: 'ninja', name: 'Ninja Cat', emoji: '🥷' }
        ];
        
        // Add seasonal theme if available
        if (this._seasonalTheme) {
            let seasonalName = '';
            let seasonalEmoji = '';
            
            switch (this._seasonalTheme) {
                case 'halloween':
                    seasonalName = 'Halloween Cat';
                    seasonalEmoji = '🎃';
                    break;
                case 'winter':
                    seasonalName = 'Winter Cat';
                    seasonalEmoji = '🐱❄️';
                    break;
                case 'valentine':
                    seasonalName = 'Valentine Cat';
                    seasonalEmoji = '😻';
                    break;
                case 'stpatrick':
                    seasonalName = 'Lucky Cat';
                    seasonalEmoji = '🍀';
                    break;
                case 'patriotic':
                    seasonalName = 'Patriotic Cat';
                    seasonalEmoji = '🇺🇸';
                    break;
            }
            
            if (seasonalName) {
                themes.unshift({
                    id: this._seasonalTheme,
                    name: seasonalName,
                    emoji: seasonalEmoji,
                    isSeasonal: true
                });
            }
        }
        
        return themes;
    }
    
    /**
     * Show theme picker and let user select a theme
     */
    async showThemePicker() {
        const themes = this.getAvailableThemes();
        
        const items = themes.map(theme => ({
            label: `${theme.emoji} ${theme.name}`,
            description: theme.isSeasonal ? 'Seasonal theme' : '',
            id: theme.id
        }));
        
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a cat theme'
        });
        
        if (selected) {
            // Update the setting
            const config = vscode.workspace.getConfiguration('codewhiskers');
            await config.update('catTheme', selected.id, true);
            
            // Update current theme
            this._currentTheme = selected.id;
            
            // Show confirmation
            vscode.window.showInformationMessage(`Cat theme changed to ${selected.label}`);
        }
    }
}

module.exports = CatThemeManager; 