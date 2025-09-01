const mongoose = require('mongoose');
const Player = require('./models/playerModel');

const samplePlayers = [
  {
    name: "Marcus Johnson",
    position: "QB",
    team: "Alabama Crimson Tide",
    school: "University of Alabama",
    year: "Junior",
    height: "6'2\"",
    weight: 215,
    garScore: 92,
    stars: 5,
    stats: {
      passingYards: 3200,
      touchdowns: 28,
      interceptions: 8
    },
    achievements: ["Heisman Finalist 2024", "SEC Player of the Year", "Bowl Game MVP"]
  },
  {
    name: "Jamal Williams",
    position: "RB",
    team: "Georgia Bulldogs",
    school: "University of Georgia",
    year: "Senior",
    height: "5'11\"",
    weight: 205,
    garScore: 89,
    stars: 4,
    stats: {
      rushingYards: 1850,
      touchdowns: 22,
      receptions: 45
    },
    achievements: ["Doak Walker Award Winner", "SEC Offensive Player of the Year"]
  },
  {
    name: "Tyler Thompson",
    position: "WR",
    team: "Ohio State Buckeyes",
    school: "Ohio State University",
    year: "Sophomore",
    height: "6'1\"",
    weight: 190,
    garScore: 87,
    stars: 4,
    stats: {
      receivingYards: 1450,
      receptions: 95,
      touchdowns: 15
    },
    achievements: ["Big Ten Freshman of the Year", "All-Big Ten First Team"]
  },
  {
    name: "Derek Patterson",
    position: "TE",
    team: "Clemson Tigers",
    school: "Clemson University",
    year: "Junior",
    height: "6'5\"",
    weight: 245,
    garScore: 85,
    stars: 4,
    stats: {
      receivingYards: 850,
      receptions: 65,
      touchdowns: 8
    },
    achievements: ["ACC Academic Honor Roll", "All-ACC Second Team"]
  },
  {
    name: "Carlos Rodriguez",
    position: "OL",
    team: "USC Trojans",
    school: "University of Southern California",
    year: "Senior",
    height: "6'4\"",
    weight: 310,
    garScore: 83,
    stars: 3,
    stats: {
      // OL stats are more about blocking performance
    },
    achievements: ["All-Pac-12 First Team", "Senior Team Captain"]
  },
  {
    name: "Brandon Mitchell",
    position: "DL",
    team: "LSU Tigers",
    school: "Louisiana State University",
    year: "Junior",
    height: "6'3\"",
    weight: 285,
    garScore: 88,
    stars: 4,
    stats: {
      tackles: 85,
      sacks: 12,
      tacklesForLoss: 18
    },
    achievements: ["SEC Defensive Player of the Year", "All-SEC First Team"]
  },
  {
    name: "Jordan Davis",
    position: "LB",
    team: "Florida Gators",
    school: "University of Florida",
    year: "Senior",
    height: "6'1\"",
    weight: 230,
    garScore: 86,
    stars: 4,
    stats: {
      tackles: 120,
      sacks: 8,
      interceptions: 3
    },
    achievements: ["Butkus Award Finalist", "All-SEC First Team"]
  },
  {
    name: "Kevin Brooks",
    position: "CB",
    team: "Texas Longhorns",
    school: "University of Texas",
    year: "Sophomore",
    height: "6'0\"",
    weight: 185,
    garScore: 84,
    stars: 4,
    stats: {
      tackles: 60,
      interceptions: 5,
      passBreakups: 12
    },
    achievements: ["All-Big 12 Freshman Team", "Jim Thorpe Award Watch List"]
  },
  {
    name: "Alex Turner",
    position: "S",
    team: "Notre Dame Fighting Irish",
    school: "University of Notre Dame",
    year: "Junior",
    height: "6'1\"",
    weight: 205,
    garScore: 82,
    stars: 3,
    stats: {
      tackles: 95,
      interceptions: 4,
      passBreakups: 8
    },
    achievements: ["All-ACC Second Team", "Academic All-American"]
  },
  {
    name: "Ryan Foster",
    position: "K",
    team: "Oklahoma Sooners",
    school: "University of Oklahoma",
    year: "Senior",
    height: "5'11\"",
    weight: 185,
    garScore: 78,
    stars: 3,
    stats: {
      fieldGoalsMade: 18,
      fieldGoalsAttempted: 22,
      extraPointsMade: 45,
      extraPointsAttempted: 46
    },
    achievements: ["All-Big 12 First Team", "Lou Groza Award Watch List"]
  },
  {
    name: "Michael Chen",
    position: "P",
    team: "Michigan Wolverines",
    school: "University of Michigan",
    year: "Junior",
    height: "6'2\"",
    weight: 195,
    garScore: 76,
    stars: 3,
    stats: {
      punts: 55,
      puntYards: 2450,
      puntAverage: 44.5
    },
    achievements: ["All-Big Ten Second Team", "Ray Guy Award Watch List"]
  },
  {
    name: "Sarah Johnson",
    position: "QB",
    team: "Stanford Cardinal",
    school: "Stanford University",
    year: "Senior",
    height: "5'10\"",
    weight: 175,
    garScore: 85,
    stars: 4,
    stats: {
      passingYards: 2850,
      touchdowns: 24,
      interceptions: 6
    },
    achievements: ["Pac-12 Player of the Year", "All-Pac-12 First Team"]
  }
];

const seedPlayers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/go4it', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Clear existing players
    await Player.deleteMany({});
    console.log('Cleared existing players');

    // Insert sample players
    const players = await Player.insertMany(samplePlayers);
    console.log(`Seeded ${players.length} players`);

    // Calculate GAR scores for all players
    for (const player of players) {
      player.calculateGAR(player.stats);
      await player.save();
    }

    console.log('Updated GAR scores for all players');
    console.log('Seeding completed successfully');

  } catch (error) {
    console.error('Error seeding players:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seed function
seedPlayers();
