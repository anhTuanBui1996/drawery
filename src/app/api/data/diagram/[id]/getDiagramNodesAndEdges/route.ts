import { routing } from "@/src/i18n/routing";
import { authOptions } from "@/src/lib/nextauth";
import supabaseAdmin from "@/src/lib/supabase/admin";
import { DiagramRow, EdgeRow, NodeRow } from "@/src/types/data/DiagramRow";
import { isUuid, toEdgeDTO, toNodeDTO } from "@/src/utils/server";
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

    const [nodesRes, edgesRes] = await Promise.all([
      supabaseAdmin
        .from("nodes")
        .select("*")
        .eq("diagram_id", id)
        .returns<NodeRow[]>(),
      supabaseAdmin
        .from("edges")
        .select("*")
        .eq("diagram_id", id)
        .returns<EdgeRow[]>(),
    ]);
    if (nodesRes.error) throw nodesRes.error;
    if (edgesRes.error) throw edgesRes.error;

    return NextResponse.json({
      success: true,
      nodes: nodesRes.data.map(toNodeDTO),
      edges: edgesRes.data.map(toEdgeDTO),
    });
  } catch (err) {
    console.error(
      `GET /api/data/diagram/${id}/getDiagramNodesAndEdges error:`,
      err,
    );
    return NextResponse.json({ error: t("alertError") }, { status: 500 });
  }
}
