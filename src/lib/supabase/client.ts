import { createBrowserClient } from "@supabase/ssr";

export type BroadcastPayload = {
  id: string;
  data: string;
  mongo_id: string;
  is_deleted: boolean;
  synced_at: string;
};

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      realtime: {
        reconnectAfterMs: (tries) => Math.min(1000 * 2 ** tries, 30000),
        timeout: 60000,
      },
    },
  );
}
