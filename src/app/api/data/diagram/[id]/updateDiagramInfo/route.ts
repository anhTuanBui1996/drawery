import { routing } from "@/src/i18n/routing";
import { authOptions } from "@/src/lib/nextauth";
import client from "@/src/lib/mongodb";
import { DiagramDocument } from "@/src/types/data/DiagramDocument";
import { ObjectId } from "mongodb";
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
  Pick<DiagramDocument, "title" | "provider" | "isPrivate" | "shares">
>;

const MAX_TITLE_LENGTH = 200;
const MAX_SHARES = 100;
const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const sameIds = (a: ObjectId[], b: ObjectId[]) => {
  if (a.length !== b.length) return false;
  const set = new Set(b.map((x) => x.toString()));
  return a.every((x) => set.has(x.toString()));
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

    if (!id || !ObjectId.isValid(id)) {
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
      requested.isPrivate = input.isPrivate;
    }

    if ("shares" in input) {
      const raw = input.shares;
      if (
        !Array.isArray(raw) ||
        raw.length > MAX_SHARES ||
        !raw.every((x) => typeof x === "string" && OBJECT_ID_PATTERN.test(x))
      ) {
        return badRequest();
      }
      requested.shares = [...new Set<string>(raw)].map((x) => new ObjectId(x));
    }

    if (Object.keys(requested).length === 0) return badRequest();

    // 2. Load the diagram and check access
    const db = client.db(process.env.MONGODB_DATA_DB_NAME);
    const diagramCol = db.collection<DiagramDocument>("diagrams");
    const diagramObjectId = new ObjectId(id);

    const diagram = await diagramCol.findOne({ _id: diagramObjectId });
    if (!diagram) {
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    }

    const isOwner = diagram.ownerId.toString() === session.user.id;
    if (diagram.isPrivate && !isOwner) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    // 3. Keep only what actually differs, so no-op saves don't trigger realtime events
    const changes: DiagramChanges = {};
    if (
      requested.title !== undefined &&
      requested.title !== (diagram.title ?? null)
    ) {
      changes.title = requested.title;
    }
    if (
      requested.provider !== undefined &&
      requested.provider !== diagram.provider
    ) {
      changes.provider = requested.provider;
    }
    if (
      requested.isPrivate !== undefined &&
      requested.isPrivate !== diagram.isPrivate
    ) {
      changes.isPrivate = requested.isPrivate;
    }
    if (requested.shares !== undefined) {
      // The owner always has access, so never list them as a share
      const shares = requested.shares.filter((x) => !x.equals(diagram.ownerId));
      if (!sameIds(shares, diagram.shares ?? [])) changes.shares = shares;
    }

    // 4. Access-control fields can only be changed by the owner
    if (
      (changes.isPrivate !== undefined || changes.shares !== undefined) &&
      !isOwner
    ) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    if (Object.keys(changes).length > 0) {
      await diagramCol.updateOne(
        { _id: diagramObjectId },
        { $set: { ...changes, updatedAt: new Date() } },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(
      `PATCH /api/data/diagram/${id}/updateDiagramInfo error:`,
      err,
    );
    return NextResponse.json({ error: t("alertError") }, { status: 500 });
  }
}
