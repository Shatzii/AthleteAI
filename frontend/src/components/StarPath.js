import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStarPathRoute, getStarPathProgress, trainStarPath } from '../utils/api';
import { Star, Lock, CheckCircle, Trophy, Target, Zap, ArrowRight, Play, Calendar, Flame, Gift, Bell, Users, TrendingUp, Award, Clock, Heart } from 'lucide-react';
import './StarPath.css';

// DailyChallengeCard component
const DailyChallengeCard = ({ challenge, onComplete }) => {
  return (
    <div className="starpath-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-white font-semibold">{challenge.title}</h4>
        {challenge.completed ? (
          <CheckCircle className="h-5 w-5 text-green-400" />
        ) : (
          <div className="h-5 w-5 rounded-full border-2 border-gray-400"></div>
        )}
      </div>
      <p className="text-gray-300 text-sm mb-3">{challenge.description}</p>
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
          {challenge.completed ? 'Completed' : `${challenge.progress || 0}/${challenge.target || 1}`}
        </div>
        {!challenge.completed && (
          <button
            onClick={onComplete}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            Complete
          </button>
        )}
      </div>
    </div>
  );
};

// WeeklyGoalCard component
const WeeklyGoalCard = ({ goal }) => {
  return (
    <div className="starpath-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-white font-semibold">{goal.title}</h4>
        {goal.completed ? (
          <CheckCircle className="h-5 w-5 text-green-400" />
        ) : (
          <div className="h-5 w-5 rounded-full border-2 border-gray-400"></div>
        )}
      </div>
      <p className="text-gray-300 text-sm mb-3">{goal.description}</p>
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
          {goal.completed ? 'Completed' : `${goal.progress || 0}/${goal.target || 1}`}
        </div>
        {!goal.completed && (
          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${((goal.progress || 0) / (goal.target || 1)) * 100}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

const SAMPLE_STARPATH_DATA = [
  {
    id: 'ball_control',
    name: 'Ball Control Mastery',
    description: 'Master fundamental ball handling and control techniques',
    currentLevel: 3,
    maxLevel: 5,
    totalXp: 750,
    requiredXp: 1000,
    isUnlocked: true,
    category: 'technical',
    prerequisites: [],
    rewards: ['First Touch Badge', '+10 Technical Rating'],
  },
  {
    id: 'agility_training',
    name: 'Agility & Speed',
    description: 'Develop explosive movement and directional changes',
    currentLevel: 2,
    maxLevel: 5,
    totalXp: 450,
    requiredXp: 600,
    isUnlocked: true,
    category: 'physical',
    prerequisites: [],
    rewards: ['Speed Demon Badge', '+8 Athleticism Rating'],
  },
  {
    id: 'game_vision',
    name: 'Game Vision',
    description: 'Enhance field awareness and decision-making',
    currentLevel: 1,
    maxLevel: 5,
    totalXp: 200,
    requiredXp: 400,
    isUnlocked: true,
    category: 'tactical',
    prerequisites: [],
    rewards: ['Visionary Badge', '+12 Game Awareness'],
  },
  {
    id: 'mental_toughness',
    name: 'Mental Resilience',
    description: 'Build confidence and focus under pressure',
    currentLevel: 0,
    maxLevel: 5,
    totalXp: 0,
    requiredXp: 300,
    isUnlocked: false,
    category: 'mental',
    prerequisites: ['game_vision'],
    rewards: ['Unshakeable Badge', '+15 Consistency'],
  },
  {
    id: 'advanced_techniques',
    name: 'Advanced Techniques',
    description: 'Master elite-level skills and movements',
    currentLevel: 0,
    maxLevel: 5,
    totalXp: 0,
    requiredXp: 800,
    isUnlocked: false,
    category: 'technical',
    prerequisites: ['ball_control'],
    rewards: ['Elite Technician Badge', '+20 Technical Rating'],
  },
  {
    id: 'leadership',
    name: 'Team Leadership',
    description: 'Develop communication and leadership skills',
    currentLevel: 0,
    maxLevel: 5,
    totalXp: 0,
    requiredXp: 500,
    isUnlocked: false,
    category: 'mental',
    prerequisites: ['mental_toughness', 'game_vision'],
    rewards: ['Captain Badge', '+25 Leadership Rating'],
  },
];

const SAMPLE_DAILY_CHALLENGES = [
  {
    id: 'morning_drill',
    title: 'Morning Ball Control Drill',
    description: 'Complete 20 minutes of ball control exercises',
    xpReward: 100,
    type: 'training',
    completed: false,
    timeLimit: '30 minutes',
    difficulty: 'easy',
  },
  {
    id: 'speed_workout',
    title: 'Speed & Agility Session',
    description: 'Complete agility ladder and sprint intervals',
    xpReward: 150,
    type: 'workout',
    completed: false,
    timeLimit: '45 minutes',
    difficulty: 'medium',
  },
  {
    id: 'mental_prep',
    title: 'Mental Preparation',
    description: 'Watch game footage and visualize success',
    xpReward: 75,
    type: 'mental',
    completed: true,
    timeLimit: '15 minutes',
    difficulty: 'easy',
  },
  {
    id: 'team_study',
    title: 'Team Strategy Study',
    description: 'Review team playbook and formations',
    xpReward: 125,
    type: 'tactical',
    completed: false,
    timeLimit: '25 minutes',
    difficulty: 'medium',
  },
];

const SAMPLE_WEEKLY_GOALS = [
  {
    id: 'training_sessions',
    title: 'Complete 5 Training Sessions',
    description: 'Finish 5 different skill training sessions this week',
    progress: 3,
    target: 5,
    xpReward: 500,
    completed: false,
  },
  {
    id: 'skill_improvement',
    title: 'Improve 2 Skills',
    description: 'Level up at least 2 different skills',
    progress: 1,
    target: 2,
    xpReward: 300,
    completed: false,
  },
  {
    id: 'consistency',
    title: '7-Day Training Streak',
    description: 'Train every day for a full week',
    progress: 7,
    target: 7,
    xpReward: 750,
    completed: true,
  },
];

const MOTIVATIONAL_MESSAGES = [
  "Every champion was once a beginner. Keep pushing!",
  "Your dedication today creates the champion of tomorrow.",
  "Small daily improvements lead to extraordinary results.",
  "The only way to fail is to stop trying. You're on the right path!",
  "Excellence is earned through consistent effort. You're doing great!",
  "Your future self will thank you for the work you're doing today.",
  "Champions are made when no one is watching. Keep training!",
  "Progress, not perfection. Every step counts!",
];

const StarPath = () => {
  const { token } = useAuth();
  const [starPathData, setStarPathData] = useState(SAMPLE_STARPATH_DATA);
  const [userProgress, setUserProgress] = useState({
    totalXp: 1400,
    completedNodes: 0,
    currentTier: 2,
    achievements: 3,
  });
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dailyChallenges, setDailyChallenges] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(7);
  const [lastLoginDate, setLastLoginDate] = useState(new Date().toDateString());
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [dailyReward, setDailyReward] = useState(null);
  const [weeklyGoals, setWeeklyGoals] = useState([]);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [showAchievement, setShowAchievement] = useState(null);
  const history = useHistory();

  useEffect(() => {
    loadStarPathProgress();
    loadDailyChallenges();
    loadWeeklyGoals();
    checkDailyLogin();
    setRandomMotivationalMessage();
  }, []);

  const loadStarPathProgress = async () => {
    try {
      setLoading(true);

      // Load skill nodes and progress data
      const [progressData, statsData] = await Promise.all([
        getStarPathRoute(token),
        getStarPathProgress(token),
      ]);

      if (progressResponse.ok && statsResponse.ok) {
        const [progressData, statsData] = await Promise.all([
          progressResponse.json(),
          statsResponse.json(),
        ]);

        if (progressData.success && statsData.success) {
          setStarPathData(progressData.skillNodes || SAMPLE_STARPATH_DATA);
          setUserProgress(
            statsData.progress || {
              totalXp: 1400,
              completedNodes: 3,
              currentTier: 2,
              achievements: 8,
            },
          );
        }
      } else {
        // Use sample data if API fails
        setStarPathData(SAMPLE_STARPATH_DATA);
        setUserProgress({
          totalXp: 1400,
          completedNodes: 3,
          currentTier: 2,
          achievements: 8,
        });
      }
    } catch (error) {
      console.error('Failed to load StarPath data:', error);
      setStarPathData(SAMPLE_STARPATH_DATA);
      setUserProgress({
        totalXp: 1400,
        completedNodes: 3,
        currentTier: 2,
        achievements: 8,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDailyChallenges = () => {
    // In production, fetch from API
    setDailyChallenges(SAMPLE_DAILY_CHALLENGES);
  };

  const loadWeeklyGoals = () => {
    // In production, fetch from API
    setWeeklyGoals(SAMPLE_WEEKLY_GOALS);
  };

  const checkDailyLogin = () => {
    const today = new Date().toDateString();
    const lastLogin = localStorage.getItem('lastLoginDate');

    if (lastLogin !== today) {
      // First login of the day
      const streakBonus = currentStreak >= 7 ? 100 : 50;
      const reward = {
        xp: streakBonus,
        message: `Daily login bonus! +${streakBonus} XP`,
        type: 'daily_login'
      };

      setDailyReward(reward);
      setShowDailyReward(true);
      setLastLoginDate(today);
      localStorage.setItem('lastLoginDate', today);

      // Update streak
      setCurrentStreak(prev => prev + 1);
    }
  };

  const setRandomMotivationalMessage = () => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length);
    setMotivationalMessage(MOTIVATIONAL_MESSAGES[randomIndex]);
  };

  const completeDailyChallenge = async (challengeId) => {
    try {
      const challenge = dailyChallenges.find(c => c.id === challengeId);
      if (!challenge || challenge.completed) return;

      // Mark as completed
      setDailyChallenges(prev =>
        prev.map(c =>
          c.id === challengeId ? { ...c, completed: true } : c
        )
      );

      // Award XP
      setUserProgress(prev => ({
        ...prev,
        totalXp: prev.totalXp + challenge.xpReward
      }));

      // Check for achievement
      const completedCount = dailyChallenges.filter(c => c.completed).length + 1;
      if (completedCount === dailyChallenges.length) {
        triggerAchievement('daily_champion');
      }

    } catch (error) {
      console.error('Failed to complete daily challenge:', error);
    }
  };

  const triggerAchievement = (achievementId) => {
    const achievements = {
      daily_champion: {
        id: 'daily_champion',
        title: 'Daily Champion',
        description: 'Complete all daily challenges!',
        icon: '🏆',
        rarity: 'rare',
        xpReward: 200
      },
      streak_master: {
        id: 'streak_master',
        title: 'Streak Master',
        description: 'Maintain a 30-day training streak!',
        icon: '🔥',
        rarity: 'epic',
        xpReward: 500
      }
    };

    const achievement = achievements[achievementId];
    if (achievement) {
      setShowAchievement(achievement);
      setUserProgress(prev => ({
        ...prev,
        totalXp: prev.totalXp + achievement.xpReward,
        achievements: prev.achievements + 1
      }));

      // Auto-hide after 5 seconds
      setTimeout(() => setShowAchievement(null), 5000);
    }
  };

  const startTraining = async (nodeId) => {
    if (loading) return;

    setLoading(true);
    try {
      // Train the skill node
      await trainStarPath(nodeId, 'practice_drill', token);

      if (response.ok) {
        const result = await response.json();
        // Update local state with new XP and progress
        setStarPathData((prevData) =>
          prevData.map((node) =>
            node.id === nodeId
              ? { ...node, totalXp: Math.min(node.totalXp + 50, node.requiredXp) }
              : node,
          ),
        );
        setUserProgress((prev) => ({ ...prev, totalXp: prev.totalXp + 50 }));
      }
    } catch (error) {
      console.error('Training failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      technical: 'bg-blue-600/20 border-blue-600 text-blue-600',
      physical: 'bg-green-600/20 border-green-600 text-green-600',
      mental: 'bg-purple-600/20 border-purple-600 text-purple-600',
      tactical: 'bg-orange-600/20 border-orange-600 text-orange-600',
    };
    return colors[category] || colors.technical;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      technical: <Target className="h-5 w-5" />,
      physical: <Zap className="h-5 w-5" />,
      mental: <Trophy className="h-5 w-5" />,
      tactical: <Star className="h-5 w-5" />,
    };
    return icons[category] || icons.technical;
  };

  return (
    <div className="starpath-container">
      {/* Header */}
      <header className="starpath-header">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => history.push('/dashboard')}
                className="text-blue-600 hover:text-blue-600/80 transition-colors"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-white neon-text">StarPath Hub</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">Total XP</div>
                <div className="text-lg font-bold text-blue-600">{userProgress.totalXp}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Tier</div>
                <div className="text-lg font-bold text-blue-600">{userProgress.currentTier}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Daily Reward Modal */}
      {showDailyReward && dailyReward && (
        <DailyRewardModal
          reward={dailyReward}
          onClose={() => setShowDailyReward(false)}
        />
      )}

      {/* Achievement Notification */}
      {showAchievement && (
        <AchievementNotification
          achievement={showAchievement}
          onClose={() => setShowAchievement(null)}
        />
      )}

      {/* Gamification Dashboard */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Motivational Message */}
        <div className="starpath-motivation-card">
          <Heart className="h-6 w-6 text-red-400" />
          <p className="text-gray-300 italic">{motivationalMessage}</p>
        </div>

        {/* Daily Stats & Streak */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="starpath-stats-card">
            <Flame className="h-8 w-8 text-orange-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{currentStreak}</div>
            <div className="text-sm text-gray-400">Day Streak</div>
          </div>
          <div className="starpath-stats-card">
            <Calendar className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {dailyChallenges.filter(c => c.completed).length}/{dailyChallenges.length}
            </div>
            <div className="text-sm text-gray-400">Daily Tasks</div>
          </div>
          <div className="starpath-stats-card">
            <Target className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {weeklyGoals.filter(g => g.completed).length}/{weeklyGoals.length}
            </div>
            <div className="text-sm text-gray-400">Weekly Goals</div>
          </div>
          <div className="starpath-stats-card">
            <Award className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{userProgress.achievements}</div>
            <div className="text-sm text-gray-400">Achievements</div>
          </div>
        </div>

        {/* Daily Challenges */}
        <div className="starpath-card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <Calendar className="h-6 w-6 text-blue-400 mr-2" />
              Today's Challenges
            </h3>
            <div className="text-sm text-gray-400">
              {dailyChallenges.filter(c => c.completed).length} of {dailyChallenges.length} completed
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dailyChallenges.map((challenge) => (
              <DailyChallengeCard
                key={challenge.id}
                challenge={challenge}
                onComplete={() => completeDailyChallenge(challenge.id)}
              />
            ))}
          </div>
        </div>

        {/* Weekly Goals */}
        <div className="starpath-card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <Target className="h-6 w-6 text-green-400 mr-2" />
              Weekly Goals
            </h3>
            <div className="text-sm text-gray-400">
              {weeklyGoals.filter(g => g.completed).length} of {weeklyGoals.length} completed
            </div>
          </div>

          <div className="space-y-4">
            {weeklyGoals.map((goal) => (
              <WeeklyGoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      </div>

      {/* StarPath Journey Overview */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Your Athletic Journey</h2>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Complete your GAR analysis to determine your StarPath level, then progress through
            AI-generated training to unlock College Path features for NCAA eligibility and
            recruitment.
          </p>
        </div>

        {/* Three Main Pathways */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Athletic Development */}
          <div className="starpath-card">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Athletic Development</h3>
              <p className="text-sm text-gray-400">
                AI-powered training and performance analysis
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => history.push('/gar-upload')}
                className="starpath-btn-primary"
              >
                Get GAR Analysis
              </button>
              <button
                onClick={() => history.push('/ai-football-coach')}
                className="starpath-btn-secondary"
              >
                AI Coach Training
              </button>
              <button
                onClick={() => history.push('/performance-analytics')}
                className="starpath-btn-secondary"
              >
                Performance Analytics
              </button>
              <button
                onClick={() => history.push('/team-sports')}
                className="starpath-btn-secondary"
              >
                Team Training
              </button>
            </div>
          </div>

          {/* College Path */}
          <div className="starpath-card">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">College Path</h3>
              <p className="text-sm text-gray-400">
                NCAA eligibility and recruitment tools
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => history.push('/academy')}
                className="starpath-btn-primary"
              >
                Academy Courses
              </button>
              <button
                onClick={() => history.push('/ncaa-tracker')}
                className="starpath-btn-secondary"
              >
                NCAA Eligibility
              </button>
              <button
                onClick={() => history.push('/athletic-contacts')}
                className="starpath-btn-secondary"
              >
                Coach Contacts
              </button>
              <button
                onClick={() => history.push('/scholarship-tracker')}
                className="starpath-btn-secondary"
              >
                Scholarship Tracker
              </button>
            </div>
          </div>

          {/* Progress Tracking */}
          <div className="starpath-card">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Progress Tracking</h3>
              <p className="text-sm text-gray-400">
                Monitor your development and achievements
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => history.push('/dashboard')}
                className="starpath-btn-primary"
              >
                Student Dashboard
              </button>
              <button
                onClick={() => history.push('/rankings')}
                className="starpath-btn-secondary"
              >
                Athlete Rankings
              </button>
              <button
                onClick={() => history.push('/verified-athletes')}
                className="starpath-btn-secondary"
              >
                Verified Athletes
              </button>
              <button
                onClick={() => history.push('/wellness-hub')}
                className="starpath-btn-secondary"
              >
                Wellness Hub
              </button>
            </div>
          </div>
        </div>

        {/* Current Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="starpath-stats-card">
            <Star className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{userProgress.totalXp}</div>
            <div className="text-sm text-gray-400">Total Experience</div>
          </div>
          <div className="starpath-stats-card">
            <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {starPathData.filter((n) => n.currentLevel > 0).length}
            </div>
            <div className="text-sm text-gray-400">Skills in Progress</div>
          </div>
          <div className="starpath-stats-card">
            <Trophy className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{userProgress.achievements}</div>
            <div className="text-sm text-gray-400">Achievements Earned</div>
          </div>
          <div className="starpath-stats-card">
            <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{userProgress.currentTier}</div>
            <div className="text-sm text-gray-400">Current Tier</div>
          </div>
        </div>

        {/* StarPath Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {starPathData.map((node) => (
            <StarPathNodeCard
              key={node.id}
              node={node}
              onSelect={setSelectedNode}
              onStartTraining={startTraining}
              loading={loading}
              getCategoryColor={getCategoryColor}
              getCategoryIcon={getCategoryIcon}
            />
          ))}
        </div>

        {/* Selected Node Details */}
        {selectedNode && (
          <NodeDetailsModal
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onStartTraining={startTraining}
            loading={loading}
            getCategoryColor={getCategoryColor}
            getCategoryIcon={getCategoryIcon}
          />
        )}
      </div>
    </div>
  );
};

const StarPathNodeCard = ({
  node,
  onSelect,
  onStartTraining,
  loading,
  getCategoryColor,
  getCategoryIcon,
}) => {
  const progressPercent = (node.totalXp / node.requiredXp) * 100;
  const isCompleted = node.currentLevel >= node.maxLevel;

  return (
    <div
      className={`starpath-node-card ${node.isUnlocked ? '' : 'opacity-60'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div
          className={`px-3 py-1 rounded-full border text-xs font-medium ${getCategoryColor(node.category)}`}
        >
          <div className="flex items-center space-x-1">
            {getCategoryIcon(node.category)}
            <span className="capitalize">{node.category}</span>
          </div>
        </div>
        {!node.isUnlocked && <Lock className="h-5 w-5 text-gray-500" />}
        {isCompleted && <CheckCircle className="h-5 w-5 text-green-400" />}
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-white mb-2">{node.name}</h3>
      <p className="text-gray-400 text-sm mb-4">{node.description}</p>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-300">
            Level {node.currentLevel}/{node.maxLevel}
          </span>
          <span className="text-gray-300">
            {node.totalXp}/{node.requiredXp} XP
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          onClick={() => onSelect(node)}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
        >
          View Details
        </button>
        {node.isUnlocked && !isCompleted && (
          <button
            onClick={() => onStartTraining(node.id)}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-md text-sm transition-colors flex items-center space-x-1"
          >
            <Play className="h-3 w-3" />
            <span>Train</span>
          </button>
        )}
      </div>
    </div>
  );
};

const NodeDetailsModal = ({
  node,
  onClose,
  onStartTraining,
  loading,
  getCategoryColor,
  getCategoryIcon,
}) => {
  const progressPercent = (node.totalXp / node.requiredXp) * 100;
  const isCompleted = node.currentLevel >= node.maxLevel;

  return (
    <div className="starpath-modal-overlay">
      <div className="starpath-modal">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div
              className={`inline-block px-3 py-1 rounded-full border text-xs font-medium mb-3 ${getCategoryColor(node.category)}`}
            >
              <div className="flex items-center space-x-1">
                {getCategoryIcon(node.category)}
                <span className="capitalize">{node.category}</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">{node.name}</h2>
            <p className="text-gray-400 mt-2">{node.description}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        {/* Progress Details */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-300">
              Level {node.currentLevel}/{node.maxLevel}
            </span>
            <span className="text-gray-300">
              {node.totalXp}/{node.requiredXp} XP
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            ></div>
          </div>
          <div className="text-gray-400 text-xs mt-1">{Math.round(progressPercent)}% Complete</div>
        </div>

        {/* Prerequisites */}
        {node.prerequisites.length > 0 && (
          <div className="mb-6">
            <h4 className="text-white font-medium mb-2">Prerequisites</h4>
            <div className="flex flex-wrap gap-2">
              {node.prerequisites.map((prereq, index) => (
                <span key={index} className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs">
                  {prereq.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rewards */}
        <div className="mb-6">
          <h4 className="text-white font-medium mb-2">Rewards</h4>
          <div className="space-y-2">
            {node.rewards.map((reward, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span className="text-gray-300 text-sm">{reward}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Close
          </button>
          {node.isUnlocked && !isCompleted && (
            <button
              onClick={() => {
                onStartTraining(node.id);
                onClose();
              }}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white px-6 py-2 rounded-md transition-colors flex items-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>Start Training</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StarPath;
