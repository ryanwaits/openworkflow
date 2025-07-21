#!/usr/bin/env bun

import { Command } from 'commander';
import chalk from 'chalk';
import { releaseCommand, prCommand } from '@openworkflow/gh';

const program = new Command();

program
  .name('openworkflow')
  .description('Extensible workflow automation CLI')
  .version('0.1.0')
  .alias('ow');

// GitHub workflows
const gh = new Command('gh')
  .description('GitHub workflow commands');

gh.addCommand(releaseCommand);
gh.addCommand(prCommand);

program.addCommand(gh);

// Future workflow integrations
// program.addCommand(linear);
// program.addCommand(jira);
// program.addCommand(slack);

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}