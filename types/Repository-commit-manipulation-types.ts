import { DVUser } from "./User-management"

export type Commit = {
    commitId: string,
    created_ts: number,
    commit_message: string,
    branch_id: string,
    author: DVUser
}

export type ListCommits = {
    object: string,
    items: Commit[]
}