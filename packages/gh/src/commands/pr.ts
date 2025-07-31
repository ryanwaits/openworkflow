import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { $ } from 'bun';
import { getCommitsBetweenBranches, getPRDetails, getCurrentBranch, getNewChanges } from '../utils/git';
import { generatePRDescription, generateReleasePRDescription } from '../utils/ai';
import { createReleasePR } from '../utils/github';
import { copyToClipboard } from '../utils/clipboard';
import { loadConfig } from '../utils/config';
import { generatePRTitle } from '../utils/pr-helpers';
import { getLatestVersion, bumpVersion, formatVersion, parseVersion } from '../utils/version';

export const prCommand = new Command('pr')
  .description('Generate and manage PR descriptions')
  .option('-s, --source <branch>', 'source branch')
  .option('-t, --target <branch>', 'target branch')
  .option('-c, --copy', 'copy to clipboard')
  .option('--create', 'create the PR')
  .option('-d, --dry-run', 'preview without creating')
  .option('-r, --release [version]', 'create release PR with version bump')
  .action(async (options) => {
    const spinner = ora('Analyzing changes...').start();
    const config = loadConfig();
    
    try {
      // Get current branch if source not specified
      const currentBranch = await getCurrentBranch();
      const sourceBranch = options.source || (options.release ? (config.defaultBranch || 'develop') : currentBranch);
      
      // Smart target branch logic
      let targetBranch = options.target;
      if (!targetBranch) {
        if (options.release) {
          // Release PRs always target main
          targetBranch = config.mainBranch || 'main';
        } else if (sourceBranch === 'develop' || sourceBranch === config.defaultBranch) {
          targetBranch = config.mainBranch || 'main';
        } else {
          targetBranch = config.defaultBranch || 'develop';
        }
      }
      
      // Always fetch latest from remote
      spinner.start('Fetching latest changes from remote...');
      await $`git fetch origin --tags`.quiet();
      spinner.succeed('Fetched latest from remote');
      
      // Show what we're comparing
      spinner.succeed(`Comparing ${chalk.cyan(sourceBranch)} → ${chalk.cyan(targetBranch)}`);
      
      // Get new changes between branches
      spinner.start('Analyzing changes...');
      
      let commits, prNumbers;
      if (options.release) {
        // For release PRs, use the new approach that handles squash merges
        const result = await getNewChanges(`origin/${sourceBranch}`, `origin/${targetBranch}`);
        commits = result.commits;
        prNumbers = result.prNumbers;
      } else {
        // For regular PRs, use the simple approach
        const result = await getCommitsBetweenBranches(targetBranch, sourceBranch);
        commits = result.commits;
        prNumbers = result.prNumbers;
      }
      
      if (commits.length === 0) {
        spinner.warn('No new changes found');
        console.log(chalk.yellow(`\nℹ️  No new changes found between ${sourceBranch} → ${targetBranch}`));
        if (options.release) {
          console.log(chalk.dim('All changes in develop have already been merged to main.'));
        }
        return;
      }
      
      spinner.succeed(`Found ${chalk.cyan(commits.length)} new commits`);
      
      // Fetch PR details if available
      let prs: PRDetails[] = [];
      if (prNumbers.length > 0) {
        spinner.start('Fetching PR details...');
        prs = await getPRDetails(prNumbers);
        spinner.succeed(`Fetched ${chalk.cyan(prs.length)} PRs`);
      }
      
      // Handle version for release PRs
      let newVersionStr = '';
      if (options.release) {
        spinner.start('Checking current version...');
        const currentVersion = await getLatestVersion();
        const currentVersionStr = currentVersion ? formatVersion(currentVersion) : null;
        
        // Calculate new version
        const versionArg = typeof options.release === 'string' ? options.release : 'patch';
        const newVersion = currentVersion 
          ? bumpVersion(currentVersion, versionArg)
          : parseVersion(versionArg) || { major: 0, minor: 1, patch: 0 };
        
        newVersionStr = formatVersion(newVersion);
        spinner.succeed(`Current version: ${chalk.cyan(currentVersionStr || 'none')} → New version: ${chalk.green(newVersionStr)}`);
      }
      
      // Generate appropriate description
      spinner.start(options.release ? 'Generating release PR description...' : 'Generating PR description...');
      const description = options.release
        ? await generateReleasePRDescription(prs, newVersionStr)
        : await generatePRDescription(
            commits.map(c => c.message),
            prs,
            targetBranch,
            sourceBranch
          );
      spinner.succeed(options.release ? 'Generated release PR description' : 'Generated PR description');
      
      // Generate PR title
      const title = options.release ? `chore: release ${newVersionStr}` : generatePRTitle(sourceBranch);
      
      if (options.dryRun || !options.create) {
        console.log(chalk.yellow('\n━━━ PR Preview ━━━\n'));
        console.log(chalk.bold('Title:'), title);
        console.log(chalk.bold('Branch:'), `${sourceBranch} → ${targetBranch}`);
        console.log(chalk.bold('\nDescription:'));
        console.log(description);
        console.log(chalk.yellow('\n━━━━━━━━━━━━━━━━━\n'));
      }
      
      // Copy to clipboard if requested
      if (options.copy) {
        await copyToClipboard(description);
        console.log(chalk.green('\n✓ PR description copied to clipboard!'));
      }
      
      // Create PR if requested
      if (options.create && !options.dryRun) {
        spinner.start('Creating PR...');
        const result = await createReleasePR(description, title, sourceBranch, targetBranch);
        spinner.succeed('Created PR');
        console.log(chalk.green(`\n✓ ${result}`));
      }
      
    } catch (error) {
      spinner.fail('Error occurred');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });