"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Repo {
  id: number;
  full_name: string;
  name: string;
  description: string | null;
  private: boolean;
}

interface ChangelogResult {
  developer: string;
  user: string;
  executive: string;
  commits_used: number;
  prs_used: number;
}

type Tone = "developer" | "user" | "executive";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [repos, setRepos] = useState<Repo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [since, setSince] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().split("T")[0];
  });
  const [until, setUntil] = useState(() => new Date().toISOString().split("T")[0]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ChangelogResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tone>("developer");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchRepos();
    }
  }, [status]);

  async function fetchRepos() {
    setLoadingRepos(true);
    try {
      const res = await fetch("/api/repos");
      if (res.ok) {
        const data = await res.json();
        setRepos(data.repos || []);
        if (data.repos?.length > 0) {
          setSelectedRepo(data.repos[0].full_name);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRepos(false);
    }
  }

  async function generate() {
    if (!selectedRepo) return;
    setGenerating(true);
    setError(null);
    setResult(null);

    const [owner, repo] = selectedRepo.split("/");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, since, until }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate changelog");
        return;
      }

      setResult({
        developer: data.developer,
        user: data.user,
        executive: data.executive,
        commits_used: data.commits_used,
        prs_used: data.prs_used,
      });
      setActiveTab("developer");
    } catch (e: any) {
      setError(e.message || "Network error");
    } finally {
      setGenerating(false);
    }
  }

  async function copyToClipboard() {
    if (!result) return;
    const text = result[activeTab];
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadMarkdown() {
    if (!result) return;
    const text = result[activeTab];
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `changelog-${activeTab}-${since}-to-${until}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#666] animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e1e] max-w-6xl mx-auto">
        <span className="font-bold text-xl tracking-tight">
          <span className="bg-gradient-to-r from-[#7c8cf8] to-[#a78bfa] bg-clip-text text-transparent">
            Proseflow
          </span>
        </span>
        <div className="flex items-center gap-4">
          {session?.user?.image && (
            <img
              src={session.user.image}
              alt="avatar"
              className="w-8 h-8 rounded-full border border-[#333]"
            />
          )}
          <span className="text-sm text-[#888]">{session?.user?.name}</span>
          <a
            href="/api/auth/signout"
            className="text-sm text-[#555] hover:text-[#888] transition-colors"
          >
            Sign out
          </a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">Generate Changelog</h1>
        <p className="text-[#666] mb-8">
          Select a repo and date range to generate release notes in 3 tones.
        </p>

        {/* Form */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            {/* Repo selector */}
            <div className="md:col-span-3">
              <label className="block text-sm text-[#888] mb-2">Repository</label>
              {loadingRepos ? (
                <div className="h-10 bg-[#1a1a1a] rounded-lg animate-pulse" />
              ) : (
                <select
                  value={selectedRepo}
                  onChange={(e) => setSelectedRepo(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#7c8cf8]"
                >
                  {repos.length === 0 && (
                    <option value="">No repos found</option>
                  )}
                  {repos.map((r) => (
                    <option key={r.id} value={r.full_name}>
                      {r.full_name} {r.private ? "🔒" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Date range */}
            <div>
              <label className="block text-sm text-[#888] mb-2">From</label>
              <input
                type="date"
                value={since}
                onChange={(e) => setSince(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#7c8cf8]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#888] mb-2">To</label>
              <input
                type="date"
                value={until}
                onChange={(e) => setUntil(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#7c8cf8]"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={generate}
                disabled={generating || !selectedRepo}
                className="w-full bg-gradient-to-r from-[#7c8cf8] to-[#a78bfa] text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  "✨ Generate"
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-[#555]">
            Beta — free while we&apos;re in early access
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 mb-6 text-sm">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            {/* Stats bar */}
            <div className="flex items-center gap-4 px-6 py-3 bg-[#0d0d0d] border-b border-[#222] text-xs text-[#555]">
              <span>
                📝 {result.commits_used} commit{result.commits_used !== 1 ? "s" : ""}
              </span>
              <span>
                🔀 {result.prs_used} PR{result.prs_used !== 1 ? "s" : ""}
              </span>
              <span className="text-green-600 ml-auto">✓ Generated</span>
            </div>

            {/* Tone tabs */}
            <div className="flex border-b border-[#222]">
              {(["developer", "user", "executive"] as Tone[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-sm font-medium transition-colors capitalize ${
                    activeTab === tab
                      ? "text-[#7c8cf8] border-b-2 border-[#7c8cf8]"
                      : "text-[#666] hover:text-[#aaa]"
                  }`}
                >
                  {tab === "developer" ? "🛠 Developer" : tab === "user" ? "👤 User-Friendly" : "📊 Executive"}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6">
              <pre className="whitespace-pre-wrap font-mono text-sm text-[#ccc] leading-relaxed max-h-96 overflow-y-auto">
                {result[activeTab]}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-6 py-4 border-t border-[#222] bg-[#0d0d0d]">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 bg-[#1a1a1a] border border-[#333] text-sm px-4 py-2 rounded-lg hover:border-[#555] transition-colors"
              >
                {copied ? "✓ Copied!" : "📋 Copy"}
              </button>
              <button
                onClick={downloadMarkdown}
                className="flex items-center gap-2 bg-[#1a1a1a] border border-[#333] text-sm px-4 py-2 rounded-lg hover:border-[#555] transition-colors"
              >
                ⬇ Download .md
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
