import { authOptions, sendUserDeletionConfirmCode } from "@/src/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import adapter from "@/src/lib/adapter";
import { ExtendedAdapterUser } from "@/src/types/auth/ExtendedAdapterUser";
import { randomInt } from "@/src/lib/utils";

export async function POST() {
  const session = await getServerSession(authOptions);
  const email = session?.user.email;
  if (!email) {
    return NextResponse.json({ error: "Email is invalid!" }, { status: 400 });
  }
  if (!process.env.APP_URL) {
    return NextResponse.json({ error: "App url is invalid!" }, { status: 400 });
  }

  const foundUser = adapter.getUserByEmail!(email) as ExtendedAdapterUser;

  if (!foundUser) {
    return NextResponse.json({ error: "User's not found!" }, { status: 400 });
  }

  const targetCode = randomInt(999999).toString();
  foundUser.verifyCodeForUserDeletion = targetCode;
  const updatedUser = (await adapter.updateUser!(
    foundUser,
  )) as ExtendedAdapterUser;

  if (updatedUser.verifyCodeForUserDeletion !== targetCode) {
    return NextResponse.json(
      { error: "Can't update verify code for user!" },
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
