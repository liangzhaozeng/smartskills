import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { PublishForm } from "@/components/publish-form";

export default async function PublishPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin");

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold mb-2">Publish a Skill</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-8">
          Share a skill with your organization via git repo or direct upload.
        </p>
        <PublishForm />
      </div>
    </main>
  );
}
