'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Package, ShoppingCart, User, ArrowRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AdminSearch() {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setIsOpen(prev => !prev)
            }
            if (e.key === 'Escape') setIsOpen(false)
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus()
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
            setQuery('')
            setResults([])
        }
    }, [isOpen])

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length < 2) {
                setResults([])
                return
            }
            setIsLoading(true)
            try {
                const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`)
                const data = await res.json()
                setResults(data)
                setSelectedIndex(0)
            } catch (err) {
                console.error(err)
            } finally {
                setIsLoading(false)
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [query])

    const handleSelect = (result: any) => {
        router.push(result.href)
        setIsOpen(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            setSelectedIndex(prev => (prev + 1) % results.length)
        } else if (e.key === 'ArrowUp') {
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            handleSelect(results[selectedIndex])
        }
    }

    if (!isOpen) return (
        <button
            onClick={() => setIsOpen(true)}
            className="p-2 text-textsoft/60 hover:text-gold transition-colors"
            title="Search (Cmd+K)"
        >
            <Search size={20} />
        </button>
    )

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-obsidian/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

            <div className="relative w-full max-w-2xl bg-white rounded-luxury shadow-luxury border border-charcoal/10 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center p-6 border-b border-charcoal/5">
                    <Search className={`w-5 h-5 mr-4 ${isLoading ? 'text-gold animate-pulse' : 'text-textsoft/40'}`} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search products, orders, or clientele..."
                        className="flex-1 bg-transparent text-charcoal text-lg outline-none placeholder:text-textsoft/30 font-heading tracking-wide"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-pearl border border-charcoal/10 px-1.5 py-0.5 rounded text-textsoft/40 font-mono">ESC</span>
                        <button onClick={() => setIsOpen(false)} className="text-textsoft/40 hover:text-charcoal transition-colors p-1">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                    {isLoading && query.length >= 2 && results.length === 0 && (
                        <div className="py-12 flex flex-col items-center justify-center gap-4 text-textsoft/40">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p className="text-[10px] uppercase tracking-widest">Searching the vault...</p>
                        </div>
                    )}

                    {!isLoading && results.length === 0 && query.length >= 2 && (
                        <div className="py-12 text-center text-textsoft/40">
                            <p className="text-[10px] uppercase tracking-widest">Zero artifacts found in the registry.</p>
                        </div>
                    )}

                    {!isLoading && results.length === 0 && query.length < 2 && (
                        <div className="p-6 text-center text-textsoft/40">
                            <p className="text-[10px] uppercase tracking-widest">Begin typing to uncover history...</p>
                            <div className="mt-8 grid grid-cols-3 gap-4">
                                <div className="p-4 rounded border border-charcoal/5 flex flex-col items-center gap-2 opacity-60">
                                    <Package size={20} />
                                    <span className="text-[8px] uppercase tracking-widest">Products</span>
                                </div>
                                <div className="p-4 rounded border border-charcoal/5 flex flex-col items-center gap-2 opacity-60">
                                    <ShoppingCart size={20} />
                                    <span className="text-[8px] uppercase tracking-widest">Orders</span>
                                </div>
                                <div className="p-4 rounded border border-charcoal/5 flex flex-col items-center gap-2 opacity-60">
                                    <User size={20} />
                                    <span className="text-[8px] uppercase tracking-widest">Clientele</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="p-2 space-y-1">
                            {results.map((result: any, index: number) => (
                                <button
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => handleSelect(result)}
                                    onMouseMove={() => setSelectedIndex(index)}
                                    className={`w-full text-left p-4 rounded flex items-center justify-between group transition-all ${index === selectedIndex ? 'bg-pearl border-l-4 border-gold pl-6' : 'hover:bg-pearl/50 border-l-4 border-transparent'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded flex items-center justify-center shadow-sm ${result.type === 'product' ? 'bg-blue-50 text-blue-600' : result.type === 'order' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'}`}>
                                            {result.type === 'product' && <Package size={18} />}
                                            {result.type === 'order' && <ShoppingCart size={18} />}
                                            {result.type === 'user' && <User size={18} />}
                                        </div>
                                        <div>
                                            <p className="font-heading text-charcoal tracking-wide">{result.title}</p>
                                            <p className="text-[10px] text-textsoft/60 uppercase tracking-widest">{result.subtitle}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[8px] uppercase tracking-widest text-gold font-bold">Jump</span>
                                        <ArrowRight size={12} className="text-gold" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-pearl/50 border-t border-charcoal/5 flex items-center justify-between text-[9px] uppercase tracking-[0.2em] font-bold text-textsoft/40">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1.5"><ArrowRight size={10} /> Navigate</span>
                        <span className="flex items-center gap-1.5"><ArrowRight size={10} className="rotate-90" /> Select</span>
                    </div>
                    <span>Dina Cosmetic Command Portal</span>
                </div>
            </div>
        </div>
    )
}
