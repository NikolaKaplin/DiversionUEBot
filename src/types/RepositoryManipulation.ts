import { DVCommit } from "./RepositoryCommitManipulation";

enum ImportLevel {
    LatestCommit = 1,
    DefaultBranchWithHistory = 2,
    FullRepoWithHistory = 3,
    FullRepoWithHistoryAndSync = 4
}

export type ImportRepo = {
    gitUrl?: string;
    importLevel?: ImportLevel;
    gitBranch?: string;
}

type DVFileBlob = {
    storageUri: string;
    storageBackend: number;
    size: number;
    sha: string;
    tempDownloadUrl?: string;
    contentBase64?: string;
}

export type DVFile = {
    path: string;
    prevPath?: string;
    hash?: string;
    prevHash?: string;
    status: number;
    mode: number;
    mtime?: string;
    blob: DVFileBlob;
}

export interface DVFileQueryParams {
    path?: string,
    recurse?: boolean,
    skip?: string,
    limit?: number,
    offset?: string,
    includeDeleted?: boolean,
    workspaceJournalOrdinalId?: number,
    itemNameQuery?: string,
    dirsOnly?: boolean,
    useSelectiveSync?: boolean,
    maxDepth?: number,
    ignoreJournalOrdinalDiff?: boolean,
    includeDownloadUrls?: boolean,
}

export interface DVTreeContentStream extends Pick<DVFileQueryParams, "path" | "recurse" | "offset" | "includeDeleted" | "itemNameQuery" | "dirsOnly" | "useSelectiveSync" | "maxDepth"> {
    includeBlobs?: boolean
}

export type DVFileTree = {
    object: "FileEntry",
    items: DVFile[],
    workspaceJournalOrdinalId?: number,
    totalExpectedItems?: number
}

export interface DVFileHistoryParams extends Pick<DVFileQueryParams, "limit" | "skip"> { }

type DVfileHistoryEntry = {
    entry: DVFile,
    commit: DVCommit,
}

export type DVfileHistory = {
    entries: DVfileHistoryEntry[]
}

export interface DVFileEntry extends DVFile { }