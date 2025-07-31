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
        const result = await $`gh pr view ${num} --json number,title,body,author,labels,additions,deletions,changedFiles,mergeCommit,baseRefName,state,mergedAt`.text();
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
          mergeCommitSha: pr.mergeCommit?.oid ? pr.mergeCommit.oid.substring(0, 7) : undefined,
          baseRefName: pr.baseRefName,
          state: pr.state,
          mergedAt: pr.mergedAt
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

export async function getNewChanges(sourceBranch: string, targetBranch: string): Promise<{ commits: CommitInfo[]; prNumbers: number[] }> {
  try {
    // First, check what's different between the branches
    const diffOutput = await $`git diff ${targetBranch}...${sourceBranch} --name-only`.text();
    
    if (!diffOutput.trim()) {
      // No differences between branches
      return { commits: [], prNumbers: [] };
    }
    
    // Get all commits in source that aren't in target
    const range = `${targetBranch}..${sourceBranch}`;
    const commitsOutput = await $`git log ${range} --pretty=format:"%H|%s|%an" --reverse`.text();
    
    if (!commitsOutput.trim()) {
      return { commits: [], prNumbers: [] };
    }
    
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

    // For squash-merge workflows, we need to check which PRs are truly new
    const allPRNumbers = new Set<number>();
    commits.forEach(commit => {
      commit.prNumbers.forEach(num => allPRNumbers.add(num));
    });
    
    // Check which PRs are NOT in the target branch
    const newPRNumbers: number[] = [];
    for (const prNum of Array.from(allPRNumbers)) {
      try {
        // Check if this PR's changes are in the target branch
        const prInfo = await $`gh pr view ${prNum} --json mergeCommit,baseRefName,state`.text();
        const pr = JSON.parse(prInfo);
        
        if (pr.state === 'MERGED' && pr.baseRefName === targetBranch && pr.mergeCommit?.oid) {
          // This PR was merged to target, check if the merge commit is in target branch
          try {
            await $`git merge-base --is-ancestor ${pr.mergeCommit.oid} ${targetBranch}`.quiet();
            // Commit is in target branch, skip this PR
            continue;
          } catch {
            // Commit is not in target branch, include this PR
          }
        }
        
        // PR is either not merged to target, or its changes aren't in target yet
        newPRNumbers.push(prNum);
      } catch {
        // If we can't fetch PR info, include it to be safe
        newPRNumbers.push(prNum);
      }
    }
    
    // Filter commits to only include those with new PRs or no PRs (direct commits)
    const newPRSet = new Set(newPRNumbers);
    const newCommits = commits.filter(commit => {
      if (commit.prNumbers.length === 0) return true; // Keep direct commits
      return commit.prNumbers.some(pr => newPRSet.has(pr)); // Keep commits with new PRs
    });

    return { commits: newCommits, prNumbers: newPRNumbers };
  } catch (error) {
    console.error('Error getting new changes:', error);
    return { commits: [], prNumbers: [] };
  }
}