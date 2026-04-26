import Anthropic from "@anthropic-ai/sdk";
import { GitHubCommit, GitHubPR } from "./github";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function buildContext(commits: GitHubCommit[], prs: GitHubPR[]): string {
  const lines: string[] = [];

  if (prs.length > 0) {
    lines.push("## Merged Pull Requests:");
    prs.forEach((pr) => {
      lines.push(`- PR #${pr.number}: ${pr.title}`);
      if (pr.body && pr.body.trim().length > 20) {
        lines.push(
          `  Description: ${pr.body.slice(0, 300).replace(/\n/g, " ")}`
        );
      }
      if (pr.labels.length > 0) {
        lines.push(`  Labels: ${pr.labels.map((l: { name: string }) => l.name).join(", ")}`);
      }
    });
  }

  if (commits.length > 0) {
    lines.push("\n## Commits:");
    const nonMerge = commits
      .filter((c) => !c.commit.message.startsWith("Merge"))
      .slice(0, 50);
    nonMerge.forEach((c) => {
      lines.push(`- ${c.commit.message.split("\n")[0]}`);
    });
  }

  return lines.join("\n");
}

export async function generateAllTones({
  commits,
  prs,
  repo,
}: {
  commits: GitHubCommit[];
  prs: GitHubPR[];
  repo: string;
}): Promise<{ developer: string; user: string; executive: string }> {
  const context = buildContext(commits, prs);

  const prompt = `You are a technical writer who generates release notes from GitHub activity.
Only describe what is evidenced in the provided commits and PRs. Never invent features.
If there is minimal activity, say so honestly rather than padding the notes.

Repository: ${repo}
PRs merged: ${prs.length}
Commits: ${commits.length}

GitHub activity:
${context}

Generate three versions of release notes:

1. DEVELOPER: Technical release notes for developers. Use markdown bullets. Include specific APIs, breaking changes, dependencies, implementation details. Technical terminology OK.

2. USER: User-facing release notes in plain language. Use markdown bullets. Focus on features and improvements visible to end users. No jargon — explain benefits. Start each bullet with a verb ("Added", "Fixed", "Improved").

3. EXECUTIVE: 2-3 sentence executive summary. High-level business value only, no technical details. Focus on impact, velocity, and progress.

Format your response EXACTLY as:

<DEVELOPER>
[developer-facing technical notes here]
</DEVELOPER>

<USER>
[user-friendly notes here]
</USER>

<EXECUTIVE>
[executive summary here]
</EXECUTIVE>

Output only the three sections in the exact XML tags shown above.`;

  const message = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 1200,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const raw =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  // Parse the three sections
  const extract = (tag: string): string => {
    const match = raw.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
    return match ? match[1].trim() : "No content generated.";
  };

  return {
    developer: extract("DEVELOPER"),
    user: extract("USER"),
    executive: extract("EXECUTIVE"),
  };
}
