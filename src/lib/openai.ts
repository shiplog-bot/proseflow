import OpenAI from "openai";
import { GitHubCommit, GitHubPR } from "./github";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildContext(commits: GitHubCommit[], prs: GitHubPR[]): string {
  const lines: string[] = [];
  if (prs.length > 0) {
    lines.push("## Merged Pull Requests:");
    prs.forEach((pr) => {
      lines.push(`- PR #${pr.number}: ${pr.title}`);
      if (pr.body && pr.body.trim().length > 20)
        lines.push(`  Description: ${pr.body.slice(0, 300).replace(/\n/g, " ")}`);
      if (pr.labels.length > 0)
        lines.push(`  Labels: ${pr.labels.map((l) => l.name).join(", ")}`);
    });
  }
  if (commits.length > 0) {
    lines.push("\n## Commits:");
    commits.filter((c) => !c.commit.message.startsWith("Merge")).slice(0, 50)
      .forEach((c) => lines.push(`- ${c.commit.message.split("\n")[0]}`));
  }
  return lines.join("\n");
}

export async function generateAllTones({ commits, prs, repo }: {
  commits: GitHubCommit[]; prs: GitHubPR[]; repo: string;
}): Promise<{ developer: string; user: string; executive: string }> {
  const context = buildContext(commits, prs);
  const systemPrompt = `You are a technical writer who generates release notes from GitHub activity.
Only describe what is evidenced in the provided commits and PRs. Never invent features.

Format your response EXACTLY as:

<DEVELOPER>
[developer-facing technical notes here]
</DEVELOPER>

<USER>
[user-friendly notes here]
</USER>

<EXECUTIVE>
[executive summary here]
</EXECUTIVE>`;

  const userPrompt = `Repository: ${repo}\nPRs merged: ${prs.length}\nCommits: ${commits.length}\n\nGitHub activity:\n${context}\n\nGenerate three versions:\n1. DEVELOPER: Technical release notes with markdown bullets.\n2. USER: User-facing plain language with markdown bullets starting with verbs.\n3. EXECUTIVE: 2-3 sentence executive summary focused on business value.\n\nOutput only the three sections in the exact XML tags.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
    temperature: 0.3,
    max_tokens: 1200,
  });

  const raw = response.choices[0].message.content?.trim() || "";
  const extract = (tag: string) => {
    const match = raw.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
    return match ? match[1].trim() : "No content generated.";
  };

  return { developer: extract("DEVELOPER"), user: extract("USER"), executive: extract("EXECUTIVE") };
}
