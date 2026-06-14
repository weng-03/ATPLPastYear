import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { searchQuestions } from "@/lib/supabase/queries";
import Header from "@/components/dashboard/Header";
import SearchResultCard from "@/components/search/SearchResultCard";

export const metadata = {
  title: "Search Questions — ATPL Past Year",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const resolvedParams = await searchParams;
  const q = resolvedParams.q;
  const query = typeof q === 'string' ? q : '';
  const results = query ? await searchQuestions(query) : [];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      <Header email={user.email ?? "Pilot"} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <a href="/dashboard" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Find Questions
          </h1>
        </div>

        {/* Search Bar */}
        <form className="mb-8 relative animate-slide-up" method="GET" action="/search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by keyword, phrase, or question ID..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl text-base focus:outline-none transition-all"
            style={{ 
              background: "var(--bg-surface)", 
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            }}
            autoFocus
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "var(--sky-400)";
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "var(--border)";
            }}
          />
        </form>

        {/* Results Header */}
        {query && (
          <div className="mb-4 text-sm font-medium animate-slide-up" style={{ color: "var(--text-muted)", animationDelay: "0.1s" }}>
            Found {results.length} result{results.length === 1 ? "" : "s"}
          </div>
        )}

        {/* Results List */}
        <div className="space-y-4">
          {results.map((q, idx) => (
            <div key={q.id} className="animate-slide-up" style={{ animationDelay: `${Math.min(idx * 0.05, 0.5)}s` }}>
              <SearchResultCard question={q} />
            </div>
          ))}

          {query && results.length === 0 && (
            <div className="text-center py-12 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8" style={{ color: "var(--text-muted)" }}>
                  <path d="M15 15l6 6M10 17A7 7 0 1 0 10 3a7 7 0 0 0 0 14z" />
                </svg>
              </div>
              <p style={{ color: "var(--text-primary)" }} className="font-semibold text-lg mb-1">No questions found</p>
              <p style={{ color: "var(--text-muted)" }} className="text-sm">We couldn't find anything for &quot;{query}&quot;. Try a different keyword.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
