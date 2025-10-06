'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BlueBtn, OrangeBtn } from './Styles';
import { signOut, useSession } from 'next-auth/react';

export default function Header() {
    const pathname = usePathname();
    const { status } = useSession();

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
            {pathname === '/' && <Link
                className={`${BlueBtn} ml-auto`}
                href="/umpire"
            >
                Start Match
            </Link>}
            {pathname === '/umpire' && status === 'authenticated' && <button className={`${OrangeBtn} ml-auto`}
                onClick={() => signOut()}>Sign out</button>}
        </div>
    </header>

    );
}