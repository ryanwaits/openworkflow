# OpenWorkflow

Extensible workflow automation CLI built as a monorepo. OpenWorkflow provides modular workflow automation tools for various platforms and services.

## Overview

OpenWorkflow is designed to be a comprehensive automation toolkit with pluggable workflow modules:

- **@openworkflow/gh** - GitHub workflow automation (releases, PRs, etc.)
- **@openworkflow/cli** - Main CLI interface
- Future: Linear, Jira, Slack, and more

## Installation

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Link CLI globally
cd packages/cli
bun link
```

## Usage

```bash
# GitHub workflows
ow gh release --dry-run
ow gh release minor --create-pr
ow gh pr --copy

# Or with full command
openworkflow gh release patch --dry-run --copy
```

## Available Commands

### GitHub (`gh`)

#### Release Management
```bash
ow gh release [version]
```

Options:
- `[version]` - Version bump type (major|minor|patch) or specific version
- `-d, --dry-run` - Preview without creating anything
- `-c, --copy` - Copy to clipboard
- `-p, --create-pr` - Create release PR
- `-r, --create-release` - Create GitHub release
- `--publish` - Publish release immediately
- `-b, --branch <branch>` - Source branch
- `-t, --target <branch>` - Target branch

#### PR Management
```bash
ow gh pr
```

Options:
- `-s, --source <branch>` - Source branch
- `-t, --target <branch>` - Target branch
- `-c, --copy` - Copy to clipboard
- `--create` - Create the PR
- `-d, --dry-run` - Preview without creating

## Configuration

Create `.openworkflow.json` in your project root:

```json
{
  "github": {
    "defaultBranch": "develop",
    "mainBranch": "main",
    "ai": {
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022"
    }
  }
}
```

## Development

```bash
# Run in development mode
bun run dev

# Run tests
bun test

# Build all packages
bun run build
```

## Environment Variables

- `ANTHROPIC_API_KEY` - Required for AI-powered features

## License

MIT
