import Link from "next/link";
import MatchCard from "@/components/MatchCard";

export default async function Home() {
  const res = await fetch(`http://localhost:3000/api/match`, {
    cache: "no-store", // always fetch latest
    method: "GET",
    headers: { "Content-Type": "application/json" },

  });

  if (!res.ok) {
    return <div className="text-red-500 p-6">❌ Failed to load matches</div>;
  }

  const matches: any[] = await res.json();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {matches && matches.length > 0 ? (
        matches.map((match) => (
          <Link
            key={match._id}
            href={`/matches/${match._id}`}
          >
            <MatchCard match={match} />
          </Link>
        ))
      ) : (
        <p className="text-gray-500">No matches found</p>
      )}
    </div>
  );
}
