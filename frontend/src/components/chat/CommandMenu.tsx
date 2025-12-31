import { useEffect, useState } from 'react'
import { Dice1, HelpCircle, Copy, BarChart2, Gamepad2, Play, Clock } from 'lucide-react'

interface Command {
    id: string
    command: string
    description: string
    icon: React.ReactNode
    template: string
}

interface CommandMenuProps {
    isOpen: boolean
    filter: string
    onSelect: (template: string) => void
    onClose: () => void
    position: 'top' | 'bottom'
}

const COMMANDS: Command[] = [
    { id: 'help', command: '/help', description: 'Show available commands', icon: <HelpCircle size={16} />, template: '/help' },
    { id: 'dice', command: '/dice', description: 'Roll a dice', icon: <Dice1 size={16} />, template: '/dice' },
    { id: 'flip', command: '/flip', description: 'Flip a coin', icon: <Copy size={16} />, template: '/flip' },
    { id: 'poll', command: '/poll', description: 'Create a poll', icon: <BarChart2 size={16} />, template: '/poll "Question?" "Option 1" "Option 2"' },
    { id: 'game', command: '/game ttt', description: 'Start Tic-Tac-Toe', icon: <Gamepad2 size={16} />, template: '/game ttt @' },
    { id: 'watch', command: '/watch', description: 'Watch video together', icon: <Play size={16} />, template: '/watch ' },
    { id: 'schedule', command: '/schedule', description: 'Schedule message', icon: <Clock size={16} />, template: '/schedule 10m ' },
]

export function CommandMenu({ isOpen, filter, onSelect, onClose, position }: CommandMenuProps) {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const filteredCommands = COMMANDS.filter(c =>
        c.command.toLowerCase().startsWith(filter.toLowerCase()) ||
        c.description.toLowerCase().includes(filter.toLowerCase())
    )

    useEffect(() => {
        setSelectedIndex(0)
    }, [filter])

    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length)
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length)
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault()
                if (filteredCommands[selectedIndex]) {
                    onSelect(filteredCommands[selectedIndex].template)
                }
            } else if (e.key === 'Escape') {
                onClose()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, filteredCommands, selectedIndex, onSelect, onClose])

    if (!isOpen || filteredCommands.length === 0) return null

    return (
        <div className={`absolute left-0 right-0 ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} mx-4 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100`}>
            <div className="max-h-60 overflow-y-auto p-1">
                {filteredCommands.map((cmd, index) => (
                    <button
                        key={cmd.id}
                        onClick={() => onSelect(cmd.template)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${index === selectedIndex ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                            }`}
                    >
                        <div className={`${index === selectedIndex ? 'text-white' : 'text-slate-400'}`}>
                            {cmd.icon}
                        </div>
                        <div>
                            <div className="font-medium font-mono text-sm">{cmd.command}</div>
                            <div className={`text-xs ${index === selectedIndex ? 'text-indigo-200' : 'text-slate-500'}`}>
                                {cmd.description}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}
