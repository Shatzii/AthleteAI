import axios from 'axios';
import {
  getPlayers,
  getArticles,
  getUserStats,
  loginUser,
  registerUser
} from '../api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('API Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'mock-token'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  describe('getPlayers', () => {
    test('makes correct API call and returns data', async () => {
      const mockResponse = {
        data: {
          players: [
            { _id: '1', name: 'John Doe', position: 'QB' }
          ]
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await getPlayers();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/players'
      );
      expect(result).toEqual(mockResponse.data);
    });

    test('handles API errors', async () => {
      const errorMessage = 'Network Error';
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          data: errorMessage
        }
      });

      try {
        await getPlayers();
        fail('Expected function to throw');
      } catch (error) {
        expect(error).toBe(errorMessage);
      }
    });
  });

  describe('getArticles', () => {
    test('makes correct API call with query parameters', async () => {
      const mockResponse = {
        data: {
          articles: [
            { _id: '1', title: 'Test Article', category: 'football' }
          ]
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const params = { category: 'football', status: 'published' };
      const result = await getArticles(params);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/articles?category=football&status=published'
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('loginUser', () => {
    test('makes correct login API call', async () => {
      const mockResponse = {
        data: {
          token: 'new-jwt-token',
          user: { _id: '1', email: 'test@example.com' }
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const credentials = { email: 'test@example.com', password: 'password' };
      const result = await loginUser(credentials);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/users/login',
        credentials
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('registerUser', () => {
    test('makes correct registration API call', async () => {
      const mockResponse = {
        data: {
          token: 'new-jwt-token',
          user: { _id: '1', email: 'newuser@example.com' }
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const userData = {
        email: 'newuser@example.com',
        password: 'password',
        name: 'New User'
      };
      const result = await registerUser(userData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/users/register',
        userData
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getUserStats', () => {
    test('makes correct API call for user statistics', async () => {
      const mockResponse = {
        data: {
          totalUsers: 150,
          activeUsers: 120,
          newUsersThisMonth: 25
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await getUserStats('mock-token');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/users/stats',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
      expect(result).toEqual(mockResponse.data);
    });
  });
});
