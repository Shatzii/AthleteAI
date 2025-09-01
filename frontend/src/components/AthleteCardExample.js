import React from 'react';

const AthleteCardExample = ({ athlete }) => {
    const {
        name = "Jason Mitchell",
        position = "WR / DB",
        avatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        stats = {
            physical: 87,
            cognitive: 92,
            psychological: 78
        },
        metrics = {
            fortyYard: "4.51s",
            vertJump: "34in",
            reaction: "0.21s"
        },
        badges = ["NextUp Prospect", "Elite Speed", "Coachable", "Commander"],
        starRating = 4
    } = athlete || {};

    return (
        <div className="athlete-card max-w-sm w-full">
            {/* Header Section */}
            <div className="athlete-card-header">
                {/* GET VERIFIED Badge */}
                <div className="absolute top-4 left-4 w-10 h-10 bg-electric-blue rounded-full flex items-center justify-center shadow-electric">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                </div>

                {/* QR Code Placeholder */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-dark-tertiary rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-text-muted" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 010 2H6v2.586l1.707 1.707a1 1 0 01-1.414 1.414L4 7.414V6a1 1 0 01-1-1zm14 0a1 1 0 011-1h3a1 1 0 010 2h-1v2.586l-1.707 1.707a1 1 0 01-1.414-1.414L16 7.414V6h-1a1 1 0 01-1-1zM6 14a1 1 0 011-1h3a1 1 0 010 2H8v2.586l-1.707 1.707a1 1 0 01-1.414-1.414L6 16.586V14zm8 0a1 1 0 011-1h3a1 1 0 010 2h-1v2.586l1.707 1.707a1 1 0 01-1.414 1.414L14 16.586V14z" clipRule="evenodd"></path>
                    </svg>
                </div>
            </div>

            {/* Center Section */}
            <div className="athlete-card-body">
                {/* Athlete Image */}
                <div className="athlete-avatar">
                    <div className="avatar-container">
                        <div className="avatar-inner">
                            <img
                                src={avatar}
                                alt={`${name} headshot`}
                                className="w-full h-full object-cover rounded-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Athlete Name */}
                <h1 className="athlete-name">{name}</h1>

                {/* Star Rating */}
                <div className="flex items-center space-x-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                        <svg
                            key={i}
                            className={`w-5 h-5 ${i < starRating ? 'text-neon-aqua' : 'text-text-muted'} filter drop-shadow`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                    ))}
                </div>
            </div>

            {/* Stat Bars Section */}
            <div className="px-6 pb-6">
                <div className="glass-panel mb-4">
                    {/* Physical Stat */}
                    <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                            <span className="stat-label">Physical</span>
                            <span className="stat-value">{stats.physical}</span>
                        </div>
                        <div className="progress-track h-2">
                            <div className="progress-fill h-2" style={{ width: `${stats.physical}%` }}></div>
                        </div>
                    </div>

                    {/* Cognitive Stat */}
                    <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                            <span className="stat-label">Cognitive</span>
                            <span className="stat-value">{stats.cognitive}</span>
                        </div>
                        <div className="progress-track h-2">
                            <div className="progress-fill h-2" style={{ width: `${stats.cognitive}%` }}></div>
                        </div>
                    </div>

                    {/* Psychological Stat */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="stat-label">Psychological</span>
                            <span className="stat-value">{stats.psychological}</span>
                        </div>
                        <div className="progress-track h-2">
                            <div className="progress-fill h-2" style={{ width: `${stats.psychological}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Combine Stats */}
            <div className="px-6 pb-6">
                <div className="grid grid-cols-3 gap-3">
                    <div className="stat-card">
                        <div className="metric-label">40-Yard</div>
                        <div className="metric-value">{metrics.fortyYard}</div>
                    </div>
                    <div className="stat-card">
                        <div className="metric-label">Vert Jump</div>
                        <div className="metric-value">{metrics.vertJump}</div>
                    </div>
                    <div className="stat-card">
                        <div className="metric-label">Reaction</div>
                        <div className="metric-value">{metrics.reaction}</div>
                    </div>
                </div>
            </div>

            {/* Badges Section */}
            <div className="px-6 pb-6">
                <div className="flex flex-wrap gap-2">
                    {badges.map((badge, index) => (
                        <span
                            key={index}
                            className={index % 2 === 0 ? 'badge-electric' : 'badge-aqua'}
                        >
                            {badge}
                        </span>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
                <div className="border-t border-electric-blue opacity-30 mb-4"></div>
                <div className="flex justify-between items-center">
                    <div className="text-lg font-orbitron text-electric-blue shadow-electric">
                        Position Fit: {position}
                    </div>
                    {/* School/Team Logo Placeholder */}
                    <div className="w-8 h-8 bg-dark-tertiary rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-text-muted" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd"></path>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AthleteCardExample;
