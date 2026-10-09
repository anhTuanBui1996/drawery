import { routing } from "@/src/i18n/routing";
import { authOptions } from "@/src/lib/nextauth";
import client from "@/src/lib/mongodb";
import { DiagramDocument } from "@/src/types/data/DiagramDocument";
import { DiagramDTO } from "@/src/types/model/DiagramData";
import { ExtendedAdapterUser } from "@/src/types/data/ExtendedAdapterUser";
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const owner = await db
      .collection<ExtendedAdapterUser>("users")
      .findOne({ _id: diagram.ownerId });

    let diagramInfo: DiagramDTO = {
      createdAt: diagram.createdAt,
      diagram_oid: diagram._id.toString(),
      isOwned: isOwner,
      isPrivate: diagram.isPrivate,
      updatedAt: diagram.updatedAt,
      ownerAvatar: owner?.image,
      ownerName: owner?.name,
      title: diagram.title,
      providerName: diagram.provider,
      owner_oid: diagram.ownerId.toString(),
      shares: diagram.shares.map((shareId) => shareId.toString()),
    };

    return NextResponse.json({ success: true, diagramInfo });
  } catch (err) {
    console.error(`GET /api/data/diagram/${id}/getDiagramDTO error:`, err);
    return NextResponse.json({ error: t("alertError") }, { status: 500 });
  }
}
