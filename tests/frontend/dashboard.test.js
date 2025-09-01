import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from '../../frontend/src/components/Dashboard';

describe('Dashboard Component', () => {
    test('renders dashboard title', () => {
        render(<Dashboard />);
        const titleElement = screen.getByText(/Performance Dashboard/i);
        expect(titleElement).toBeInTheDocument();
    });

    test('renders performance metrics', () => {
        render(<Dashboard />);
        const metricElements = screen.getAllByText(/[\d]+/); // Assuming metrics are numbers
        expect(metricElements.length).toBeGreaterThan(0);
    });

    test('renders recommended training programs', () => {
        render(<Dashboard />);
        const programTitleElement = screen.getByText(/Recommended Training Programs/i);
        expect(programTitleElement).toBeInTheDocument();
    });

    test('renders AI insights section', () => {
        render(<Dashboard />);
        const aiInsightsElement = screen.getByText(/AI-Powered Performance Insights/i);
        expect(aiInsightsElement).toBeInTheDocument();
    });
});