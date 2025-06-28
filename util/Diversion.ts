import axios, { AxiosRequestConfig, Method } from "axios";
import fs from "fs-extra"
import { ListCommits } from "../types/Repository-commit-manipulation-types";


export class DiversionClient {

    private baseUrl = "https://api.diversion.dev/v0";
    private apiToken: string;

    constructor(apiToken: string) {
        this.apiToken = apiToken;
    }

    private readonly PATHS = {
            ALL_COMMITS_IN_REPO: "",
            TEST_AUTH: "/auth/test"
    }

    private createUrl(url: string, ...args: string[]) {
        let editedUrl = url;
        for (let i = 0; i < args.length; i++ ) {
            editedUrl.replace(/\{[^}]*\}/, args[i])
        }
        return editedUrl;
    }

    private async request(method: Method, path: string, params?: object) {
        const options: AxiosRequestConfig = {
            method: method,
            url: this.baseUrl + path,
            headers: {
                Authorization: `Bearer ${this.apiToken}`
            },
            params: params
        }

        let res = await axios.request(options).catch((error) => {
            throw new Error("Diversion client request error: " + error)
        })

        return res;
    }

    public async testAuth(): Promise<{status: boolean}> {
        const url = this.PATHS.TEST_AUTH;
        const isValid = await this.request("GET", url, {
            repo_id: "dv.repo.4dfc3aee-4d92-4e94-a0c3-7658f8bd3d8f"
        });
        return isValid.status == 204 ? {status: true} : {status: false};
    }

    public async getCommitInRepo(repoId: string): Promise<ListCommits> {
        const url = this.createUrl(this.PATHS.ALL_COMMITS_IN_REPO, repoId);
        const commits = await this.request("get", url).catch((error) => {
            throw new Error("Error fetching commits: " + error)
        });
        return commits.data;
    }
    
    // public async checkUpdatesCurrentRepo(repoId: string) {
    //     const oldCommits = await fs.readJSON("../info/last-commit.json");
    //     const commits = await this.getCommitInRepo(repoId);
    //     const newCommits = 
    // }
}