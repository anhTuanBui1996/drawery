import { authOptions, sendUserDeletionConfirmCode } from "@/src/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import adapter from "@/src/lib/adapter";
import { ExtendedAdapterUser } from "@/src/types/model/ExtendedAdapterUser";
import { randomInt } from "@/src/lib/utils";
import { routing } from "@/src/i18n/routing";
import { getTranslations } from "next-intl/server";

export async function POST(req: Request) {
  const locale = req.headers.get("accept-language") || routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "Profile" });
  const session = await getServerSession(authOptions);
  const email = session?.user.email;
  if (!email) {
    return NextResponse.json({ error: t("invalidEmail") }, { status: 400 });
  }
  if (!process.env.APP_URL) {
    return NextResponse.json({ error: t("invalidAppUrl") }, { status: 400 });
  }

  const foundUser = adapter.getUserByEmail!(email) as ExtendedAdapterUser;

  if (!foundUser) {
    return NextResponse.json({ error: t("userNotFound") }, { status: 400 });
  }

  const targetCode = randomInt(999999).toString();
  foundUser.verifyCodeForUserDeletion = targetCode;
  const updatedUser = (await adapter.updateUser!(
    foundUser,
  )) as ExtendedAdapterUser;

  if (updatedUser.verifyCodeForUserDeletion !== targetCode) {
    return NextResponse.json(
      { error: t("cantUpdateVerifyCode") },
      { status: 400 },
    );
  }

  await sendUserDeletionConfirmCode({
    code: targetCode,
    identifier: email,
    url: process.env.APP_URL,
  });
  return NextResponse.json({ success: true, targetCode });
}
