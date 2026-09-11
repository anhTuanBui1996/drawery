import { routing } from "@/src/i18n/routing";
import { authOptions } from "@/src/lib/auth";
import client from "@/src/lib/db";
import { DiagramDocument } from "@/src/types/data/DiagramTransfer";
import { DiagramInfo } from "@/src/types/model/DiagramData";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const locale = req.headers.get("accept-language") || routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "Dashboard" });
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const db = client.db(process.env.MONGODB_DATA_DB_NAME);

    const rawDiagrams = await db
      .collection<DiagramDocument>("diagrams")
      .find({ shares: new ObjectId(session.user.id) })
      .toArray();

    const diagrams: DiagramInfo[] = rawDiagrams.map((doc) => {
      const isOwner = doc.ownerId.toString() === session.user.id;
      let res: DiagramInfo = {
        isOwned: isOwner,
        isPrivate: doc.isPrivate,
        createdAt: doc.createdAt,
        lastUpdatedAt: doc.updatedAt ?? doc.createdAt,
        diagramId: doc._id.toHexString(),
        title: doc.title ?? undefined,
      };
      if (isOwner) {
        res.ownerAvatar = session.user.image;
        res.ownerName = session.user.name;
      }
      return res;
    });

    return NextResponse.json({ success: true, diagrams });
  } catch (err) {
    console.error("GET /api/data/getMyDiagrams error:", err);
    return NextResponse.json({ error: err }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const locale = req.headers.get("accept-language") || routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "Drawing" });
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, isPrivate } = await req.json();
    const db = client.db(process.env.MONGODB_DATA_DB_NAME);

    const newDiagram = await db.collection("diagrams").insertOne({
      createdAt: new Date(),
      title,
      ownerId: new ObjectId(session.user.id),
      isPrivate,
      data: null,
    });

    return NextResponse.json({
      success: true,
      newDiagramId: newDiagram.insertedId.toString(),
    });
  } catch (err) {
    console.error("POST /api/data/getMyDiagrams error:", err);
    return NextResponse.json({ error: t("alertError") }, { status: 500 });
  }
}
