// Social Community Platform Service for AthleteAI
// Provides athlete networking, forums, mentorship, and social features

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

class SocialCommunityService {
  constructor() {
    this.forums = new Map();
    this.mentorships = new Map();
    this.teams = new Map();
    this.challenges = new Map();
    this.notifications = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the social community service
   */
  async initialize() {
    try {
      console.log('Initializing Social Community Service...');

      // Initialize default forums
      await this.initializeDefaultForums();

      // Initialize default challenges
      await this.initializeDefaultChallenges();

      this.isInitialized = true;
      console.log('Social Community Service initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Social Community Service:', error);
      throw error;
    }
  }

  /**
   * Initialize default forums
   */
  async initializeDefaultForums() {
    const defaultForums = [
      {
        id: 'football-training',
        name: 'Football Training',
        description: 'Discuss training techniques, drills, and conditioning',
        category: 'training',
        moderators: [],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'nutrition-fitness',
        name: 'Nutrition & Fitness',
        description: 'Share nutrition tips, diet plans, and fitness advice',
        category: 'health',
        moderators: [],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'college-recruiting',
        name: 'College Recruiting',
        description: 'Discuss college recruitment, scholarships, and NCAA rules',
        category: 'recruiting',
        moderators: [],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'injury-prevention',
        name: 'Injury Prevention',
        description: 'Share experiences and advice about staying healthy',
        category: 'health',
        moderators: [],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'mental-training',
        name: 'Mental Training',
        description: 'Discuss mental toughness, visualization, and psychology',
        category: 'mental',
        moderators: [],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'general-discussion',
        name: 'General Discussion',
        description: 'General topics and community discussions',
        category: 'general',
        moderators: [],
        isActive: true,
        createdAt: new Date()
      }
    ];

    defaultForums.forEach(forum => {
      this.forums.set(forum.id, {
        ...forum,
        posts: [],
        members: new Set()
      });
    });
  }

  /**
   * Initialize default challenges
   */
  async initializeDefaultChallenges() {
    const defaultChallenges = [
      {
        id: 'monthly-mileage',
        name: 'Monthly Mileage Challenge',
        description: 'Run/walk the most miles this month',
        type: 'fitness',
        duration: 30, // days
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        participants: new Map(),
        leaderboard: [],
        isActive: true,
        rules: 'Track your running/walking miles and report weekly progress',
        rewards: ['Bragging rights', 'Community recognition']
      },
      {
        id: 'strength-gains',
        name: 'Strength Gains Challenge',
        description: 'Track your strength improvements over 8 weeks',
        type: 'strength',
        duration: 56, // days
        startDate: new Date(),
        endDate: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000),
        participants: new Map(),
        leaderboard: [],
        isActive: true,
        rules: 'Log your max lifts weekly and track progress',
        rewards: ['Personal records', 'Training insights']
      },
      {
        id: 'nutrition-tracker',
        name: 'Nutrition Consistency Challenge',
        description: 'Maintain healthy eating habits for 21 days',
        type: 'nutrition',
        duration: 21, // days
        startDate: new Date(),
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        participants: new Map(),
        leaderboard: [],
        isActive: true,
        rules: 'Log meals daily and share healthy recipes',
        rewards: ['Better habits', 'Recipe collection']
      }
    ];

    defaultChallenges.forEach(challenge => {
      this.challenges.set(challenge.id, challenge);
    });
  }

  /**
   * Create a new forum post
   * @param {string} forumId - Forum ID
   * @param {Object} postData - Post data
   * @returns {Object} Created post
   */
  async createForumPost(forumId, postData) {
    try {
      const forum = this.forums.get(forumId);
      if (!forum) {
        throw new Error('Forum not found');
      }

      const post = {
        id: uuidv4(),
        forumId,
        authorId: postData.authorId,
        title: postData.title,
        content: postData.content,
        tags: postData.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: 0,
        likedBy: new Set(),
        replies: [],
        isPinned: false,
        isLocked: false
      };

      forum.posts.push(post);
      forum.members.add(postData.authorId);

      // Notify forum members (simplified)
      this.notifyForumMembers(forumId, postData.authorId, 'new_post', post);

      return post;

    } catch (error) {
      console.error('Error creating forum post:', error);
      throw error;
    }
  }

