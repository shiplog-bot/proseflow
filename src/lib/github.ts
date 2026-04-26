export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  updated_at: string;
  language: string | null;
}

export interface GitHubCommit {
  sha: string;
  commit: { message: string; author: { name: string; date: string } };
  html_url: string;
}

export interface GitHubPR {
  number: number;
  title: string;
  body: string | null;
  merged_at: string | null;
  html_url: string;
  labels: { name: string }[];
  user: { login: string };
}

export async function getUserRepos(accessToken: string): Promise<GitHubRepo[]> {
  const res = await fetch(
    "https://api.github.com/user/repos?sort=updated&per_page=50&type=owner",
    { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github.v3+json" } }
  );
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

export async function getCommitsInRange(
  accessToken: string, owner: string, repo: string, since: string, until: string
): Promise<GitHubCommit[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?since=${since}&until=${until}&per_page=100`,
    { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github.v3+json" } }
  );
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

export async function getMergedPRsInRange(
  accessToken: string, owner: string, repo: string, since: string, until: string
): Promise<GitHubPR[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=100`,
    { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github.v3+json" } }
  );
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const prs: GitHubPR[] = await res.json();
  const sinceDate = new Date(since);
  const untilDate = new Date(until);
  return prs.filter((pr) => {
    if (!pr.merged_at) return false;
    const d = new Date(pr.merged_at);
    return d >= sinceDate && d <= untilDate;
  });
}
