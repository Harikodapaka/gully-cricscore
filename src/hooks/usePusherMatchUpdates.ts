'use client';

import { useEffect, useState } from 'react';
import { pusherClient } from '@/lib/pusher-client';
import { IBall } from '@/models/Ball';
import { IMatchPopulated } from '@/models/Match';
import { MATCH_STATUS } from '@/constants/match';

interface BallDeletedPayload {
    ballId: string;
    inningsId: string;
    runs: number;
    isWicket: boolean;
    overNumber: number;
    ballNumber: number;
}

interface UsePusherMatchUpdatesOptions {
    matchId: string | string[] | undefined;
    matchStatus: string | undefined;
    onScoreUpdate: (ball: IBall) => void;
    onBallDeleted?: (payload: BallDeletedPayload) => void;
}

export function usePusherMatchUpdates({
    matchId,
    matchStatus,
    onScoreUpdate,
    onBallDeleted,
}: UsePusherMatchUpdatesOptions) {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!matchId || matchStatus !== MATCH_STATUS.IN_PROGRESS) {
            setIsConnected(false);
            return;
        }

        const channelName = `match-${matchId}`;
        let channel: ReturnType<typeof pusherClient.subscribe> | null = null;

        const onConnected = () => {
            setIsConnected(true);
            console.log('Connected to Pusher');
        };

        const onDisconnected = () => {
            setIsConnected(false);
            console.log('Disconnected from Pusher');
        };

        const onChannelSubscribed = () => {
            setIsConnected(true);
            console.log('Channel subscribed:', channelName);
        };

        const onChannelError = (error: any) => {
            setIsConnected(false);
            console.error('Channel subscription error:', error);
        };

        try {
            // Check initial connection state
            if (pusherClient.connection.state === 'connected') {
                setIsConnected(true);
            }

            channel = pusherClient.subscribe(channelName);

            const scoreUpdateHandler = (data: IBall) => {
                console.log("Score update received");
                onScoreUpdate(data);
            };

            const ballDeletedHandler = (payload: BallDeletedPayload) => {
                console.log("Ball deleted event received", payload);
                if (onBallDeleted) {
                    onBallDeleted(payload);
                }
            };

            channel.bind('score-update', scoreUpdateHandler);
            if (onBallDeleted) {
                channel.bind('ball-deleted', ballDeletedHandler);
            }

            // Bind to channel subscription events
            channel.bind('pusher:subscription_succeeded', onChannelSubscribed);
            channel.bind('pusher:subscription_error', onChannelError);

            // Bind to connection events
            pusherClient.connection.bind('connected', onConnected);
            pusherClient.connection.bind('disconnected', onDisconnected);

            return () => {
                if (channel) {
                    channel.unbind('score-update', scoreUpdateHandler);
                    if (onBallDeleted) {
                        channel.unbind('ball-deleted', ballDeletedHandler);
                    }
                    channel.unbind('pusher:subscription_succeeded', onChannelSubscribed);
                    channel.unbind('pusher:subscription_error', onChannelError);
                    pusherClient.unsubscribe(channelName);
                }
                pusherClient.connection.unbind('connected', onConnected);
                pusherClient.connection.unbind('disconnected', onDisconnected);
            };
        } catch (err) {
            console.error('Pusher subscription error', err);
            setIsConnected(false);
        }
    }, [matchId, matchStatus, onScoreUpdate, onBallDeleted]);

    return { isConnected };
}

