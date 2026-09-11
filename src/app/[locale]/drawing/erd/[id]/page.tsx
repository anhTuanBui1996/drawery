import { DiagramInfo } from "@/src/types/model/DiagramData";
import ERD from "./ui";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ERD id={id} />;
}
