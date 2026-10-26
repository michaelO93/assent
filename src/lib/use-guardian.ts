"use client";

import { useCallback, useEffect, useState } from "react";
import type { PrivateKeyAccount } from "viem/accounts";
import { fetchGuardian, type GuardianState } from "./client-api";
import { createGuardianAccount, loadChildren, loadGuardianAccount, type Child } from "./guardian";

/** The parent's local key, their children (device-only), and their on-chain state. */
export function useGuardian() {
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState<PrivateKeyAccount | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [state, setState] = useState<GuardianState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (acct = account) => {
    setChildren(loadChildren());
    if (!acct) return;
    try {
      setState(await fetchGuardian(acct.address));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [account]);

  useEffect(() => {
    const acct = loadGuardianAccount();
    setAccount(acct);
    setChildren(loadChildren());
    setReady(true);
    if (acct) fetchGuardian(acct.address).then(setState, (e) => setError((e as Error).message));
  }, []);

  const create = useCallback(() => {
    const acct = createGuardianAccount();
    setAccount(acct);
    void refresh(acct);
    return acct;
  }, [refresh]);

  return { ready, account, children, state, error, refresh, create };
}
