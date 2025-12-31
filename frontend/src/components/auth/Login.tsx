import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useWebSocket } from '@/contexts/WebSocketContext'
import { LogIn, Wifi, WifiOff } from 'lucide-react'

export function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const navigate = useNavigate()
    const { isConnected, login } = useWebSocket()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await login(username, password)

            if (result.success) {
                navigate('/chat')
            } else {
                setError(result.message || 'Login failed')
            }
        } catch (err) {
            setError('Connection error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="card w-full max-w-md space-y-8 animate-fade-in">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mb-4">
                        <LogIn className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-text-primary">Welcome Back</h2>
                    <p className="text-text-secondary mt-2">Sign in to continue to ChatBox</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {/* Connection Status */}
                    <div className={`flex items-center gap-2 text-sm ${isConnected ? 'text-green-500' : 'text-yellow-500'}`}>
                        {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                        {isConnected ? 'Connected to server' : 'Connecting...'}
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-2">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="input"
                            placeholder="Enter your username"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>

                    <p className="text-center text-text-secondary">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary-500 hover:text-primary-400 font-medium">
                            Sign up
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    )
}
