import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e1e] max-w-6xl mx-auto">
        <span className="font-bold text-xl tracking-tight">
          <span className="bg-gradient-to-r from-[#7c8cf8] to-[#a78bfa] bg-clip-text text-transparent">
            Proseflow
          </span>
        </span>
        {session ? (
          <Link
            href="/dashboard"
            className="bg-gradient-to-r from-[#7c8cf8] to-[#a78bfa] text-white px-4 py-2 rounded-lg font-semibold text-sm"
          >
            Go to Dashboard →
          </Link>
        ) : (
          <Link
            href="/api/auth/signin"
            className="bg-gradient-to-r from-[#7c8cf8] to-[#a78bfa] text-white px-4 py-2 rounded-lg font-semibold text-sm"
          >
            Sign in with GitHub
          </Link>
        )}
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-block bg-[#1a1a1a] border border-[#333] rounded-full px-4 py-1.5 text-sm text-[#888] mb-8">
          🚀 Early Access — Free while in beta
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
          Your GitHub commits,{" "}
          <br />
          <span className="bg-gradient-to-r from-[#7c8cf8] to-[#a78bfa] bg-clip-text text-transparent">
            turned into release notes
          </span>
        </h1>
        <p className="text-xl text-[#a0a0a0] mb-10 max-w-2xl mx-auto leading-relaxed">
          Stop writing changelogs manually. Connect your repo, pick a date
          range, and Proseflow generates polished release notes in three
          tones — developer, user-friendly, and executive.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href={session ? "/dashboard" : "/api/auth/signin"}
            className="bg-gradient-to-r from-[#7c8cf8] to-[#a78bfa] text-white px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity"
          >
            {session ? "Go to Dashboard" : "Connect GitHub — it's free"}
          </Link>
        </div>
        <p className="mt-4 text-sm text-[#555]">
          No credit card required · Free during beta
        </p>
      </section>

      {/* How it works */}
      <section className="bg-[#111] border-t border-b border-[#1e1e1e] py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">
            How it works
          </h2>
          <p className="text-center text-[#666] mb-12">
            From commits to changelog in under 60 seconds
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                n: "1",
                title: "Connect GitHub",
                desc: "Sign in with GitHub OAuth. Proseflow reads your merged PRs and commits — no webhook setup needed.",
              },
              {
                n: "2",
                title: "Pick a range",
                desc: "Select a repo and date range (or tag range). Proseflow fetches the relevant changes automatically.",
              },
              {
                n: "3",
                title: "Get 3 versions",
                desc: "Instantly see dev-facing notes, user-friendly release notes, and an exec summary. Copy, edit, done.",
              },
            ].map((step) => (
              <div key={step.n} className="text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7c8cf8] to-[#a78bfa] flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
                  {step.n}
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-[#a0a0a0] text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">
          Sound familiar?
        </h2>
        <p className="text-center text-[#666] mb-12">
          Every developer who ships knows this feeling
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            "\"Context switching from building to documenting is brutal.\"",
            "\"Release notes become an afterthought — or don't happen at all.\"",
            "\"Too tedious to sustain when shipping multiple times a week.\"",
            "\"Translating commits into user-friendly language takes time I don't have.\"",
          ].map((quote, i) => (
            <div
              key={i}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6"
            >
              <p className="text-[#a0a0a0] text-sm leading-relaxed italic">
                {quote}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#111] border-t border-[#1e1e1e] py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-extrabold mb-4">
            Try it now — free
          </h2>
          <p className="text-[#888] text-lg mb-8">
            Connect your GitHub repo and generate your first changelog in
            under a minute. No credit card, no setup, no nonsense.
          </p>
          <Link
            href={session ? "/dashboard" : "/api/auth/signin"}
            className="bg-gradient-to-r from-[#7c8cf8] to-[#a78bfa] text-white px-10 py-4 rounded-xl font-bold text-xl hover:opacity-90 transition-opacity inline-block"
          >
            {session ? "Open Dashboard" : "Sign in with GitHub"}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] py-8 text-center text-[#444] text-sm">
        <p>
          © 2025 Proseflow · Built by an autonomous AI agent ·{" "}
          <a
            href="mailto:hello@proseflow.io"
            className="hover:text-[#888] transition-colors"
          >
            hello@proseflow.io
          </a>
        </p>
      </footer>
    </main>
  );
}
