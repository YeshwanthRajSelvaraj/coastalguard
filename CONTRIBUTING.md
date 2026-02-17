# Contributing to CoastalGuard

Thank you for your interest in contributing to CoastalGuard! This project aims to improve the safety of coastal fishermen through technology, and every contribution makes a difference.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/coastalguard.git
   cd coastalguard
   ```
3. **Add upstream** remote:
   ```bash
   git remote add upstream https://github.com/YeshwanthRajSelvaraj/coastalguard.git
   ```
4. **Create a branch** for your work:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## How to Contribute

### 🐛 Reporting Bugs
- Use the GitHub Issues tab
- Include steps to reproduce, expected vs actual behavior
- Add screenshots if applicable

### 💡 Suggesting Features
- Open a GitHub Issue with the **Feature Request** label
- Describe the use case and expected behavior

### 🔧 Code Contributions
- Bug fixes, new features, documentation improvements are all welcome
- For major changes, please open an issue first to discuss the approach

## Development Setup

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Copy environment config
cp .env.example .env

# Start development servers
npm run dev:full
```

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Description |
|--------|------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `style:` | Code style (formatting, semicolons, etc.) |
| `refactor:` | Code refactoring |
| `test:` | Adding or updating tests |
| `chore:` | Build process or auxiliary tool changes |

**Examples:**
```
feat: add satellite channel retry mechanism
fix: resolve SOS caching issue on iOS Safari
docs: update API reference with new endpoints
```

## Pull Request Process

1. Ensure your code follows the existing code style
2. Update documentation if needed
3. Run `npm run lint` to check for linting errors
4. Write a clear PR description explaining the changes
5. Reference any related issues using `Fixes #123` or `Closes #123`
6. Request a review from maintainers

---

Thank you for contributing to CoastalGuard! 🌊
