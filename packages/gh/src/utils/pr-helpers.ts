// Generate PR title from branch name
export function generatePRTitle(branchName: string): string {
  // Common branch patterns
  const patterns = [
    { regex: /^(feat|feature)\/(.+)$/, type: 'feat' },
    { regex: /^(fix|bugfix|hotfix)\/(.+)$/, type: 'fix' },
    { regex: /^(chore|task)\/(.+)$/, type: 'chore' },
    { regex: /^(docs|documentation)\/(.+)$/, type: 'docs' },
    { regex: /^(refactor|refactoring)\/(.+)$/, type: 'refactor' },
    { regex: /^(test|tests|testing)\/(.+)$/, type: 'test' },
    { regex: /^(style|styling)\/(.+)$/, type: 'style' },
    { regex: /^(perf|performance)\/(.+)$/, type: 'perf' },
  ];

  for (const pattern of patterns) {
    const match = branchName.match(pattern.regex);
    if (match) {
      const type = pattern.type;
      const description = match[2]
        .replace(/[-_]/g, ' ')
        .toLowerCase()
        .trim();
      return `${type}: ${description}`;
    }
  }

  // Fallback: just clean up the branch name
  const cleanedName = branchName
    .replace(/[-_]/g, ' ')
    .toLowerCase()
    .trim();
  
  return `chore: ${cleanedName}`;
}