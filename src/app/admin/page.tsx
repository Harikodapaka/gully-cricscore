import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PageContainer } from "@/components/Styles";

export default async function UserAdminPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
        redirect("/");
    }
    return (
        <div className={PageContainer}>
            <h2 className="text-2xl font-bold mb-4">User Admin Page</h2>
            {/* Add user management UI here */}
            <p>Welcome, Admin! Here you can manage users.</p>
        </div>
    );
}
