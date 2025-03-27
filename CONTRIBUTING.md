# Contributing to CodeWhiskers

Thank you for considering contributing to CodeWhiskers! We welcome contributions from everyone.

## How to Contribute

1. **Fork the Repository**
   - Fork the repository on GitHub

2. **Clone Your Fork**
   ```
   git clone https://github.com/your-username/codewhiskers.git
   cd codewhiskers
   ```

3. **Install Dependencies**
   ```
   npm install
   ```

4. **Create a Branch**
   ```
   git checkout -b feature/your-feature-name
   ```

5. **Make Your Changes**
   - Implement your feature or bug fix
   - Add or update tests as necessary
   - Make sure your code follows the existing style

6. **Test Your Changes**
   ```
   npm test
   ```

7. **Build the Extension**
   ```
   npm run webpack
   ```

8. **Commit Your Changes**
   ```
   git commit -m "Add some feature"
   ```

9. **Push to Your Fork**
   ```
   git push origin feature/your-feature-name
   ```

10. **Submit a Pull Request**
    - Go to your fork on GitHub and click the "New Pull Request" button

## Development Guidelines

- Follow the existing code style and organization
- Add comments to explain complex logic
- Update documentation for any user-facing changes
- Write tests for new features
- Keep changes focused and avoid unrelated modifications

## Adding Support for New Languages

To add support for a new programming language:

1. Update the `supportedLanguages` array in `src/parserModule.js`
2. Add language-specific parsing logic
3. Update the activation events in `package.json`
4. Test thoroughly with sample code in the new language

## Adding New Features

When adding a new feature, consider:

1. Does it align with the CodeWhiskers philosophy of making code understanding intuitive?
2. Will it maintain the kitten theme?
3. Is it optimized for performance?
4. Is it well documented?

## Reporting Issues

If you find a bug or have a suggestion:

1. Check if the issue already exists in the GitHub issue tracker
2. If not, create a new issue with:
   - A clear title
   - A detailed description
   - Steps to reproduce (for bugs)
   - Expected and actual behavior (for bugs)
   - Screenshots if applicable

## Code of Conduct

- Be respectful and inclusive
- Appreciate different viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what's best for the community

We look forward to your contributions! 😺 