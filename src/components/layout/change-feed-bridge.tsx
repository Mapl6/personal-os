"use client";

import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { changeFeed, type Change } from "@/repositories";

const CHANNEL = "pos-changes";

/**
 * Turns store writes into cache refreshes. Query keys start with the
 * collection name, so a write to `tasks` refreshes every tasks query.
 * Writes are also relayed to other open tabs via BroadcastChannel.
 */
export function ChangeFeedBridge() {
  const qc = useQueryClient();
  React.useEffect(() => {
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL) : null;
    const refresh = (changes: Change[]) => {
      const collections = new Set(changes.map((c) => c.collection));
      collections.delete("meta");
      for (const c of collections) qc.invalidateQueries({ queryKey: [c] });
    };
    const unsubscribe = changeFeed.subscribe((changes) => {
      refresh(changes);
      channel?.postMessage(changes);
    });
    if (channel) channel.onmessage = (e: MessageEvent<Change[]>) => refresh(e.data);
    return () => {
      unsubscribe();
      channel?.close();
    };
  }, [qc]);
  return null;
}
