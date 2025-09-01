const mongoose = require('mongoose');
const Article = require('./models/articleModel');
const Page = require('./models/pageModel');
const Campaign = require('./models/campaignModel');
const User = require('./models/userModel');

require('dotenv').config();

const seedCMSData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/go4it');
    console.log('Connected to MongoDB');

    // Create admin user if doesn't exist
    let adminUser = await User.findOne({ email: 'admin@go4it.com' });
    if (!adminUser) {
      adminUser = new User({
        username: 'admin',
        email: 'admin@go4it.com',
        password: 'admin123', // In production, hash this password
        role: 'admin'
      });
      await adminUser.save();
      console.log('Admin user created');
    }

    // Create sample articles
    const sampleArticles = [
      {
        title: 'Brazilian Football Revolution: Neymar\'s Legacy and Future Stars',
        slug: 'brazilian-football-revolution-neymar-legacy',
        content: 'Exploring how Brazilian football continues to dominate global soccer with emerging talents and tactical innovations. The Brazilian football system has long been the envy of the world, producing players like Pelé, Ronaldo, and Neymar. This article examines the current state of Brazilian youth development and the next generation of stars.',
        excerpt: 'Exploring how Brazilian football continues to dominate global soccer with emerging talents and tactical innovations.',
        category: 'football',
        tags: ['Brazil', 'Neymar', 'Youth Development', 'International'],
        author: adminUser._id,
        status: 'published',
        featuredImage: '/uploads/sample-brazil.jpg',
        seoTitle: 'Brazilian Football Revolution | Go4It Sports',
        seoDescription: 'Discover Brazil\'s football legacy and emerging talents shaping the future of global soccer.',
        seoKeywords: ['Brazilian football', 'Neymar', 'soccer', 'youth development']
      },
      {
        title: 'European Basketball League Expansion: New Markets, New Challenges',
        slug: 'european-basketball-league-expansion',
        content: 'Analysis of how European basketball is expanding into new international markets and adapting to global competition. The EuroLeague and other European competitions are facing new challenges as basketball grows worldwide.',
        excerpt: 'Analysis of how European basketball is expanding into new international markets and adapting to global competition.',
        category: 'basketball',
        tags: ['Europe', 'Expansion', 'Global Basketball', 'EuroLeague'],
        author: adminUser._id,
        status: 'published',
        featuredImage: '/uploads/sample-europe.jpg',
        seoTitle: 'European Basketball Expansion | Go4It Sports',
        seoDescription: 'Explore how European basketball is adapting to global competition and new markets.',
        seoKeywords: ['European basketball', 'EuroLeague', 'global expansion', 'basketball']
      },
      {
        title: 'Asian Baseball\'s Rise: From Japan to the World Stage',
        slug: 'asian-baseball-rise-japan-world',
        content: 'The growing influence of Asian baseball and its impact on international baseball development. Japan, South Korea, and Taiwan continue to produce world-class talent and challenge traditional baseball powers.',
        excerpt: 'The growing influence of Asian baseball and its impact on international baseball development.',
        category: 'baseball',
        tags: ['Asia', 'Japan', 'International Baseball', 'MLB'],
        author: adminUser._id,
        status: 'published',
        featuredImage: '/uploads/sample-asia.jpg',
        seoTitle: 'Asian Baseball Rise | Go4It Sports',
        seoDescription: 'Discover how Asian baseball is making its mark on the world stage.',
        seoKeywords: ['Asian baseball', 'Japan', 'international baseball', 'MLB']
      }
    ];

    for (const articleData of sampleArticles) {
      const existingArticle = await Article.findOne({ slug: articleData.slug });
      if (!existingArticle) {
        const article = new Article(articleData);
        await article.save();
        console.log(`Article "${articleData.title}" created`);
      }
    }

    // Create sample page
    const aboutPageData = {
      title: 'About Go4It Sports',
      slug: 'about',
      content: 'Go4It Sports is your premier destination for athletic intelligence and performance analytics. We provide cutting-edge tools and insights to help athletes, coaches, and teams achieve their full potential.',
      template: 'about',
      metaTitle: 'About Us | Go4It Sports Platform',
      metaDescription: 'Learn about Go4It Sports, your premier destination for athletic intelligence and performance analytics.',
      featuredImage: '/uploads/about-hero.jpg',
      sections: [
        {
          type: 'hero',
          title: 'Empowering Athletes Worldwide',
          content: 'We combine advanced analytics, AI-powered coaching, and comprehensive tracking to give athletes the competitive edge they need.',
          image: '/uploads/about-hero.jpg'
        },
        {
          type: 'content',
          title: 'Our Mission',
          content: 'To democratize access to professional-grade athletic intelligence tools and make high-level performance analysis available to athletes at every level.'
        }
      ],
      isPublished: true,
      author: adminUser._id
    };

    const existingPage = await Page.findOne({ slug: 'about' });
    if (!existingPage) {
      const page = new Page(aboutPageData);
      await page.save();
      console.log('About page created');
    }

    // Create sample campaign
    const campaignData = {
      title: 'Student Athlete Recruitment Campaign',
      slug: 'student-athlete-recruitment-2025',
      description: 'Comprehensive campaign to attract high school student athletes to our platform',
      type: 'social',
      status: 'active',
      targetAudience: 'students',
      content: {
        headline: 'Unlock Your Athletic Potential',
        subheadline: 'Join thousands of student athletes using Go4It Sports',
        body: 'Get personalized coaching, track your performance, and connect with college recruiters.',
        callToAction: 'Start Your Journey',
        ctaLink: '/register'
      },
      budget: {
        allocated: 5000,
        spent: 1250,
        currency: 'USD'
      },
      schedule: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        timeZone: 'UTC'
      },
      createdBy: adminUser._id,
      assignedTo: [adminUser._id],
      tags: ['recruitment', 'students', 'social media', '2025']
    };

    const existingCampaign = await Campaign.findOne({ slug: campaignData.slug });
    if (!existingCampaign) {
      const campaign = new Campaign(campaignData);
      await campaign.save();
      console.log('Recruitment campaign created');
    }

    console.log('CMS data seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding CMS data:', error);
    process.exit(1);
  }
};

seedCMSData();
