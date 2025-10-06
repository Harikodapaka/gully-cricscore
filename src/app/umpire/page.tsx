'use client';

import { useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Roles } from '@/types/roles';
import { BlueBtnOutlined, CardBase, PageContainer } from '@/components/Styles';
import Alert from '@/components/Alert';
import { UnauthenticatedPage } from './unauthenticatedPage';
import { StartMatchForm } from './startMatchForm';

export default function UmpirePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [matches, setMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const emailRef = useRef<HTMLInputElement>(null);
    const goToHome = () => router.push('/');

    if (status === 'unauthenticated') {
        return (
            <UnauthenticatedPage router={router} />
        );
    }

    if (!session) {
        return null;
    }

    if (session.user.role === Roles.spectator.toString()) {
        return (<div className={PageContainer}>
            <Alert
                variant="error"
                title="Oops!"
                message={
                    <div className={`flex flex-col gap-3`}>
                        <p className='font-bold'>You dont have permission to view this page.</p>
                        <button
                            onClick={goToHome}
                            className={`${BlueBtnOutlined} max-w-fit flex items-center gap-2`}
                        >
                            Back to home
                        </button>
                    </div>
                }
                onClose={goToHome}
            />
        </div>)
    }

    return (
        <div className={PageContainer}>
            <div className={`${CardBase} p-4`}>
                <h2 className='text-xl mb-3'>Enter match details:</h2>
                <StartMatchForm />
            </div>
        </div>
    );
}