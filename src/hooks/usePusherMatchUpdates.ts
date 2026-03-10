"use client";

import { useEffect, useRef, useState } from "react";
import { MATCH_STATUS } from "@/constants/match";
import { pusherClient } from "@/lib/pusher-client";
import type { BallDTO } from "@/types/dto";

// Exported so consumers don't need to re-declare the type locally
export interface BallDeletedPayload {
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
  onScoreUpdate: (ball: BallDTO) => void;
  onBallDeleted?: (payload: BallDeletedPayload) => void;
  // Task 12: Optional callback fired when Pusher reconnects,
  // so the parent can re-fetch fresh data after a disconnection.
  onReconnect?: () => void;
}

export function usePusherMatchUpdates({
  matchId,
  matchStatus,
  onScoreUpdate,
  onBallDeleted,
  onReconnect,
}: UsePusherMatchUpdatesOptions) {
  const [isConnected, setIsConnected] = useState(false);
  // Task 12: Track whether we've ever connected so we know a reconnect is happening
  const wasConnectedRef = useRef(false);

  // Task 6: Store callbacks in refs so the useEffect never needs them as dependencies.
  // Previously, new function references on each render caused full Pusher re-subscription.
  const onScoreUpdateRef = useRef(onScoreUpdate);
  const onBallDeletedRef = useRef(onBallDeleted);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => {
    onScoreUpdateRef.current = onScoreUpdate;
    onBallDeletedRef.current = onBallDeleted;
    onReconnectRef.current = onReconnect;
  });

  useEffect(() => {
    if (!matchId || matchStatus !== MATCH_STATUS.IN_PROGRESS) {
      setIsConnected(false);
      return;
    }

    const channelName = `match-${matchId}`;
    let channel: ReturnType<typeof pusherClient.subscribe> | null = null;

    const onConnected = () => {
      // Task 12: If we were connected before, this is a reconnect — trigger data refresh
      if (wasConnectedRef.current) {
        onReconnectRef.current?.();
      }
      wasConnectedRef.current = true;
      setIsConnected(true);
    };

    const onDisconnected = () => setIsConnected(false);
    const onChannelSubscribed = () => setIsConnected(true);
    const onChannelError = () => setIsConnected(false);

    try {
      if (pusherClient.connection.state === "connected") {
        wasConnectedRef.current = true;
        setIsConnected(true);
      }

      channel = pusherClient.subscribe(channelName);

      // Use refs so these handlers are stable — no re-subscription on prop changes
      const scoreUpdateHandler = (data: BallDTO) => {
        onScoreUpdateRef.current(data);
      };

      const ballDeletedHandler = (payload: BallDeletedPayload) => {
        onBallDeletedRef.current?.(payload);
      };

      channel.bind("score-update", scoreUpdateHandler);
      channel.bind("ball-deleted", ballDeletedHandler);
      channel.bind("pusher:subscription_succeeded", onChannelSubscribed);
      channel.bind("pusher:subscription_error", onChannelError);

      pusherClient.connection.bind("connected", onConnected);
      pusherClient.connection.bind("disconnected", onDisconnected);

      return () => {
        if (channel) {
          channel.unbind("score-update", scoreUpdateHandler);
          channel.unbind("ball-deleted", ballDeletedHandler);
          channel.unbind("pusher:subscription_succeeded", onChannelSubscribed);
          channel.unbind("pusher:subscription_error", onChannelError);
          pusherClient.unsubscribe(channelName);
        }
        pusherClient.connection.unbind("connected", onConnected);
        pusherClient.connection.unbind("disconnected", onDisconnected);
      };
    } catch (err) {
      console.error("Pusher subscription error", err);
      setIsConnected(false);
    }
    // Task 6: callbacks intentionally excluded — handled via refs above
  }, [matchId, matchStatus]);

  return { isConnected };
}
