import Link from "next/link";
import { Suspense } from "react";
import LoadingOverlay from "@/components/LoadingOverlay";
import MatchCard from "@/components/MatchCard";
import type { IMatchPopulated } from "@/models/Match";

async function MatchesList() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/match?limit=10`,
    {
      cache: "no-store",
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );

  if (!res.ok) {
    return <div className="text-red-500 p-6">❌ Failed to load matches</div>;
  }

  const matches: IMatchPopulated[] = await res.json();

  return (
    <>
      {matches && matches.length > 0 ? (
        matches.map((match) => (
          <Link key={`match-${match._id}`} href={`/matches/${match._id}`}>
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
    <div className="mx-auto max-w-[900px] px-4 py-5">
      <div className="sec-head">
        <span className="sec-title">Recent Matches</span>
      </div>
      <Suspense fallback={<LoadingOverlay />}>
        <MatchesList />
      </Suspense>
    </div>
  );
}
