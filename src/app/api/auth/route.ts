import { authOptions } from "@/src/lib/auth";
import client from "@/src/lib/db";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/src/i18n/routing";
import { DiagramInfo } from "@/src/types/model/DiagramData";

export async function POST(req: NextRequest) {
  const locale = req.headers.get("accept-language") || routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "Drawing" });
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const body = await req.json();
    const diagramId: string = body.diagramId;

    if (!diagramId || !ObjectId.isValid(diagramId)) {
      return NextResponse.json({ error: t("invalidId") }, { status: 400 });
    }

    const db = client.db(process.env.MONGODB_DATA_DB_NAME);

    const diagram = await db.collection("diagrams").findOne({
      _id: new ObjectId(diagramId),
    });

    if (!diagram) {
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    }

    const isOwner = diagram.ownerId.toString() === session.user.id;

    if (diagram.isPrivate && !isOwner) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    const owner = await db
      .collection("users")
      .findOne({ _id: diagram.ownerId }, { projection: { name: 1, image: 1 } });

    const responseData: DiagramInfo = {
      isOwned: isOwner,
      isPrivate: diagram.isPrivate,
      createdAt: diagram.createdAt,
      lastUpdatedAt: diagram.lastUpdatedAt,
      diagramId: diagram._id.toString(),
      title: diagram.title,
    };

    if (!isOwner && owner) {
      responseData.ownerName = owner.name;
      responseData.ownerAvatar = owner.image;
    }

    return NextResponse.json(responseData);
  } catch (err) {
    console.error("POST /api/data/getDiagramDataWithId error:", err);
    return NextResponse.json(err, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const locale = req.headers.get("accept-language") || routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "Drawing" });
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { diagramId }: { diagramId: string } = await req.json();
    const db = client.db(process.env.MONGODB_DATA_DB_NAME);

    const deleteDiagram = await db.collection("diagrams").deleteOne({
      ownerId: new ObjectId(session.user.id),
      _id: new ObjectId(diagramId),
    });

    return NextResponse.json({ success: deleteDiagram.deletedCount === 1 });
  } catch (err) {
    console.error("POST /api/data/deleteDiagram error:", err);
    return NextResponse.json({ error: t("alertError") }, { status: 500 });
  }
}
