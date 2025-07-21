import { $ } from 'bun';
import type { CommitInfo, PRDetails } from '../types';

export async function getCommitsBetweenBranches(baseBranch: string, sourceBranch: string): Promise<{ commits: CommitInfo[]; prNumbers: number[] }> {
  try {
    const range = `${baseBranch}..${sourceBranch}`;
    
    const commitsOutput = await $`git log ${range} --pretty=format:"%H|%s|%an" --reverse`.text();
    const commits = commitsOutput.trim().split('\n').filter(Boolean).map(line => {
      const [hash, message] = line.split('|');
      
      // Extract PR numbers from commit message
      const prNumbers: number[] = [];
      const matches = message.matchAll(/#(\d+)/g);
      for (const match of matches) {
        prNumbers.push(parseInt(match[1]));
      }
      
      return {
        hash,
        message,
        prNumbers
      };
    });

    // Collect all unique PR numbers
    const allPRNumbers = new Set<number>();
    commits.forEach(commit => {
      commit.prNumbers.forEach(num => allPRNumbers.add(num));
    });

    return { commits, prNumbers: Array.from(allPRNumbers) };
  } catch (error) {
    console.error('Error getting commits:', error);
    return { commits: [], prNumbers: [] };
  }
}

export async function getCurrentBranch(): Promise<string> {
  try {
    const branch = await $`git rev-parse --abbrev-ref HEAD`.text();
    return branch.trim();
  } catch (error) {
    console.error('Error getting current branch:', error);
    throw new Error('Failed to get current git branch');
  }
}

export async function getPRDetails(prNumbers: number[]): Promise<PRDetails[]> {
  if (prNumbers.length === 0) return [];

  try {
    const prPromises = prNumbers.map(async (num) => {
      try {
        const result = await $`gh pr view ${num} --json number,title,body,author,labels,additions,deletions,changedFiles,mergeCommit`.text();
        const pr = JSON.parse(result);
        
        return {
          number: pr.number,
          title: pr.title,
          author: pr.author.login,
          body: pr.body,
          labels: pr.labels?.map((l: any) => l.name) || [],
          additions: pr.additions,
          deletions: pr.deletions,
          changedFiles: pr.changedFiles,
          mergeCommitSha: pr.mergeCommit?.oid ? pr.mergeCommit.oid.substring(0, 7) : undefined
        } as PRDetails;
      } catch (e) {
        console.warn(`Failed to fetch PR #${num}`);
        return null;
      }
    });

    const results = await Promise.all(prPromises);
    return results.filter((pr): pr is PRDetails => pr !== null);
  } catch (error) {
    console.error('Error fetching PR details:', error);
    return [];
  }
}