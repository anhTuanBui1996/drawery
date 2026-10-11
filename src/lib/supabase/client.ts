import { createBrowserClient } from "@supabase/ssr";

// Payload of realtime.broadcast_changes (the row is the table row as JSON)
export type RowChangePayload<T> = {
  id: string;
  schema: string;
  table: string;
  operation: "INSERT" | "UPDATE" | "DELETE";
  record: T | null;
  old_record: T | null;
};

export function createClient() {
  return createBrowserClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      realtime: {
        reconnectAfterMs: (tries) => Math.min(1000 * 2 ** tries, 30000),
        timeout: 60000,
      },
    },
  );
}
