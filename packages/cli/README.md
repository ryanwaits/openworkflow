# @openworkflow/cli

Main CLI interface for OpenWorkflow - extensible workflow automation.

## Installation

```bash
# Install globally
npm install -g @openworkflow/cli

# Or use directly with bun
bun install @openworkflow/cli
```

## Usage

```bash
# Short alias
ow <command>

# Full command
openworkflow <command>
```

## Available Workflows

- `gh` - GitHub workflow automation (releases, PRs)
- More coming soon: Linear, Jira, Slack, etc.

## Examples

```bash
# GitHub release management
ow gh release --dry-run
ow gh release minor --create-pr

# PR description generation
ow gh pr --copy
```

## Development

```bash
# Install dependencies
bun install

# Run in development
bun run dev

# Link globally for testing
bun link
```

## License

MIT