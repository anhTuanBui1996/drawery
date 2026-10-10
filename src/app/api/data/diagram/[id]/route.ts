import { routing } from "@/src/i18n/routing";
import { authOptions } from "@/src/lib/nextauth";
import supabaseAdmin from "@/src/lib/supabase/admin";
import { DiagramRow } from "@/src/types/data/DiagramRow";
import { isUuid } from "@/src/utils/server";
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

    return NextResponse.json({ success: true, diagram });
  } catch (err) {
    console.error(`GET /api/data/diagram/${id} error:`, err);
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

    if (!isUuid(id)) {
      return NextResponse.json({ error: t("invalidId") }, { status: 400 });
    }

    const { data: diagram, error: findError } = await supabaseAdmin
      .from("diagrams")
      .select("*")
      .eq("id", id)
      .maybeSingle<DiagramRow>();
    if (findError) throw findError;

    if (!diagram) {
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    }

    if (diagram.owner_id !== session.user.id) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    // Nodes and edges are removed by the "on delete cascade" foreign keys
    const { error: deleteError } = await supabaseAdmin
      .from("diagrams")
      .delete()
      .eq("id", id);
    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true, diagram });
  } catch (err) {
    console.error(`DELETE /api/data/diagram/${id} error:`, err);
    return NextResponse.json({ error: t("alertError") }, { status: 500 });
  }
}
