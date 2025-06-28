export enum SyncGitLevel {
  latestCommit = 1,
  branchWithHistory = 2,
  fullRepoWithHistory = 3,
  fullRepoWithHistoryAndSync = 4,
}

enum DigestMethod {
  sha1,
  md5,
}

export interface RepoInfo {
  repoName: string;
  description: string;
  organizationId: string;
  repoId: string;
  defaultBranchId: string;
  defaultBranchName: string;
  sizeBytes: number;
  ownerUserId: string;
  createdTimestamp: number;
  syncGitRepoUrl: string;
  syncGitLevel: SyncGitLevel;
  digestMethod: DigestMethod;
}

export type ListRepo = {
  object: string;
  items: RepoInfo[];
};

export interface CreateRepo
  extends Pick<RepoInfo, "repoName" | "description" | "organizationId"> {
  branchless: boolean;
  useExistingDvignore: boolean;
}
