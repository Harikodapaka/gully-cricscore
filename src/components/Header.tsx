'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
    return (<header className="bg-white border-b border-[#e9e9e9]">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-8 px-4 sm:px-6 lg:px-8">
            <Link className="block text-teal-600" href="/">
                <span className="sr-only">Home</span>
                <Image
                    className="dark:invert"
                    src="/next.svg"
                    alt="Next.js logo"
                    width={120}
                    height={38}
                    priority
                />
            </Link>
            <Link
                className="block rounded-md bg-blue-500 px-2 py-2 sm:px-5 sm:py-2.5 text-sm font-medium text-white transition hover:bg-blue-400 ml-auto"
                href="/umpire"
            >
                Start Match
            </Link>
        </div>
    </header>

    );
}