'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Roles } from '@/types/roles';

export default function UmpirePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [matches, setMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);


    if (status === 'unauthenticated') {
        return (
            <div className='container mx-auto p-4'>
                Umpire Access: Please sign in with Google to access the umpire panel

                <button
                    onClick={() => signIn('google')}
                    className="w-full bg-green-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
                >
                    Sign in with Google

                </button>

                
            </div>
        );
    }

    if(!session) {
        return null;
    }
    
    if(session.user.role === Roles.spectator.toString()) {
        return (<div className='container mx-auto p-4'>
            You dont have permission to view this page.
        </div>)
    }

    return (
        <div className='container mx-auto p-4'>
            umpire page :  {status}
            <div>
                    <p>Signed in as {((session as any).user as any)?.email}</p>
                    <p>Role: {session.user.role}</p>
                    <button className="w-full bg-red-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
                    onClick={() => signOut()}>Sign out</button>
                </div>
        </div>
    );
}