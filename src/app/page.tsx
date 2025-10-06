import MatchCard from "@/components/MatchCard";

export default function Home() {
  return (
    <div className="min-h-screen mx-auto max-w-2xl px-4 py-6">
      {[1, 2, 3, 4].map((match) => (<MatchCard key={match} id={match} />))}
    </div>
  );
}
