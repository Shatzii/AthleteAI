import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Admin from '../Admin';

// Mock React Router
const mockUseRouteMatch = jest.fn();
jest.mock('react-router-dom', () => ({
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
  Route: ({ children }) => <div>{children}</div>,
  Switch: ({ children }) => <div>{children}</div>,
  useRouteMatch: () => ({
    path: '/admin',
    url: '/admin'
  }),
}));

// Mock the API functions
jest.mock('../../utils/api', () => ({
  getArticles: jest.fn(),
  getPages: jest.fn(),
  getMedia: jest.fn(),
  getCampaigns: jest.fn(),
  getUserStats: jest.fn(),
}));

import {
  getArticles,
  getPages,
  getMedia,
  getCampaigns,
  getUserStats
} from '../../utils/api';

const mockStats = {
  totalUsers: 150,
  activeUsers: 120,
  totalArticles: 45,
  publishedArticles: 38,
  totalPages: 12,
  totalMedia: 89,
  totalCampaigns: 8,
  activeCampaigns: 5
};

const mockArticles = [
  { _id: '1', title: 'Test Article 1', status: 'published' },
  { _id: '2', title: 'Test Article 2', status: 'draft' }
];

const mockPages = [
  { _id: '1', title: 'Home Page', status: 'published' },
  { _id: '2', title: 'About Page', status: 'published' }
];

const mockMedia = [
  { _id: '1', filename: 'image1.jpg', type: 'image' },
  { _id: '2', filename: 'video1.mp4', type: 'video' }
];

const mockCampaigns = [
  { _id: '1', name: 'Summer Campaign', status: 'active' },
  { _id: '2', name: 'Winter Campaign', status: 'inactive' }
];

describe('Admin Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock all API calls
    getUserStats.mockResolvedValue(mockStats);
    getArticles.mockResolvedValue({ articles: mockArticles });
    getPages.mockResolvedValue({ pages: mockPages });
    getMedia.mockResolvedValue({ media: mockMedia });
    getCampaigns.mockResolvedValue({ campaigns: mockCampaigns });
  });

  test('renders loading state initially', () => {
    render(<Admin />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('renders dashboard with all stats after loading', async () => {
    render(<Admin />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // totalUsers
    });

    // Check all stats are displayed
    expect(screen.getByText('120')).toBeInTheDocument(); // activeUsers
    expect(screen.getByText('45')).toBeInTheDocument(); // totalArticles
    expect(screen.getByText('38')).toBeInTheDocument(); // publishedArticles
    expect(screen.getByText('12')).toBeInTheDocument(); // totalPages
    expect(screen.getByText('89')).toBeInTheDocument(); // totalMedia
    expect(screen.getByText('8')).toBeInTheDocument(); // totalCampaigns
    expect(screen.getByText('5')).toBeInTheDocument(); // activeCampaigns
  });

  test('displays content management sections', async () => {
    render(<Admin />);

    await waitFor(() => {
      expect(screen.getByText('Articles')).toBeInTheDocument();
    });

    // Check that all content sections are present
    expect(screen.getByText('Pages')).toBeInTheDocument();
    expect(screen.getByText('Media Files')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
  });

  test('displays recent articles', async () => {
    render(<Admin />);

    await waitFor(() => {
      expect(screen.getByText('Test Article 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Article 2')).toBeInTheDocument();
  });

  test('displays recent pages', async () => {
    render(<Admin />);

    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });

    expect(screen.getByText('About Page')).toBeInTheDocument();
  });

  test('displays media files', async () => {
    render(<Admin />);

    await waitFor(() => {
      expect(screen.getByText('image1.jpg')).toBeInTheDocument();
    });

    expect(screen.getByText('video1.mp4')).toBeInTheDocument();
  });

  test('displays campaigns', async () => {
    render(<Admin />);

    await waitFor(() => {
      expect(screen.getByText('Summer Campaign')).toBeInTheDocument();
    });

    expect(screen.getByText('Winter Campaign')).toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    getUserStats.mockRejectedValue(new Error('API Error'));

    render(<Admin />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  test('calls all API functions on mount', async () => {
    render(<Admin />);

    await waitFor(() => {
      expect(getUserStats).toHaveBeenCalled();
    });

    expect(getArticles).toHaveBeenCalled();
    expect(getPages).toHaveBeenCalled();
    expect(getMedia).toHaveBeenCalled();
    expect(getCampaigns).toHaveBeenCalled();
  });

  test('navigates between different admin sections', async () => {
    render(<Admin />);

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    // Check that we can navigate to different sections
    const articlesLink = screen.getByText('New Article');
    const pagesLink = screen.getByText('New Page');

    expect(articlesLink).toBeInTheDocument();
    expect(pagesLink).toBeInTheDocument();
  });
});
