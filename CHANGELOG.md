# Change Log

All notable changes to the "WhiskerCode" extension will be documented in this file.

## [1.2.4] - 2024-03-27

### Added
- Direct issue fixing from Performance Analysis panel:
  - Added "Fix Issue" buttons to each performance issue card
  - One-click fixing without returning to editor
  - Visual feedback with success/error messages
  - Real-time status updates on fixed issues
  - Sorting and filtering of issues by severity

## [1.2.3] - 2024-03-27

### Added
- Enhanced code fix experience:
  - Added preview window for suggested code changes
  - Green highlighting for modified code sections
  - Confirmation dialog before applying changes
  - Option to cancel fixes if not desired
  - Detailed side-by-side comparison of original and fixed code
- Improved user feedback:
  - Success and error messages for fix operations
  - Clear visualization of code differences
  - Severity indicators for performance issues

## [1.2.2] - 2024-03-27

### Changed
- Enhanced visual identity with cat icons:
  - Added cat emoji (🐱) to all command titles
  - Added cat icons to Code Lens displays for better visibility
  - Added cat emoji to Quick Fix action titles
  - Improved distinction from other extensions in menus and action lists
- UI improvements:
  - Moved editor title commands to dropdown menus to reduce clutter
  - Better organization of commands in editor UI

## [1.2.1] - 2024-03-27

### Fixed
- Performance Analysis visualization improvements:
  - Fixed duplicate "Performance Analysis" title
  - Enhanced headings with better contrast and readability
  - Corrected missing Low Severity tab content
  - Improved styling and layout for better user experience
- Function Dependency Graph enhancements:
  - Added zoom and pan controls
  - Improved initial scaling to better fit the screen
  - Added node information panel showing function details on hover
  - Optimized force simulation parameters for better node spacing
  - Added responsive behavior for window resizing

## [1.2.0] - 2024-03-20

### Added
- Code Lens integration
  - View complexity metrics directly above functions
  - Performance issue indicators in the editor
  - Refactoring opportunities shown inline
  - React component-specific insights
- Quick Fix suggestions
  - One-click fixes for performance issues
  - Automated refactoring options
  - Context-aware code improvements
- Code Actions for common issues
  - Fix memory management problems
  - Optimize async/await patterns
  - Simplify complex logic

## [1.1.0] - 2024-03-20

### Added
- Advanced code parsing capabilities with support for modern language features
  - Enhanced detection of ES6+ JavaScript features
  - Improved TypeScript parsing with generic type support
  - React component and hook pattern recognition
- Enhanced performance analysis engine
  - Algorithmic complexity detection (O(1), O(n), O(n²), O(n³))
  - Memory usage optimization suggestions
  - Space complexity analysis
  - Best practices recommendations
- Cognitive complexity metrics
  - Code maintainability scoring
  - Nesting depth analysis
  - Refactoring opportunity detection
- Duplicated code pattern finder
- Context-aware optimizations for:
  - React components and hooks
  - Async/await and Promise patterns
  - DOM manipulation
  - Data structure selection

## [1.0.3] - 2024-03-20

### Added
- Keyboard shortcuts for commonly used features
  - `Ctrl/Cmd+Shift+E`: Explain selected code
  - `Ctrl/Cmd+Shift+T`: Trace variable usage
  - `Ctrl/Cmd+Shift+P`: Detect performance issues
  - `Ctrl/Cmd+Shift+C`: Analyze code complexity
- Status bar integration for quick access to features
- Improved command palette organization with categories and icons
- Enhanced visual feedback with emojis in command titles

## [1.0.2] - 2024-03-20

### Fixed
- Updated repository URLs to point to the correct GitHub repository
- Improved documentation links and references

## [1.0.1] - 2024-03-20

### Changed
- Rebranded extension from CodeWhiskers to WhiskerCode
- Updated all command references to use the new prefix
- Refreshed documentation to reflect new branding

## [1.0.0] - 2024-03-19

### Added
- Initial release of WhiskerCode
- Code explanation feature with kitten-themed UI
- Variable tracing functionality
- Performance hotspot detection
- Code complexity analysis
- Function dependency visualization
- Multiple cat themes for UI customization
- Documentation suggestion system 