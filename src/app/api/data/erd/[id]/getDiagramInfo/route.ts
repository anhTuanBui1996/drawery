import { routing } from "@/src/i18n/routing";
import { authOptions } from "@/src/lib/nextauth";
import client from "@/src/lib/mongodb";
import supabaseAdmin from "@/src/lib/supabase/admin";
import { DiagramRow } from "@/src/types/data/DiagramRow";
import { DiagramDTO } from "@/src/types/model/DiagramData";
import { ExtendedAdapterUser } from "@/src/types/data/ExtendedAdapterUser";
import { isUuid, toDiagramDTO } from "@/src/utils/server";
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

    if (!isUuid(id)) {
      return NextResponse.json({ error: t("invalidId") }, { status: 400 });
    }

    const { data: diagram, error } = await supabaseAdmin
      .from("diagrams")
      .select("*")
      .eq("id", id)
      .maybeSingle<DiagramRow>();
    if (error) throw error;

    if (!diagram) {
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    }

    const isOwner = diagram.owner_id === session.user.id;

    if (diagram.is_private && !isOwner) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    // Users still live in MongoDB
    const owner = ObjectId.isValid(diagram.owner_id)
      ? await client
          .db(process.env.MONGODB_DATA_DB_NAME)
          .collection<ExtendedAdapterUser>("users")
          .findOne({ _id: new ObjectId(diagram.owner_id) })
      : null;

    const diagramInfo: DiagramDTO = {
      ...toDiagramDTO(diagram),
      isOwned: isOwner,
      ownerAvatar: owner?.image,
      ownerName: owner?.name,
    };

    return NextResponse.json({ success: true, diagramInfo });
  } catch (err) {
    console.error(`GET /api/data/erd/${id}/getDiagramInfo error:`, err);
    return NextResponse.json({ error: t("alertError") }, { status: 500 });
  }
}
