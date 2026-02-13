"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Shield, Search, Loader2 } from "lucide-react";

interface Profile {
    id: string;
    email: string;
    role: string;
    created_at: string;
}

export default function AdminUsers() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchProfiles = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching profiles:", error);
        } else {
            setProfiles((data as Profile[]) || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProfiles();
    }, []);

    const filteredProfiles = profiles.filter(p =>
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
                <p className="text-zinc-500 uppercase tracking-[0.3em] text-[10px]">Assembling Resident Directory...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-serif text-gold mb-1">Palace Residents</h2>
                    <p className="text-zinc-500 text-sm tracking-widest uppercase">Manage client access and loyalty</p>
                </div>
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                    <input
                        placeholder="SEARCH CLIENTS..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-950 border border-gold/10 px-10 py-3 text-[10px] uppercase tracking-widest text-white focus:border-gold/30 outline-none transition-colors"
                    />
                </div>
            </div>

            <div className="bg-zinc-950 border border-gold/10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gold/10 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                                <th className="p-6 font-medium">Client</th>
                                <th className="p-6 font-medium">Email Address</th>
                                <th className="p-6 font-medium">Clearance</th>
                                <th className="p-6 font-medium">Arrival Date</th>
                                <th className="p-6 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gold/5">
                            {filteredProfiles.map((profile) => (
                                <tr key={profile.id} className="text-sm group hover:bg-gold/5 transition-colors">
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-gold/10 flex items-center justify-center text-gold">
                                                <User size={14} />
                                            </div>
                                            <span className="font-sans text-white">Guest Resident</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-zinc-400 font-mono">{profile.email}</td>
                                    <td className="p-6">
                                        <span className={`flex items-center gap-2 text-[10px] uppercase tracking-widest ${profile.role === 'admin' ? 'text-gold' : 'text-zinc-500'}`}>
                                            {profile.role === 'admin' && <Shield size={10} />}
                                            {profile.role}
                                        </span>
                                    </td>
                                    <td className="p-6 text-zinc-500">{new Date(profile.created_at).toLocaleDateString()}</td>
                                    <td className="p-6 text-right text-[10px] uppercase tracking-widest text-gold hover:text-white cursor-pointer transition-colors">
                                        View Dossier
                                    </td>
                                </tr>
                            ))}
                            {!filteredProfiles.length && (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center text-zinc-600 italic font-light tracking-widest uppercase text-[10px]">No residents found in the palace</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
