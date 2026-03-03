"use client";

import { useRouter } from "next/navigation";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  _count: { skills: number };
}

export function AdminUsers({ users }: { users: AdminUser[] }) {
  const router = useRouter();

  async function changeRole(userId: string, role: string) {
    await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    router.refresh();
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-[var(--muted-foreground)] text-xs border-b border-[var(--border)]">
          <th className="text-left py-2 px-2">User</th>
          <th className="text-left py-2 px-2">Email</th>
          <th className="text-right py-2 px-2">Skills</th>
          <th className="text-right py-2 px-2">Role</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr
            key={user.id}
            className="border-b border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
          >
            <td className="py-3 px-2">{user.name || "—"}</td>
            <td className="py-3 px-2 text-[var(--muted-foreground)]">
              {user.email}
            </td>
            <td className="py-3 px-2 text-right text-[var(--muted-foreground)]">
              {user._count.skills}
            </td>
            <td className="py-3 px-2 text-right">
              <select
                value={user.role}
                onChange={(e) => changeRole(user.id, e.target.value)}
                className="bg-[var(--muted)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="MEMBER">MEMBER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
