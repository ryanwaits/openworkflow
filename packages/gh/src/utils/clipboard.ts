import { $ } from 'bun';

export async function copyToClipboard(text: string): Promise<void> {
  try {
    // Use pbcopy on macOS, xclip on Linux, clip on Windows
    if (process.platform === 'darwin') {
      await $`echo ${text} | pbcopy`;
    } else if (process.platform === 'linux') {
      await $`echo ${text} | xclip -selection clipboard`;
    } else if (process.platform === 'win32') {
      await $`echo ${text} | clip`;
    } else {
      throw new Error(`Clipboard not supported on platform: ${process.platform}`);
    }
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    throw error;
  }
}