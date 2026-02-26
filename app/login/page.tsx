"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    Loader2,
    ShieldCheck,
    Sparkles,
    Lock,
    Eye,
    EyeOff,
} from "lucide-react";
import Link from "next/link";

type AuthMode = "login" | "signup";

export default function LoginPage() {
    const [mode, setMode] = useState<AuthMode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();

    // ── TASK 3.2: Role-based redirect after login ─────────────────────────
    const redirectAfterLogin = async (userId: string) => {
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .single();

        if (profile?.role === "admin") {
            router.push("/admin");
        } else {
            router.push("/");
        }
        router.refresh();
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
        } else if (data?.user) {
            await redirectAfterLogin(data.user.id);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        const { error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
        });

        if (authError) {
            setError(authError.message);
        } else {
            setSuccess("Account created! Please check your email to verify your account.");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setFullName("");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex overflow-hidden bg-[#050505]">
            {/* ══ LEFT — Hero Panel ══════════════════════════════════════════ */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden">
                {/* Cinematic background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0C0A08] via-[#050505] to-[#0D0B09]" />
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage:
                            "radial-gradient(ellipse at 30% 40%, rgba(212,175,55,0.25) 0%, transparent 55%), radial-gradient(ellipse at 70% 70%, rgba(212,175,55,0.1) 0%, transparent 50%)",
                    }}
                />
                {/* Subtle grid */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(212,175,55,1) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,1) 1px, transparent 1px)",
                        backgroundSize: "60px 60px",
                    }}
                />

                {/* Decorative gold orb */}
                <div
                    className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-10 animate-float"
                    style={{
                        background:
                            "radial-gradient(circle, rgba(212,175,55,0.6) 0%, transparent 70%)",
                        filter: "blur(40px)",
                    }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center px-12 space-y-8 max-w-md">
                    <Link href="/" className="group">
                        <div className="relative w-20 h-20 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                            <Image
                                src="/logo.jpg"
                                alt="DINA COSMETIC"
                                fill
                                className="object-contain filter-gold-glow"
                            />
                        </div>
                    </Link>

                    <div className="space-y-4">
                        <p className="text-[10px] text-[#D4AF37] uppercase tracking-[0.6em] font-light">
                            The Obsidian Palace
                        </p>
                        <h1 className="text-4xl font-serif text-[#F3EFE8] leading-tight">
                            Welcome to<br />
                            <span className="text-gold-gradient italic">Luxury Beauty</span>
                        </h1>
                        <p className="text-sm text-[#A9A39A] leading-relaxed max-w-xs mx-auto">
                            Access your personal vault of premium cosmetics
                            and exclusive collections.
                        </p>
                    </div>

                    {/* Feature bullets */}
                    <div className="space-y-3 w-full text-left">
                        {[
                            "Exclusive member-only collections",
                            "Personalized beauty recommendations",
                            "Priority access to new arrivals",
                        ].map((feat, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Sparkles className="w-3 h-3 text-[#D4AF37] flex-shrink-0" />
                                <span className="text-[11px] text-[#A9A39A] uppercase tracking-wider">
                                    {feat}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom quote */}
                <div className="absolute bottom-8 left-0 right-0 text-center px-12">
                    <p className="text-[9px] text-[#7A746F] uppercase tracking-[0.4em]">
                        &ldquo;Beauty is the illumination of your soul&rdquo;
                    </p>
                </div>
            </div>

            {/* ══ RIGHT — Auth Form Panel ════════════════════════════════════ */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
                {/* Glass dark form panel */}
                <div className="w-full max-w-md glass-dark rounded-lg p-8 lg:p-10 space-y-8 animate-luxury-fade">

                    {/* Mobile logo (hidden on desktop — shown on left panel on desktop) */}
                    <div className="lg:hidden flex flex-col items-center gap-4 text-center">
                        <Link href="/" className="relative w-16 h-16 opacity-80 hover:opacity-100 transition-opacity">
                            <Image src="/logo.jpg" alt="DINA COSMETIC" fill className="object-contain" />
                        </Link>
                        <p className="text-[9px] text-[#D4AF37] uppercase tracking-[0.5em]">
                            The Obsidian Palace
                        </p>
                    </div>

                    {/* Heading */}
                    <div className="space-y-1.5">
                        <h2 className="text-2xl font-serif text-[#F3EFE8] tracking-wide">
                            {mode === "login" ? "Welcome Back" : "Create Account"}
                        </h2>
                        <p className="text-[11px] text-[#A9A39A] uppercase tracking-widest">
                            {mode === "login"
                                ? "Sign in to access your vault"
                                : "Join the Obsidian Palace"}
                        </p>
                    </div>

                    {/* Mode Switcher */}
                    <div
                        className="flex border border-[rgba(212,175,55,0.15)] bg-black/30 rounded-sm overflow-hidden"
                        role="tablist"
                        aria-label="Authentication mode"
                    >
                        {(["login", "signup"] as AuthMode[]).map((m) => (
                            <button
                                key={m}
                                id={`auth-tab-${m}`}
                                role="tab"
                                aria-selected={mode === m}
                                onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                                className={`flex-1 py-3 text-[10px] uppercase tracking-[0.3em] transition-all duration-300 font-medium min-h-[44px] ${mode === m
                                        ? "bg-[#D4AF37] text-[#050505] shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                                        : "text-[#A9A39A] hover:text-[#F3EFE8] hover:bg-white/5"
                                    }`}
                            >
                                {m === "login" ? "Sign In" : "Sign Up"}
                            </button>
                        ))}
                    </div>

                    {/* ── LOGIN FORM ── */}
                    {mode === "login" ? (
                        <form
                            id="login-form"
                            onSubmit={handleLogin}
                            className="space-y-5"
                            aria-label="Login form"
                            noValidate
                        >
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="login-email"
                                    className="text-[10px] uppercase tracking-[0.3em] text-[#A9A39A]"
                                >
                                    Email Address
                                </Label>
                                <Input
                                    id="login-email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    className="bg-black/30 border-[rgba(212,175,55,0.15)] text-[#F3EFE8] placeholder:text-[#7A746F] rounded-none focus-visible:ring-[rgba(212,175,55,0.5)] h-12 text-[12px] tracking-wide"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="login-password"
                                    className="text-[10px] uppercase tracking-[0.3em] text-[#A9A39A]"
                                >
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="login-password"
                                        type={showPass ? "text" : "password"}
                                        placeholder="••••••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                        className="bg-black/30 border-[rgba(212,175,55,0.15)] text-[#F3EFE8] placeholder:text-[#7A746F] rounded-none focus-visible:ring-[rgba(212,175,55,0.5)] h-12 text-[12px] pr-12"
                                    />
                                    <button
                                        type="button"
                                        aria-label={showPass ? "Hide password" : "Show password"}
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A746F] hover:text-[#A9A39A] transition-colors p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                    >
                                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div
                                    role="alert"
                                    className="text-[11px] text-[#F87171] bg-red-500/8 border border-red-500/20 p-3 text-center rounded-sm"
                                >
                                    {error}
                                </div>
                            )}

                            <Button
                                id="login-submit"
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#D4AF37] text-[#050505] hover:bg-[#B8962E] transition-all duration-300 h-13 uppercase text-[10px] tracking-[0.4em] font-bold rounded-none shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.35)] btn-press min-h-[48px]"
                            >
                                {loading ? (
                                    <div className="spinner-gold" role="status" aria-label="Signing in..." />
                                ) : (
                                    <span className="flex items-center justify-center gap-3">
                                        <Lock className="w-3 h-3" />
                                        Authorize Access
                                        <ArrowRight className="w-3 h-3" />
                                    </span>
                                )}
                            </Button>

                            <div className="text-center">
                                <Link
                                    href="/forgot-password"
                                    className="text-[10px] uppercase tracking-widest text-[#7A746F] hover:text-[#D4AF37] transition-colors min-h-[44px] inline-flex items-center"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                        </form>
                    ) : (
                        /* ── SIGNUP FORM ── */
                        <form
                            id="signup-form"
                            onSubmit={handleSignup}
                            className="space-y-5"
                            aria-label="Sign up form"
                            noValidate
                        >
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="signup-name"
                                    className="text-[10px] uppercase tracking-[0.3em] text-[#A9A39A]"
                                >
                                    Full Name
                                </Label>
                                <Input
                                    id="signup-name"
                                    type="text"
                                    placeholder="Your Full Name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    autoComplete="name"
                                    className="bg-black/30 border-[rgba(212,175,55,0.15)] text-[#F3EFE8] placeholder:text-[#7A746F] rounded-none focus-visible:ring-[rgba(212,175,55,0.5)] h-12 text-[12px]"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="signup-email"
                                    className="text-[10px] uppercase tracking-[0.3em] text-[#A9A39A]"
                                >
                                    Email Address
                                </Label>
                                <Input
                                    id="signup-email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    className="bg-black/30 border-[rgba(212,175,55,0.15)] text-[#F3EFE8] placeholder:text-[#7A746F] rounded-none focus-visible:ring-[rgba(212,175,55,0.5)] h-12 text-[12px]"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="signup-password"
                                    className="text-[10px] uppercase tracking-[0.3em] text-[#A9A39A]"
                                >
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="signup-password"
                                        type={showPass ? "text" : "password"}
                                        placeholder="Min. 6 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="new-password"
                                        className="bg-black/30 border-[rgba(212,175,55,0.15)] text-[#F3EFE8] placeholder:text-[#7A746F] rounded-none focus-visible:ring-[rgba(212,175,55,0.5)] h-12 text-[12px] pr-12"
                                    />
                                    <button
                                        type="button"
                                        aria-label={showPass ? "Hide password" : "Show password"}
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A746F] hover:text-[#A9A39A] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                    >
                                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="confirm-password"
                                    className="text-[10px] uppercase tracking-[0.3em] text-[#A9A39A]"
                                >
                                    Confirm Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="confirm-password"
                                        type={showConfirmPass ? "text" : "password"}
                                        placeholder="••••••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        autoComplete="new-password"
                                        className="bg-black/30 border-[rgba(212,175,55,0.15)] text-[#F3EFE8] placeholder:text-[#7A746F] rounded-none focus-visible:ring-[rgba(212,175,55,0.5)] h-12 text-[12px] pr-12"
                                    />
                                    <button
                                        type="button"
                                        aria-label={showConfirmPass ? "Hide confirm password" : "Show confirm password"}
                                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A746F] hover:text-[#A9A39A] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                    >
                                        {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div
                                    role="alert"
                                    className="text-[11px] text-[#F87171] bg-red-500/8 border border-red-500/20 p-3 text-center rounded-sm"
                                >
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div
                                    role="status"
                                    className="text-[11px] text-[#6EE7B7] bg-green-500/8 border border-green-500/20 p-3 text-center rounded-sm"
                                >
                                    {success}
                                </div>
                            )}

                            <Button
                                id="signup-submit"
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#D4AF37] text-[#050505] hover:bg-[#B8962E] transition-all duration-300 uppercase text-[10px] tracking-[0.4em] font-bold rounded-none shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.35)] btn-press min-h-[48px]"
                            >
                                {loading ? (
                                    <div className="spinner-gold" role="status" aria-label="Creating account..." />
                                ) : (
                                    <span className="flex items-center justify-center gap-3">
                                        Create Account
                                        <ShieldCheck className="w-4 h-4" />
                                    </span>
                                )}
                            </Button>

                            <p className="text-[10px] uppercase tracking-widest text-[#7A746F] text-center">
                                By signing up, you agree to our{" "}
                                <Link href="/terms" className="text-[#A9A39A] hover:text-[#D4AF37] transition-colors underline underline-offset-2">
                                    Terms of Service
                                </Link>
                            </p>
                        </form>
                    )}

                    {/* Back to Home */}
                    <div className="text-center pt-2 border-t border-[rgba(255,255,255,0.06)]">
                        <Link
                            href="/"
                            id="login-back-home"
                            className="text-[10px] uppercase tracking-widest text-[#7A746F] hover:text-[#D4AF37] transition-colors inline-flex items-center gap-2 min-h-[44px]"
                        >
                            ← Return to Palace
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
