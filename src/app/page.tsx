import Link from "next/link";
import { Suspense } from "react";
import MatchCard from "@/components/MatchCard";
import LoadingOverlay from "@/components/LoadingOverlay";

async function MatchesList() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/match`, {
    cache: "no-store",
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    return <div className="text-red-500 p-6">❌ Failed to load matches</div>;
  }

  const matches: any[] = await res.json();

  return (
    <>
      {matches && matches.length > 0 ? (
        matches.map((match) => (
          <Link key={match._id} href={`/matches/${match._id}`}>
            <MatchCard match={match} />
          </Link>
        ))
      ) : (
        <p className="text-gray-500">No matches found</p>
      )}
    </>
  );
}

export default function Home() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Suspense fallback={<LoadingOverlay />}>
        <MatchesList />
      </Suspense>
    </div>
  );
}