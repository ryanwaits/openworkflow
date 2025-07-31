export interface Version {
  major: number;
  minor: number;
  patch: number;
}

export type VersionBump = 'major' | 'minor' | 'patch';

export interface PRDetails {
  number: number;
  title: string;
  author: string;
  body?: string;
  labels?: string[];
  additions?: number;
  deletions?: number;
  changedFiles?: number;
  mergeCommitSha?: string;
  baseRefName?: string;
  state?: string;
  mergedAt?: string;
}

export interface CommitInfo {
  hash: string;
  message: string;
  prNumbers: number[];
}

export interface ReleaseNotesSection {
  title: string;
  items: string[];
}

export interface ReleaseNotes {
  version: string;
  date: string;
  sections: ReleaseNotesSection[];
  breakingChanges?: string[];
  contributors?: string[];
}