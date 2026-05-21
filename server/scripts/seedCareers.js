const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const CareerPath = require('../models/CareerPath');

const sampleCareers = [
  {
    title: 'Machine Learning Engineer',
    description: 'Design, build and deploy ML models and AI systems that power intelligent applications at scale.',
    industry: 'Technology',
    subIndustry: 'Artificial Intelligence',
    tags: ['AI', 'machine learning', 'python', 'data', 'neural networks'],
    roles: [
      { title: 'Junior ML Engineer', level: 'junior', description: 'Implement and fine-tune existing ML models' },
      { title: 'ML Engineer', level: 'mid', description: 'Build production ML pipelines and APIs' },
      { title: 'Senior ML Engineer', level: 'senior', description: 'Lead ML architecture and research' },
      { title: 'Principal ML Engineer', level: 'principal', description: 'Set technical direction for ML systems' },
    ],
    entryRoleTitle: 'Junior ML Engineer',
    seniorRoleTitle: 'Principal ML Engineer',
    requiredDegrees: [
      { level: 'bachelor', field: 'Computer Science, Mathematics, or Statistics', isRequired: false },
      { level: 'master', field: 'Machine Learning or AI', isRequired: false, alternatives: ['Strong portfolio acceptable'] },
    ],
    degreeMandatory: false,
    certifications: [
      { name: 'TensorFlow Developer Certificate', issuer: 'Google', difficultyLevel: 'intermediate', estimatedPrepTime: '3 months', cost: 100 },
      { name: 'AWS Certified Machine Learning – Specialty', issuer: 'Amazon', difficultyLevel: 'advanced', estimatedPrepTime: '6 months', cost: 300 },
      { name: 'Deep Learning Specialization', issuer: 'Coursera / DeepLearning.AI', difficultyLevel: 'intermediate', estimatedPrepTime: '4 months', cost: 49, isRequired: false },
    ],
    requiredSkills: [
      { name: 'Python', category: 'language', importance: 5, proficiencyRequired: 4 },
      { name: 'Machine Learning', category: 'domain', importance: 5, proficiencyRequired: 4 },
      { name: 'TensorFlow', category: 'framework', importance: 4, proficiencyRequired: 3 },
      { name: 'SQL', category: 'language', importance: 3, proficiencyRequired: 3 },
      { name: 'Statistics', category: 'domain', importance: 4, proficiencyRequired: 3 },
    ],
    niceToHaveSkills: ['PyTorch', 'Kubernetes', 'Spark', 'MLflow', 'Rust'],
    salaryPotential: {
      entryLevel: { min: 80000, max: 110000 },
      midLevel: { min: 110000, max: 160000 },
      seniorLevel: { min: 160000, max: 250000 },
      currency: 'USD', region: 'USA',
    },
    demandLevel: 'very-high',
    growthRate: 28,
    jobOpenings: 75000,
    futureOutlook: 'booming',
    automationRisk: 10,
    workType: 'hybrid',
    pathwaySteps: [
      { step: 1, title: 'Python & Math Foundations', durationMonths: 3, description: 'Master Python, linear algebra, calculus, and probability.', milestones: ['Complete Python course', 'Finish Khan Academy linear algebra'] },
      { step: 2, title: 'ML Core Concepts', durationMonths: 3, description: 'Learn supervised, unsupervised learning, and model evaluation.', milestones: ['Complete Andrew Ng ML course', 'Build 3 regression/classification projects'] },
      { step: 3, title: 'Deep Learning & Frameworks', durationMonths: 3, description: 'Master TensorFlow/PyTorch and neural network architectures.', milestones: ['Earn TensorFlow certificate', 'Build a CNN and RNN project'] },
      { step: 4, title: 'Production & Portfolio', durationMonths: 3, description: 'Deploy ML models, build portfolio, apply to roles.', milestones: ['Deploy model on AWS SageMaker', 'Publish 2 Kaggle notebooks', 'Apply to 20+ roles'] },
    ],
  },
  {
    title: 'Full Stack Developer',
    description: 'Build end-to-end web applications, working across both frontend UI and backend APIs.',
    industry: 'Technology',
    subIndustry: 'Software Development',
    tags: ['web', 'javascript', 'react', 'node', 'frontend', 'backend', 'development'],
    roles: [
      { title: 'Junior Full Stack Developer', level: 'junior' },
      { title: 'Full Stack Developer', level: 'mid' },
      { title: 'Senior Full Stack Developer', level: 'senior' },
      { title: 'Full Stack Tech Lead', level: 'lead' },
    ],
    entryRoleTitle: 'Junior Full Stack Developer',
    seniorRoleTitle: 'Full Stack Tech Lead',
    requiredDegrees: [
      { level: 'bachelor', field: 'Computer Science or Information Technology', isRequired: false },
      { level: 'bootcamp', field: 'Full Stack Web Development', isRequired: false },
    ],
    degreeMandatory: false,
    certifications: [
      { name: 'AWS Certified Developer – Associate', issuer: 'Amazon', difficultyLevel: 'intermediate', estimatedPrepTime: '3 months', cost: 300 },
      { name: 'Meta Front-End Developer Certificate', issuer: 'Meta / Coursera', difficultyLevel: 'beginner', estimatedPrepTime: '7 months', cost: 49 },
    ],
    requiredSkills: [
      { name: 'JavaScript', category: 'language', importance: 5, proficiencyRequired: 4 },
      { name: 'React', category: 'framework', importance: 5, proficiencyRequired: 4 },
      { name: 'Node.js', category: 'framework', importance: 4, proficiencyRequired: 3 },
      { name: 'SQL', category: 'language', importance: 3, proficiencyRequired: 3 },
      { name: 'HTML/CSS', category: 'language', importance: 4, proficiencyRequired: 4 },
    ],
    niceToHaveSkills: ['TypeScript', 'Docker', 'GraphQL', 'Redis', 'Next.js'],
    salaryPotential: {
      entryLevel: { min: 60000, max: 85000 },
      midLevel: { min: 85000, max: 130000 },
      seniorLevel: { min: 130000, max: 200000 },
      currency: 'USD', region: 'USA',
    },
    demandLevel: 'very-high',
    growthRate: 23,
    jobOpenings: 180000,
    futureOutlook: 'booming',
    automationRisk: 15,
    workType: 'remote',
    pathwaySteps: [
      { step: 1, title: 'HTML, CSS & JavaScript', durationMonths: 2, description: 'Build the web fundamentals foundation.' },
      { step: 2, title: 'React & Frontend', durationMonths: 2, description: 'Learn React, state management, and responsive UI.' },
      { step: 3, title: 'Backend & Databases', durationMonths: 2, description: 'Master Node.js, Express, and SQL/MongoDB.' },
      { step: 4, title: 'Full Projects & Job Hunt', durationMonths: 2, description: 'Build 3 full-stack projects and apply.' },
    ],
  },
  {
    title: 'Data Analyst',
    description: 'Transform raw data into actionable business insights using statistics, visualization, and analytical tools.',
    industry: 'Analytics',
    subIndustry: 'Business Intelligence',
    tags: ['data', 'analytics', 'SQL', 'Excel', 'visualization', 'business', 'statistics'],
    roles: [
      { title: 'Junior Data Analyst', level: 'junior' },
      { title: 'Data Analyst', level: 'mid' },
      { title: 'Senior Data Analyst', level: 'senior' },
      { title: 'Lead Data Analyst', level: 'lead' },
    ],
    entryRoleTitle: 'Junior Data Analyst',
    seniorRoleTitle: 'Lead Data Analyst',
    requiredDegrees: [
      { level: 'bachelor', field: 'Statistics, Mathematics, Business, or Computer Science', isRequired: true },
    ],
    degreeMandatory: true,
    certifications: [
      { name: 'Google Data Analytics Certificate', issuer: 'Google / Coursera', difficultyLevel: 'beginner', estimatedPrepTime: '6 months', cost: 49, isRequired: false },
      { name: 'Microsoft Power BI Data Analyst', issuer: 'Microsoft', difficultyLevel: 'intermediate', estimatedPrepTime: '3 months', cost: 165 },
    ],
    requiredSkills: [
      { name: 'SQL', category: 'language', importance: 5, proficiencyRequired: 4 },
      { name: 'Data Analysis', category: 'domain', importance: 5, proficiencyRequired: 4 },
      { name: 'Python', category: 'language', importance: 3, proficiencyRequired: 2 },
      { name: 'Communication', category: 'soft', importance: 4, proficiencyRequired: 3 },
      { name: 'Statistics', category: 'domain', importance: 4, proficiencyRequired: 3 },
    ],
    niceToHaveSkills: ['Tableau', 'Power BI', 'R', 'Looker', 'dbt'],
    salaryPotential: {
      entryLevel: { min: 50000, max: 70000 },
      midLevel: { min: 70000, max: 100000 },
      seniorLevel: { min: 100000, max: 140000 },
      currency: 'USD', region: 'USA',
    },
    demandLevel: 'high',
    growthRate: 18,
    jobOpenings: 110000,
    futureOutlook: 'growing',
    automationRisk: 25,
    workType: 'hybrid',
    pathwaySteps: [
      { step: 1, title: 'SQL & Excel Mastery', durationMonths: 2, description: 'Learn SQL queries and Excel pivot tables.' },
      { step: 2, title: 'Statistics & Python Basics', durationMonths: 2, description: 'Understand stats and learn pandas/numpy.' },
      { step: 3, title: 'Data Visualization', durationMonths: 2, description: 'Master Tableau or Power BI dashboards.' },
      { step: 4, title: 'Business Projects & Certification', durationMonths: 2, description: 'Earn Google certificate and apply.' },
    ],
  },
  {
    title: 'UX/UI Designer',
    description: 'Create intuitive, beautiful digital experiences by combining user research, design thinking, and visual craft.',
    industry: 'Design',
    subIndustry: 'Product Design',
    tags: ['design', 'UX', 'UI', 'figma', 'user research', 'creative', 'product'],
    roles: [
      { title: 'Junior UX Designer', level: 'junior' },
      { title: 'UX/UI Designer', level: 'mid' },
      { title: 'Senior Product Designer', level: 'senior' },
      { title: 'Design Lead', level: 'lead' },
    ],
    entryRoleTitle: 'Junior UX Designer',
    seniorRoleTitle: 'Design Lead',
    requiredDegrees: [
      { level: 'bachelor', field: 'Design, HCI, Psychology, or any field', isRequired: false },
      { level: 'bootcamp', field: 'UX Design Bootcamp', isRequired: false },
    ],
    degreeMandatory: false,
    certifications: [
      { name: 'Google UX Design Certificate', issuer: 'Google / Coursera', difficultyLevel: 'beginner', estimatedPrepTime: '6 months', cost: 49 },
      { name: 'Figma Professional Certification', issuer: 'Figma', difficultyLevel: 'intermediate', estimatedPrepTime: '2 months', cost: 0 },
    ],
    requiredSkills: [
      { name: 'UX Design', category: 'domain', importance: 5, proficiencyRequired: 4 },
      { name: 'Figma', category: 'tool', importance: 5, proficiencyRequired: 4 },
      { name: 'Communication', category: 'soft', importance: 4, proficiencyRequired: 4 },
      { name: 'Problem Solving', category: 'soft', importance: 4, proficiencyRequired: 3 },
    ],
    niceToHaveSkills: ['HTML/CSS', 'Protopie', 'Adobe XD', 'User Testing', 'Motion Design'],
    salaryPotential: {
      entryLevel: { min: 55000, max: 75000 },
      midLevel: { min: 75000, max: 110000 },
      seniorLevel: { min: 110000, max: 170000 },
      currency: 'USD', region: 'USA',
    },
    demandLevel: 'high',
    growthRate: 16,
    jobOpenings: 90000,
    futureOutlook: 'growing',
    automationRisk: 20,
    workType: 'hybrid',
    pathwaySteps: [
      { step: 1, title: 'Design Fundamentals', durationMonths: 2, description: 'Learn design principles, colour theory, typography.' },
      { step: 2, title: 'UX Research & Wireframing', durationMonths: 2, description: 'User interviews, personas, low-fidelity wireframes.' },
      { step: 3, title: 'High-Fidelity Design & Figma', durationMonths: 2, description: 'Build pixel-perfect prototypes in Figma.' },
      { step: 4, title: 'Portfolio & Job Applications', durationMonths: 2, description: 'Create 3 case studies and apply to roles.' },
    ],
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/career_pathway_db');
    console.log('✅ Connected to MongoDB');

    // Drop the collection entirely to clear stuck indexes
    try {
      await mongoose.connection.db.dropCollection('careerpaths');
      console.log('🗑️  Dropped careerpaths collection');
    } catch (e) { /* collection may not exist yet */ }

    // Add auto-generated slug to each career
    const careersWithSlug = sampleCareers.map(c => ({
      ...c,
      slug: c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    }));

    const inserted = await CareerPath.insertMany(careersWithSlug);
    console.log(`🌱 Seeded ${inserted.length} career paths:`);
    inserted.forEach(c => console.log(`   ✓ ${c.title}`));

    await mongoose.connection.close();
    console.log('✅ Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seed();

