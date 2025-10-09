'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Roles } from '@/types/roles';
import { BlueBtnOutlined, PageContainer } from '@/components/Styles';
import Alert from '@/components/Alert';
import { UnauthenticatedPage } from './unauthenticatedPage';

export default function UmpireLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();

    const goToHome = () => router.push('/');

    if (status === 'unauthenticated') {
        return <UnauthenticatedPage router={router} />;
    }

    if (!session) {
        return null;
    }

    if (session.user.role === Roles.spectator.toString()) {
        return (
            <div className={PageContainer}>
                <Alert
                    variant="error"
                    title="Oops!"
                    message={
                        <div className="flex flex-col gap-3">
                            <p className="font-bold">You dont have permission to view this page.</p>
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
            </div>
        );
    }

    return <>{children}</>;
}