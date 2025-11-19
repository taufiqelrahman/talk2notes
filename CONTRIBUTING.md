# Contributing to Talk2Notes

Thank you for your interest in contributing to Talk2Notes! This document provides guidelines and instructions for contributing.

## 📋 Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/talk2notes.git
   cd talk2notes
   ```
3. **Install dependencies**
   ```bash
   pnpm install
   ```
4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Add your API keys
   ```
5. **Create a branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```

## 💻 Development Guidelines

### Code Style

- **TypeScript**: Use for server-side logic, utilities, and data models
- **JavaScript**: Use for client components and UI
- Follow the existing code structure and patterns
- Use meaningful variable and function names
- Add comments for complex logic

### File Organization

```
Server-side (TypeScript):
- actions/      → Server Actions
- lib/          → Core libraries
- utils/        → Utility functions
- types/        → Type definitions

Client-side (JavaScript):
- components/   → React components
- app/          → Pages and layouts
```

### Naming Conventions

- **Files**: kebab-case (`validate-file.ts`, `upload-form.js`)
- **Components**: PascalCase (`UploadForm`, `NotesDisplay`)
- **Functions**: camelCase (`validateFile`, `transcribeAudio`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`, `AI_PROVIDER`)

### TypeScript Guidelines

- Define explicit types for all function parameters and return values
- Use interfaces for object shapes
- Avoid `any` type unless absolutely necessary
- Export types that may be reused

### React/Next.js Guidelines

- Use functional components
- Implement proper error boundaries
- Use Next.js Server Actions for data mutations
- Keep components focused and single-purpose
- Use proper semantic HTML

### Security Requirements

All code must follow the security guidelines in `.instructions.md`:

- Validate all inputs (client and server-side)
- Sanitize file uploads
- No hardcoded secrets
- Use parameterized queries
- Implement proper error handling
- No sensitive data in logs or error messages

## 🧪 Testing

Before submitting:

1. **Type check**

   ```bash
   pnpm type-check
   ```

2. **Lint**

   ```bash
   pnpm lint
   ```

3. **Format**

   ```bash
   pnpm format
   ```

4. **Build**

   ```bash
   pnpm build
   ```

5. **Manual testing**
   - Test with various file formats
   - Test error cases
   - Verify uploads work correctly
   - Check notes generation

## 📝 Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no logic changes)
- `refactor`: Code restructuring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples

```bash
feat(upload): add drag-and-drop support

Add drag-and-drop functionality to the upload form
for improved user experience.

Closes #123
```

```bash
fix(transcription): handle empty audio files

Add validation to prevent processing of empty
or corrupted audio files.

Fixes #456
```

## 🔀 Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all checks pass**
4. **Write a clear PR description**:
   - What changes were made
   - Why the changes were needed
   - How to test the changes
   - Screenshots (if UI changes)

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

How to test these changes

## Screenshots (if applicable)

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
- [ ] All tests pass
```

## 🐛 Bug Reports

### Before Submitting

1. Check existing issues
2. Try the latest version
3. Collect relevant information

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:

1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment**

- OS: [e.g. macOS 14.0]
- Node version: [e.g. 18.17.0]
- Browser: [e.g. Chrome 120]

**Additional context**
Any other relevant information
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
Clear description of desired functionality

**Describe alternatives you've considered**
Other approaches you've thought about

**Additional context**
Mockups, examples, etc.
```

## 🏗️ Architecture Decisions

When making significant architectural changes:

1. Open a discussion first
2. Explain the rationale
3. Consider backwards compatibility
4. Update `ARCHITECTURE.md`

## 📚 Documentation

Good documentation includes:

- Clear explanations
- Code examples
- API references
- Usage instructions
- Configuration options

Update these files as needed:

- `README.md` - Main documentation
- `ARCHITECTURE.md` - Technical details
- `CONTRIBUTING.md` - This file
- Code comments

## 🤝 Community

- Be respectful and inclusive
- Help others learn
- Share knowledge
- Provide constructive feedback
- Credit others' work

## 📧 Questions?

- Open a [Discussion](https://github.com/taufiqelrahman/talk2notes/discussions)
- Check existing [Issues](https://github.com/taufiqelrahman/talk2notes/issues)
- Review the [Architecture docs](ARCHITECTURE.md)

## 🎉 Recognition

Contributors will be:

- Listed in the project
- Credited in release notes
- Thanked in the community

Thank you for contributing to Talk2Notes! 🚀
