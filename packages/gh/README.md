# @openworkflow/gh

GitHub workflow automation package for OpenWorkflow.

## Features

- **Release Management**: Automated release creation with AI-generated notes
- **PR Management**: Generate and manage PR descriptions
- **Version Management**: Semantic versioning support
- **AI Integration**: Powered by Anthropic's Claude for intelligent content generation

## Installation

```bash
npm install @openworkflow/gh
```

## Usage

This package is designed to be used through the OpenWorkflow CLI or programmatically:

```typescript
import { releaseCommand, prCommand } from '@openworkflow/gh';
```

## Commands

### Release Command

Manages GitHub releases with version bumping and AI-generated release notes.

### PR Command

Generates and manages pull request descriptions based on commits and included PRs.

## Configuration

See the main OpenWorkflow documentation for configuration options.

## Environment Variables

- `ANTHROPIC_API_KEY` - Required for AI features

## License

MIT