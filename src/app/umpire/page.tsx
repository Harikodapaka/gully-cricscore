'use client';

import { CardBase, PageContainer } from '@/components/Styles';
import { StartMatchForm } from './startMatchForm';

export default function UmpirePage() {
    return (
        <div className={PageContainer}>
            <div className={`${CardBase} p-4`}>
                <h2 className='text-xl mb-3'>Enter match details:</h2>
                <StartMatchForm />
            </div>
        </div>
    );
}