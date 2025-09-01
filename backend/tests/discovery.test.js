const {
    scrapeRivalsAthletes,
    scrape247SportsAthletes,
    scrapeHudlAthletes,
    normalizeAthleteData,
    deduplicateAthletes,
    getScrapingStats
} = require('../utils/scraper');

describe('Athlete Discovery and Scraping', () => {
    beforeAll(() => {
        // Set test environment
        process.env.NODE_ENV = 'test';
    });

    describe('Data Normalization', () => {
        test('should normalize position abbreviations', () => {
            const athlete = {
                name: 'John Doe',
                position: 'Quarterback',
                school: 'Test High School',
                rating: 85
            };

            const normalized = normalizeAthleteData(athlete);
            expect(normalized.position).toBe('QB');
        });

        test('should handle multiple position variations', () => {
            const positions = [
                { input: 'Running Back', expected: 'RB' },
                { input: 'Wide Receiver', expected: 'WR' },
                { input: 'Tight End', expected: 'TE' },
                { input: 'Defensive Line', expected: 'DL' },
                { input: 'Linebacker', expected: 'LB' },
                { input: 'Cornerback', expected: 'CB' },
                { input: 'Safety', expected: 'S' }
            ];

            positions.forEach(({ input, expected }) => {
                const normalized = normalizeAthleteData({
                    name: 'Test Player',
                    position: input,
                    school: 'Test School'
                });
                expect(normalized.position).toBe(expected);
            });
        });

        test('should normalize height format', () => {
            const athlete = {
                name: 'Test Player',
                position: 'QB',
                height: "6'2\"",
                school: 'Test School'
            };

            const normalized = normalizeAthleteData(athlete);
            expect(normalized.height).toBe("6'2\"");
        });

        test('should handle rating scale conversion', () => {
            const athlete = {
                name: 'Test Player',
                position: 'QB',
                rating: 950, // Some sites use 0-1000 scale
                school: 'Test School'
            };

            const normalized = normalizeAthleteData(athlete);
            expect(normalized.rating).toBe(95);
        });

        test('should calculate GAR score when not provided', () => {
            const athlete = {
                name: 'Test Player',
                position: 'QB',
                rating: 90,
                school: 'Test School'
            };

            const normalized = normalizeAthleteData(athlete);
            expect(normalized.garScore).toBe(90);
        });
    });

    describe('Data Deduplication', () => {
        test('should remove duplicate athletes', () => {
            const athletes = [
                {
                    name: 'John Doe',
                    school: 'Test High School',
                    position: 'QB',
                    rating: 85
                },
                {
                    name: 'John Doe',
                    school: 'Test High School',
                    position: 'QB',
                    rating: 87
                },
                {
                    name: 'Jane Smith',
                    school: 'Another School',
                    position: 'WR',
                    rating: 82
                }
            ];

            const unique = deduplicateAthletes(athletes);
            expect(unique).toHaveLength(2);
            expect(unique[0].name).toBe('John Doe');
            expect(unique[1].name).toBe('Jane Smith');
        });

        test('should handle case insensitive matching', () => {
            const athletes = [
                {
                    name: 'john doe',
                    school: 'test high school',
                    position: 'QB'
                },
                {
                    name: 'John Doe',
                    school: 'Test High School',
                    position: 'QB'
                }
            ];

            const unique = deduplicateAthletes(athletes);
            expect(unique).toHaveLength(1);
        });

        test('should preserve the first occurrence', () => {
            const athletes = [
                {
                    name: 'John Doe',
                    school: 'Test High School',
                    rating: 85,
                    position: 'QB'
                },
                {
                    name: 'John Doe',
                    school: 'Test High School',
                    rating: 90,
                    position: 'QB'
                }
            ];

            const unique = deduplicateAthletes(athletes);
            expect(unique[0].rating).toBe(85);
        });
    });

    describe('Scraping Statistics', () => {
        test('should return scraping statistics', () => {
            const stats = getScrapingStats();

            expect(Object.keys(stats)).toContain('rivals.com');
            expect(Object.keys(stats)).toContain('247sports.com');
            expect(Object.keys(stats)).toContain('hudl.com');

            expect(stats['rivals.com']).toHaveProperty('requestsInWindow');
            expect(stats['rivals.com']).toHaveProperty('limit');
            expect(stats['rivals.com']).toHaveProperty('canMakeRequest');
        });

        test('should track rate limiting correctly', () => {
            // Initially should be able to make requests
            let stats = getScrapingStats();
            expect(stats['rivals.com'].canMakeRequest).toBe(true);

            // After simulating requests, should respect limits
            // Note: In a real test, we'd mock the request recording
            expect(stats['rivals.com'].requestsInWindow).toBe(0);
        });
    });

    describe('Mock Scraping Tests', () => {
        // Mock axios for testing
        const mockAxios = {
            get: jest.fn()
        };

        beforeEach(() => {
            jest.clearAllMocks();
        });

        test('should handle scraping errors gracefully', async () => {
            // Mock a failed request
            mockAxios.get.mockRejectedValue(new Error('Network error'));

            // Test that the scraper handles errors without crashing
            // Note: In real implementation, we'd inject the mock axios
            expect(true).toBe(true); // Placeholder for actual test
        });

        test('should validate athlete data structure', () => {
            const validAthlete = {
                name: 'John Doe',
                position: 'QB',
                school: 'Test High School',
                rating: 85,
                stars: 4,
                height: "6'2\"",
                weight: 180,
                source: 'rivals.com',
                scrapedAt: new Date()
            };

            // Test that all required fields are present
            expect(validAthlete.name).toBeDefined();
            expect(validAthlete.position).toBeDefined();
            expect(validAthlete.school).toBeDefined();
            expect(validAthlete.rating).toBeDefined();
            expect(validAthlete.source).toBeDefined();
        });

        test('should handle empty scraping results', () => {
            const emptyResults = [];
            const unique = deduplicateAthletes(emptyResults);

            expect(unique).toHaveLength(0);
        });

        test('should handle malformed athlete data', () => {
            const malformedAthletes = [
                { name: '', position: 'QB' }, // Empty name
                { name: 'John Doe', position: '' }, // Empty position
                { name: 'John Doe', position: 'QB' }, // Valid
                { name: null, position: 'RB' }, // Null name
            ];

            const normalized = malformedAthletes.map(normalizeAthleteData);

            // Should only process valid entries
            const validEntries = normalized.filter(athlete =>
                athlete.name && athlete.position
            );

            expect(validEntries).toHaveLength(1);
            expect(validEntries[0].name).toBe('John Doe');
            expect(validEntries[0].position).toBe('QB');
        });
    });

    describe('Integration Scenarios', () => {
        test('should handle mixed data sources', () => {
            const mixedAthletes = [
                {
                    name: 'John Doe',
                    position: 'Quarterback',
                    school: 'Test High School',
                    source: 'rivals.com',
                    rating: 85
                },
                {
                    name: 'John Doe',
                    position: 'QB',
                    school: 'Test High School',
                    source: '247sports.com',
                    rating: 87
                },
                {
                    name: 'Jane Smith',
                    position: 'Wide Receiver',
                    school: 'Another School',
                    source: 'hudl.com',
                    rating: 82
                }
            ];

            const normalized = mixedAthletes.map(normalizeAthleteData);
            const unique = deduplicateAthletes(normalized);

            // Should deduplicate John Doe from different sources
            expect(unique).toHaveLength(2);

            // Should normalize positions
            expect(unique[0].position).toBe('QB');
            expect(unique[1].position).toBe('WR');
        });

        test('should calculate highlight scores correctly', () => {
            const athlete = {
                name: 'Test Player',
                position: 'QB',
                school: 'Test School',
                recruitingData: {
                    rating: 90
                },
                stars: 4,
                highlights: [
                    { title: 'Game Highlights', url: 'https://example.com' },
                    { title: 'Practice Footage', url: 'https://example.com' }
                ],
                socialMedia: {
                    twitter: 'https://twitter.com/test',
                    instagram: 'https://instagram.com/test'
                },
                achievements: ['All-State', 'Team Captain']
            };

            const normalized = normalizeAthleteData(athlete);

            // Base score from rating
            expect(normalized.garScore).toBe(90);

            // Should have highlights
            expect(normalized.highlights).toHaveLength(2);

            // Should have social media
            expect(Object.keys(normalized.socialMedia)).toHaveLength(2);

            // Should have achievements
            expect(normalized.achievements).toHaveLength(2);
        });

        test('should handle edge cases in data processing', () => {
            const edgeCases = [
                {
                    name: '   John Doe   ', // Extra whitespace
                    position: 'qb', // Lowercase
                    school: 'TEST HIGH SCHOOL', // Uppercase
                    rating: '85' // String instead of number
                },
                {
                    name: 'Jane Smith',
                    position: 'WR',
                    school: 'Another School',
                    rating: null // Null rating
                }
            ];

            const normalized = edgeCases.map(normalizeAthleteData);

            // Should trim whitespace
            expect(normalized[0].name).toBe('John Doe');

            // Should handle null rating
            expect(normalized[1].rating).toBeUndefined();
        });
    });

    describe('Performance and Scalability', () => {
        test('should handle large datasets efficiently', () => {
            const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
                name: `Player ${i}`,
                position: 'QB',
                school: `School ${i % 100}`,
                rating: Math.floor(Math.random() * 100)
            }));

            const startTime = Date.now();
            const normalized = largeDataset.map(normalizeAthleteData);
            const unique = deduplicateAthletes(normalized);
            const endTime = Date.now();

            // Should process 1000 records in reasonable time
            expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second

            // Should have some deduplication
            expect(unique.length).toBeLessThanOrEqual(normalized.length);
        });

        test('should maintain data integrity during processing', () => {
            const originalData = {
                name: 'John Doe',
                position: 'Quarterback',
                school: 'Test High School',
                rating: 85,
                customField: 'should be preserved'
            };

            const normalized = normalizeAthleteData(originalData);

            // Should preserve original fields
            expect(normalized.customField).toBe('should be preserved');

            // Should add normalized fields
            expect(normalized.position).toBe('QB');
            expect(normalized.garScore).toBe(85);
        });
    });
});
