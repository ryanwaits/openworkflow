import readline from 'readline';
import chalk from 'chalk';

export async function confirm(message: string, defaultValue = false): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    const defaultStr = defaultValue ? 'Y/n' : 'y/N';
    rl.question(`${chalk.yellow('?')} ${message} ${chalk.gray(`(${defaultStr})`)} `, (answer) => {
      rl.close();
      
      if (!answer.trim()) {
        resolve(defaultValue);
        return;
      }
      
      const normalizedAnswer = answer.trim().toLowerCase();
      resolve(normalizedAnswer === 'y' || normalizedAnswer === 'yes');
    });
  });
}