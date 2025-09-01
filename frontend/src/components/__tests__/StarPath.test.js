import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock useAuth BEFORE importing the component
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: 'test-user-id' },
    token: 'test-token'
  }),
}));

// Mock the API functions
jest.mock('../../utils/api', () => ({
  getStarPathRoute: jest.fn(),
  getStarPathProgress: jest.fn(),
  trainStarPath: jest.fn(),
}));

import StarPath from '../StarPath';
import {
  getStarPathRoute,
  getStarPathProgress,
  trainStarPath
} from '../../utils/api';

const mockStarPathData = [
  {
    id: 'ball_control',
    name: 'Ball Control Mastery',
    description: 'Master fundamental ball handling techniques',
    currentLevel: 3,
    maxLevel: 5,
    totalXp: 750,
    requiredXp: 1000,
    isUnlocked: true,
    category: 'technical'
  },
  {
    id: 'agility_training',
    name: 'Agility & Speed',
    description: 'Develop explosive movement and changes of direction',
    currentLevel: 2,
    maxLevel: 5,
    totalXp: 450,
    requiredXp: 600,
    isUnlocked: true,
    category: 'physical'
  }
];

const mockUserProgress = {
  totalXp: 1200,
  currentTier: 'Bronze',
  achievements: 5,
  currentStreak: 7
};

describe('StarPath Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock API responses
    getStarPathRoute.mockResolvedValue({ starPath: mockStarPathData });
    getStarPathProgress.mockResolvedValue(mockUserProgress);
  });

  test('renders loading state initially', () => {
    render(<StarPath />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('renders StarPath hub after loading', async () => {
    render(<StarPath />);

    await waitFor(() => {
      expect(screen.getByText('StarPath Hub')).toBeInTheDocument();
    });

    expect(screen.getByText('Your Athletic Journey')).toBeInTheDocument();
  });

  test('displays user progress stats', async () => {
    render(<StarPath />);

    await waitFor(() => {
      expect(screen.getByText('1200')).toBeInTheDocument(); // totalXp
    });

    expect(screen.getByText('Bronze')).toBeInTheDocument(); // currentTier
    expect(screen.getByText('5')).toBeInTheDocument(); // achievements
    expect(screen.getByText('7')).toBeInTheDocument(); // currentStreak
  });

  test('displays StarPath nodes', async () => {
    render(<StarPath />);

    await waitFor(() => {
      expect(screen.getByText('Ball Control Mastery')).toBeInTheDocument();
    });

    expect(screen.getByText('Agility & Speed')).toBeInTheDocument();
    expect(screen.getByText('Master fundamental ball handling techniques')).toBeInTheDocument();
  });

  test('displays skill categories', async () => {
    render(<StarPath />);

    await waitFor(() => {
      expect(screen.getByText('technical')).toBeInTheDocument();
    });

    expect(screen.getByText('physical')).toBeInTheDocument();
  });

  test('shows progress bars for skills', async () => {
    render(<StarPath />);

    await waitFor(() => {
      // Check that progress information is displayed
      expect(screen.getByText('3')).toBeInTheDocument(); // current level for ball control
      expect(screen.getByText('5')).toBeInTheDocument(); // max level
    });
  });

  test('handles back navigation', async () => {
    render(<StarPath />);

    await waitFor(() => {
      expect(screen.getByText('StarPath Hub')).toBeInTheDocument();
    });

    const backButton = screen.getByText('← Back to Home');
    fireEvent.click(backButton);

    expect(mockHistoryPush).toHaveBeenCalledWith('/');
  });

  test('calls API functions on mount', async () => {
    render(<StarPath />);

    await waitFor(() => {
      expect(getStarPathRoute).toHaveBeenCalled();
    });

    expect(getStarPathProgress).toHaveBeenCalled();
  });

  test('handles API errors gracefully', async () => {
    getStarPathRoute.mockRejectedValue(new Error('API Error'));

    render(<StarPath />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  test('displays motivational content', async () => {
    render(<StarPath />);

    await waitFor(() => {
      expect(screen.getByText('Your Athletic Journey')).toBeInTheDocument();
    });

    // Check for motivational messaging
    expect(screen.getByText(/Complete your GAR analysis/i)).toBeInTheDocument();
  });

  test('shows training pathways', async () => {
    render(<StarPath />);

    await waitFor(() => {
      expect(screen.getByText('Athletic Development')).toBeInTheDocument();
    });

    expect(screen.getByText('AI-powered training and performance analysis')).toBeInTheDocument();
  });
});
