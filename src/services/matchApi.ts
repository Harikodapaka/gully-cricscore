import { API_BASE_URL } from '@/constants/match';

export interface BallPayload {
    inningsId: string;
    overNumber: number;
    ballNumber: number;
    runs: number;
    isWicket: boolean;
    isExtra: boolean;
    extraType: string;
    matchId: string | string[];
}

export const matchApi = {
    fetchMatchDetails: async (matchId: string | string[]) => {
        const response = await fetch(`${API_BASE_URL}/api/match/${matchId}/details`);
        if (!response.ok) {
            throw new Error('Failed to fetch match data');
        }
        return response.json();
    },

    transitionInnings: async (matchId: string | string[]) => {
        const response = await fetch(
            `${API_BASE_URL}/api/match/${matchId}/transition-innings`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
            }
        );
        if (!response.ok) {
            throw new Error('Failed to transition innings');
        }
        return response.json();
    },

    trackBall: async (body: BallPayload) => {
        const response = await fetch(`${API_BASE_URL}/api/ball`, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
            throw new Error('Failed to track score');
        }
        return response.json();
    },

    deleteBall: async (ballId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/ball/${ballId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
            throw new Error('Failed to delete last ball');
        }
        return response.json();
    },
};

