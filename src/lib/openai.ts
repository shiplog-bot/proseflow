import OpenAI from "openai";
import { GitHubCommit, GitHubPR } from "./github";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
        lines.push(`  Labels: ${pr.labels.map((l) => l.name).join(", ")}`);
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

  const systemPrompt = `You are a technical writer who generates release notes from GitHub activity.
Only describe what is evidenced in the provided commits and PRs. Never invent features.
If there is minimal activity, say so honestly rather than padding the notes.

You will generate THREE versions of the same changelog in a single response.
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

  const userPrompt = `Repository: ${repo}
PRs merged: ${prs.length}
Commits: ${commits.length}

GitHub activity:
${context}

Generate three versions:

1. DEVELOPER: Technical release notes for developers. Use markdown bullets. Include specific APIs, breaking changes, dependencies, implementation details. Technical terminology OK.

2. USER: User-facing release notes in plain language. Use markdown bullets. Focus on features and improvements visible to end users. No jargon — explain benefits. Start each bullet with a verb ("Added", "Fixed", "Improved").

3. EXECUTIVE: 2-3 sentence executive summary. High-level business value only, no technical details. Focus on impact, velocity, and progress.

Output only the three sections in the exact XML tags shown above.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 1200,
  });

  const raw = response.choices[0].message.content?.trim() || "";

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
