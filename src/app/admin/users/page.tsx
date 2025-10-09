import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { PageContainer } from "@/components/Styles";
import UserRoleSelect from "./UserRoleSelect";

export default async function AdminUsersPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
        redirect("/");
    }

    await dbConnect();
    const users = await User.find({}, "name email role").lean();

    return (
        <div className={PageContainer}>
            <h2 className="text-2xl font-bold mb-4">All Users</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="py-2 px-4 border-b">Name</th>
                            <th className="py-2 px-4 border-b">Email</th>
                            <th className="py-2 px-4 border-b">Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user: any) => (
                            <tr key={user._id} className="even:bg-gray-50">
                                <td className="py-2 px-4 border-b">{user.name}</td>
                                <td className="py-2 px-4 border-b">{user.email}</td>
                                <td className="py-2 px-4 border-b">
                                    <UserRoleSelect userId={user._id.toString()} currentRole={user.role} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
