const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const CareerPath = require('../models/CareerPath');
const sriLankaCareerMarketData = require('../data/sriLankaCareerMarketData');

const withSlug = (career) => ({
  ...career,
  slug: career.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
});

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/career_pathway_db');
    console.log('Connected to MongoDB');

    await CareerPath.deleteMany({});
    const inserted = await CareerPath.insertMany(sriLankaCareerMarketData.map(withSlug));

    console.log(`Seeded ${inserted.length} Sri Lanka-focused career paths:`);
    inserted.forEach(career => {
      const score = career.marketSignal?.sriLankaDemandScore || 'n/a';
      console.log(`- ${career.title} (${score}/100 Sri Lanka demand)`);
    });

    await mongoose.connection.close();
    console.log('Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
