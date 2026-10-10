import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcrypt";
import client from "@/src/lib/mongodb";
import { Account, getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import adapter from "@/src/lib/mongodbAdapter";
import { authOptions } from "@/src/lib/nextauth";
import { routing } from "@/src/i18n/routing";
import supabaseAdmin from "@/src/lib/supabase/admin";

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
        // Xóa diagram của user (node và edge bị xóa theo nhờ on delete cascade)
        const { error: deleteDiagramError } =
          await supabaseAdmin
            .from("diagrams")
            .delete()
            .eq("owner_id", foundUser._id.toString())
            .select("id");
        if (deleteDiagramError) {
          console.error("DELETE /api/auth/deleteUser error:", deleteDiagramError);
          return NextResponse.json(
            { error: t("deleteDiagramFail") },
            { status: 500 },
          );
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
