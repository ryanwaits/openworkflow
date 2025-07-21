import { $ } from 'bun';

export async function createReleasePR(
  description: string, 
  title: string, 
  sourceBranch: string,
  targetBranch: string = 'main'
): Promise<string> {
  try {
    const result = await $`gh pr create --base ${targetBranch} --head ${sourceBranch} --title "${title}" --body "${description}"`.text();
    return result;
  } catch (error) {
    // If PR already exists, update it
    console.log('PR might already exist, trying to find it...');
    try {
      const existingPR = await $`gh pr list --base ${targetBranch} --head ${sourceBranch} --json number --jq '.[0].number'`.text();
      if (existingPR.trim()) {
        await $`gh pr edit ${existingPR.trim()} --title "${title}" --body "${description}"`.text();
        return `Updated existing PR #${existingPR.trim()}`;
      }
    } catch (e) {
      throw error;
    }
    throw error;
  }
}

export async function createGitHubRelease(
  version: string, 
  notes: string, 
  draft = true,
  targetBranch: string = 'main'
): Promise<string> {
  try {
    const draftFlag = draft ? '--draft' : '';
    const result = await $`gh release create ${version} --title "${version}" --notes "${notes}" ${draftFlag} --target ${targetBranch}`.text();
    return result;
  } catch (error) {
    console.error('Error creating GitHub release:', error);
    throw error;
  }
}

export async function publishRelease(version: string): Promise<string> {
  try {
    const result = await $`gh release edit ${version} --draft=false`.text();
    return result;
  } catch (error) {
    console.error('Error publishing release:', error);
    throw error;
  }
}