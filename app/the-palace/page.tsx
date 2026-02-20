import { createClient } from '@/utils/supabase/server'

export default async function Page() {
    const supabase = await createClient()

    const { data: todos } = await supabase.from('todos').select()

    return (
        <div className="bg-background-primary text-text-bodyDark min-h-screen pt-32 pb-24 px-6 flex items-center justify-center">
            <div className="max-w-md w-full border border-gold-primary/20 bg-background-secondary p-12 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-serif italic text-gold-primary uppercase tracking-tighter">The Registry</h1>
                    <p className="text-[10px] text-text-mutedDark uppercase tracking-[0.5em] font-light">Artifact Manifestations</p>
                </div>

                <ul className="space-y-6">
                    {todos?.map((todo: any, i: number) => (
                        <li key={i} className="flex items-center gap-4 text-[11px] uppercase tracking-widest text-text-bodyDark/70 border-b border-gold-primary/5 pb-4">
                            <span className="text-gold-primary opacity-30">[{String(i + 1).padStart(2, '0')}]</span>
                            {typeof todo === 'object' ? JSON.stringify(todo) : todo}
                        </li>
                    ))}
                    {(!todos || todos.length === 0) && (
                        <p className="text-center text-[10px] text-text-mutedDark/40 uppercase tracking-widest italic pt-8">No records found in the current vault segment.</p>
                    )}
                </ul>
            </div>
        </div>
    )
}
