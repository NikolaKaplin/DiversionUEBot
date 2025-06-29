import { DVUser } from "./UserManagement";

export type DVCommit = {
  commitId: string;
  createdTs: number;
  commitMessage: string;
  branchId: string;
  author: DVUser;
  parents: string[];
};

export type DVListCommits = {
  object: "Commit";
  items: DVCommit[];
};

export interface DVListCommitsQueryParams {
  refIds?: string[],
  limit?: number,
  skip?: number,
  query?: string,
}

export type DVCommitChangesCount = {
  changesCount: number
}

export type DVCommitWorkspaceReq = {
  commitMessage: string,
  includePaths?: string[] | null
}

export type DVCommitWorkspaceRes = {
  id: number,
  readOnly: boolean,
  failedPaths: string[] | null
}

export type DVCommiRevertReq = {
  baseId: string,
  revertRefId: string,
}

export type DVCommiRevertRes = {
  mergeId: string,
}

export type DVCommiRevertTo = {
  workspaceId: string,
  commitId: string,
}

