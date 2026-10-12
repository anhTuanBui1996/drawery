import { routing } from "@/src/i18n/routing";
import { authOptions } from "@/src/lib/nextauth";
import supabaseAdmin from "@/src/lib/supabase/admin";
import { DiagramRow } from "@/src/types/data/DiagramRow";
import { DiagramDTO } from "@/src/types/model/DiagramData";
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
      .contains("shares", [session.user.id])
      .returns<DiagramRow[]>();
    if (error) throw error;

    const diagrams: DiagramDTO[] = data.map((row) => {
      const isOwner = row.owner_id === session.user.id;
      const res: DiagramDTO = { ...toDiagramDTO(row), isOwned: isOwner };
      if (isOwner) {
        res.ownerAvatar = session.user.image;
        res.ownerName = session.user.name;
      }
      return res;
    });

    return NextResponse.json({ success: true, diagrams });
  } catch (err) {
    console.error("GET /api/data/erd/shareWithMe error:", err);
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

    const { data, error } = await supabaseAdmin
      .from("diagrams")
      .insert({
        title,
        owner_id: session.user.id,
        is_private: isPrivate,
      })
      .select("id")
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, newDiagramId: data.id });
  } catch (err) {
    console.error("POST /api/data/erd/shareWithMe error:", err);
    return NextResponse.json({ error: t("alertError") }, { status: 500 });
  }
}
