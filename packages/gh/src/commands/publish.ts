import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { publishRelease } from '../utils/github';
import { formatVersion, parseVersion } from '../utils/version';

export const publishCommand = new Command('publish')
  .description('Publish a draft release')
  .argument('<version>', 'version to publish (e.g., v3.0.1 or 3.0.1)')
  .action(async (versionArg) => {
    const spinner = ora('Publishing release...').start();
    
    try {
      // Parse and format version to ensure it has 'v' prefix
      const parsedVersion = parseVersion(versionArg);
      if (!parsedVersion) {
        throw new Error(`Invalid version format: ${versionArg}`);
      }
      
      const version = formatVersion(parsedVersion);
      
      spinner.text = `Publishing ${chalk.green(version)}...`;
      
      const result = await publishRelease(version);
      spinner.succeed(`Published ${chalk.green(version)}`);
      
      console.log(chalk.green(`\n✓ ${result}`));
      console.log(chalk.dim(`\nView the release: https://github.com/{owner}/{repo}/releases/tag/${version}`));
      
    } catch (error: any) {
      spinner.fail('Failed to publish release');
      
      if (error.message?.includes('release not found')) {
        console.error(chalk.red(`\nRelease ${versionArg} not found.`));
        console.log(chalk.dim('Tip: Use "gh release list" to see available releases'));
      } else if (error.message?.includes('is not a draft')) {
        console.error(chalk.red(`\nRelease ${versionArg} is already published.`));
      } else {
        console.error(chalk.red(`\nError: ${error.message}`));
      }
      
      process.exit(1);
    }
  });