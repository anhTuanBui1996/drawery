import { routing } from "@/src/i18n/routing";
import { authOptions } from "@/src/lib/nextauth";
import supabaseAdmin from "@/src/lib/supabase/admin";
import { DiagramRow } from "@/src/types/data/DiagramRow";
import { DiagramDTO, NewDiagramDTO } from "@/src/types/model/DiagramData";
import { toDiagramDTO } from "@/src/utils/server";
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

    const { data, error } = await supabaseAdmin
      .from("diagrams")
      .select("*")
      .eq("owner_id", session.user.id)
      .returns<DiagramRow[]>();
    if (error) throw error;

    const diagrams: DiagramDTO[] = data.map((row) => ({
      ...toDiagramDTO(row),
      isOwned: true,
      ownerAvatar: session.user.image,
      ownerName: session.user.name,
    }));

    return NextResponse.json({ success: true, diagrams });
  } catch (err) {
    console.error("GET /api/data/diagram error:", err);
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

    const { title, isPrivate } = (await req.json()) as NewDiagramDTO;

    const { data, error } = await supabaseAdmin
      .from("diagrams")
      .insert({
        title: title || t("noTitle"),
        owner_id: session.user.id,
        is_private: isPrivate,
      })
      .select("id")
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, newDiagramId: data.id });
  } catch (err) {
    console.error("POST /api/data/diagram error:", err);
    return NextResponse.json({ error: t("alertError") }, { status: 500 });
  }
}
