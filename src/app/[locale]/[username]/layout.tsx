"use client";

import { useRouter } from "@/src/i18n/navigation";
import { useSession } from "next-auth/react";
import { use, useEffect } from "react";

export default function Layout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string; username: string }>;
}>) {
  const router = useRouter();
  const { username } = use(params);
  const session = useSession();

  useEffect(() => {
    if (session.status === "loading") {
      return;
    }
    if (session.status === "unauthenticated") {
      router.push("/signin");
    }
    if (
      session.status === "authenticated" &&
      session.data?.user?.username !== username
    ) {
      router.push(`/${session.data.user.username}/dashboard`);
    }
  }, [session.status, session.data?.user?.username, username, router]);

  return <>{children}</>;
}
