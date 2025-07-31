import { $ } from 'bun';
import type { Version } from '../types';

export function parseVersion(versionString: string): Version | null {
  const match = versionString.match(/v?(\d+)\.(\d+)\.(\d+)(?:-(.+))?/);
  if (!match) return null;
  
  return {
    major: parseInt(match[1]),
    minor: parseInt(match[2]),
    patch: parseInt(match[3])
  };
}

export function formatVersion(version: Version): string {
  return `v${version.major}.${version.minor}.${version.patch}`;
}

export function bumpVersion(current: Version, bumpType: 'major' | 'minor' | 'patch' | string): Version {
  const newVersion = { ...current };
  
  switch (bumpType) {
    case 'major':
      newVersion.major++;
      newVersion.minor = 0;
      newVersion.patch = 0;
      break;
    case 'minor':
      newVersion.minor++;
      newVersion.patch = 0;
      break;
    case 'patch':
      newVersion.patch++;
      break;
    default:
      // If it's a specific version like "3.0.1"
      const parsed = parseVersion(bumpType);
      if (parsed) {
        return parsed;
      }
      throw new Error(`Invalid bump type: ${bumpType}`);
  }
  
  return newVersion;
}

export async function getLatestVersion(): Promise<Version | null> {
  // First check GitHub releases (includes drafts and published)
  try {
    const releases = await $`gh release list --limit 10 --json tagName,isDraft,isPrerelease`.text();
    const releaseData = JSON.parse(releases);
    
    // Find the latest non-prerelease version (draft or published)
    for (const release of releaseData) {
      if (!release.isPrerelease) {
        const version = parseVersion(release.tagName);
        if (version) {
          console.log(`Latest version: ${release.tagName}`);
          return version;
        }
      }
    }
  } catch (error) {
    console.error('Error fetching GitHub releases:', error);
  }
  
  // Fallback to git tags if no releases found
  try {
    const allTags = await $`git tag --list "v*.*.*" --sort=-version:refname`.text();
    const tags = allTags.trim().split('\n').filter(Boolean);
    
    if (tags.length > 0) {
      const latestTag = tags[0];
      const version = parseVersion(latestTag);
      console.log(`Latest version (from tags): ${latestTag}`);
      return version;
    }
  } catch (error) {
    console.error('Error fetching git tags:', error);
  }
  
  console.log('No previous releases found, starting from v0.0.0');
  return null;
}