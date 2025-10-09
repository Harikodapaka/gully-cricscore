"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function UserRoleSelect({ userId, currentRole }: { userId: string, currentRole: string }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const newRole = e.target.value;
        await fetch("/api/user", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, newRole })
        });
        startTransition(() => {
            router.refresh();
        });
    }

    return (
        <select
            id={`role-${userId}`}
            name="role"
            className="capitalize border rounded px-2 py-1"
            defaultValue={currentRole}
            onChange={handleChange}
            disabled={isPending}
        >
            <option value="admin">Admin</option>
            <option value="spectator">Spectator</option>
            <option value="umpire">Umpire</option>
        </select>
    );
}
