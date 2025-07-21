import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface GitHubConfig {
  defaultBranch?: string;
  mainBranch?: string;
  ai?: {
    provider?: 'anthropic' | 'openai';
    model?: string;
  };
  github?: {
    owner?: string;
    repo?: string;
  };
  formatProfiles?: {
    release?: string; // profile name: "default" or path to custom profile
    pr?: string; // profile name: "standard", "minimal" or path to custom profile
  };
}

export function loadConfig(): GitHubConfig {
  // Look for config in multiple places
  const configPaths = [
    join(process.cwd(), '.openworkflow.json'),
    join(process.cwd(), '.github', 'openworkflow.json'),
    join(process.cwd(), 'openworkflow.config.json')
  ];
  
  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      try {
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));
        return config.github || config;
      } catch (error) {
        console.warn('Failed to load config file:', error);
      }
    }
  }
  
  // Default configuration
  return {
    defaultBranch: 'develop',
    mainBranch: 'main',
    ai: {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022'
    }
  };
}