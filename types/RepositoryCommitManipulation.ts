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
