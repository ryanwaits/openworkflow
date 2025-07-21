import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import {
  getLatestVersion,
  bumpVersion,
  formatVersion,
  parseVersion
} from '../utils/version';
import {
  getCommitsBetweenBranches,
  getPRDetails
} from '../utils/git';
import type { PRDetails } from '../types';
import { generateReleaseNotes } from '../utils/ai';
import { createGitHubRelease } from '../utils/github';
import { copyToClipboard } from '../utils/clipboard';
import { loadConfig } from '../utils/config';
import { confirm } from '../utils/prompt';
import { $ } from 'bun';

export const releaseCommand = new Command('release')
  .description('Create and manage GitHub releases')
  .argument('[version]', 'version bump type (major|minor|patch) or specific version', 'patch')
  .option('-d, --dry-run', 'preview without creating anything')
  .option('-c, --copy', 'copy release notes to clipboard')
  .option('--draft', 'create as draft release (default)')
  .option('--publish', 'publish release immediately')
  .option('-b, --branch <branch>', 'target branch (default: main)')
  .action(async (versionArg, options) => {
    const config = loadConfig();
    let spinner;

    try {
      // Version detection
      const currentVersion = await getLatestVersion();
      const currentVersionStr = currentVersion ? formatVersion(currentVersion) : null;

      // Check for changes BEFORE calculating new version
      // Fetch latest from remote
      await $`git fetch origin --tags`.quiet();

      const targetBranch = options.branch || config.mainBranch || 'main';
      const remoteTargetBranch = `origin/${targetBranch}`;
      const lastTag = currentVersion ? formatVersion(currentVersion) : null;
      let commits = [];
      let prNumbers = [];

      if (lastTag) {
        const result = await getCommitsBetweenBranches(lastTag, remoteTargetBranch);
        commits = result.commits;
        prNumbers = result.prNumbers;
      } else {
        // If no previous release, get all commits
        const result = await getCommitsBetweenBranches('HEAD~20', remoteTargetBranch);
        commits = result.commits;
        prNumbers = result.prNumbers;
      }

      // Exit early if no changes
      if (commits.length === 0 && lastTag) {
        console.log(chalk.yellow(`\nℹ️  No changes since ${lastTag}.`));
        console.log(chalk.dim('\nTip: Merge your release PR first, then create the GitHub release.'));
        console.log(chalk.dim(`     ow gh pr --release ${versionArg} --create`));

        if (!options.dryRun) {
          const shouldContinue = await confirm(
            'No changes detected. Do you still want to create an empty release?',
            false
          );

          if (!shouldContinue) {
            console.log(chalk.gray('Cancelled.'));
            return;
          }
        } else {
          // Exit early for dry runs with no changes
          return;
        }
      }

      // Only calculate new version if we have changes
      const newVersion = currentVersion
        ? bumpVersion(currentVersion, versionArg)
        : parseVersion(versionArg) || { major: 0, minor: 1, patch: 0 };

      const newVersionStr = formatVersion(newVersion);
      
      // Fetch PR details and generate release notes
      spinner = ora(`Generating release notes for ${chalk.green(newVersionStr)}...`).start();
      let prs: PRDetails[] = [];
      let releaseNotes = '';

      if (prNumbers.length > 0) {
        prs = await getPRDetails(prNumbers);

        // Check if this is a release PR (usually has "release" in the title)
        const releasePR = prs.find(pr =>
          pr.title.toLowerCase().includes('release') &&
          pr.title.includes(newVersionStr)
        );

        if (releasePR && releasePR.body) {
          // Extract PR numbers from the release PR body
          const prReferences = [...releasePR.body.matchAll(/#(\d+)/g)];
          const referencedPRNumbers = prReferences.map(m => parseInt(m[1]));

          if (referencedPRNumbers.length > 0) {
            // Fetch details for all PRs referenced in the release PR
            const referencedPRs = await getPRDetails(referencedPRNumbers);
            releaseNotes = await generateReleaseNotes(referencedPRs, newVersionStr, currentVersionStr);
          } else {
            // Fallback: use the release PR body itself
            releaseNotes = releasePR.body;
          }
        } else {
          // Normal flow: generate from all PRs found
          releaseNotes = await generateReleaseNotes(prs, newVersionStr, currentVersionStr);
        }
      } else {
        // No PRs found, generate basic notes
        releaseNotes = await generateReleaseNotes([], newVersionStr, currentVersionStr);
      }
      
      spinner.succeed('Generated release notes');

      if (options.dryRun) {
        console.log(chalk.yellow('\n📝 DRY RUN - Release Notes:\n'));
        console.log(releaseNotes);
      }

      // Copy to clipboard if requested
      if (options.copy) {
        await copyToClipboard(releaseNotes);
        console.log(chalk.green('\n✓ Release notes copied to clipboard!'));
      }

      // Create GitHub release if not dry run
      if (!options.dryRun) {
        spinner.start('Creating GitHub release...');
        const draft = !options.publish;
        const releaseResult = await createGitHubRelease(newVersionStr, releaseNotes, draft, targetBranch);
        spinner.succeed(`Created ${draft ? 'draft' : 'published'} release`);
        console.log(chalk.green(`\n✓ ${releaseResult}`));

        if (draft) {
          console.log(chalk.dim('\nTip: Use --publish to create a published release'));
        }
      } else {
        console.log(chalk.yellow('\nℹ️  This was a dry run. Use without --dry-run to create the release.'));
        console.log(chalk.dim('Tip: Create a release PR first with: ow gh pr --release'));
      }

    } catch (error) {
      if (spinner) {
        spinner.fail('Error occurred');
      }
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });
