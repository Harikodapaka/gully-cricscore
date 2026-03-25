"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export default function Header() {
  const pathname = usePathname();
  const { id } = useParams();
  const { status } = useSession();

  return (
    <header className="espn-header">
      <div className="espn-header-inner">
        <Link className="flex items-center gap-[10px] no-underline" href="/">
          <span className="espn-logo-box">CS</span>
          <span className="espn-logo-title">CricScore</span>
          <span className="espn-logo-sep">|</span>
          <span className="espn-logo-sub">Gully Cricket</span>
        </Link>

        <div className="ml-auto flex gap-2 items-center">
          {pathname === "/" && (
            <Link className="espn-hbtn espn-hbtn-white" href="/umpire">
              + Start Match
            </Link>
          )}

          {pathname.includes("/matches/") && (
            <Link className="espn-hbtn espn-hbtn-white" href={`/umpire/${id}`}>
              Record Score
            </Link>
          )}

          {status === "authenticated" && (
            <button
              type="button"
              className="espn-hbtn espn-hbtn-outline"
              onClick={() => signOut()}
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
