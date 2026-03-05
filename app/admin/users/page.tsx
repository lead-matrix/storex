import { createClient as createAdminClient } from "@/utils/supabase/admin";
import { Shield, User, Mail, Calendar } from "lucide-react";
import { updateUserRole } from "@/lib/actions/admin";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Clientele | Admin" };


export default async function AdminUsersPage() {
    // Must use admin client to read all profiles (RLS restricts anon to own row)
    const supabase = await createAdminClient();

    const { data: users } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-12 pb-24 animate-luxury-fade">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-heading text-charcoal mb-2 tracking-luxury">Clientele</h1>
                    <p className="text-textsoft text-xs uppercase tracking-luxury font-medium">Exclusive Member Directory</p>
                </div>
            </div>

            <div className="bg-white rounded-luxury shadow-soft border border-charcoal/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-charcoal/5 bg-pearl/30 text-[10px] uppercase tracking-luxury text-textsoft font-bold">
                                <th className="px-8 py-5">Profile</th>
                                <th className="px-8 py-5 text-center">Status / Role</th>
                                <th className="px-8 py-5 text-center">Joined</th>
                                <th className="px-8 py-5 text-right">Management</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px] text-textsoft font-medium">
                            {users?.map((user) => (
                                <tr key={user.id} className="border-b border-charcoal/5 hover:bg-gold/5 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-pearl border border-charcoal/10 rounded-full flex items-center justify-center text-textsoft group-hover:border-gold/30 transition-colors shrink-0">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-charcoal font-medium text-sm tracking-wide truncate group-hover:text-gold transition-colors">
                                                    {user.full_name || "Guest Client"}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5 text-textsoft/70">
                                                    <Mail className="w-3 h-3" />
                                                    <p className="text-[10px] truncate">{user.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-center">
                                            <span className={`px-3 py-1 rounded-full text-[9px] uppercase tracking-luxury font-medium border ${user.role === 'admin'
                                                ? 'border-gold/30 text-gold bg-gold/5'
                                                : 'border-charcoal/10 text-charcoal bg-pearl/50'
                                                }`}>
                                                {user.role === 'admin' ? 'Administrator' : 'Client'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-textsoft/70">
                                            <Calendar className="w-3 h-3" />
                                            <span className="text-[10px] uppercase tracking-luxury">
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <form action={async () => {
                                                "use server";
                                                await updateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin');
                                            }}>
                                                <button
                                                    type="submit"
                                                    className={`bg-pearl border border-charcoal/10 px-4 py-1.5 transition-all flex items-center gap-2 rounded-md shadow-sm active:scale-95 ${user.role === 'admin' ? 'text-textsoft hover:text-red-600 hover:border-red-200 hover:bg-red-50' : 'text-textsoft hover:text-charcoal hover:border-charcoal/30'
                                                        }`}
                                                    title={user.role === 'admin' ? "Revoke Administrative Privileges" : "Grant Administrative Privileges"}
                                                >
                                                    <Shield className={`w-3 h-3 ${user.role === 'admin' ? 'text-red-500' : 'text-gold'}`} />
                                                    <span className="text-[9px] uppercase tracking-luxury font-medium">
                                                        {user.role === 'admin' ? 'Revoke' : 'Elevate'}
                                                    </span>
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!users || users.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-24 text-center text-textsoft uppercase text-[10px] tracking-luxury">
                                        No clients registered
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
