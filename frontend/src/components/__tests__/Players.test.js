import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Players from '../Players';

// Mock the API functions
jest.mock('../../utils/api', () => ({
  getPlayers: jest.fn(),
}));

import { getPlayers } from '../../utils/api';

const mockPlayers = [
  {
    _id: '1',
    name: 'John Doe',
    position: 'Quarterback',
    school: 'Test University',
    stats: { passingYards: 2500, touchdowns: 25 }
  },
  {
    _id: '2',
    name: 'Jane Smith',
    position: 'Wide Receiver',
    school: 'Another University',
    stats: { receivingYards: 1200, touchdowns: 12 }
  }
];

describe('Players Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    getPlayers.mockResolvedValue([]);

    render(<Players />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('renders players list after loading', async () => {
    getPlayers.mockResolvedValue(mockPlayers);

    render(<Players />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Quarterback')).toBeInTheDocument();
    expect(screen.getByText('Wide Receiver')).toBeInTheDocument();
  });

  test('handles API error gracefully', async () => {
    getPlayers.mockRejectedValue(new Error('API Error'));

    render(<Players />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Players')).toBeInTheDocument();
    });
  });

  test('retry button calls API again', async () => {
    getPlayers.mockRejectedValueOnce(new Error('API Error'));
    getPlayers.mockResolvedValueOnce(mockPlayers);

    render(<Players />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Players')).toBeInTheDocument();
    });

    const retryButton = screen.getByText(/retry/i);
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(getPlayers).toHaveBeenCalledTimes(2);
  });
});
