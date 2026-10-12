import { routing } from "@/src/i18n/routing";
import { authOptions } from "@/src/lib/nextauth";
import supabaseAdmin from "@/src/lib/supabase/admin";
import { DiagramRow } from "@/src/types/data/DiagramRow";
import { isUuid } from "@/src/utils/server";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { NextRequest, NextResponse } from "next/server";
import { SQLProviderName, SQLProviders } from "@/src/constants/sqlProviders";

// Fields that can be changed through this route. The client sends only the
// ones that changed. Keep in sync with DIAGRAM_SYNC_FIELDS in DrawingProvider.
type RequestBody = {
  title?: unknown;
  providerName?: unknown;
  isPrivate?: unknown;
  shares?: unknown;
};

type DiagramChanges = Partial<
  Pick<DiagramRow, "title" | "provider" | "is_private" | "shares">
>;

const MAX_TITLE_LENGTH = 200;
const MAX_SHARES = 100;
// Shares are user ids, and users still live in MongoDB (ObjectId)
const USER_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const sameIds = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  const set = new Set(b);
  return a.every((x) => set.has(x));
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const locale = req.headers.get("accept-language") || routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "Drawing" });
  const { id } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    if (!isUuid(id)) {
      return NextResponse.json({ error: t("invalidId") }, { status: 400 });
    }

    let input: RequestBody;
    try {
      input = ((await req.json()) ?? {}) as RequestBody;
    } catch {
      return NextResponse.json({ error: t("alertError") }, { status: 400 });
    }
    const badRequest = () =>
      NextResponse.json({ error: t("alertError") }, { status: 400 });

    // 1. Validate input shape (nothing is trusted from the client)
    const requested: DiagramChanges = {};

    if ("title" in input) {
      if (input.title === null) {
        requested.title = t("noTitle");
      } else if (
        typeof input.title === "string" &&
        input.title.trim().length <= MAX_TITLE_LENGTH
      ) {
        requested.title = input.title.trim() || t("noTitle");
      } else {
        return badRequest();
      }
    }

    if ("providerName" in input) {
      const name = input.providerName;
      if (
        typeof name !== "string" ||
        !SQLProviders.some((p) => p.provider === name)
      ) {
        return badRequest();
      }
      requested.provider = name as SQLProviderName;
    }

    if ("isPrivate" in input) {
      if (typeof input.isPrivate !== "boolean") return badRequest();
      requested.is_private = input.isPrivate;
    }

    if ("shares" in input) {
      const raw = input.shares;
      if (
        !Array.isArray(raw) ||
        raw.length > MAX_SHARES ||
        !raw.every((x) => typeof x === "string" && USER_ID_PATTERN.test(x))
      ) {
        return badRequest();
      }
      requested.shares = [...new Set<string>(raw)];
    }

    if (Object.keys(requested).length === 0) return badRequest();

    // 2. Load the diagram and check access
    const { data: diagram, error: findError } = await supabaseAdmin
      .from("diagrams")
      .select("*")
      .eq("id", id)
      .maybeSingle<DiagramRow>();
    if (findError) throw findError;

    if (!diagram) {
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    }

    const isOwner = diagram.owner_id === session.user.id;
    if (diagram.is_private && !isOwner) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    // 3. Keep only what actually differs, so no-op saves don't trigger realtime events
    const changes: DiagramChanges = {};
    if (requested.title !== undefined && requested.title !== diagram.title) {
      changes.title = requested.title;
    }
    if (
      requested.provider !== undefined &&
      requested.provider !== diagram.provider
    ) {
      changes.provider = requested.provider;
    }
    if (
      requested.is_private !== undefined &&
      requested.is_private !== diagram.is_private
    ) {
      changes.is_private = requested.is_private;
    }
    if (requested.shares !== undefined) {
      // The owner always has access, so never list them as a share
      const shares = requested.shares.filter((x) => x !== diagram.owner_id);
      if (!sameIds(shares, diagram.shares ?? [])) changes.shares = shares;
    }

    // 4. Access-control fields can only be changed by the owner
    if (
      (changes.is_private !== undefined || changes.shares !== undefined) &&
      !isOwner
    ) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    if (Object.keys(changes).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("diagrams")
        .update({ ...changes, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (updateError) throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(
      `PATCH /api/data/erd/${id}/updateDiagramInfo error:`,
      err,
    );
    return NextResponse.json({ error: t("alertError") }, { status: 500 });
  }
}
