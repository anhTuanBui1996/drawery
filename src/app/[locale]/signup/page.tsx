import SignUp from "./ui";
import { getProviders } from "next-auth/react";

export default async function Page() {
  const providers = await getProviders();
  return <SignUp providers={providers} />;
}