  /**
   * Reply to a forum post
   * @param {string} postId - Post ID
   * @param {Object} replyData - Reply data
   * @returns {Object} Created reply
   */
  async replyToPost(postId, replyData) {
    try {
      // Find the post across all forums
      let targetPost = null;
      let targetForum = null;

      for (const forum of this.forums.values()) {
        targetPost = forum.posts.find(p => p.id === postId);
        if (targetPost) {
          targetForum = forum;
          break;
        }
      }

      if (!targetPost) {
        throw new Error('Post not found');
      }

      const reply = {
        id: uuidv4(),
        authorId: replyData.authorId,
        content: replyData.content,
        createdAt: new Date(),
        likes: 0,
        likedBy: new Set()
      };

      targetPost.replies.push(reply);
      targetPost.updatedAt = new Date();

      // Notify post author
      this.notifyUser(targetPost.authorId, 'post_reply', {
        postId,
        replyId: reply.id,
        replierId: replyData.authorId
      });

      return reply;

    } catch (error) {
      console.error('Error replying to post:', error);
      throw error;
    }
  }

  /**
   * Like a post or reply
   * @param {string} itemId - Post or reply ID
   * @param {string} userId - User ID
   * @returns {Object} Updated item
   */
  async likeItem(itemId, userId) {
    try {
      // Find the item across all forums
      let targetItem = null;
      let targetPost = null;

      for (const forum of this.forums.values()) {
        for (const post of forum.posts) {
          if (post.id === itemId) {
            targetItem = post;
            targetPost = post;
            break;
          }
          const reply = post.replies.find(r => r.id === itemId);
          if (reply) {
            targetItem = reply;
            targetPost = post;
            break;
          }
        }
        if (targetItem) break;
      }

      if (!targetItem) {
        throw new Error('Item not found');
      }

      if (targetItem.likedBy.has(userId)) {
        // Unlike
        targetItem.likedBy.delete(userId);
        targetItem.likes--;
      } else {
        // Like
        targetItem.likedBy.add(userId);
        targetItem.likes++;
      }

      return targetItem;

    } catch (error) {
      console.error('Error liking item:', error);
      throw error;
    }
  }

  /**
   * Find mentorship matches for an athlete
   * @param {string} athleteId - Athlete ID
   * @param {Object} preferences - Mentorship preferences
   * @returns {Array} Potential mentors
   */
  async findMentors(athleteId, preferences) {
    try {
      // In a real implementation, this would query the database for mentors
      // For simulation, return mock mentor matches
      const mockMentors = [
        {
          id: 'mentor1',
          name: 'Coach Johnson',
          sport: 'football',
          experience: '15 years',
          specialization: 'quarterback development',
          rating: 4.8,
          availability: 'weekends',
          matchScore: 95
        },
        {
          id: 'mentor2',
          name: 'Sarah Martinez',
          sport: 'football',
          experience: '10 years',
          specialization: 'conditioning',
          rating: 4.9,
          availability: 'weekdays',
          matchScore: 88
        },
        {
          id: 'mentor3',
          name: 'Mike Chen',
          sport: 'football',
          experience: '12 years',
          specialization: 'recruiting',
          rating: 4.7,
          availability: 'evenings',
          matchScore: 82
        }
      ];

      // Filter based on preferences
      return mockMentors.filter(mentor => {
        if (preferences.sport && mentor.sport !== preferences.sport) return false;
        if (preferences.specialization && !mentor.specialization.includes(preferences.specialization)) return false;
        return true;
      });

    } catch (error) {
      console.error('Error finding mentors:', error);
      throw error;
    }
  }

