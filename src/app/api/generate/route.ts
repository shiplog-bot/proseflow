import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getCommitsInRange, getMergedPRsInRange } from "@/lib/github";
import { generateAllTones } from "@/lib/openai";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { owner, repo, since, until } = body;

  if (!owner || !repo || !since || !until) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const accessToken = (session as any).accessToken;

  try {
    // Fetch commits and PRs in parallel
    const [commits, prs] = await Promise.all([
      getCommitsInRange(accessToken, owner, repo, since, until),
      getMergedPRsInRange(accessToken, owner, repo, since, until),
    ]);

    if (commits.length === 0 && prs.length === 0) {
      return NextResponse.json(
        { error: "No commits or PRs found in the selected date range." },
        { status: 404 }
      );
    }

    // Generate all 3 tones in ONE OpenAI call (efficient)
    const changelogs = await generateAllTones({ commits, prs, repo });

    return NextResponse.json({
      developer: changelogs.developer,
      user: changelogs.user,
      executive: changelogs.executive,
      commits_used: commits.length,
      prs_used: prs.length,
    });
  } catch (error: any) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate changelog" },
      { status: 500 }
    );
  }
}
