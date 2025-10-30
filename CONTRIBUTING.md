# Contributing to Ecosystem Dynamics Sandbox

Thank you for your interest in contributing to the Ecosystem Dynamics Sandbox! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your feature/fix
4. Make your changes
5. Test your changes thoroughly
6. Submit a pull request

## Development Setup

1. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

2. Set up MongoDB locally or use MongoDB Atlas

3. Configure environment variables:
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

4. Run the development servers:
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

## Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Testing

Before submitting a PR:
- Ensure all existing tests pass
- Add tests for new functionality
- Test the application manually
- Check for console errors

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Ensure your PR description clearly describes the problem and solution
3. Reference any relevant issues
4. Request review from maintainers

## Reporting Issues

When reporting issues, please include:
- Clear description of the problem
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Browser/OS information

## Feature Requests

We welcome feature requests! Please:
- Check existing issues first
- Provide clear use cases
- Explain the expected behavior
- Consider submitting a PR if you can implement it

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
