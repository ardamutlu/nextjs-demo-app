export interface GithubSearchRepositoriesResponse {
  total_count: number;
  incomplete_results: boolean;
  items: Repository[];
}

export interface Repository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;

  owner: Owner;

  html_url: string;
  clone_url: string;
  description: string | null;
  fork: boolean;
  url: string;

  created_at: string;
  updated_at: string;
  pushed_at: string;

  homepage: string | null;
  size: number;

  stargazers_count: number;
  watchers_count: number;
  language: string | null;

  forks_count: number;
  open_issues_count: number;

  license: License | null;

  default_branch: string;

  score: number;
  visibility: "public" | "private";
}

export interface Owner {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  url: string;
  html_url: string;
  type: "User" | "Organization";
}

export interface License {
  key: string;
  name: string;
  spdx_id: string | null;
  url: string | null;
}
