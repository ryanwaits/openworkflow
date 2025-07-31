import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import type { PRDetails, ReleaseNotes } from '../types';
import { loadConfig } from './config';
import chalk from 'chalk';

export async function generateReleaseNotes(
  prs: PRDetails[],
  version: string,
  previousVersion: string | null
): Promise<string> {
  const config = loadConfig();
  const model = config.ai?.model || 'claude-3-5-sonnet-20241022';

  const prSummary = prs.map(pr =>
    `PR #${pr.number}: ${pr.title}
Author: @${pr.author}
Labels: ${pr.labels?.join(', ') || 'None'}
Commit: ${pr.mergeCommitSha || 'unknown'}
Description: ${pr.body ? pr.body.substring(0, 200) + (pr.body.length > 200 ? '...' : '') : 'No description'}`
  ).join('\n\n---\n\n');

  const prompt = `You are creating release notes for version ${version}.

Based on the following merged PRs, create release notes following these STRICT rules:

1. DO NOT include a title header - start directly with the sections
2. Group changes ONLY into these sections (use emoji headers):
   - ## ✨ Features
   - ## 🪲 Bug Fixes
   - ## 📚 Documentation
   - ## 🧹 Maintenance
3. For each PR, format as: "- {description} (#PR_NUMBER) (COMMIT_HASH)"
   Example: "- Fixed parameter population from OpenAPI examples in API playground (#1031) (a69340b)"
4. NO upgrade instructions, NO breaking changes section, NO general statements
5. Focus on SPECIFIC changes only
6. At the end, add "## Contributors" section listing all unique authors as "- @username"

PRs included in this release:

${prSummary}

Remember: Keep descriptions specific and concise. Reference format must be (#number) (hash).`;

  try {
    const { text } = await generateText({
      model: anthropic(model),
      prompt,
      maxRetries: 5,
      abortSignal: AbortSignal.timeout(30000), // 30 second timeout
    });

    return text;
  } catch (error: any) {
    console.error('Error generating release notes:', error);

    // Handle overloaded API
    if (error.statusCode === 529 || error.message?.includes('Overloaded')) {
      console.log(chalk.yellow('\n⚠️  AI service is currently overloaded. Please try again in a few moments.'));
      console.log(chalk.dim('Tip: You can use --dry-run to see what would be generated'));
    } else if (error.message?.includes('timeout')) {
      console.log(chalk.yellow('\n⚠️  Request timed out. The AI service might be slow.'));
    }

    throw error;
  }
}

export async function generatePRDescription(
  commits: string[],
  prs: PRDetails[],
  targetBranch: string,
  sourceBranch: string
): Promise<string> {
  const config = loadConfig();
  const model = config.ai?.model || 'claude-3-5-sonnet-20241022';

  let prompt = `You are creating a pull request description for merging ${sourceBranch} into ${targetBranch}.

This PR includes ${commits.length} commits`;

  if (prs.length > 0) {
    const prSummary = prs.map(pr =>
      `PR #${pr.number}: ${pr.title}
Changes: +${pr.additions || 0} -${pr.deletions || 0} in ${pr.changedFiles || 0} files
Labels: ${pr.labels?.join(', ') || 'None'}
Description: ${pr.body || 'No description'}`
    ).join('\n\n---\n\n');

    prompt += ` and ${prs.length} pull requests.

Pull Requests included:
${prSummary}`;
  } else {
    prompt += `.

Commit messages:
${commits.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;
  }

  prompt += `

Create a MINIMAL PR description following these rules:
1. Write 1-2 sentences summarizing what changed
2. If there are multiple changes, use bullet points (maximum 5)
3. NO headers, NO sections, NO markdown formatting
4. Keep it casual and brief
5. Don't include testing checklists or related sections
6. ${prs.length > 0 ? 'Reference PRs as #123' : 'Focus on the actual changes made'}

Example good description:
"Updates clarity function organization and adds new data helpers section for better code structure."

Example with bullets:
"Reorganizes clarity functions for better structure
• Groups related functions together
• Adds new data helpers section
• No breaking changes"`;

  try {
    const { text } = await generateText({
      model: anthropic(model),
      prompt,
      maxRetries: 5,
      abortSignal: AbortSignal.timeout(30000), // 30 second timeout
    });

    return text;
  } catch (error: any) {
    console.error('Error generating PR description:', error);

    // Handle overloaded API
    if (error.statusCode === 529 || error.message?.includes('Overloaded')) {
      console.log(chalk.yellow('\n⚠️  AI service is currently overloaded. Please try again in a few moments.'));
      console.log(chalk.dim('Tip: The API usually recovers within 30-60 seconds'));
    } else if (error.message?.includes('timeout')) {
      console.log(chalk.yellow('\n⚠️  Request timed out. The AI service might be slow.'));
    }

    throw error;
  }
}

export async function generateReleasePRDescription(
  prs: PRDetails[],
  version: string
): Promise<string> {
  const config = loadConfig();
  const model = config.ai?.model || 'claude-3-5-sonnet-20241022';

  const prSummary = prs.map(pr =>
    `PR #${pr.number}: ${pr.title}
Author: @${pr.author}
Labels: ${pr.labels?.join(', ') || 'None'}
Commit: ${pr.mergeCommitSha || 'unknown'}
Description: ${pr.body ? pr.body.substring(0, 200) + (pr.body.length > 200 ? '...' : '') : 'No description'}`
  ).join('\n\n---\n\n');

  const prompt = `You are creating a pull request description for release ${version}.

Based on the following merged PRs, create a SIMPLE release PR description following these STRICT rules:

1. Output ONLY a flat bullet list - nothing else
2. Use PRESENT TENSE verbs (Fix, Add, Update, Remove) NOT past tense (Fixed, Added, Updated, Removed)
3. Consolidate related changes into single entries:
   - If multiple PRs affect the same component/feature, combine them
   - If one PR fixes/improves another PR's changes, combine them
4. Format each line as either:
   - Single PR: "- {description} (#{number}) ({hash})"
   - Multiple PRs: "- {combined description} (#{num1}, #{num2}) ({hash1}, {hash2})"
5. Order by importance: critical fixes first, then features, then docs/maintenance
6. NO explanations, NO notes, NO headers, NO preamble
7. Start directly with the first bullet point

PRs included:

${prSummary}

Output ONLY the bullet list. Nothing before it, nothing after it.`;

  try {
    const { text } = await generateText({
      model: anthropic(model),
      prompt,
      maxRetries: 5,
      abortSignal: AbortSignal.timeout(30000), // 30 second timeout
    });

    return text;
  } catch (error: any) {
    console.error('Error generating release PR description:', error);

    // Handle overloaded API
    if (error.statusCode === 529 || error.message?.includes('Overloaded')) {
      console.log(chalk.yellow('\n⚠️  AI service is currently overloaded. Please try again in a few moments.'));
      console.log(chalk.dim('Tip: You can use --dry-run to see what would be generated'));
    } else if (error.message?.includes('timeout')) {
      console.log(chalk.yellow('\n⚠️  Request timed out. The AI service might be slow.'));
    }

    throw error;
  }
}
