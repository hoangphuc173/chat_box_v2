import { useState, useEffect } from 'react'

interface LocationPickerProps {
    isOpen: boolean
    onClose: () => void
    onSelectLocation: (latitude: number, longitude: number, locationName?: string) => void
}

export function LocationPicker({ isOpen, onClose, onSelectLocation }: LocationPickerProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [location, setLocation] = useState<{
        latitude: number
        longitude: number
        name?: string
    } | null>(null)
    const [locationName, setLocationName] = useState('')

    useEffect(() => {
        if (!isOpen) {
            setError(null)
            setLocation(null)
            setLocationName('')
        }
    }, [isOpen])

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser')
            return
        }

        setIsLoading(true)
        setError(null)

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords
                setLocation({ latitude, longitude })
                setIsLoading(false)

                // Try to get location name using reverse geocoding
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    )
                    const data = await response.json()
                    if (data.display_name) {
                        const name = data.display_name.split(',').slice(0, 3).join(', ')
                        setLocationName(name)
                        setLocation(prev => prev ? { ...prev, name } : null)
                    }
                } catch (e) {
                    console.error('Failed to get location name:', e)
                }
            },
            (error) => {
                setIsLoading(false)
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setError('Location permission denied. Please enable location access.')
                        break
                    case error.POSITION_UNAVAILABLE:
                        setError('Location information is unavailable.')
                        break
                    case error.TIMEOUT:
                        setError('Location request timed out.')
                        break
                    default:
                        setError('An unknown error occurred.')
                        break
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
    }

    const handleShare = () => {
        if (location) {
            onSelectLocation(location.latitude, location.longitude, location.name)
            onClose()
        }
    }

    if (!isOpen) return null

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl p-4 w-80">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                    Share Location
                </h3>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            {!location ? (
                <button
                    onClick={getCurrentLocation}
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Getting Location...
                        </>
                    ) : (
                        <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="22" y1="12" x2="18" y2="12" />
                                <line x1="6" y1="12" x2="2" y2="12" />
                                <line x1="12" y1="6" x2="12" y2="2" />
                                <line x1="12" y1="22" x2="12" y2="18" />
                            </svg>
                            Get Current Location
                        </>
                    )}
                </button>
            ) : (
                <div className="space-y-4">
                    <div className="p-3 bg-slate-700/50 rounded-lg">
                        <div className="text-xs text-slate-400 mb-1">Location</div>
                        <div className="text-white text-sm">
                            {locationName || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setLocation(null)}
                            className="flex-1 py-2 px-4 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                        >
                            Retry
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
                        >
                            Share
                        </button>
                    </div>
                </div>
            )}

            <p className="mt-4 text-xs text-slate-500 text-center">
                Your location will be shared with the chat room
            </p>
        </div>
    )
}
