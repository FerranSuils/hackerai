import { WorkOS } from "@workos-inc/node";

let _workos: WorkOS | undefined;

function getWorkos(): WorkOS {
  if (!_workos) {
    _workos = new WorkOS(process.env.WORKOS_API_KEY, {
      clientId: process.env.WORKOS_CLIENT_ID,
    });
  }
  return _workos;
}

// Lazy proxy: initialized on first property access at runtime, not at import time.
// This prevents build failures when env vars are not yet available.
export const workos: WorkOS = new Proxy({} as WorkOS, {
  get(_, prop) {
    return (getWorkos() as any)[prop];
  },
});
