import { routing } from "@/src/i18n/routing";
import { authOptions } from "@/src/lib/auth";
import client from "@/src/lib/db";
import { DiagramDocument } from "@/src/types/data/DiagramTransfer";
import { DiagramInfo } from "@/src/types/model/DiagramData";
import { ExtendedAdapterUser } from "@/src/types/model/ExtendedAdapterUser";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const locale = req.headers.get("accept-language") || routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "Drawing" });
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newTitle }: { newTitle: string } = await req.json();

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

    const updateResult = await db
      .collection<DiagramDocument>("diagrams")
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { title: newTitle, lastUpdatedAt: new Date() } },
      );

    if (updateResult.modifiedCount === 1) {
      const newDiagram = await db
        .collection<DiagramDocument>("diagrams")
        .findOne({
          _id: new ObjectId(id),
        });
      if (!newDiagram) {
        return NextResponse.json({ error: t("notFound") });
      }

      const owner = await db
        .collection<ExtendedAdapterUser>("users")
        .findOne({ _id: newDiagram.ownerId });

      const newDiagramInfo: DiagramInfo = {
        diagramId: id,
        createdAt: newDiagram.createdAt,
        isOwned: isOwner,
        isPrivate: newDiagram.isPrivate,
        lastUpdatedAt: newDiagram.updatedAt,
        ownerAvatar: owner?.image,
        ownerName: owner?.name,
        title: newDiagram.title,
      };

      return NextResponse.json({
        success: true,
        result: newDiagramInfo,
      });
    }

    return NextResponse.json({ error: t("sendUpdateTitleFail") });
  } catch (err) {
    console.error("POST /api/data/updateDiagramTitle error:", err);
    return NextResponse.json({ error: t("alertError") }, { status: 500 });
  }
}
