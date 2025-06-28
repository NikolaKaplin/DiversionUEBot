import axios, { AxiosRequestConfig, HttpStatusCode, Method } from "axios";
import { DVListCommitsQueryParams, DVListCommits, DVCommit } from "../types/RepositoryCommitManipulation";
import { BillingSucces } from "../types/Account";
import { Default } from "../types/Default";
import {
  ContentGenerationInput,
  ContentGenerationOutput,
} from "../types/ContentGeneration";
import { CreateRepo, ListRepo, RepoInfo } from "../types/RepositoryManagement";
import { DVfileHistory, DVFileHistoryParams, DVFileQueryParams, DVTreeContentStream, DVFileTree, ImportRepo, DVFileEntry } from "../types/RepositoryManipulation";
import { Success } from "../types/Success";

export class DiversionClient {
  private baseUrl = "https://api.diversion.dev/v0";
  private apiToken: string;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  private readonly PATHS = {
    ALL_COMMITS_IN_REPO: "",
    TEST_AUTH: "/auth/test",
    ACCOUNT_BILLING: "/account/billing",
    CONTENT_GENERATION: "/content/generate",
    REPOS: "/repos",
    REPO_ID: "/repos/{repo_id}",
    REPO_IMPORT: "/repos/{repo_id}/import",
    REPO_IMPORT_VERIFY: "/repos/import/check",
    REPO_SYNC: "/repos/{repo_id}/sync",
    REPO_SET_DEF_BRANCH: "/repos/{repo_id}/default_branch",
    REPO_FILE_TREE: "/repos/{repo_id}/trees/{ref_id},",
    REPO_TREE_STREAM: "/repos/{repo_id}/tree_content/{ref_id}",
    REPO_FILE_HISTORY: "/repos/{repo_id}/files/history/{ref_id}/{path}",
    REPO_FILE_ENTRY: "/repos/{repo_id}/files/{ref_id}/{path}",
    REPO_BLOB_CONTENTS: "/repos/{repo_id}/blobs/{ref_id}/{path}",
    REPO_LIST_COMMITS: "/repos/{repo_id}/commits",
    REPO_COMMITS_BULK: "/repos/{repo_id}/commits/bulk",
    REPO_COMMITS_DETAILS: "/repos/{repo_id}/commits/{commit_id}",
  };

