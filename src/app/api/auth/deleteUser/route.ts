import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcrypt";
import client from "@/src/lib/db";
import { Account, getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import adapter from "@/src/lib/adapter";
import { authOptions } from "@/src/lib/auth";
import { routing } from "@/src/i18n/routing";
import { DiagramDocument } from "@/src/types/data/DiagramTransfer";
import { NodeRelationEdge, TableNodeData } from "@/src/types/model/TableNode";
import { Node } from "@xyflow/react";
import { ObjectId } from "mongodb";

export async function DELETE(req: NextRequest) {
  const locale = req.headers.get("accept-language") || routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "Profile" });
  const session = await getServerSession(authOptions);
  const { email, password, emailConfirmedDeletionCode } = await req.json();

  if (session?.user.email !== email) {
    return NextResponse.json({ error: t("invalidEmail") }, { status: 400 });
  }

  const foundUser = await client
    .db(process.env.MONGODB_AUTH_DB_NAME)
    .collection("users")
    .findOne({ email });

  if (!foundUser) {
    return NextResponse.json({ error: t("userNotFound") }, { status: 404 });
  } else {
    if (!(await compare(password, foundUser.password))) {
      return NextResponse.json(
        { error: t("passwordIsIncorrect") },
        { status: 400 },
      );
    } else {
      if (foundUser.emailConfirmedDeletionCode !== emailConfirmedDeletionCode) {
        return NextResponse.json(
          { error: t("confirmationCodeAndTargetNotIdentical") },
          { status: 400 },
        );
      } else {
        // Xóa danh sách diagram của user
        const listDiagram = await client
          .db(process.env.MONGODB_DATA_DB_NAME)
          .collection<DiagramDocument>("diagrams")
          .find({ ownerId: foundUser._id })
          .toArray();
        let failDeleteDiagramIds: ObjectId[] = [];
        listDiagram.forEach(async ({ _id }) => {
          // Xóa danh sách node và edge của diagram
          await client
            .db(process.env.MONGODB_DATA_DB_NAME)
            .collection<NodeRelationEdge>("edges")
            .deleteMany({ data: { diagramId: _id } });
          await client
            .db(process.env.MONGODB_DATA_DB_NAME)
            .collection<TableNodeData>("nodes")
            .deleteMany({ data: { diagramId: _id } });
          // Xóa diagram
          const deleteDiagramResult = await client
            .db(process.env.MONGODB_DATA_DB_NAME)
            .collection<DiagramDocument>("diagrams")
            .deleteOne({ _id });
          if (deleteDiagramResult.deletedCount !== 1) {
            failDeleteDiagramIds.push(_id);
          }
        });
        if (failDeleteDiagramIds.length) {
          return NextResponse.json({
            error: t("deleteDiagramFail"),
            failDeleteDiagramIds,
          });
        }

        // Xóa danh sách account
        const listProvider = await client
          .db(process.env.MONGODB_AUTH_DB_NAME)
          .collection<Account>("accounts")
          .find({ userId: foundUser._id.toString() })
          .project({ provider: 1 })
          .toArray();
        let failedDeleteAccountProviders: string[] = [];
        listProvider.forEach(async (p) => {
          let res = await fetch("/api/auth/unlinkProvider", {
            method: "POST",
            headers: { "accept-language": locale },
            body: JSON.stringify({ provider: p }),
          });
          let { success } = await res.json();
          if (!success) {
            failedDeleteAccountProviders.push(p.provider);
          }
        });
        if (failedDeleteAccountProviders.length) {
          return NextResponse.json(
            {
              error: t("cantDeleteAccountOfThisUser"),
              failedDeleteAccountProviders,
            },
            { status: 500 },
          );
        } else {
          const deletedUser = await adapter.deleteUser!(
            foundUser._id.toString(),
          );
          if (deletedUser) {
            return NextResponse.json({ success: true });
          } else {
            return NextResponse.json(
              { error: t("cantDeleteUser") },
              { status: 500 },
            );
          }
        }
      }
    }
  }
}
