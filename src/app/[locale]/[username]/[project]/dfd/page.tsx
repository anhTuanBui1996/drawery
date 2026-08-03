export default async function Dashboard({
  params,
}: {
  params: Promise<{ user: string }>;
}) {
  const { user } = await params;
  return <div>Dashboard Page for {user}</div>;
}
