interface PollOption {
    id: string;
    text: string;
    votes: number;
    voters: string[];
}

interface Poll {
    id: string;
    question: string;
    options: PollOption[];
    createdBy: string;
    createdAt: number;
    isClosed: boolean;
}

interface PollMessageProps {
    poll: Poll;
    currentUserId: string;
    onVote: (pollId: string, optionId: string) => void;
}

export function PollMessage({ poll, currentUserId, onVote }: PollMessageProps) {
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
    const hasVoted = poll.options.some(opt => opt.voters.includes(currentUserId));

    const handleVote = (optionId: string) => {
        if (!hasVoted && !poll.isClosed) {
            onVote(poll.id, optionId);
        }
    };

    return (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
            {/* Question */}
            <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <line x1="12" y1="20" x2="12" y2="10" />
                        <line x1="18" y1="20" x2="18" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="16" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h4 className="text-white font-medium mb-1">{poll.question}</h4>
                    <p className="text-xs text-slate-400">
                        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                        {poll.isClosed && <span className="ml-2 text-red-400">• Closed</span>}
                    </p>
                </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
                {poll.options.map((option) => {
                    const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                    const isVoted = option.voters.includes(currentUserId);

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleVote(option.id)}
                            disabled={hasVoted || poll.isClosed}
                            className={`w-full text-left p-3 rounded-lg border transition-all relative overflow-hidden ${isVoted
                                    ? 'border-emerald-500 bg-emerald-500/10'
                                    : hasVoted || poll.isClosed
                                        ? 'border-slate-700 bg-slate-800/50 cursor-not-allowed'
                                        : 'border-slate-700 bg-slate-800/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 cursor-pointer'
                                }`}
                        >
                            {/* Progress Bar */}
                            {(hasVoted || poll.isClosed) && (
                                <div
                                    className={`absolute inset-0 ${isVoted ? 'bg-emerald-500/20' : 'bg-slate-700/30'
                                        } transition-all`}
                                    style={{ width: `${percentage}%` }}
                                />
                            )}

                            {/* Content */}
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {isVoted && (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                    <span className="text-white font-medium">{option.text}</span>
                                </div>
                                {(hasVoted || poll.isClosed) && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-400">{option.votes}</span>
                                        <span className="text-sm font-semibold text-white">{Math.round(percentage)}%</span>
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
