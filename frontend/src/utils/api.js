import axios from 'axios';

const API_URL = '/api'; // Use relative URL for proxy support

// Function to register a new user
export const registerUser = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/v1/users/register`, userData);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// Function to log in a user
export const loginUser = async (credentials) => {
    try {
        const response = await axios.post(`${API_URL}/v1/users/login`, credentials);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// Function to fetch user profile
export const fetchUserProfile = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/v1/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// OAuth functions
export const initiateGoogleLogin = () => {
    window.location.href = `${API_URL}/v1/auth/google`;
};

export const initiateGithubLogin = () => {
    window.location.href = `${API_URL}/v1/auth/github`;
};

export const initiateFacebookLogin = () => {
    window.location.href = `${API_URL}/v1/auth/facebook`;
};

// Function to handle OAuth callback
export const handleOAuthCallback = async (token, provider) => {
    try {
        // Store the token
        localStorage.setItem('token', token);

        // Fetch user profile
        const userData = await fetchUserProfile(token);

        return {
            success: true,
            token,
            user: userData.user,
            provider
        };
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Football API functions
export const getFootballStrategies = async () => {
    try {
        const response = await axios.get(`${API_URL}/football/strategies`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getDefenseStrategy = async (type) => {
    try {
        const response = await axios.get(`${API_URL}/football/defenses/${type}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getOffenseStrategy = async (type) => {
    try {
        const response = await axios.get(`${API_URL}/football/offenses/${type}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getDrillInfo = async (type) => {
    try {
        const response = await axios.get(`${API_URL}/football/drills/${type}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const askAICoach = async (question) => {
    try {
        const response = await axios.post(`${API_URL}/football/coach`, { question });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getVideoPlaylist = async () => {
    try {
        const response = await axios.get(`${API_URL}/football/videos`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// Performance API functions
export const fetchUserPerformance = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/performance`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        // Return mock data if endpoint doesn't exist or token is invalid
        return {
            success: true,
            data: [
                { id: 1, title: 'Total Distance', value: '45.2 km', change: '+5.2%', trend: 'up' },
                { id: 2, title: 'Average Speed', value: '8.5 km/h', change: '+2.1%', trend: 'up' },
                { id: 3, title: 'Training Sessions', value: '24', change: '+15%', trend: 'up' },
                { id: 4, title: 'Personal Best', value: '12.3 km', change: 'New Record!', trend: 'up' },
                { id: 5, title: 'Calories Burned', value: '2,450', change: '+8.3%', trend: 'up' },
                { id: 6, title: 'Heart Rate Avg', value: '145 bpm', change: '-3.2%', trend: 'down' }
            ]
        };
    }
};

// NCAA API functions
export const calculateNCAEligibility = async (eligibilityData) => {
    try {
        const response = await axios.post(`${API_URL}/ncaa/calculate`, eligibilityData);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getNCARequirements = async (division) => {
    try {
        const response = await axios.get(`${API_URL}/ncaa/requirements/${division}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getAllNCARequirements = async () => {
    try {
        const response = await axios.get(`${API_URL}/ncaa/requirements`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// Players API functions
export const getPlayers = async (params = {}) => {
    try {
        const queryString = new URLSearchParams(params).toString();
        const response = await axios.get(`${API_URL}/players${queryString ? `?${queryString}` : ''}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getPlayerById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/players/${id}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const createPlayer = async (playerData, token) => {
    try {
        const response = await axios.post(`${API_URL}/players`, playerData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const updatePlayer = async (id, playerData, token) => {
    try {
        const response = await axios.put(`${API_URL}/players/${id}`, playerData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const deletePlayer = async (id, token) => {
    try {
        const response = await axios.delete(`${API_URL}/players/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getPlayersByPosition = async (position) => {
    try {
        const response = await axios.get(`${API_URL}/players/position/${position}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getTopPlayers = async (limit = 10) => {
    try {
        const response = await axios.get(`${API_URL}/players/top/${limit}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// Articles API functions
export const getArticles = async (params = {}) => {
    try {
        const queryString = new URLSearchParams(params).toString();
        const response = await axios.get(`${API_URL}/articles${queryString ? `?${queryString}` : ''}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getArticleBySlug = async (slug) => {
    try {
        const response = await axios.get(`${API_URL}/articles/${slug}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const createArticle = async (articleData, token) => {
    try {
        const response = await axios.post(`${API_URL}/articles`, articleData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const updateArticle = async (id, articleData, token) => {
    try {
        const response = await axios.put(`${API_URL}/articles/${id}`, articleData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const deleteArticle = async (id, token) => {
    try {
        const response = await axios.delete(`${API_URL}/articles/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// Pages API functions
export const getPages = async (params = {}) => {
    try {
        const queryString = new URLSearchParams(params).toString();
        const response = await axios.get(`${API_URL}/pages${queryString ? `?${queryString}` : ''}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getPageBySlug = async (slug) => {
    try {
        const response = await axios.get(`${API_URL}/pages/${slug}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const createPage = async (pageData, token) => {
    try {
        const response = await axios.post(`${API_URL}/pages`, pageData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const updatePage = async (id, pageData, token) => {
    try {
        const response = await axios.put(`${API_URL}/pages/${id}`, pageData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const deletePage = async (id, token) => {
    try {
        const response = await axios.delete(`${API_URL}/pages/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// Media API functions
export const getMedia = async (params = {}) => {
    try {
        const queryString = new URLSearchParams(params).toString();
        const response = await axios.get(`${API_URL}/media${queryString ? `?${queryString}` : ''}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const uploadMedia = async (formData, token) => {
    try {
        const response = await axios.post(`${API_URL}/media`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const deleteMedia = async (id, token) => {
    try {
        const response = await axios.delete(`${API_URL}/media/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// Campaigns API functions
export const getCampaigns = async (token, params = {}) => {
    try {
        const queryString = new URLSearchParams(params).toString();
        const response = await axios.get(`${API_URL}/campaigns${queryString ? `?${queryString}` : ''}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getCampaignById = async (id, token) => {
    try {
        const response = await axios.get(`${API_URL}/campaigns/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const createCampaign = async (campaignData, token) => {
    try {
        const response = await axios.post(`${API_URL}/campaigns`, campaignData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const updateCampaign = async (id, campaignData, token) => {
    try {
        const response = await axios.put(`${API_URL}/campaigns/${id}`, campaignData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const deleteCampaign = async (id, token) => {
    try {
        const response = await axios.delete(`${API_URL}/campaigns/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// StarPath API functions
export const getStarPathRoute = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/starpath/route`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getStarPathProgress = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/starpath/progress`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const trainStarPath = async (nodeId, activity, token) => {
    try {
        const response = await axios.post(`${API_URL}/starpath/train`, {
            nodeId,
            activity
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const levelUpStarPath = async (nodeId, token) => {
    try {
        const response = await axios.post(`${API_URL}/starpath/level-up`, {
            nodeId
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getStarPathAchievements = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/starpath/achievements`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getStarPathLeaderboard = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/starpath/leaderboard`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// Recruiting API functions
export const getRecruitingMatches = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/recruiting/matches`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getRecruitingConversations = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/recruiting/conversations`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getRecruitingAnalytics = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/recruiting/analytics`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const sendRecruitingMessage = async (messageData, token) => {
    try {
        const response = await axios.post(`${API_URL}/recruiting/message`, messageData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const updateRecruitingPreferences = async (preferences, token) => {
    try {
        const response = await axios.put(`${API_URL}/recruiting/preferences`, preferences, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getCoaches = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/recruiting/coaches`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const scheduleVisit = async (visitData, token) => {
    try {
        const response = await axios.post(`${API_URL}/recruiting/visit`, visitData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getRecruitingTimeline = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/recruiting/timeline`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// User stats API function
export const getUserStats = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/users/stats`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// Ranking API functions
export const getGARRanks = async (params = {}) => {
    try {
        const response = await axios.post(`${API_URL}/rankings/gar-ranking`, params);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getPositionRanks = async (position) => {
    try {
        const response = await axios.get(`${API_URL}/rankings/position/${position}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getTopAthletes = async (limit = 100) => {
    try {
        const response = await axios.get(`${API_URL}/rankings/top-athletes?limit=${limit}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const updateAthleteGAR = async (id, token) => {
    try {
        const response = await axios.put(`${API_URL}/rankings/update-gar/${id}`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};