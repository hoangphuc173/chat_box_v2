import { useState } from 'react';

interface LoginPageProps {
    onLogin: (username: string, password: string) => Promise<any>;
    onRegister: (username: string, password: string) => Promise<any>;
}

export default function LoginPage({ onLogin, onRegister }: LoginPageProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !password.trim()) {
            setError('Please fill in all fields');
            return;
        }

        if (!isLogin && password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const result = isLogin
                ? await onLogin(username, password)
                : await onRegister(username, password);

            if (!result.success) {
                setError(result.error || 'Operation failed');
            } else if (!isLogin) {
                setIsLogin(true);
                setPassword('');
                setConfirmPassword('');
            }
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-5 relative overflow-hidden">
            {/* Background Glow Effects */}
            <div className="absolute -top-[150px] -right-[150px] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.4)_0%,transparent_70%)] blur-[60px]" />
            <div className="absolute -bottom-[100px] -left-[100px] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.3)_0%,transparent_70%)] blur-[60px]" />

            {/* Login Card */}
            <div className="w-full max-w-[420px] bg-[#171923]/85 backdrop-blur-[20px] rounded-3xl p-10 md:p-12 border border-white/10 shadow-2xl relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-[72px] h-[72px] mx-auto mb-4 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-[20px] flex items-center justify-center shadow-[0_10px_30px_rgba(139,92,246,0.4)]">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-br from-violet-500 to-violet-400 bg-clip-text text-transparent mb-2">
                        ChatBox
                    </h1>
                    <p className="text-slate-400 text-sm">
                        {isLogin ? 'Welcome back! Sign in to continue' : 'Create your account'}
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-sm mb-5 text-center">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Username */}
                    <div className="mb-4">
                        <label className="block text-slate-200 text-sm font-medium mb-2">Username</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full py-3.5 px-4 pl-12 bg-slate-800/80 border border-white/10 rounded-xl text-slate-100 text-[15px] outline-none transition-all box-border focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="mb-4">
                        <label className="block text-slate-200 text-sm font-medium mb-2">Password</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </span>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full py-3.5 px-12 bg-slate-800/80 border border-white/10 rounded-xl text-slate-100 text-[15px] outline-none transition-all box-border focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none text-slate-500 cursor-pointer p-0 hover:text-slate-400"
                            >
                                {showPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password (Register only) */}
                    {!isLogin && (
                        <div className="mb-4">
                            <label className="block text-slate-200 text-sm font-medium mb-2">Confirm Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full py-3.5 px-4 pl-12 bg-slate-800/80 border border-white/10 rounded-xl text-slate-100 text-[15px] outline-none transition-all box-border focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                            />
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3.5 mt-2 bg-gradient-to-br from-violet-500 to-indigo-500 border-none rounded-xl text-white text-base font-semibold cursor-pointer flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(139,92,246,0.3)] transition-all hover:translate-y-[-1px] active:translate-y-[1px] disabled:opacity-70 disabled:cursor-not-allowed`}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                {isLogin ? 'Sign In' : 'Sign Up'}
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </>
                        )}
                    </button>
                </form>

                {/* Toggle */}
                <div className="mt-6 text-center text-slate-400 text-sm">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                        className="bg-transparent border-none text-violet-500 font-semibold cursor-pointer text-sm hover:underline"
                    >
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </div>
            </div>
        </div>
    );
}
