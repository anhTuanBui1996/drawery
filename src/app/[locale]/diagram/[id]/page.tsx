export default async function Diagram({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <div>Dashboard Page for {id}</div>;
}