  private createUrl(url: string, ...args: string[]) {
    let editedUrl = url;
    for (let i = 0; i < args.length; i++) {
      editedUrl.replace(/\{[^}]*\}/, args[i]);
    }
    return editedUrl;
  }

  private async request(method: Method, path: string, config?: { header?: object; params?: object; data?: object; }
  ) {
    const options: AxiosRequestConfig = {
      method: method,
      url: this.baseUrl + path,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        ...config.header,
      },
      params: config.params,
      data: config.data,
    };

    let res = await axios.request(options).catch((error) => {
      throw new Error("Diversion client request error: " + error);
    });

    return res;
  }

  public async testAuth(): Promise<Success> {
    const url = this.PATHS.TEST_AUTH;
    const isValid = await this.request("GET", url, {
      data: {
        repo_id: "dv.repo.4dfc3aee-4d92-4e94-a0c3-7658f8bd3d8f",
      },
    });
    return isValid.status == 204 ? { success: true } : { success: false };
  }

  public async billingLink(): Promise<BillingSucces | Default> {
    const url = this.PATHS.ACCOUNT_BILLING;
    const billing = await this.request("GET", url);
    return billing.data;
  }

  public async generateContent(
    data: ContentGenerationInput
  ): Promise<ContentGenerationOutput> {
    const url = this.PATHS.CONTENT_GENERATION;
    const output = await this.request("POST", url, { data });
    return output.data;
  }

  public readonly repo = {
    create: async (data: CreateRepo): Promise<RepoInfo> => {
      const url = this.PATHS.REPOS;
      const createdRepo = await this.request("POST", url, { data });
      return createdRepo.data;
    },
    delete: async (repoId: string): Promise<Success> => {
      const url = this.createUrl(this.PATHS.REPO_ID, repoId);
      const deleteRepo = await this.request("DELETE", url);
      return { success: deleteRepo.status === HttpStatusCode.Accepted }
    },
    sync: async (repoId: string, XHubSignature256: string): Promise<Success> => {
      const url = this.createUrl(this.PATHS.REPO_SYNC, repoId);
      const syncRepo = await this.request("POST", url, { header: { 'X-Hub-Signature-256': XHubSignature256 } })
      return { success: syncRepo.status === HttpStatusCode.Accepted }
    },

    importFromGit: async (data: ImportRepo): Promise<Success> => {
      const url = this.PATHS.REPO_IMPORT;
      const importRepo = await this.request("POST", url, { data, header: { 'Content-Type': 'application/json' } });
      return { success: importRepo.status === HttpStatusCode.Accepted }
    },
    verfyImportFromGit: async (data: ImportRepo): Promise<Success> => {
      const url = this.PATHS.REPO_IMPORT_VERIFY;
      const verfyImportRepo = await this.request("POST", url, { data });
      return { success: verfyImportRepo.status === HttpStatusCode.NoContent }
    },
    setDefaultBranch: async (repoId: string, branchId: string): Promise<Success> => {
      const url = this.createUrl(this.PATHS.REPO_SET_DEF_BRANCH, repoId);
      const setDefaultBranchRepo = await this.request("POST", url, { data: { branch_id: branchId }, header: { 'Content-Type': 'application/json' } });
      return { success: setDefaultBranchRepo.status === HttpStatusCode.Ok }
    },
    fileThree: async (repoId: string, refId: string, params: DVFileQueryParams = {
      recurse: true, limit: 1500, includeDeleted: false, dirsOnly: false, useSelectiveSync: true, maxDepth: 1, ignoreJournalOrdinalDiff: false, includeDownloadUrls: false
    }
    ): Promise<DVFileTree> => {
      const url = this.createUrl(this.PATHS.REPO_FILE_TREE, repoId, refId);
      const fileThreeRepo = await this.request("GET", url, { params });
      return fileThreeRepo.data
    },
    treeContentStream: async (repoId: string, refId: string, params: DVTreeContentStream = {
      recurse: true, includeDeleted: false, dirsOnly: false, useSelectiveSync: true, maxDepth: 1, includeBlobs: false
    }): Promise<Success> => {
      const url = this.createUrl(this.PATHS.REPO_TREE_STREAM, repoId, refId);
      const treeContentStreamRepo = await this.request("GET", url, { params });
      return { success: treeContentStreamRepo.status === HttpStatusCode.Ok }
    },
    fileHistory: async (repoId: string, refId: string, path: string, params: DVFileHistoryParams = { limit: 100 }): Promise<DVfileHistory> => {
      const url = this.createUrl(this.PATHS.REPO_FILE_HISTORY, repoId, refId, path);
      const fileHistoryRepo = await this.request("GET", url, { params });
      return fileHistoryRepo.data
    },
    fileEntry: async (repoId: string, refId: string, path: string): Promise<DVFileEntry> => {
      const url = this.createUrl(this.PATHS.REPO_FILE_ENTRY, repoId, refId, path);
      const fileEntryRepo = await this.request("GET", url);
      return fileEntryRepo.data
    },
    blobContents: async (repoId: string, refId: string, path: string): Promise<Success> => {
      const url = this.createUrl(this.PATHS.REPO_FILE_ENTRY, repoId, refId, path);
      const blobContents = await this.request("GET", url);
      return blobContents.data
    },
    list: async (): Promise<ListRepo> => {
      const url = this.PATHS.REPOS;
      const repos = await this.request("GET", url);
      return repos.data;
    },
    details: async (repoId: string): Promise<RepoInfo> => {
      const url = this.createUrl(this.PATHS.REPO_ID, repoId);
      const details = await this.request("GET", url);
      return details.data;
    },
    commitManager: {
      list: async (repoId: string, params: DVListCommitsQueryParams = { limit: 100 }): Promise<DVListCommits> => {
        const url = this.createUrl(this.PATHS.REPO_LIST_COMMITS, repoId);
        const listCommitsRepo = await this.request("GET", url, { params });
        return listCommitsRepo.data
      },
      bulk: async (repoId: string, refIds: string[]): Promise<object> => {
        const url = this.createUrl(this.PATHS.REPO_COMMITS_BULK, repoId);
        const bulkCommitsRepo = await this.request("GET", url, {
          params: { refIds: refIds }
        });
        return bulkCommitsRepo.data
      },
      details: async (repoId: string, commitId: string): Promise<DVCommit> => {
        const url = this.createUrl(this.PATHS.REPO_COMMITS_DETAILS, repoId, commitId);
        const detailsCommitsRepo = await this.request("GET", url);
        return detailsCommitsRepo.data
      },
      updateMessage: async (repoId: string, commitId: string, commitMessage: string): Promise<object> => {
        const url = this.createUrl(this.PATHS.REPO_COMMITS_BULK, repoId, commitId);
        const updateMessageCommitsRepo = await this.request("PATCH", url, { header: { 'Content-Type': 'application/json' }, data: { commit_message: commitMessage } })
        return updateMessageCommitsRepo.data
      }
    }
  };
}