  /**
   * Request mentorship
   * @param {string} athleteId - Athlete ID
   * @param {string} mentorId - Mentor ID
   * @param {Object} requestData - Request details
   * @returns {Object} Mentorship request
   */
  async requestMentorship(athleteId, mentorId, requestData) {
    try {
      const mentorshipId = uuidv4();

      const mentorship = {
        id: mentorshipId,
        athleteId,
        mentorId,
        status: 'pending',
        goals: requestData.goals,
        availability: requestData.availability,
        message: requestData.message,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.mentorships.set(mentorshipId, mentorship);

      // Notify mentor
      this.notifyUser(mentorId, 'mentorship_request', mentorship);

      return mentorship;

    } catch (error) {
      console.error('Error requesting mentorship:', error);
      throw error;
    }
  }

  /**
   * Create a team
   * @param {Object} teamData - Team data
   * @returns {Object} Created team
   */
  async createTeam(teamData) {
    try {
      const teamId = uuidv4();

      const team = {
        id: teamId,
        name: teamData.name,
        description: teamData.description,
        sport: teamData.sport,
        level: teamData.level,
        location: teamData.location,
        captainId: teamData.captainId,
        members: new Set([teamData.captainId]),
        maxMembers: teamData.maxMembers || 20,
        isRecruiting: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        activities: []
      };

      this.teams.set(teamId, team);

      return team;

    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  /**
   * Join a team
   * @param {string} teamId - Team ID
   * @param {string} athleteId - Athlete ID
   * @returns {Object} Updated team
   */
  async joinTeam(teamId, athleteId) {
    try {
      const team = this.teams.get(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      if (team.members.size >= team.maxMembers) {
        throw new Error('Team is full');
      }

      if (team.members.has(athleteId)) {
        throw new Error('Already a member of this team');
      }

      team.members.add(athleteId);
      team.updatedAt = new Date();

      // Notify team captain
      this.notifyUser(team.captainId, 'team_join', {
        teamId,
        athleteId,
        teamName: team.name
      });

      return team;

    } catch (error) {
      console.error('Error joining team:', error);
      throw error;
    }
  }

  /**
   * Join a challenge
   * @param {string} challengeId - Challenge ID
   * @param {string} athleteId - Athlete ID
   * @returns {Object} Updated challenge
   */
  async joinChallenge(challengeId, athleteId) {
    try {
      const challenge = this.challenges.get(challengeId);
      if (!challenge) {
        throw new Error('Challenge not found');
      }

      if (!challenge.isActive) {
        throw new Error('Challenge is not active');
      }

      if (challenge.participants.has(athleteId)) {
        throw new Error('Already participating in this challenge');
      }

      challenge.participants.set(athleteId, {
        joinedAt: new Date(),
        progress: 0,
        lastUpdate: new Date()
      });

      return challenge;

    } catch (error) {
      console.error('Error joining challenge:', error);
      throw error;
    }
  }

  /**
   * Update challenge progress
   * @param {string} challengeId - Challenge ID
   * @param {string} athleteId - Athlete ID
   * @param {number} progress - New progress value
   * @returns {Object} Updated participant data
   */
  async updateChallengeProgress(challengeId, athleteId, progress) {
    try {
      const challenge = this.challenges.get(challengeId);
      if (!challenge) {
        throw new Error('Challenge not found');
      }

      const participant = challenge.participants.get(athleteId);
      if (!participant) {
        throw new Error('Not participating in this challenge');
      }

      participant.progress = progress;
      participant.lastUpdate = new Date();

      // Update leaderboard
      this.updateChallengeLeaderboard(challenge);

      return participant;

    } catch (error) {
      console.error('Error updating challenge progress:', error);
      throw error;
    }
  }

  /**
   * Update challenge leaderboard
   * @param {Object} challenge - Challenge object
   */
  updateChallengeLeaderboard(challenge) {
    const participants = Array.from(challenge.participants.entries()).map(([athleteId, data]) => ({
      athleteId,
      progress: data.progress,
      lastUpdate: data.lastUpdate
    }));

    // Sort by progress (descending)
    participants.sort((a, b) => b.progress - a.progress);

    challenge.leaderboard = participants.slice(0, 10); // Top 10
  }

  /**
   * Get forum posts
   * @param {string} forumId - Forum ID
   * @param {Object} options - Query options
   * @returns {Array} Forum posts
   */
  getForumPosts(forumId, options = {}) {
    const forum = this.forums.get(forumId);
    if (!forum) {
      throw new Error('Forum not found');
    }

    let posts = [...forum.posts];

    // Apply filters
    if (options.tag) {
      posts = posts.filter(p => p.tags.includes(options.tag));
    }

    if (options.authorId) {
      posts = posts.filter(p => p.authorId === options.authorId);
    }

    // Sort
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

    posts.sort((a, b) => {
      if (sortBy === 'likes') {
        return (a.likes - b.likes) * sortOrder;
      }
      return (new Date(a[sortBy]) - new Date(b[sortBy])) * sortOrder;
    });

    // Pagination
    const page = options.page || 1;
    const limit = options.limit || 20;
    const startIndex = (page - 1) * limit;

    return {
      posts: posts.slice(startIndex, startIndex + limit),
      total: posts.length,
      page,
      totalPages: Math.ceil(posts.length / limit)
    };
  }

  /**
   * Get available forums
   * @returns {Array} List of forums
   */
  getForums() {
    return Array.from(this.forums.values()).map(forum => ({
      id: forum.id,
      name: forum.name,
      description: forum.description,
      category: forum.category,
      memberCount: forum.members.size,
      postCount: forum.posts.length,
      lastActivity: forum.posts.length > 0 ? forum.posts[forum.posts.length - 1].createdAt : null
    }));
  }

  /**
   * Get active challenges
   * @returns {Array} List of challenges
   */
  getChallenges() {
    return Array.from(this.challenges.values())
      .filter(c => c.isActive)
      .map(challenge => ({
        id: challenge.id,
        name: challenge.name,
        description: challenge.description,
        type: challenge.type,
        duration: challenge.duration,
        participantCount: challenge.participants.size,
        endDate: challenge.endDate,
        leaderboard: challenge.leaderboard.slice(0, 5) // Top 5
      }));
  }

  /**
   * Get teams
   * @param {Object} filters - Filter options
   * @returns {Array} List of teams
   */
  getTeams(filters = {}) {
    let teams = Array.from(this.teams.values());

    // Apply filters
    if (filters.sport) {
      teams = teams.filter(t => t.sport === filters.sport);
    }

    if (filters.level) {
      teams = teams.filter(t => t.level === filters.level);
    }

    if (filters.isRecruiting !== undefined) {
      teams = teams.filter(t => t.isRecruiting === filters.isRecruiting);
    }

    return teams.map(team => ({
      id: team.id,
      name: team.name,
      description: team.description,
      sport: team.sport,
      level: team.level,
      location: team.location,
      memberCount: team.members.size,
      maxMembers: team.maxMembers,
      isRecruiting: team.isRecruiting,
      captainId: team.captainId
    }));
  }

  /**
   * Notify forum members
   * @param {string} forumId - Forum ID
   * @param {string} senderId - Sender ID
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   */
  notifyForumMembers(forumId, senderId, type, data) {
    const forum = this.forums.get(forumId);
    if (!forum) return;

    forum.members.forEach(memberId => {
      if (memberId !== senderId) {
        this.notifyUser(memberId, type, data);
      }
    });
  }

  /**
   * Notify a user
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   */
  notifyUser(userId, type, data) {
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }

    const userNotifications = this.notifications.get(userId);
    userNotifications.push({
      id: uuidv4(),
      type,
      data,
      createdAt: new Date(),
      read: false
    });

    // Keep only last 50 notifications
    if (userNotifications.length > 50) {
      userNotifications.shift();
    }
  }

  /**
   * Get user notifications
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Array} User notifications
   */
  getUserNotifications(userId, options = {}) {
    const notifications = this.notifications.get(userId) || [];
    const unreadOnly = options.unreadOnly || false;

    let filteredNotifications = notifications;
    if (unreadOnly) {
      filteredNotifications = notifications.filter(n => !n.read);
    }

    // Sort by created date (newest first)
    filteredNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const page = options.page || 1;
    const limit = options.limit || 20;
    const startIndex = (page - 1) * limit;

    return {
      notifications: filteredNotifications.slice(startIndex, startIndex + limit),
      total: filteredNotifications.length,
      unreadCount: notifications.filter(n => !n.read).length
    };
  }

  /**
   * Mark notifications as read
   * @param {string} userId - User ID
   * @param {Array} notificationIds - Notification IDs to mark as read
   */
  markNotificationsRead(userId, notificationIds) {
    const notifications = this.notifications.get(userId) || [];

    notificationIds.forEach(id => {
      const notification = notifications.find(n => n.id === id);
      if (notification) {
        notification.read = true;
      }
    });
  }

  /**
   * Get social community statistics
   * @returns {Object} Service statistics
   */
  getStats() {
    const forumStats = Array.from(this.forums.values()).reduce((stats, forum) => {
      stats.totalPosts += forum.posts.length;
      stats.totalMembers += forum.members.size;
      return stats;
    }, { totalPosts: 0, totalMembers: 0 });

    const challengeStats = Array.from(this.challenges.values()).reduce((stats, challenge) => {
      stats.totalParticipants += challenge.participants.size;
      return stats;
    }, { totalParticipants: 0 });

    const teamStats = Array.from(this.teams.values()).reduce((stats, team) => {
      stats.totalMembers += team.members.size;
      return stats;
    }, { totalMembers: 0 });

    return {
      isInitialized: this.isInitialized,
      forums: this.forums.size,
      totalForumPosts: forumStats.totalPosts,
      totalForumMembers: forumStats.totalMembers,
      challenges: this.challenges.size,
      totalChallengeParticipants: challengeStats.totalParticipants,
      teams: this.teams.size,
      totalTeamMembers: teamStats.totalMembers,
      mentorships: this.mentorships.size,
      version: '1.0.0'
    };
  }
}

module.exports = SocialCommunityService;