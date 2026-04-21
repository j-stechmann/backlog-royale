# Contributing to Backlog Royale

First off, thank you for considering contributing to Backlog Royale! It's people like you that make the agile community better.

## How Can I Contribute?

### Reporting Bugs

- Check the [Issues](https://github.com/your-username/backlog-royale/issues) to see if the bug has already been reported.
- If not, create a new issue. Provide a clear title, a detailed description, and steps to reproduce the bug.

### Suggesting Enhancements

- Open a new issue with the tag "enhancement".
- Describe the feature you'd like to see and why it would be useful.

### Pull Requests

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix: `git checkout -b feature/your-feature-name`.
3.  Make your changes.
4.  Ensure your code follows the existing style and passes linting.
    - Frontend: `npm run lint`
    - Backend: `go fmt ./...`
5.  Commit your changes: `git commit -m "Add some feature"`.
6.  Push to your branch: `git push origin feature/your-feature-name`.
7.  Open a Pull Request against the `main` branch.

## Development Environment Setup

Please refer to the [Getting Started](README.md#getting-started) section in the main README for instructions on how to set up your local development environment.

## Development Standards & "Laws"

To ensure the project remains stable and maintainable, all contributors (including AI agents) must adhere to the following:

### 1. Verification is Mandatory
Before submitting any pull request or finalizing changes:
- **Backend**: Run `go test -v ./...` and ensure all tests pass.
- **Frontend**: Run `npm run test` and `npm run lint`.
- **New Features**: Must include accompanying unit tests (Go `*_test.go` or Vitest `*.test.ts`).

### 2. Backend (Go) Patterns
- **Logging**: Use `log/slog` for structured logging. Never use `fmt.Printf` or standard `log` for application logs.
- **WebSocket Messages**: Use strictly typed structs for JSON communication. Avoid `map[string]interface{}`.
- **Configuration**: Use environment variables via `os.Getenv` in `main.go`.

### 3. Frontend (React) Patterns
- **Testing**: Use **Vitest** and **React Testing Library**.
- **State Management**: Prefer hooks and context over global state libraries unless complexity demands otherwise.
- **API/WS URLs**: Never hardcode URLs. Use `import.meta.env` as documented in `CONFIGURATION.md`.

### 4. Continuous Integration
The project uses GitHub Actions (see `.github/workflows/ci.yml`). Ensure your changes do not break the CI pipeline.

### 5. Documentation
If you add or change a configuration variable, you **must** update `CONFIGURATION.md` and the relevant service README.

## License

By contributing to Backlog Royale, you agree that your contributions will be licensed under its [GPLv2 License](LICENSE).
