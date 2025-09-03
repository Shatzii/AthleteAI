const mongoose = require('mongoose');

// Mock database for development
let mockDB = {
    players: [],
    isConnected: false
};

const connectDB = async () => {
    try {
        // For development, use mock database instead of MongoDB
        if (process.env.NODE_ENV !== 'production') {
            console.log('🧪 Using mock database for development');
            mockDB.isConnected = true;

            // Initialize with sample data
            initializeMockData();

            return mockDB;
        }

        // Production: Use real MongoDB
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferCommands: false,
            bufferMaxEntries: 0,
            maxIdleTimeMS: 30000,
            family: 4,
            minPoolSize: 2,
        };

        if (process.env.NODE_ENV === 'production') {
            options.ssl = true;
            options.sslValidate = true;
            options.sslCA = process.env.MONGO_SSL_CA;
        }

        await mongoose.connect(process.env.MONGO_URI, options);
        console.log('✅ MongoDB connected successfully with optimized settings');

        mongoose.connection.on('connected', () => {
            console.log('📊 Mongoose connected to MongoDB');
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('📡 Mongoose disconnected from MongoDB');
        });

        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('🔄 MongoDB connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Database connection error:', error);
        // For development, continue with mock data even if connection fails
        if (process.env.NODE_ENV !== 'production') {
            console.log('🧪 Falling back to mock database');
            mockDB.isConnected = true;
            initializeMockData();
            return mockDB;
        }
        throw error;
    }
};

function initializeMockData() {
    mockDB.players = [
        {
            _id: '1',
            name: 'John Smith',
            position: 'QB',
            school: 'Alabama',
            year: 'Junior',
            height: "6'2\"",
            weight: 210,
            garScore: 92,
            stars: 5,
            sport: 'football',
            recruitingData: {
                source: 'rivals.com',
                rating: 95,
                location: 'Texas, USA'
            },
            stats: {
                passingYards: 2850,
                rushingYards: 450,
                touchdowns: 28,
                tackles: 0,
                sacks: 0,
                interceptions: 8
            },
            achievements: ['State Champion', 'All-American', 'Team Captain'],
            socialMedia: {
                twitter: '@johnsmithqb',
                instagram: '@johnsmithfootball'
            },
            highlights: [
                { title: 'Game Winning TD', url: 'https://example.com/highlight1', views: 15000 }
            ]
        },
        {
            _id: '2',
            name: 'Mike Johnson',
            position: 'RB',
            school: 'Ohio State',
            year: 'Sophomore',
            height: "5'11\"",
            weight: 195,
            garScore: 88,
            stars: 4,
            sport: 'football',
            recruitingData: {
                source: '247sports.com',
                rating: 90,
                location: 'Florida, USA'
            },
            stats: {
                passingYards: 0,
                rushingYards: 1250,
                receivingYards: 350,
                touchdowns: 15,
                tackles: 25,
                sacks: 0,
                interceptions: 0
            },
            achievements: ['1000+ rushing yards', 'Team MVP'],
            socialMedia: {
                twitter: '@mikejohnsonrb',
                instagram: '@mikejohnsonfootball'
            }
        },
        {
            _id: '3',
            name: 'Sarah Davis',
            position: 'WR',
            school: 'USC',
            year: 'Freshman',
            height: "5'8\"",
            weight: 165,
            garScore: 85,
            stars: 4,
            sport: 'football',
            recruitingData: {
                source: 'rivals.com',
                rating: 88,
                location: 'California, USA'
            },
            stats: {
                passingYards: 0,
                rushingYards: 50,
                receivingYards: 850,
                touchdowns: 12,
                tackles: 15,
                sacks: 0,
                interceptions: 0
            },
            achievements: ['All-State', 'Scholar Athlete'],
            socialMedia: {
                twitter: '@sarahdaviswr',
                instagram: '@sarahdavisfootball'
            }
        },
        {
            _id: '4',
            name: 'Tom Wilson',
            position: 'OL',
            school: 'Texas',
            year: 'Senior',
            height: "6'5\"",
            weight: 285,
            garScore: 78,
            stars: 3,
            sport: 'football',
            recruitingData: {
                source: '247sports.com',
                rating: 82,
                location: 'Texas, USA'
            },
            stats: {
                passingYards: 0,
                rushingYards: 0,
                receivingYards: 0,
                touchdowns: 0,
                tackles: 45,
                sacks: 2,
                interceptions: 0
            },
            achievements: ['Academic All-Big12', 'Team Captain'],
            socialMedia: {
                twitter: '@tomwilsonol',
                instagram: '@tomwilsonfootball'
            }
        },
        {
            _id: '5',
            name: 'Chris Brown',
            position: 'LB',
            school: 'LSU',
            year: 'Junior',
            height: "6'1\"",
            weight: 225,
            garScore: 82,
            stars: 4,
            sport: 'football',
            recruitingData: {
                source: 'rivals.com',
                rating: 85,
                location: 'Louisiana, USA'
            },
            stats: {
                passingYards: 0,
                rushingYards: 0,
                receivingYards: 0,
                touchdowns: 2,
                tackles: 85,
                sacks: 8,
                interceptions: 3
            },
            achievements: ['Butkus Award Watch List', 'All-SEC'],
            socialMedia: {
                twitter: '@chrisbrownlb',
                instagram: '@chrisbrownfootball'
            }
        }
    ];
}

module.exports = { connectDB, mockDB };