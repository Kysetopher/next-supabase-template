import { requireUser } from "@/lib/supabase/dal";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-12">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Signed in as {user.email}.</p>
      </div>
    </div>
  );
}
