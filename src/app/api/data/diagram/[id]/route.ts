import { routing } from "@/src/i18n/routing";
import { authOptions } from "@/src/lib/auth";
import client from "@/src/lib/db";
import {
  DiagramDocument,
  EdgeDocument,
  NodeDocument,
} from "@/src/types/data/DiagramTransfer";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
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

    const db = client.db(process.env.MONGODB_DATA_DB_NAME);

    const diagram = await db.collection<DiagramDocument>("diagrams").findOne({
      _id: new ObjectId(id),
    });

    if (!diagram) {
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    }

    const isOwner = diagram.ownerId.toString() === session.user.id;

    if (diagram.isPrivate && !isOwner) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    return NextResponse.json({ success: true, diagram });
  } catch (err) {
    console.error("GET /api/data/diagram/[id] error:", err);
    return NextResponse.json({ error: t("alertError") }, { status: 500 });
  }
}

export async function DELETE(
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

    const db = client.db(process.env.MONGODB_DATA_DB_NAME);

    const diagram = await db.collection<DiagramDocument>("diagrams").findOne({
      _id: new ObjectId(id),
    });

    if (!diagram) {
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    }

    const isOwner = diagram.ownerId.toString() === session.user.id;

    if (!isOwner) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    // Xóa danh sách edge
    await db
      .collection<EdgeDocument>("edges")
      .deleteMany({ diagramId: new ObjectId(id) });

    // Xóa danh sách node
    await db
      .collection<NodeDocument>("nodes")
      .deleteMany({ diagramId: new ObjectId(id) });

    // Xóa diagram
    const deleteResult = await db
      .collection<DiagramDocument>("diagrams")
      .deleteOne({ _id: new ObjectId(id) });

    if (deleteResult.deletedCount !== 1) {
      return NextResponse.json({ error: t("alertError") }, { status: 500 });
    }

    return NextResponse.json({ success: true, diagram });
  } catch (err) {
    console.error("DELETE /api/data/diagram/[id] error:", err);
    return NextResponse.json({ error: t("alertError") }, { status: 500 });
  }
}
