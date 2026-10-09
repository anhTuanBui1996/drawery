import { routing } from "@/src/i18n/routing";
import { authOptions } from "@/src/lib/nextauth";
import client from "@/src/lib/mongodb";
import {
  DiagramDocument,
  EdgeDocument,
  NodeDocument,
} from "@/src/types/data/DiagramDocument";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { NextRequest, NextResponse } from "next/server";
import { EdgeDTO, NodeDTO } from "@/src/types/model/DiagramData";
import { toEdgeDocument, toNodeDocument } from "@/src/utils/server";

type RequestBody = {
  upsertNodes?: NodeDTO[];
  deleteNodeIds?: string[];
  upsertEdges?: EdgeDTO[];
  deleteEdgeIds?: string[];
};

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

// Ids that are not ObjectIds were never persisted (e.g. created and deleted
// before the first save), so there is nothing to delete for them.
const toObjectIds = (ids: unknown): ObjectId[] =>
  Array.isArray(ids)
    ? ids
        .filter(
          (x): x is string =>
            typeof x === "string" && OBJECT_ID_PATTERN.test(x),
        )
        .map((x) => new ObjectId(x))
    : [];

const toArray = <T>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

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

    let body: RequestBody;
    try {
      body = (await req.json()) as RequestBody;
    } catch {
      return NextResponse.json({ error: t("alertError") }, { status: 400 });
    }

    const upsertNodes = toArray<NodeDTO>(body?.upsertNodes);
    const upsertEdges = toArray<EdgeDTO>(body?.upsertEdges);
    const deleteNodeIds = toObjectIds(body?.deleteNodeIds);
    const deleteEdgeIds = toObjectIds(body?.deleteEdgeIds);

    const db = client.db(process.env.MONGODB_DATA_DB_NAME);

    const diagramObjectId = new ObjectId(id);
    const diagram = await db.collection<DiagramDocument>("diagrams").findOne({
      _id: diagramObjectId,
    });

    if (!diagram) {
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    }

    const isOwner = diagram.ownerId.toString() === session.user.id;

    if (diagram.isPrivate && !isOwner) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    const nodeCol = db.collection<NodeDocument>("nodes");
    const edgeCol = db.collection<EdgeDocument>("edges");

    // Upsert each changed node/edge by its own _id, always scoped to this diagram.
    // If the _id already belongs to another diagram, the upsert fails with a
    // duplicate key error instead of overwriting that document.
    const nodeOps = upsertNodes.map(toNodeDocument).map(({ _id, ...rest }) => ({
      replaceOne: {
        filter: { _id, diagramId: diagramObjectId },
        replacement: {
          ...rest,
          updatedAt: new Date(),
          diagramId: diagramObjectId,
        },
        upsert: true,
      },
    }));

    const edgeOps = upsertEdges.map(toEdgeDocument).map(({ _id, ...rest }) => ({
      replaceOne: {
        filter: { _id, diagramId: diagramObjectId },
        replacement: {
          ...rest,
          updatedAt: new Date(),
          diagramId: diagramObjectId,
        },
        upsert: true,
      },
    }));

    // bulkWrite throws on an empty array, so only call it when there is work
    await Promise.all([
      nodeOps.length > 0
        ? nodeCol.bulkWrite(nodeOps, { ordered: false })
        : null,
      edgeOps.length > 0
        ? edgeCol.bulkWrite(edgeOps, { ordered: false })
        : null,
    ]);

    // Delete only what the client explicitly removed, scoped to this diagram
    await Promise.all([
      deleteNodeIds.length > 0
        ? nodeCol.deleteMany({
            diagramId: diagramObjectId,
            _id: { $in: deleteNodeIds },
          })
        : null,
      deleteEdgeIds.length > 0
        ? edgeCol.deleteMany({
            diagramId: diagramObjectId,
            _id: { $in: deleteEdgeIds },
          })
        : null,
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(
      `PATCH /api/data/diagram/${id}/updateDiagramNodesAndEdges error:`,
      err,
    );
    return NextResponse.json({ error: t("alertError") }, { status: 500 });
  }
}
