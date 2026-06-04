const express = require('express');
const router = express.Router();
const https = require('https');
const { protect } = require('../middleware/auth');
const Assessment = require('../models/Assessment');

const AI_NAME = 'PathGuide AI';

// ── Gemini REST call ──────────────────────────────────────────────
const callGemini = (contents) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return reject(new Error('GEMINI_API_KEY not set in .env'));

    const body = JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{
          text: `You are "${AI_NAME}", a practical career and commercialization advisor inside the PATHAI Career Intelligence platform.

TONE: Professional, encouraging, concise, and commercially practical.
PERSONALITY: You help students turn measurable skills into Sri Lankan career and project opportunities.

RULES:
1. Focus ONLY on career, technology, skills, and learning paths. Politely decline medical, legal, or unrelated advice.
2. Use Sri Lankan context and LKR salary/cost estimates. Do not use USD.
3. When suggesting learning paths, give ordered steps (e.g., "Step 1: Learn React → Step 2: Node.js → Step 3: MongoDB").
4. Use emojis occasionally but purposefully: 🚀 for opportunities, 💻 for technical skills, 🧠 for learning, 📈 for growth, ⚡ for quick wins.
5. Keep responses concise and scannable — use bullet points or numbered lists when helpful.
6. Reference the user's assessment data (if provided in context) to personalize advice.
7. Sign off longer responses with a motivational micro-note.`,
        }],
      },
      generationConfig: { temperature: 0.75, maxOutputTokens: 600 },
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 429) return reject(new Error('AI is busy right now. Please wait a moment and try again.'));
          if (res.statusCode === 403) return reject(new Error('API key issue. Please check your GEMINI_API_KEY.'));
          if (json.error) return reject(new Error(json.error.message));
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) return reject(new Error('Empty response from Gemini'));
          resolve(text.trim());
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(12000, () => req.destroy(new Error('AI request timed out')));
    req.write(body);
    req.end();
  });
};

// ── Build Gemini-format history from our chat history ─────────────
const buildContents = (history, userMessage, assessmentContext) => {
  const contents = [];

  // Inject assessment context as first AI turn if available
  if (assessmentContext) {
    contents.push({
      role: 'user',
      parts: [{ text: `[SYSTEM CONTEXT] Here is my profile data: ${JSON.stringify(assessmentContext)}` }],
    });
    contents.push({
      role: 'model',
      parts: [{ text: `Got it! I've loaded your profile. I can see your skills, interests, and predicted career paths. I'll personalize my advice accordingly. How can I help you today? 🚀` }],
    });
  }

  // Add conversation history
  for (const msg of history) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    });
  }

  // Add current message
  contents.push({ role: 'user', parts: [{ text: userMessage }] });
  return contents;
};

// ─────────────────────────────────────────────────────────────────────────────
// CAREER CARDS  — 25+ IT roles with beginner-friendly 5-step roadmaps
// roadmap[] uses exactly 5 plain-language steps so the UI can display them
// as a numbered "What to do" list anyone can follow from day one.
// ─────────────────────────────────────────────────────────────────────────────
const localCareerCards = [

  // ── 1. AI / MACHINE LEARNING ENGINEER ────────────────────────────
  {
    keywords: ['machine learning', 'ml engineer', 'ai engineer', 'artificial intelligence', 'computer vision',
               'deep learning', 'neural network', 'nlp', 'large language model', 'llm', 'generative ai'],
    title: 'AI / Machine Learning Engineer',
    salary: 'LKR 130,000–500,000 per month',
    skills: [
      '🐍 Python — for writing data and model code',
      '📊 Mathematics — statistics, probability, and linear algebra basics',
      '🤖 ML libraries — scikit-learn, TensorFlow, or PyTorch',
      '🗄️ Data wrangling — cleaning messy real-world data with pandas',
      '☁️ Model deployment — serving predictions via a simple REST API',
    ],
    roadmap: [
      '📚 Step 1 — LEARN THE BASICS: Complete a free Python course (try "Python for Everybody" on Coursera). Then learn basic statistics: mean, median, standard deviation, and probability.',
      '🔬 Step 2 — UNDERSTAND ML CONCEPTS: Take Andrew Ng\'s free Machine Learning course on Coursera. Learn what "training data", "model", "accuracy", and "overfitting" mean — no need to memorize math formulas yet.',
      '🛠️ Step 3 — BUILD YOUR FIRST MODEL: Download a free Sri Lankan dataset (e.g., weather, crop yield, or hospital records from data.gov.lk). Build a simple prediction model and share the results as a chart.',
      '🚀 Step 4 — LEVEL UP WITH PROJECTS: Build 2 real projects — e.g., a tea leaf quality classifier using photos, or a student exam score predictor. Put them on GitHub with a clear README.',
      '💼 Step 5 — PROVE BUSINESS VALUE: Deploy one model as a free web demo (using Streamlit or Hugging Face Spaces). Calculate how much time or money the prediction could save a Sri Lankan business. Add that LKR number to your portfolio.',
    ],
    project: '🌿 Tea leaf quality grading app — upload a leaf photo, get a grade (A/B/C) and estimated LKR export value. Show "before vs after" accuracy compared to manual grading.',
    certifications: [
      'Machine Learning Specialization — Andrew Ng (Coursera, free to audit)',
      'Python for Everybody — University of Michigan (Coursera)',
      'Fast.ai Practical Deep Learning — fast.ai (completely free)',
    ],
  },

  // ── 2. DATA SCIENTIST ────────────────────────────────────────────
  {
    keywords: ['data scientist', 'data science', 'statistical analysis', 'predictive analytics', 'r programming',
               'hypothesis testing', 'regression', 'clustering', 'feature engineering'],
    title: 'Data Scientist',
    salary: 'LKR 110,000–450,000 per month',
    skills: [
      '🐍 Python or R — the two main data science languages',
      '📈 Statistics — t-tests, regression, correlation, and A/B testing',
      '🧹 Data cleaning — handling missing values and messy data',
      '📊 Data visualization — making charts with Matplotlib or Seaborn',
      '🤖 Machine learning basics — classification, clustering, forecasting',
    ],
    roadmap: [
      '📚 Step 1 — BUILD YOUR MATH FOUNDATION: Study statistics basics for free on Khan Academy — focus on mean, median, distributions, and probability. You do NOT need advanced calculus to start.',
      '🐍 Step 2 — LEARN PYTHON FOR DATA: Complete "Python for Data Science" on freeCodeCamp or Kaggle\'s free micro-courses. Practice with pandas, NumPy, and Matplotlib every day for 30 minutes.',
      '🔍 Step 3 — EXPLORE REAL DATA: Download 3 public Sri Lankan datasets (population, paddy yield, elections) from data.gov.lk. Ask interesting questions and answer them with charts and numbers — this IS data science.',
      '🧪 Step 4 — RUN YOUR FIRST ANALYSIS: Pick one dataset, form a hypothesis (e.g., "rainfall affects paddy yield"), test it statistically, and write a simple report with findings. Post it on Medium or LinkedIn.',
      '💼 Step 5 — BUILD A PORTFOLIO STORY: Do 2 end-to-end projects on Kaggle. Write a clear explanation of your findings as a story, not just code. Employers want to see that you can explain numbers to non-technical people.',
    ],
    project: '📉 Student exam performance analyzer — use public school data to find which factors (attendance, distance, gender) most affect results, and recommend 3 low-cost LKR interventions to the Ministry of Education.',
    certifications: [
      'IBM Data Science Professional Certificate (Coursera)',
      'Kaggle micro-courses — Pandas, Data Viz, ML (all free)',
      'Statistics and Probability — Khan Academy (free)',
    ],
  },

  // ── 3. DATA ENGINEER ─────────────────────────────────────────────
  {
    keywords: ['data engineer', 'data pipeline', 'etl', 'apache spark', 'kafka', 'airflow', 'data warehouse',
               'data lake', 'bigquery', 'snowflake', 'dbt', 'pipeline engineer'],
    title: 'Data Engineer',
    salary: 'LKR 120,000–480,000 per month',
    skills: [
      '🐍 Python and SQL — the two must-have languages for data pipelines',
      '🔄 ETL pipelines — Extract, Transform, Load data from many sources',
      '🗄️ Data warehousing — organizing data so analysts can query it fast',
      '☁️ Cloud data services — AWS S3, Google BigQuery, or Azure Data Factory',
      '⚙️ Workflow tools — Apache Airflow for scheduling automated data jobs',
    ],
    roadmap: [
      '📚 Step 1 — MASTER SQL DEEPLY: SQL is the #1 skill of a data engineer. Complete SQLZoo or Mode Analytics SQL tutorials. Practice writing JOINs, CTEs, window functions, and aggregations daily.',
      '🐍 Step 2 — LEARN PYTHON FOR DATA: Focus on reading files, calling APIs, and writing data to databases using Python. Practice the requests, pandas, and SQLAlchemy libraries.',
      '🔄 Step 3 — BUILD YOUR FIRST PIPELINE: Create an automated script that: (1) downloads data from a public API, (2) cleans it, and (3) saves it to a local SQLite database on a schedule. This is a real ETL pipeline.',
      '☁️ Step 4 — GO TO THE CLOUD: Sign up for a free AWS or GCP account. Move your pipeline to the cloud — store data in S3 or Cloud Storage, and query it with Athena or BigQuery. Calculate the monthly cost in LKR.',
      '💼 Step 5 — ADD ORCHESTRATION: Learn Apache Airflow basics (free Docker setup). Convert your pipeline into Airflow DAGs with error alerts. Document the pipeline with a data flow diagram. This is a portfolio-worthy project.',
    ],
    project: '🏪 Sri Lankan e-commerce sales pipeline — pull sales data from a dummy Shopify API daily, clean and transform it, load into BigQuery, and connect to a Looker Studio dashboard showing revenue by product and region.',
    certifications: [
      'Google Professional Data Engineer (GCP Certification)',
      'DataTalks.Club Data Engineering Zoomcamp (free)',
      'dbt Fundamentals — dbt Labs (free)',
    ],
  },

  // ── 4. DATA ANALYST / BI SPECIALIST ─────────────────────────────
  {
    keywords: ['data analyst', 'business analyst data', 'bi specialist', 'power bi', 'tableau', 'sql analyst',
               'business intelligence', 'excel analyst', 'looker', 'reporting analyst'],
    title: 'Data Analyst / BI Specialist',
    salary: 'LKR 85,000–300,000 per month',
    skills: [
      '🗃️ SQL — querying databases to pull the numbers you need',
      '📊 Power BI or Tableau — building visual dashboards from data',
      '📋 Excel — pivot tables, VLOOKUP, and data cleaning formulas',
      '🗣️ Business communication — translating data findings into decisions',
      '📐 Basic statistics — understanding averages, trends, and outliers',
    ],
    roadmap: [
      '📚 Step 1 — LEARN SQL FROM SCRATCH: Go to SQLBolt.com (completely free). Complete all 20 lessons. Practice writing SELECT, WHERE, GROUP BY, and JOIN queries. SQL is the #1 skill for this role — spend 2 weeks here.',
      '📊 Step 2 — LEARN POWER BI (FREE): Download Power BI Desktop (free for Windows). Watch Guy in a Cube\'s YouTube tutorials. Connect it to a free CSV dataset and build your first 3-chart dashboard.',
      '🔍 Step 3 — WORK WITH REAL DATA: Find a real Sri Lankan dataset (supermarket sales, school results, hospital admissions). Clean it in Excel, analyze it with SQL, and build a Power BI dashboard. Ask: "What decision does this help someone make?"',
      '📝 Step 4 — DOCUMENT YOUR FINDINGS: Write a 1-page PDF report of your findings in plain language — no jargon. Include 3 charts and 3 recommendations. Pretend you are presenting to a manager who does not like numbers.',
      '💼 Step 5 — BUILD A PORTFOLIO: Complete 3 full analysis projects. Upload datasets, SQL queries, and Power BI files to GitHub. Share on LinkedIn. Offer to do a free dashboard for a local school or NGO — that is your first real client.',
    ],
    project: '🏫 School performance tracker — analyze exam results, attendance, and fee data for 5 local schools. Build a Power BI dashboard that shows which schools need the most support, and present it with LKR cost-to-improve estimates.',
    certifications: [
      'Google Data Analytics Professional Certificate (Coursera)',
      'Microsoft Power BI Data Analyst (PL-300) — Microsoft Learn (free)',
      'SQLBolt — interactive SQL lessons (free)',
    ],
  },

  // ── 5. NETWORK ENGINEER ──────────────────────────────────────────
  {
    keywords: ['network engineer', 'network administrator', 'cisco', 'ccna', 'ccnp', 'router', 'switch',
               'firewall', 'tcp/ip', 'vlan', 'ospf', 'bgp', 'wan', 'lan', 'vpn', 'subnetting', 'networking'],
    title: 'Network Engineer',
    salary: 'LKR 80,000–350,000 per month',
    skills: [
      '🌐 TCP/IP and subnetting — how devices communicate over a network',
      '🔧 Cisco IOS — configuring routers and switches with command lines',
      '🔒 Firewall rules — controlling what traffic is allowed or blocked',
      '📡 VPN setup — secure remote access for employees',
      '📊 Network monitoring — using tools like Wireshark and PRTG',
    ],
    roadmap: [
      '📚 Step 1 — UNDERSTAND HOW THE INTERNET WORKS: Watch "Networking Fundamentals" by Network Chuck on YouTube (free, very fun). Learn what IP addresses, routers, switches, DNS, and DHCP are in simple terms — no pressure yet.',
      '🖥️ Step 2 — SET UP YOUR FREE HOME LAB: Download Cisco Packet Tracer for free (register on Cisco Networking Academy). Build virtual networks on your laptop. Practice subnetting — use the "Subnet Zero" practice tool daily for 15 minutes.',
      '🔧 Step 3 — LEARN CISCO IOS COMMANDS: Follow the free Cisco Networking Academy "Introduction to Networks" course. Practice: setting IP addresses, creating VLANs, configuring OSPF routing, and setting up a basic firewall rule.',
      '📡 Step 4 — BUILD A REALISTIC NETWORK: In Packet Tracer, design a complete network for a fictional Sri Lankan office with 3 floors, a server room, and a DMZ. Document every device, IP range, and firewall rule in a table.',
      '💼 Step 5 — GET CERTIFIED AND GET PAID: Take the CCNA exam (LKR ~25,000 via Pearson VUE). Add your Packet Tracer lab files to GitHub. Offer a free network audit to a local school or small office — write the findings as a report with LKR improvement costs.',
    ],
    project: '🏢 Multi-branch SME network — design a complete network for a Sri Lankan company with 3 offices, including VLAN segmentation for HR/Finance/IT, site-to-site VPN, redundant internet links, and an LKR-priced hardware shopping list.',
    certifications: [
      'Cisco CCNA 200-301 — Cisco Networking Academy (free course + paid exam)',
      'CompTIA Network+ — CompTIA (good alternative to CCNA)',
      'Cisco Packet Tracer Course — free on Networking Academy',
    ],
  },

  // ── 6. CLOUD & DEVOPS ENGINEER ───────────────────────────────────
  {
    keywords: ['cloud engineer', 'devops', 'devops engineer', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
               'ci/cd', 'terraform', 'ansible', 'infrastructure as code', 'site reliability', 'platform engineer'],
    title: 'Cloud & DevOps Engineer',
    salary: 'LKR 140,000–550,000 per month',
    skills: [
      '🐧 Linux command line — navigating servers and writing bash scripts',
      '🐳 Docker — packaging apps in containers so they run anywhere',
      '☁️ AWS / Azure / GCP — deploying apps on cloud platforms',
      '🔄 CI/CD pipelines — automating code testing and deployment',
      '📋 Infrastructure as Code — writing server configs with Terraform',
    ],
    roadmap: [
      '📚 Step 1 — GET COMFORTABLE WITH LINUX: Install Ubuntu on a free virtual machine (VirtualBox). Practice 20 essential Linux commands: ls, cd, grep, chmod, ssh, and more. Watch Network Chuck\'s "Linux for Hackers" series on YouTube — it is free and very practical.',
      '🐳 Step 2 — LEARN DOCKER (GAME CHANGER): Follow the official Docker "Getting Started" tutorial (free). Run your first container, then Dockerize a simple Node.js or Python app. Understand images, containers, volumes, and networks.',
      '☁️ Step 3 — DEPLOY TO THE CLOUD: Create a free AWS account (12-month free tier). Deploy your Dockerized app to EC2. Set up a domain, HTTPS certificate, and basic CloudWatch monitoring. Calculate the monthly cost in LKR.',
      '🔄 Step 4 — AUTOMATE WITH CI/CD: Create a GitHub Actions workflow that automatically tests and deploys your app whenever you push code. Add a Slack notification for failed deployments. This is what "DevOps" actually means.',
      '💼 Step 5 — WRITE INFRASTRUCTURE AS CODE: Learn basic Terraform — write a .tf file that creates a cloud server with one command. Destroy and recreate it to prove it works. Document cost estimates in LKR and submit as a portfolio project.',
    ],
    project: '🚀 Auto-scaling web app deployment — deploy a simple web app on AWS with Docker, set up GitHub Actions for CI/CD, add auto-scaling to handle traffic spikes, set a budget alert at LKR 5,000/month, and document the full architecture.',
    certifications: [
      'AWS Certified Cloud Practitioner — AWS (best starting cert)',
      'Docker Foundations — Docker official curriculum (free)',
      'GitHub Actions — GitHub Learning Lab (free)',
    ],
  },

  // ── 7. CYBERSECURITY ANALYST ─────────────────────────────────────
  {
    keywords: ['cybersecurity', 'security analyst', 'information security', 'penetration testing', 'ethical hacker',
               'pentest', 'soc analyst', 'vulnerability assessment', 'incident response', 'infosec', 'cyber'],
    title: 'Cybersecurity Analyst',
    salary: 'LKR 100,000–400,000 per month',
    skills: [
      '🌐 Network security — understanding how attacks travel across networks',
      '🔍 Vulnerability scanning — finding weaknesses before attackers do',
      '🛡️ Incident response — what to do when a system is compromised',
      '🐧 Linux command line — most security tools run on Linux',
      '📝 Security reporting — writing clear risk reports for management',
    ],
    roadmap: [
      '📚 Step 1 — BUILD THE FOUNDATION: Complete the free "Google Cybersecurity Certificate" on Coursera. It covers networking, Linux, SQL, and basic security concepts. No prior experience needed — it takes about 6 months at your own pace.',
      '🏠 Step 2 — BUILD A HOME LAB (FREE): Download VirtualBox and set up 2 virtual machines — one as "attacker" (Kali Linux) and one as "victim" (Windows or Ubuntu). This sandbox environment lets you practice safely without breaking anything real.',
      '🔍 Step 3 — LEARN BY DOING ON TRYHACKME: Sign up for TryHackMe.com (free tier). Complete the "Pre-Security" and "SOC Level 1" learning paths. These are interactive challenges — you actually hack things in a safe environment.',
      '🏢 Step 4 — DO A REAL SECURITY AUDIT: Offer to do a FREE basic security check for your college computer lab, a family member\'s business, or a local school. Check their passwords, Wi-Fi security, software updates, and backup practices. Write a 2-page report.',
      '💼 Step 5 — BUILD YOUR ATTACK DEFENSE PORTFOLIO: Complete 3 "Capture The Flag" (CTF) competitions on PicoCTF or HackTheBox. Document your methodology for each. Get CompTIA Security+ certified. This combination of cert + lab work + CTF scores gets you hired.',
    ],
    project: '🔐 SME security assessment — audit a small Sri Lankan business for the top 10 security risks (OWASP Top 10 style). Deliver a ranked risk report with a 30-day remediation plan and LKR cost estimate for each fix.',
    certifications: [
      'Google Cybersecurity Certificate — Coursera (7 courses, ~6 months)',
      'CompTIA Security+ — globally respected, no experience needed',
      'TryHackMe Pre-Security + SOC Level 1 — interactive, free tier',
    ],
  },

  // ── 8. SOFTWARE ENGINEER (BACKEND) ──────────────────────────────
  {
    keywords: ['software engineer', 'backend engineer', 'backend developer', 'java developer', 'spring boot',
               'c# developer', '.net developer', 'golang developer', 'software development', 'api developer',
               'microservices', 'rest api developer'],
    title: 'Software Engineer (Backend)',
    salary: 'LKR 100,000–450,000 per month',
    skills: [
      '☕ Java, C#, Go, or Python — choose one backend language and master it',
      '🔗 REST API design — building the "engine" behind apps and websites',
      '🗄️ Database design — using PostgreSQL or MySQL to store data',
      '🧪 Unit testing — writing tests so your code does not break later',
      '🔒 Authentication — JWT tokens, OAuth, and keeping users secure',
    ],
    roadmap: [
      '📚 Step 1 — PICK ONE LANGUAGE AND COMMIT: Choose Java (most jobs in Sri Lanka), Python (easiest to start), or C# (.NET). Watch "Java Programming for Complete Beginners" on Udemy or "CS50\'s Introduction to Programming" (free). Stick to one language for 3 months.',
      '🔗 Step 2 — LEARN HOW BACKEND WORKS: Build a simple "To-Do" CRUD app with your language — Create, Read, Update, Delete items. Connect it to a free database (SQLite or PostgreSQL). This teaches you how every backend app works.',
      '🗄️ Step 3 — MASTER DATABASES: Learn SQL — practice writing queries that JOIN tables, GROUP data, and handle transactions. Use a free tool like TablePlus or DBeaver to visualize your database. Design a proper schema with primary and foreign keys.',
      '🧪 Step 4 — WRITE TESTS AND USE GIT: Learn to write unit tests for your code (JUnit for Java, pytest for Python). Set up a GitHub repository for every project. Commit code daily — employers look at your GitHub activity.',
      '💼 Step 5 — BUILD A REAL API AND DEPLOY IT: Build a production-quality REST API for a Sri Lankan use case (e.g., hotel booking, school enrollment). Add JWT authentication, write API documentation with Swagger, and deploy it to a free cloud host. This is your portfolio centrepiece.',
    ],
    project: '🏨 Hotel booking REST API — build a backend for a Sri Lankan guesthouse: user registration, room listing, booking with date availability check, payment status tracking, and an admin report showing monthly revenue in LKR.',
    certifications: [
      'Oracle Java SE 11 Developer Certification (1Z0-819)',
      'Microsoft Azure Developer Associate (AZ-204) — for C# developers',
      'CS50 Web Programming with Python and JavaScript — Harvard (free)',
    ],
  },

  // ── 9. FRONTEND DEVELOPER ────────────────────────────────────────
  {
    keywords: ['frontend developer', 'front-end developer', 'frontend engineer', 'react developer',
               'vue developer', 'angular developer', 'html', 'css', 'javascript developer',
               'ui developer', 'web designer developer'],
    title: 'Frontend Developer',
    salary: 'LKR 80,000–350,000 per month',
    skills: [
      '🌐 HTML & CSS — the building blocks of every web page',
      '⚡ JavaScript — making pages interactive and dynamic',
      '⚛️ React or Vue — modern frameworks for building fast web apps',
      '📱 Responsive design — making sites look good on mobile and desktop',
      '🎨 CSS animations & Tailwind — making UIs look polished and modern',
    ],
    roadmap: [
      '📚 Step 1 — START WITH HTML & CSS (2 weeks): Go to freeCodeCamp.org and complete "Responsive Web Design Certification" (free). Build 5 practice pages: a profile card, a landing page, a pricing table, a photo gallery, and a contact form.',
      '⚡ Step 2 — ADD JAVASCRIPT (1 month): Complete "JavaScript Algorithms and Data Structures" on freeCodeCamp (free). Focus on: variables, functions, loops, arrays, objects, and DOM manipulation. Build a to-do list and a quiz app from scratch.',
      '⚛️ Step 3 — LEARN REACT (6 weeks): Follow the official React tutorial at react.dev (free). Build a weather app that fetches real data from a free API. Learn: components, props, state, and useEffect — these 4 concepts power 90% of React apps.',
      '🎨 Step 4 — MAKE IT BEAUTIFUL: Learn Tailwind CSS or styled-components. Rebuild one of your plain HTML projects into a modern, responsive, animated UI. Copy the design style of a popular site you love (Airbnb, Notion, etc.).',
      '💼 Step 5 — BUILD YOUR PORTFOLIO SITE: Create a personal portfolio website showcasing 3–4 projects. Host it free on Vercel or Netlify. Make sure it loads in under 2 seconds, looks great on mobile, and has no spelling mistakes. This IS your CV.',
    ],
    project: '🛒 Sri Lankan artisan marketplace frontend — build a beautiful multi-page React app where local craftspeople list handmade products with LKR prices, photos, and a shopping cart. No backend needed — use mock data and localStorage.',
    certifications: [
      'freeCodeCamp Responsive Web Design Certification (free)',
      'Meta Frontend Developer Professional Certificate (Coursera)',
      'JavaScript.info — complete free textbook and exercises',
    ],
  },

  // ── 10. FULL-STACK WEB DEVELOPER ─────────────────────────────────
  {
    keywords: ['full stack', 'fullstack developer', 'full-stack developer', 'mern stack', 'mean stack',
               'full stack engineer', 'nodejs backend', 'express developer'],
    title: 'Full-Stack Web Developer',
    salary: 'LKR 95,000–400,000 per month',
    skills: [
      '⚛️ React (frontend) + Node.js (backend) — the most popular full-stack combo',
      '🗄️ MongoDB or PostgreSQL — storing app data in a database',
      '🔒 JWT authentication — secure login and user sessions',
      '🚀 Deployment — hosting full apps on Vercel, Railway, or AWS',
      '🔗 REST APIs — connecting the frontend and backend seamlessly',
    ],
    roadmap: [
      '📚 Step 1 — MASTER HTML, CSS, AND JAVASCRIPT FIRST: Before learning a framework, spend 4 weeks on vanilla HTML/CSS/JS using freeCodeCamp. Build a working weather app and a quiz game without any framework.',
      '⚛️ Step 2 — LEARN REACT FOR THE FRONTEND: Build 3 React projects — a movie search app (using TMDB API), a budget tracker, and a simple blog. Understand components, state, and React Router for multiple pages.',
      '🌐 Step 3 — LEARN NODE.JS AND EXPRESS FOR THE BACKEND: Build a REST API with Node.js and Express. Add MongoDB (free Atlas cloud database). Connect your React frontend to your Node.js backend — this is the MERN stack.',
      '🔒 Step 4 — ADD AUTHENTICATION AND REAL FEATURES: Add user registration and login using JWT tokens. Add file upload, email notifications, or payment simulation. Your app should solve a real problem, not just be a tutorial clone.',
      '💼 Step 5 — DEPLOY AND SHARE: Deploy your full-stack app: frontend on Vercel (free), backend on Railway (free tier). Add a custom .lk domain (LKR ~1,500/year). Write a clear README. Share the live link on LinkedIn. Freelance projects start here.',
    ],
    project: '📅 Community event booking platform for Sri Lanka — users register, browse upcoming events by city, book a seat, and get an email confirmation. Admin dashboard shows total bookings, revenue in LKR, and attendee lists.',
    certifications: [
      'The Odin Project — full free full-stack curriculum (highly recommended)',
      'CS50 Web Programming — Harvard (free, very respected)',
      'MongoDB University M001 — free MongoDB basics course',
    ],
  },

  // ── 11. MOBILE APP DEVELOPER (FLUTTER / REACT NATIVE) ───────────
  {
    keywords: ['mobile developer', 'flutter developer', 'react native developer', 'cross platform developer',
               'mobile app', 'app developer', 'dart developer'],
    title: 'Mobile App Developer (Flutter / React Native)',
    salary: 'LKR 90,000–380,000 per month',
    skills: [
      '🐦 Flutter (Dart) — Google\'s framework to build iOS and Android from one code base',
      '⚛️ React Native — build mobile apps using JavaScript and React',
      '🔗 REST API integration — connecting your app to a backend server',
      '💾 Local storage — saving data offline using SQLite or Hive',
      '📲 App Store publishing — submitting to Google Play and Apple App Store',
    ],
    roadmap: [
      '📚 Step 1 — CHOOSE FLUTTER (RECOMMENDED FOR SRI LANKA): Flutter is in high demand locally. Install Flutter and Android Studio (both free). Watch "Flutter Crash Course" by Net Ninja on YouTube. Run your first "Hello World" app on your phone or emulator.',
      '🎨 Step 2 — LEARN THE FLUTTER BASICS (1 month): Build 3 simple apps: a BMI calculator, a to-do list, and a quiz app. Learn: Widgets, Column/Row layouts, StatefulWidget, and Navigator for screen transitions.',
      '🔗 Step 3 — CONNECT TO THE INTERNET: Learn how to call a REST API from Flutter using the http package. Build a currency converter app that fetches live exchange rates. Then add LKR (Sri Lankan Rupee) conversion.',
      '💾 Step 4 — ADD OFFLINE AND ADVANCED FEATURES: Learn Firebase (free tier) — add Google login, cloud database (Firestore), and push notifications to your app. These 3 features appear in almost every professional app.',
      '💼 Step 5 — PUBLISH AND MONETIZE: Create a Google Play Developer account (LKR ~700 one-time). Publish your best app. Add Google AdMob for passive income. Calculate your estimated LKR monthly revenue at 1,000 downloads. Submit this as your portfolio.',
    ],
    project: '💰 Sri Lankan household budget app — track monthly expenses in LKR by category (food, transport, school fees), set budget limits, get alerts when overspending, and see a monthly savings trend chart. Publish to Google Play.',
    certifications: [
      'Flutter official documentation + codelabs — flutter.dev (free)',
      'Google Associate Android Developer — Google (respected globally)',
      'Udemy: The Complete Flutter Development Bootcamp — Dr. Angela Yu',
    ],
  },

  // ── 12. ANDROID DEVELOPER ────────────────────────────────────────
  {
    keywords: ['android developer', 'android app', 'kotlin developer', 'android studio', 'android engineer',
               'native android', 'jetpack compose'],
    title: 'Android Developer (Native — Kotlin)',
    salary: 'LKR 90,000–380,000 per month',
    skills: [
      '🟣 Kotlin — the modern language for native Android apps',
      '🏗️ Jetpack Compose — Google\'s new way to build Android UIs',
      '🗄️ Room database — storing data locally on Android devices',
      '🔗 Retrofit — calling REST APIs from Android apps',
      '📲 Android lifecycle — understanding how Activities and Fragments work',
    ],
    roadmap: [
      '📚 Step 1 — SET UP AND LEARN KOTLIN BASICS: Install Android Studio (free). Take Google\'s free "Kotlin Bootcamp for Programmers" course. Write your first Android app — a simple screen that says "Hello, Sri Lanka!" and changes color when tapped.',
      '🏗️ Step 2 — LEARN JETPACK COMPOSE: Jetpack Compose is the future of Android UI. Complete Google\'s "Jetpack Compose Basics" codelab (free). Build: a profile screen, a scrollable list, and a settings page.',
      '🗄️ Step 3 — STORE DATA LOCALLY: Learn Room database — it stores data on the user\'s phone. Build a notes app where users create, edit, and delete notes that persist after closing the app.',
      '🔗 Step 4 — CONNECT TO A BACKEND: Use Retrofit to call a free public API (e.g., a weather API). Display the data beautifully. Add error handling for no internet connection — professional apps always handle this.',
      '💼 Step 5 — PUBLISH YOUR APP: Publish your best app to Google Play (LKR ~700 one-time fee). Write a proper app description, add screenshots, and set a category. Share the Play Store link on your CV and LinkedIn.',
    ],
    project: '🚌 Sri Lanka bus tracker app — users enter their route, the app shows scheduled departure times, estimated fares in LKR, and a live map with bus position (using a mock API). Works offline with cached data.',
    certifications: [
      'Google Associate Android Developer Certification',
      'Android Basics with Compose — developer.android.com (free)',
      'Kotlin for Android Developers — JetBrains Academy (free tier)',
    ],
  },

  // ── 13. IOS DEVELOPER ────────────────────────────────────────────
  {
    keywords: ['ios developer', 'swift developer', 'swiftui', 'iphone app', 'apple developer', 'xcode',
               'ios engineer', 'macos developer', 'cocoa'],
    title: 'iOS Developer (Swift / SwiftUI)',
    salary: 'LKR 120,000–480,000 per month',
    skills: [
      '🍎 Swift — Apple\'s modern programming language for iOS apps',
      '📱 SwiftUI — the modern way to design iOS interfaces declaratively',
      '🗄️ Core Data / SwiftData — storing data locally on iPhones',
      '🔗 URLSession / Alamofire — calling REST APIs from iOS apps',
      '🛍️ App Store publishing — submitting apps via App Store Connect',
    ],
    roadmap: [
      '📚 Step 1 — SET UP AND LEARN SWIFT: You need a Mac (macOS). Install Xcode (free from App Store). Complete Apple\'s "Swift Playgrounds" app (free on iPad/Mac) to learn Swift syntax interactively. Then do "100 Days of SwiftUI" by Paul Hudson (free website).',
      '📱 Step 2 — BUILD 3 SWIFTUI APPS: Build: a temperature converter, a to-do list with local storage, and a photo gallery with animations. Learn: Views, State, NavigationStack, and List — these power most iOS apps.',
      '🔗 Step 3 — FETCH DATA FROM THE INTERNET: Build a news app that fetches Sri Lankan headlines from a free news API. Display articles in a scrollable list with images and share buttons.',
      '💾 Step 4 — ADD ADVANCED FEATURES: Learn notifications, camera access, and Core Location (GPS). Build one app that uses at least 2 of these — they appear in almost every client project.',
      '💼 Step 5 — PUBLISH TO APP STORE: Apple Developer Program costs USD 99/year (~LKR 30,000) — share the cost with classmates if needed, or apply for the Apple WWDC scholarship. Submit your best app. The App Store link is more impressive than any certificate.',
    ],
    project: '🌏 Sri Lankan travel guide iOS app — browse famous destinations, save favourites, view GPS directions, see admission prices in LKR, and read travel tips in Sinhala and English. Offline mode using Core Data.',
    certifications: [
      '100 Days of SwiftUI — hackingwithswift.com (completely free, outstanding)',
      'Apple Developer Documentation — developer.apple.com (free)',
      'CS193p Stanford iOS Development — Stanford University (free on YouTube)',
    ],
  },

  // ── 14. GAME DEVELOPER ───────────────────────────────────────────
  {
    keywords: ['game developer', 'game development', 'unity developer', 'unreal engine', 'game designer',
               'godot', 'c++ game', 'game programmer', 'indie game', 'game dev'],
    title: 'Game Developer',
    salary: 'LKR 80,000–350,000 per month',
    skills: [
      '🎮 Unity (C#) or Godot (GDScript) — the most popular free game engines',
      '🧩 Game design principles — levels, mechanics, rewards, and player motivation',
      '🎨 2D/3D asset creation basics — sprites, models, and animations',
      '⚙️ Physics and collision — making objects interact realistically',
      '💰 Monetization — in-app purchases, ads, and Google Play / App Store publishing',
    ],
    roadmap: [
      '📚 Step 1 — PICK UNITY AND LEARN C# BASICS: Unity is free and has the most jobs and tutorials. Install Unity Hub (free). Complete "Unity Learn: Junior Programmer" (free official path). Learn C# basics: variables, loops, classes, and functions.',
      '🎮 Step 2 — BUILD 3 TINY GAMES: Make a Flappy Bird clone, a simple 2D platformer, and a top-down shooter. Follow free Unity tutorials on YouTube (Brackeys channel is legendary). Focus on getting games to WORK, not look perfect.',
      '🕹️ Step 3 — ADD POLISH AND GAME FEEL: Learn: particle effects for explosions, screen shake, sound effects, UI menus, a pause screen, and a game-over screen. "Game feel" is what separates amateur games from professional ones.',
      '📱 Step 4 — PUBLISH A MOBILE GAME: Export your best game to Android in Unity. Set up monetization with Google AdMob (earn LKR from ads). Submit to Google Play. Share the link with friends and gather feedback.',
      '💼 Step 5 — THINK LOCAL: Build a game inspired by Sri Lankan culture — a Carom board game, a cricket game, or a Sinhala word puzzle. Local content gets local press coverage, which is free marketing. Estimate LKR revenue from 10,000 downloads.',
    ],
    project: '🏏 Sri Lanka Cricket mobile game — a 2D cricket batting game with famous Sri Lankan grounds (SSC, Pallekele), local player names, and a leaderboard. Monetize with banner ads (estimate LKR monthly revenue).',
    certifications: [
      'Unity Junior Programmer Learning Path — learn.unity.com (free)',
      'Godot 4 Documentation + demos — godotengine.org (free)',
      'CS50 Game Development — Harvard University (free on edX)',
    ],
  },

  // ── 15. DATABASE ADMINISTRATOR (DBA) ─────────────────────────────
  {
    keywords: ['database administrator', 'dba', 'database engineer', 'oracle dba', 'mysql dba',
               'postgresql dba', 'sql server dba', 'database management', 'db admin'],
    title: 'Database Administrator (DBA)',
    salary: 'LKR 100,000–380,000 per month',
    skills: [
      '🗄️ SQL mastery — advanced queries, stored procedures, and triggers',
      '⚡ Performance tuning — making slow queries run 10x faster',
      '💾 Backup and recovery — protecting data and restoring it after failure',
      '🔒 Database security — access controls and encryption',
      '📊 Capacity planning — estimating storage and performance growth',
    ],
    roadmap: [
      '📚 Step 1 — MASTER ADVANCED SQL: Go beyond basic SELECT statements. Learn: window functions (ROW_NUMBER, RANK), CTEs, stored procedures, triggers, and transactions. Practice on a free PostgreSQL database with sample data.',
      '🛠️ Step 2 — LEARN A MAJOR DATABASE SYSTEM: Pick PostgreSQL (free, widely used in Sri Lanka) or Oracle (more enterprise jobs). Install it locally and learn: creating users, granting permissions, creating tablespaces, and managing connections.',
      '⚡ Step 3 — LEARN PERFORMANCE TUNING: Study how indexes work and when to use them. Learn to read a query execution plan (EXPLAIN ANALYZE in PostgreSQL). Optimize 5 slow queries from a practice dataset — document the before/after speed.',
      '💾 Step 4 — PRACTICE BACKUP AND RECOVERY: Set up automated daily backups using pg_dump or RMAN (Oracle). Practice restoring from a backup — simulate a "disaster recovery" scenario. Document the recovery time in minutes.',
      '💼 Step 5 — BUILD A DBA PORTFOLIO: Design a full database for a hospital, school, or hotel. Include: normalized table schema (3NF), indexes for common queries, stored procedures for business logic, a backup schedule, and a monitoring dashboard. This is your interview showpiece.',
    ],
    project: '🏥 Hospital database system — design and manage a PostgreSQL database for a Sri Lankan clinic: patient records, appointments, prescriptions, billing in LKR. Include indexes, stored procedures for report generation, and an automated backup plan.',
    certifications: [
      'Oracle Database SQL Certified Associate (1Z0-071)',
      'PostgreSQL for Everybody — coursera.org (free to audit)',
      'SQL Performance Explained — book by Markus Winand (free to read online)',
    ],
  },

  // ── 16. SYSTEM ADMINISTRATOR / IT SUPPORT ────────────────────────
  {
    keywords: ['system administrator', 'sysadmin', 'it support', 'helpdesk', 'it technician',
               'windows server', 'active directory', 'it administrator', 'desktop support',
               'it infrastructure', 'service desk'],
    title: 'System Administrator / IT Support',
    salary: 'LKR 60,000–250,000 per month',
    skills: [
      '🖥️ Windows Server & Active Directory — managing company computers and users',
      '🐧 Linux administration — managing servers from the command line',
      '🌐 Networking basics — DNS, DHCP, IP addressing, and VPN',
      '🔧 Troubleshooting — diagnosing and fixing hardware and software issues',
      '📋 IT documentation — writing clear guides and SOPs for users',
    ],
    roadmap: [
      '📚 Step 1 — LEARN WINDOWS SERVER AND ACTIVE DIRECTORY: Install Windows Server 2022 (free 180-day trial) in VirtualBox. Set up a domain, create user accounts, set password policies, and map a shared drive. This is what every office SysAdmin does daily.',
      '🐧 Step 2 — GET COMFORTABLE WITH LINUX: Install Ubuntu Server in VirtualBox. Practice: creating users, setting file permissions, configuring a web server (Apache), and scheduling tasks with cron. 80% of servers worldwide run Linux.',
      '🌐 Step 3 — UNDERSTAND NETWORKING IN PRACTICE: Set up your own DNS server, DHCP server, and file server in a virtual lab. Troubleshoot connectivity issues using ping, traceroute, nslookup, and Wireshark.',
      '🔧 Step 4 — PRACTICE REAL TROUBLESHOOTING: Find 10 "real world IT problems" on Reddit\'s r/sysadmin or TechNet. Try to solve each one. Document your troubleshooting steps. Speed and accuracy in diagnosing problems = your salary multiplier.',
      '💼 Step 5 — VOLUNTEER AND CERTIFY: Offer free IT support to a local school, NGO, or small business. Fix their computers, set up their network, and document everything you did in a report. Get CompTIA A+ certified — it is the most recognized entry-level IT cert in Sri Lanka.',
    ],
    project: '🏫 School computer lab setup — plan and document the complete IT setup for a 30-computer lab: Windows Server with AD, user accounts for each student, shared printer, antivirus policy, internet filter, and a monthly maintenance SOP. Include LKR hardware cost estimate.',
    certifications: [
      'CompTIA A+ — the gold standard for IT support (widely recognised)',
      'Microsoft Certified: Windows Server Fundamentals (MTA)',
      'Google IT Support Professional Certificate — Coursera (free to audit)',
    ],
  },

  // ── 17. QA / TEST ENGINEER ───────────────────────────────────────
  {
    keywords: ['qa engineer', 'quality assurance', 'test engineer', 'software tester', 'automation tester',
               'selenium', 'cypress', 'test automation', 'manual testing', 'api testing', 'postman testing'],
    title: 'QA / Test Engineer',
    salary: 'LKR 75,000–320,000 per month',
    skills: [
      '🧪 Manual testing — finding bugs by using apps the way real users would',
      '🤖 Test automation — writing scripts that test the app automatically',
      '🔗 API testing — using Postman to test backend endpoints',
      '📋 Test case writing — documenting exactly what to test and what result to expect',
      '🐛 Bug reporting — clearly describing bugs so developers can fix them fast',
    ],
    roadmap: [
      '📚 Step 1 — UNDERSTAND WHAT TESTING ACTUALLY IS: Read "A Practitioner\'s Guide to Software Test Design" (free online chapters). Learn the difference between: unit tests, integration tests, and end-to-end tests. Understand what a "test case" and a "bug report" look like.',
      '🔗 Step 2 — START WITH API TESTING (EASIEST WIN): Download Postman (free). Use a public API (like the REST Countries API) and write 20 test cases: test correct responses, wrong inputs, missing fields, and edge cases. Export as a Postman collection.',
      '🤖 Step 3 — LEARN SELENIUM OR CYPRESS FOR WEB TESTING: Pick Cypress (easier to learn). Install it, write your first automated test that opens a website, clicks a button, and checks the result. Automate 10 test cases for any public website.',
      '📋 Step 4 — WRITE PROFESSIONAL TEST DOCUMENTATION: For a real or practice project, write a complete Test Plan: scope, test cases (with ID, steps, expected result, actual result), and a defect report. Use Jira or a free equivalent like Linear.',
      '💼 Step 5 — BUILD A QA PORTFOLIO: Find an open-source project on GitHub. Report 3 real bugs you find. Contribute 5 automated test cases. Document everything. A GitHub profile with real QA contributions is rare and very impressive to employers.',
    ],
    project: '🛒 E-commerce site test suite — for a Sri Lankan online shop (real or practice), write: 50 manual test cases, 10 automated Cypress tests for the checkout flow, an API test collection in Postman, a performance test with k6, and a final bug report.',
    certifications: [
      'ISTQB Foundation Level — globally recognised QA certification',
      'Postman Student Expert — free certification from Postman',
      'Cypress.io Documentation + official courses — cypress.io (free)',
    ],
  },

  // ── 18. SITE RELIABILITY ENGINEER (SRE) ─────────────────────────
  {
    keywords: ['site reliability engineer', 'sre', 'reliability engineer', 'observability', 'monitoring',
               'prometheus', 'grafana', 'on-call', 'incident management', 'slo', 'sla'],
    title: 'Site Reliability Engineer (SRE)',
    salary: 'LKR 150,000–600,000 per month',
    skills: [
      '📊 Monitoring and observability — Prometheus, Grafana, and distributed tracing',
      '🐧 Linux and systems programming — deep knowledge of how servers work',
      '⚙️ Automation — eliminating repetitive manual operations with code',
      '🔥 Incident management — staying calm, diagnosing fast, and writing post-mortems',
      '📐 SLOs/SLAs — defining and measuring reliability targets in percentage uptime',
    ],
    roadmap: [
      '📚 Step 1 — BUILD DEVOPS FOUNDATIONS FIRST: SRE is "DevOps done by software engineers". You must first be comfortable with Linux, Docker, Kubernetes basics, and CI/CD. Complete the Cloud & DevOps Engineer roadmap steps 1–3 before starting SRE.',
      '📊 Step 2 — LEARN THE 4 GOLDEN SIGNALS: Study Latency, Traffic, Errors, and Saturation (Google\'s "4 Golden Signals"). Set up Prometheus (free) + Grafana (free) in Docker locally. Create dashboards showing these 4 metrics for a simple web app.',
      '🔥 Step 3 — SIMULATE AND RESPOND TO INCIDENTS: Use Chaos Engineering tools (LitmusChaos or Gremlin free tier) to deliberately break your local app. Practice the incident response process: detect → diagnose → fix → document. Write a post-mortem report.',
      '⚙️ Step 4 — AUTOMATE TOIL AWAY: "Toil" is repetitive manual work. Identify 5 tasks in a hypothetical ops team (e.g., rotating logs, restarting services) and automate them with Bash or Python scripts. Calculate time saved per week.',
      '💼 Step 5 — DEFINE RELIABILITY TARGETS: For a practice app, define SLOs (e.g., 99.9% uptime = max 8.7 hours downtime per year). Set up alerting in Grafana that fires when SLO is at risk. Document the entire reliability plan. This is what SRE interviews test.',
    ],
    project: '📡 Application reliability dashboard — set up a 3-tier web app (frontend + backend + database) in Docker, instrument it with Prometheus metrics and Grafana dashboards, define SLOs, write runbooks for 5 common failure scenarios, and simulate a full incident response.',
    certifications: [
      'Google SRE Book — sre.google (free to read online, the original SRE reference)',
      'Certified Kubernetes Administrator (CKA) — CNCF',
      'AWS Certified SysOps Administrator — AWS',
    ],
  },

  // ── 19. IT PROJECT MANAGER ───────────────────────────────────────
  {
    keywords: ['it project manager', 'project manager it', 'scrum master', 'agile', 'pmp',
               'project management', 'tech project manager', 'it manager', 'program manager'],
    title: 'IT Project Manager / Scrum Master',
    salary: 'LKR 120,000–450,000 per month',
    skills: [
      '📅 Agile and Scrum — managing software projects in 2-week sprints',
      '📋 Jira or Trello — tracking tasks, bugs, and team progress',
      '🗣️ Stakeholder communication — keeping clients and teams aligned',
      '⚠️ Risk management — identifying problems before they derail projects',
      '📊 Project reporting — status reports, burndown charts, and KPIs',
    ],
    roadmap: [
      '📚 Step 1 — UNDERSTAND THE IT DEVELOPMENT CYCLE: Read "The Phoenix Project" (novel about DevOps — very readable). Learn what developers, QA engineers, and designers actually do. You cannot manage people well if you don\'t understand their work.',
      '📅 Step 2 — LEARN AGILE AND SCRUM: Take the free "Scrum for Beginners" course on Scrum.org. Learn: Sprint Planning, Daily Standup, Sprint Review, and Retrospective. Understand the Scrum roles: Product Owner, Scrum Master, and Development Team.',
      '🛠️ Step 3 — USE PROJECT MANAGEMENT TOOLS: Create a free Jira Software account. Set up a project, create a product backlog with 20 user stories, plan a 2-week sprint, and simulate daily standups. Practice with Trello for simpler projects.',
      '📋 Step 4 — LEAD A REAL PROJECT: Volunteer to manage a project for a university club, NGO, or local startup — even if it is small (like building a simple website). Run proper Scrum ceremonies. Track velocity and show a burndown chart at the end.',
      '💼 Step 5 — GET CERTIFIED: The PSM I (Professional Scrum Master) exam costs ~USD 150 (~LKR 45,000) and is highly respected. Pair it with PMP later for senior roles. Document your managed project with screenshots, burndown charts, and a lessons-learned report.',
    ],
    project: '📱 App development project case study — manage a fictional 8-week project to build a Sri Lankan ride-booking app. Deliver: full backlog with 30 user stories, 4 sprint plans, a risk register, weekly status reports, and a final retrospective report with LKR budget tracking.',
    certifications: [
      'Professional Scrum Master I (PSM I) — Scrum.org (highly respected)',
      'Google Project Management Certificate — Coursera (free to audit)',
      'PMP (Project Management Professional) — PMI (senior-level)',
    ],
  },

  // ── 20. BUSINESS ANALYST (IT / TECH) ────────────────────────────
  {
    keywords: ['business analyst', 'ba', 'systems analyst', 'requirements analyst', 'business systems analyst',
               'process analyst', 'functional analyst', 'it business analyst'],
    title: 'Business Analyst (IT / Tech)',
    salary: 'LKR 90,000–360,000 per month',
    skills: [
      '🗣️ Requirements gathering — interviewing stakeholders to understand exactly what they need',
      '📝 Use case and user story writing — translating needs into developer-friendly specs',
      '📊 Process mapping — drawing "how things work now" vs "how they should work"',
      '🗄️ SQL basics — querying data to validate business rules and find gaps',
      '🧩 Wireframing — sketching rough UI mockups to confirm understanding',
    ],
    roadmap: [
      '📚 Step 1 — UNDERSTAND THE BA ROLE: Read "Business Analysis Techniques" by James Cadle (get the PDF). Watch "Business Analyst Career" by Techcanvass on YouTube. A BA bridges the gap between business people (who have problems) and developers (who build solutions).',
      '🗣️ Step 2 — LEARN REQUIREMENTS GATHERING: Study: interviews, workshops, surveys, observation, and document analysis. Practice by interviewing a real person (family member, classmate) about a problem they have. Write their requirements as user stories: "As a [user], I want [feature] so that [benefit]".',
      '📊 Step 3 — LEARN PROCESS MAPPING: Download Lucidchart or draw.io (both free). Draw an "as-is" process map for a familiar process (how a student registers for exams, how a shop processes an order). Then design the "to-be" improved process.',
      '🗄️ Step 4 — LEARN SQL FOR DATA ANALYSIS: A BA who can query a database is worth 2x more. Complete SQLBolt (free). Practice writing queries that answer business questions: "How many customers ordered more than once last month?"',
      '💼 Step 5 — BUILD A BA PORTFOLIO: For a local Sri Lankan organization (school, clinic, shop), produce a full BA deliverable set: stakeholder analysis, process maps (as-is/to-be), functional requirements document, and wireframes in Figma. Present it as a case study.',
    ],
    project: '🏥 Hospital outpatient system BA package — interview 3 "stakeholders" (play different roles yourself or with friends). Deliver: stakeholder register, as-is process map for patient booking, user stories for a new digital system, wireframes, and a requirements traceability matrix.',
    certifications: [
      'IIBA Entry Certificate in Business Analysis (ECBA) — entry-level, no experience needed',
      'Google Project Management Certificate — includes BA content (Coursera, free to audit)',
      'Business Analysis Foundations — LinkedIn Learning',
    ],
  },

  // ── 21. ERP / SAP CONSULTANT ─────────────────────────────────────
  {
    keywords: ['erp consultant', 'sap consultant', 'oracle erp', 'erp implementation', 'sap basis',
               'sap fico', 'sap mm', 'sap sd', 'sap abap', 'odoo consultant', 'erp developer'],
    title: 'ERP / SAP Consultant',
    salary: 'LKR 120,000–500,000 per month',
    skills: [
      '🏭 ERP concepts — understanding how modules (Finance, HR, Inventory) connect',
      '⚙️ SAP configuration — setting up business processes without writing code',
      '🗄️ SQL and ABAP basics — querying SAP databases and writing simple reports',
      '📊 Business process knowledge — understanding accounting, procurement, and supply chain',
      '🗣️ Client communication — gathering requirements and training end-users',
    ],
    roadmap: [
      '📚 Step 1 — UNDERSTAND ERP CONCEPTS: Study what an ERP system does using free YouTube resources. Learn about modules: FI (Finance), CO (Controlling), MM (Materials Management), SD (Sales & Distribution). Understand "business process" in each module.',
      '🖥️ Step 2 — GET SAP ACCESS FOR FREE: Apply for the SAP IDES or SAP BTP Trial (free cloud access). Alternatively, practice with Odoo Community Edition (100% free open-source ERP). Complete basic navigation, create a vendor, and process a purchase order.',
      '🎓 Step 3 — TAKE FREE SAP TRAINING: SAP Learning Hub has many free courses. Start with "SAP Business Suite Overview" and "SAP Navigation". openSAP.com offers free instructor-led SAP courses — complete at least 2.',
      '🗄️ Step 4 — LEARN A MODULE DEEPLY: Pick ONE module (SAP FICO is most in demand in Sri Lanka). Study: chart of accounts, cost centers, posting a journal entry, and running a balance sheet report. Document each step with screenshots.',
      '💼 Step 5 — DO A PRACTICE IMPLEMENTATION: Using Odoo (free), set up a complete company: configure chart of accounts, create a product catalog with LKR prices, process a complete "procure-to-pay" cycle (purchase order → goods receipt → vendor invoice → payment). Document it as a case study.',
    ],
    project: '🏢 Sri Lankan garment factory ERP implementation — using Odoo, set up: a chart of accounts in LKR, supplier management, raw material inventory, production orders, employee payroll, and a monthly profit/loss report. Document each configuration step.',
    certifications: [
      'SAP Certified Application Associate — FICO or MM (paid, but very valuable)',
      'openSAP free courses — open.sap.com (multiple free certifications)',
      'Odoo Functional Certification — odoo.com (free trial exam)',
    ],
  },

  // ── 22. BLOCKCHAIN DEVELOPER ─────────────────────────────────────
  {
    keywords: ['blockchain developer', 'blockchain', 'web3', 'smart contract', 'solidity', 'ethereum',
               'defi', 'nft developer', 'crypto developer', 'dapp developer'],
    title: 'Blockchain / Web3 Developer',
    salary: 'LKR 150,000–600,000 per month (highly variable)',
    skills: [
      '⛓️ Blockchain fundamentals — how distributed ledgers, consensus, and hashing work',
      '📝 Solidity — the language for writing Ethereum smart contracts',
      '🔧 Hardhat or Foundry — tools for developing and testing smart contracts',
      '🌐 Web3.js / Ethers.js — connecting web apps to the blockchain',
      '🔒 Smart contract security — common exploits like reentrancy and overflow attacks',
    ],
    roadmap: [
      '📚 Step 1 — UNDERSTAND BLOCKCHAIN FIRST (NO HYPE): Read "Bitcoin and Cryptocurrency Technologies" (free PDF by Princeton). Understand: blocks, hashes, Merkle trees, consensus mechanisms, and why decentralization matters. Ignore the price speculation.',
      '🐍 Step 2 — LEARN SOLIDITY BASICS: Go to CryptoZombies.io (free, gamified Solidity tutorial). You build a zombie game by writing smart contracts. Complete all chapters — by the end you understand: contracts, functions, mappings, events, and inheritance.',
      '🔧 Step 3 — BUILD AND DEPLOY YOUR FIRST SMART CONTRACT: Set up Hardhat (free). Write a simple "Token" or "Voting" smart contract. Deploy it to the Sepolia testnet (free test ETH available from a faucet). Interact with it using Ethers.js.',
      '🧪 Step 4 — LEARN SMART CONTRACT SECURITY: Read the "SWC Registry" of known smart contract vulnerabilities. Reentrancy and integer overflow are the most common. Audit your own contracts using Slither (free tool). Many blockchain hacks happen due to poor security.',
      '💼 Step 5 — BUILD A REAL DAPP: Build a full decentralized application: a frontend (React), smart contract backend (Solidity on a testnet), and MetaMask wallet integration. Ideas: a voting dApp for a university election, or a simple escrow system for Sri Lankan freelancers.',
    ],
    project: '🗳️ Transparent tender system dApp — a smart contract where Sri Lankan government tenders are posted, vendors submit bids (sealed with a hash), bids are revealed on deadline, and the winner is selected transparently on-chain. Include a React frontend.',
    certifications: [
      'CryptoZombies — cryptozombies.io (free, interactive Solidity)',
      'Alchemy University — free blockchain developer bootcamp',
      'Certified Blockchain Developer — Blockchain Council',
    ],
  },

  // ── 23. AR / VR DEVELOPER ────────────────────────────────────────
  {
    keywords: ['ar developer', 'vr developer', 'augmented reality', 'virtual reality', 'mixed reality',
               'unity ar', 'arkit', 'arcore', 'metaverse developer', 'xr developer', 'extended reality'],
    title: 'AR / VR Developer',
    salary: 'LKR 120,000–500,000 per month',
    skills: [
      '🎮 Unity 3D (C#) — the most popular engine for AR/VR development',
      '📱 ARCore (Android) or ARKit (iOS) — Google\'s and Apple\'s AR SDKs',
      '🕹️ XR Interaction Toolkit — Unity\'s toolkit for VR controller interactions',
      '🎨 3D modelling basics — working with models from Blender or Unity Asset Store',
      '⚡ Performance optimization — AR/VR must run at 90FPS to avoid nausea',
    ],
    roadmap: [
      '📚 Step 1 — BUILD UNITY 3D FOUNDATIONS FIRST: Complete the "Unity Junior Programmer" learning path (free). You must be comfortable in Unity before attempting AR/VR. Build: a simple 3D game with physics, collisions, and UI.',
      '📱 Step 2 — START WITH AR (EASIER THAN VR): Download Unity AR Foundation (free). Build your first AR app: place a 3D object on a flat surface using your phone camera. An AR app runs on any modern Android phone — no expensive headset needed.',
      '🌏 Step 3 — BUILD A MEANINGFUL AR EXPERIENCE: Create an AR app with a Sri Lankan context — e.g., point your phone at a menu and see LKR prices in 3D, or point at a product and see its description in Sinhala. Show it to 10 real users and collect feedback.',
      '🕹️ Step 4 — EXPLORE VR (IF YOU HAVE ACCESS): Use Unity\'s XR Interaction Toolkit with a cheap Google Cardboard headset (~LKR 1,500) for mobile VR. Build a virtual tour of a Sri Lankan heritage site (Sigiriya, Temple of the Tooth). No expensive headset needed to start.',
      '💼 Step 5 — TARGET ENTERPRISE AND EDUCATION MARKETS: Sri Lankan schools and tourism boards have real budgets for AR/VR experiences. Build one polished demo (e.g., a virtual heritage tour). Pitch it with an LKR pricing model (license fee per institution).',
    ],
    project: '🏛️ Sigiriya virtual heritage tour AR app — point your phone at a printed map of Sigiriya and see 3D models of the frescoes, rock fortress, and water gardens pop up. Tap each model for a 30-second audio guide in Sinhala and English.',
    certifications: [
      'Unity Learn AR/VR paths — learn.unity.com (free)',
      'Google ARCore documentation + codelabs — developers.google.com (free)',
      'Coursera: Extended Reality for Everybody — University of Michigan',
    ],
  },

  // ── 24. DIGITAL MARKETING / SEO SPECIALIST ───────────────────────
  {
    keywords: ['digital marketing', 'seo specialist', 'seo', 'search engine optimization', 'google ads',
               'social media marketing', 'content marketing', 'email marketing', 'ppc', 'growth hacker',
               'digital marketer'],
    title: 'Digital Marketing / SEO Specialist',
    salary: 'LKR 60,000–280,000 per month',
    skills: [
      '🔍 SEO — making websites appear on the first page of Google results',
      '📱 Social media marketing — running campaigns on Instagram, Facebook, TikTok',
      '📧 Email marketing — building and nurturing a subscriber list',
      '📊 Google Analytics — tracking who visits your site and what they do',
      '💰 Google Ads / Meta Ads — running paid advertising campaigns with ROI tracking',
    ],
    roadmap: [
      '📚 Step 1 — UNDERSTAND DIGITAL MARKETING FUNDAMENTALS: Complete "Google Digital Marketing Fundamentals" (free certification). It covers SEO, SEM, social media, email, and analytics in plain language. No technical background needed.',
      '🔍 Step 2 — MASTER SEO FIRST: Install Ubersuggest (free plan) or use Google Search Console. Learn: keyword research, on-page SEO (title tags, meta descriptions, headings), and link building. Optimize a free blog or a friend\'s business website and track ranking improvements.',
      '📊 Step 3 — LEARN GOOGLE ANALYTICS: Set up Google Analytics 4 (GA4) on any website (make a free Wix site if needed). Learn to read: traffic sources, bounce rate, conversion goals, and user behavior flow. Data-driven marketers earn far more than guessing marketers.',
      '💰 Step 4 — RUN A REAL AD CAMPAIGN: Create a Facebook Ads or Google Ads account. Run a test campaign with a tiny budget (LKR 1,000–2,000). Document: impressions, clicks, cost-per-click, and conversions. Even a small real campaign teaches more than 10 theory courses.',
      '💼 Step 5 — BUILD A CASE STUDY PORTFOLIO: For 3 Sri Lankan businesses (real or fictional), create a full digital marketing plan: target audience, SEO audit, social media calendar (30 days), ad campaign plan with LKR budget, and expected ROI. This is what agencies want to see.',
    ],
    project: '🍛 Sri Lankan restaurant digital campaign — build a website (free on Wix), optimize it for Google ("best rice and curry in Colombo"), run a Facebook ad campaign for LKR 2,000 targeting locals, build an email list, and report monthly organic vs paid traffic with revenue impact in LKR.',
    certifications: [
      'Google Digital Marketing & E-commerce Certificate — Coursera (free to audit)',
      'HubSpot Content Marketing Certification — hubspot.com (free)',
      'Google Analytics Individual Qualification (GAIQ) — free from Google',
    ],
  },

  // ── 25. TECHNICAL SUPPORT ENGINEER ──────────────────────────────
  {
    keywords: ['technical support', 'tech support', 'customer support engineer', 'support engineer',
               'it helpdesk', 'level 2 support', 'technical support engineer', 'customer success engineer'],
    title: 'Technical Support Engineer',
    salary: 'LKR 55,000–220,000 per month',
    skills: [
      '🔧 Troubleshooting — diagnosing software and hardware issues systematically',
      '🗣️ Customer communication — explaining technical problems in simple language',
      '🌐 Networking basics — understanding connectivity issues (DNS, IP, VPN)',
      '🖥️ Operating systems — supporting Windows, macOS, and Linux users',
      '📋 Ticketing systems — managing support tickets with Zendesk or Freshdesk',
    ],
    roadmap: [
      '📚 Step 1 — LEARN THE FUNDAMENTALS: Complete the "Google IT Support Professional Certificate" on Coursera (6 courses, free to audit). It covers: hardware, networking, operating systems, system administration, and security. This is the best structured path for beginners.',
      '🖥️ Step 2 — GET HANDS-ON WITH OPERATING SYSTEMS: Install Windows 11 and Ubuntu in VirtualBox (free). Practice: installing software, managing users, setting up printers, fixing permission errors, and reading event logs. Speed and confidence in these tasks = getting hired.',
      '🌐 Step 3 — LEARN NETWORKING BASICS FOR SUPPORT: Study: what to do when someone says "I have no internet". Practice: checking IP with ipconfig/ifconfig, pinging to test connectivity, flushing DNS, and resetting a router. These solve 70% of support tickets.',
      '📋 Step 4 — PRACTICE WITH A TICKETING SYSTEM: Sign up for a free Freshdesk account. Create 10 fictional support tickets, assign priorities, write clear responses, and close them with documented solutions. This is what Level 1 and Level 2 support looks like.',
      '💼 Step 5 — VOLUNTEER AND BUILD EXPERIENCE: Offer free IT support to a local school, community centre, or family business for 1 month. Log every issue you solve in a spreadsheet (issue, time taken, solution). This is your experience — list it on your CV as "IT Support Volunteer".',
    ],
    project: '📞 Support knowledge base — document solutions for the 20 most common IT problems in Sri Lankan offices: slow internet, printer not found, forgotten Windows password, virus removal, email setup. Write each solution as a step-by-step guide in Sinhala and English.',
    certifications: [
      'Google IT Support Professional Certificate — Coursera (6 courses, free to audit)',
      'CompTIA A+ — the most respected entry-level IT certification globally',
      'HDI Customer Service Representative (HDI-CSR) — for support roles',
    ],
  },

  // ── 26. IOT & EMBEDDED SYSTEMS DEVELOPER ─────────────────────────
  {
    keywords: ['iot', 'arduino', 'sensor', 'electronics', 'embedded', 'esp32', 'raspberry pi',
               'smart agriculture', 'embedded systems', 'microcontroller', 'firmware developer'],
    title: 'IoT & Embedded Systems Developer',
    salary: 'LKR 90,000–340,000 per month',
    skills: [
      '⚡ Arduino / ESP32 firmware — writing code that runs on tiny microcontrollers',
      '🔌 Electronics basics — reading circuit diagrams and wiring sensors',
      '📡 MQTT / HTTP — sending sensor data to the cloud over Wi-Fi',
      '🐍 Python on Raspberry Pi — running Linux on a small single-board computer',
      '💰 Cost estimation — calculating bill of materials (BOM) in LKR',
    ],
    roadmap: [
      '📚 Step 1 — LEARN ELECTRONICS AND ARDUINO BASICS: Buy a starter kit (LKR ~3,000–5,000 from local electronics shops). Complete the official Arduino tutorials: blink an LED, read a button, control a servo motor. These 3 projects teach you 80% of what you need.',
      '🌡️ Step 2 — ADD SENSORS: Connect a temperature+humidity sensor (DHT22, ~LKR 500), a soil moisture sensor, and a motion sensor. Write code to read values and print them to the Serial Monitor. Log readings to a CSV file every 60 seconds.',
      '📡 Step 3 — SEND DATA TO THE CLOUD: Use an ESP32 (Wi-Fi enabled, ~LKR 800). Send sensor readings to a free MQTT broker (HiveMQ Cloud). Display the data on a free dashboard (Node-RED or Grafana). You have just built a real IoT system.',
      '🔧 Step 4 — BUILD AN ENCLOSURE AND POWER SOLUTION: Your project must survive outdoors. Design a weatherproof box using an IP65 enclosure (~LKR 600). Power it with a solar panel and battery (~LKR 3,000). Calculate total build cost in LKR.',
      '💼 Step 5 — SOLVE A REAL PROBLEM WITH LKR VALUE: Build a solution for Sri Lankan agriculture: smart irrigation that saves 30% water, or a greenhouse temperature monitor with SMS alerts. Measure actual savings. Calculate LKR ROI. Farmers will pay for proven tools.',
    ],
    project: '🌱 Smart greenhouse monitoring system — temperature, humidity, soil moisture, and light sensors inside a small greenhouse. Data sent to a free cloud dashboard every 5 minutes. SMS alert (via Dialog API) when temperature is too high. Full BOM with LKR prices.',
    certifications: [
      'Arduino Official Courses — Arduino.cc/education (free)',
      'Raspberry Pi Certified Educator — raspberrypi.org',
      'MQTT Essentials — HiveMQ (free learning path)',
    ],
  },

  // ── 27. UX / UI DESIGNER ─────────────────────────────────────────
  {
    keywords: ['ux designer', 'ui designer', 'product designer', 'ux researcher', 'user experience designer',
               'figma designer', 'interaction designer', 'visual designer', 'usability', 'user interface designer'],
    title: 'UX / UI Designer',
    salary: 'LKR 80,000–300,000 per month',
    skills: [
      '🎨 Figma — the industry-standard tool for designing and prototyping interfaces',
      '🔬 User research — interviewing users to understand their real needs',
      '📐 Design systems — creating reusable components and style guides',
      '🧪 Usability testing — watching real users interact with your design',
      '📊 Design metrics — measuring task success rate, error rate, and satisfaction',
    ],
    roadmap: [
      '📚 Step 1 — LEARN FIGMA (THE ESSENTIAL TOOL): Figma is free for students. Watch "Figma Tutorial for Beginners" by Flux on YouTube. Learn: frames, components, auto layout, and prototyping. Build a simple 3-screen mobile app mockup by the end of week 1.',
      '🔬 Step 2 — STUDY REAL USER RESEARCH: Interview 5 real people about a problem you want to solve (e.g., how they use apps to pay bills). Ask "why" 5 times for each answer. Write an empathy map and user persona. This research shapes everything you design.',
      '🎨 Step 3 — LEARN DESIGN PRINCIPLES: Study: visual hierarchy, colour contrast (accessibility), typography, spacing, and grid systems. The book "Don\'t Make Me Think" by Steve Krug is short and practical. Apply these rules to redesign an ugly Sri Lankan government website.',
      '🧪 Step 4 — TEST WITH REAL USERS: Build a clickable prototype in Figma and ask 5 people to complete a task (e.g., "Book a bus ticket"). Watch silently — do NOT help them. Note where they get confused. Fix those points. Repeat. This is the most valuable UX skill.',
      '💼 Step 5 — BUILD A CASE STUDY PORTFOLIO: Do 3 full design projects from research to prototype. For each, write a case study: problem → research → insights → design decisions → prototype → test results. Post on Behance or a personal website. Case studies beat pretty mockups every time.',
    ],
    project: '🚌 Sri Lanka bus ticketing app redesign — research current pain points, create user personas for commuters and students, design a modern mobile app in Figma (light/dark mode), prototype the full booking flow, test with 5 real users, and report usability improvement metrics.',
    certifications: [
      'Google UX Design Professional Certificate — Coursera (7 courses, free to audit)',
      'Figma for UX Design — Designlab (free intro)',
      'Interaction Design Foundation — IDF membership (~USD 20/month, cancel anytime)',
    ],
  },
];

const normalise = (value = '') => value.toString().toLowerCase();
const bulletList = (items = []) => items.map(item => `- ${item}`).join('\n');

const pickCareerCard = (message = '') => {
  const text = normalise(message);
  // Return null if no keyword matches — callers must NOT silently default to the AI/ML card.
  return localCareerCards.find(card => card.keywords.some(keyword => text.includes(keyword))) || null;
};

const buildAssessmentSummaryReply = (assessmentContext) => {
  if (!assessmentContext) {
    return `**${AI_NAME} assessment guidance**\n\nI can personalize this better after you complete the Assessment. For now, use this practical path:\n\n1. Finish the Skill Check with at least 4 evidence-based answers.\n2. Pick a Problem-Market Fit area with real users or data.\n3. Open Results and focus on the top 3 gap skills.\n4. Build one portfolio project that proves customer value in LKR.\n\nBring evidence to the competition: screenshots, dataset sample, user feedback, cost estimate, and a 3-minute pitch.`;
  }

  const careers = assessmentContext.predictedCareers?.length
    ? assessmentContext.predictedCareers.map(career => `${career.title || 'Career'} (${career.matchScore || 0}% match)`).join(', ')
    : 'No predicted careers yet';

  return `**${AI_NAME} assessment summary**\n\nYour strongest current signals:\n${bulletList(assessmentContext.topSkills?.length ? assessmentContext.topSkills : ['Complete the practical skill check to generate measured skills'])}\n\nBest career matches:\n- ${careers}\n\nPractical next steps:\n1. Pick the highest-match career and list its top 3 gap skills.\n2. Build one small project that proves those skills with real users, data, or a working demo.\n3. Add LKR cost/value evidence so it works for a Science-to-Business pitch.\n4. Re-run the assessment after adding project proof.`;
};

// ─────────────────────────────────────────────────────────────────────────────
// DEDICATED HANDLERS — exact answers for the 6 suggestion-chip questions
// These are checked BEFORE any career-card keyword matching so a phrase like
// "best LKR potential" never accidentally triggers the Network Engineer card.
// ─────────────────────────────────────────────────────────────────────────────

const buildBestLkrReply = () =>
  `**${AI_NAME} — Best Sri Lankan Tech Careers by LKR Salary** 💰\n\n` +
  `Here is a ranked breakdown of tech roles by earning potential in Sri Lanka:\n\n` +
  `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
  `🥇 **TOP TIER — LKR 140,000–600,000/month**\n` +
  `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
  `• ☁️ Cloud & DevOps Engineer — LKR 140,000–550,000\n` +
  `• 🔐 Site Reliability Engineer (SRE) — LKR 150,000–600,000\n` +
  `• ⛓️ Blockchain / Web3 Developer — LKR 150,000–600,000 *(volatile)*\n` +
  `• 🍎 iOS Developer (Swift) — LKR 120,000–480,000\n` +
  `• 🤖 AI / ML Engineer — LKR 130,000–500,000\n\n` +
  `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
  `🥈 **MID TIER — LKR 100,000–450,000/month**\n` +
  `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
  `• 🔬 Data Scientist — LKR 110,000–450,000\n` +
  `• ☕ Software Engineer (Backend) — LKR 100,000–450,000\n` +
  `• 🔄 Data Engineer — LKR 120,000–480,000\n` +
  `• 🛡️ Cybersecurity Analyst — LKR 100,000–400,000\n` +
  `• 🌐 Network Engineer — LKR 80,000–350,000\n` +
  `• ⚙️ ERP / SAP Consultant — LKR 120,000–500,000\n\n` +
  `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
  `🥉 **GROWTH TIER — LKR 75,000–380,000/month**\n` +
  `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
  `• 📱 Mobile App Developer — LKR 90,000–380,000\n` +
  `• 🌐 Full-Stack Web Developer — LKR 95,000–400,000\n` +
  `• 🖥️ IT Project Manager — LKR 120,000–450,000\n` +
  `• 🧪 QA / Test Engineer — LKR 75,000–320,000\n` +
  `• 🗄️ Database Administrator — LKR 100,000–380,000\n\n` +
  `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
  `💡 **PathGuider's Honest Advice**\n` +
  `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
  `The **highest salary** goes to people who can:\n` +
  `1️⃣ Show a live working demo (not just a certificate)\n` +
  `2️⃣ Prove measurable business value in LKR\n` +
  `3️⃣ Work in Cloud, AI/ML, or Security — Sri Lanka's fastest-growing areas\n\n` +
  `🚀 Ask me *"roadmap to become a Cloud Engineer"* to start the highest-paying path today!`;

const buildMlSkillsReply = () => {
  const card = localCareerCards.find(c => c.title.includes('AI / Machine Learning'));
  return `**${AI_NAME} — Skills for ML Engineering** 🤖\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💡 **ESSENTIAL SKILLS (in learning order)**\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    (card ? card.skills.map((s, i) => `${i + 1}. ${s}`).join('\n') : '') + '\n\n' +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🗺️ **WHERE TO START — Quick 3-step plan**\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `1️⃣ **Python first** — Complete "Python for Everybody" on Coursera (free to audit). Focus on: lists, loops, functions, and reading CSV files. This is 80% of ML day-to-day work.\n\n` +
    `2️⃣ **Statistics basics** — Study mean, median, standard deviation, and probability on Khan Academy (free). You need these to understand why models work.\n\n` +
    `3️⃣ **Your first model** — Take Andrew Ng's Machine Learning course on Coursera (free to audit). Build a house price predictor on a Sri Lankan dataset as your first project.\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🚀 **PORTFOLIO PROJECT IDEA**\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `${card ? card.project : '🌿 Tea leaf quality grading app with before/after value in LKR.'}\n\n` +
    `**Sri Lanka salary:** ${card ? card.salary : 'LKR 130,000–500,000 per month'}\n\n` +
    `💬 Ask me *"full roadmap for ML Engineering"* to see all 5 detailed steps!`;
};

const buildSchoolDropoutRoadmapReply = () => {
  const card = localCareerCards.find(c => c.title.includes('Data Analyst'));
  const steps = card ? card.roadmap.map((s, i) => `${i + 1}️⃣ ${s}`).join('\n\n') : '';
  return `**${AI_NAME} Roadmap: School Dropout Dashboard (Data Analyst Path)** 📊\n\n` +
    `Building a school dropout risk dashboard is a perfect Data Analyst portfolio project. Here is your complete plan:\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🗂️ **THE PROJECT PLAN**\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📌 **What to build:** A Power BI or Tableau dashboard that shows school principals which students are at risk of dropping out — before it happens.\n\n` +
    `📌 **Data you need (free sources):**\n` +
    `• Student attendance records (% per month)\n` +
    `• Exam score trends (declining = risk signal)\n` +
    `• Fee payment gaps (financial stress indicator)\n` +
    `• Distance from school (transport barrier)\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🎯 **YOUR 5-STEP ACTION PLAN**\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `1️⃣ **Get the data** — Download a free student dataset from Kaggle ("Student Performance" dataset). Or create a realistic mock dataset in Excel with 100 students and 5 columns.\n\n` +
    `2️⃣ **Clean it in Excel or Python** — Remove blanks, fix inconsistent values, create a "Risk Score" column (0–10) based on attendance + grades + fees.\n\n` +
    `3️⃣ **Analyze with SQL** — Load your data into a free PostgreSQL or SQLite database. Write queries to answer: "Which zone has the most at-risk students?", "Which grade level drops out the most?"\n\n` +
    `4️⃣ **Build the dashboard** — Open Power BI Desktop (free). Create 4 visuals: dropout risk by school zone (map), monthly attendance trend (line chart), fee payment status (bar chart), and a Top 10 at-risk students table.\n\n` +
    `5️⃣ **Add recommendations** — Below the dashboard, add a "Principal Action Plan": 3 specific LKR-costed interventions (e.g., "Free transport for Zone B = LKR 8,000/month, prevents 12 dropouts").\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💡 **SKILLS THIS PROJECT PROVES**\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `${card ? card.skills.map(s => `• ${s}`).join('\n') : ''}\n\n` +
    `**Sri Lanka salary for Data Analyst:** ${card ? card.salary : 'LKR 85,000–300,000 per month'}\n\n` +
    `✨ *This project alone can get you hired — it solves a real problem, uses real data skills, and shows business value in LKR!*`;
};

const buildFirstCertReply = (assessmentContext) => {
  const topCareer = assessmentContext?.predictedCareers?.[0]?.title || null;
  const card = topCareer ? localCareerCards.find(c => c.title.toLowerCase().includes(topCareer.toLowerCase().split(' ')[0])) : null;

  return `**${AI_NAME} — Which Certification Should You Get First?** 🏆\n\n` +
    (card
      ? `Based on your assessment, your top career match is **${topCareer}**. Here are the best certs for that path:\n\n${card.certifications.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n`
      : '') +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🎯 **PathGuider's Universal Cert Advice for Sri Lanka**\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `**If you are a complete beginner → Start here:**\n` +
    `1. 🔵 **Google IT Support Certificate** (Coursera) — Free to audit, 6 months. Opens doors to IT Support, SysAdmin, and Helpdesk roles. LKR 55,000–220,000/month entry salary.\n\n` +
    `**If you want to code → Pick your path:**\n` +
    `2. 🟢 **freeCodeCamp Web Development** — Free, self-paced. Best first step for Web or Frontend Developer roles.\n` +
    `3. 🟡 **Google Data Analytics** (Coursera) — Free to audit. Best for Data Analyst / BI roles. LKR 85,000–300,000/month.\n\n` +
    `**If you want higher salary fast → Go cloud:**\n` +
    `4. ☁️ **AWS Cloud Practitioner** — LKR ~15,000 exam fee. The single cert that unlocks the highest-paying Sri Lankan IT jobs. Cloud & DevOps pays LKR 140,000–550,000/month.\n\n` +
    `**If you want security → Start here:**\n` +
    `5. 🔐 **Google Cybersecurity Certificate** (Coursera) — Free to audit, 6 months. Leads into CompTIA Security+ which commands LKR 100,000–400,000/month.\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💡 **The Golden Rule**\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `**Always pair a certificate with a project.** A certificate proves you studied. A project proves you can *do the work*. Employers in Sri Lanka hire people who can demonstrate real skills — not just show a PDF.\n\n` +
    `🚀 Tell me your target role and I'll give you the exact cert roadmap for it!`;
};

const buildPitchReply = () =>
  `**${AI_NAME} — Turn Your Prototype into a Business Pitch** 💼\n\n` +
  `You built something — now let's make it worth money. Here is the exact framework:\n\n` +
  `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
  `🎯 **THE 5-PART PITCH STRUCTURE**\n` +
  `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
  `1️⃣ **THE PROBLEM (30 seconds)**\n` +
  `Start with a real Sri Lankan pain point. Use a specific number.\n` +
  `❌ *"Farmers waste water"*\n` +
  `✅ *"Sri Lankan paddy farmers lose LKR 45,000 per season due to over-irrigation. There is no affordable real-time soil monitoring solution under LKR 10,000."*\n\n` +
  `2️⃣ **YOUR SOLUTION (30 seconds)**\n` +
  `Show your prototype — live, not slides. Say exactly what it does.\n` +
  `✅ *"I built a soil moisture sensor system with an ESP32. It sends real-time data to a dashboard and triggers irrigation automatically. Total build cost: LKR 4,500."*\n\n` +
  `3️⃣ **THE PROOF (60 seconds)**\n` +
  `This is the most important part. Show measurable results:\n` +
  `• Screenshot or live demo of your working prototype\n` +
  `• Before vs after numbers (water used, time saved, error rate reduced)\n` +
  `• At least one real user who tested it and gave feedback\n\n` +
  `4️⃣ **THE BUSINESS MODEL (30 seconds)**\n` +
  `Explain how money flows — in LKR:\n` +
  `✅ *"Each unit sells for LKR 8,500. At 100 units/year, revenue = LKR 850,000. Cost of goods = LKR 4,500 × 100 = LKR 450,000. Gross profit = LKR 400,000."*\n\n` +
  `5️⃣ **THE ASK (15 seconds)**\n` +
  `Be specific about what you need:\n` +
  `✅ *"I am looking for a LKR 150,000 pilot grant to test 30 units with farmers in Anuradhapura. I will report back with 3-month data."*\n\n` +
  `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
  `📋 **YOUR PITCH CHECKLIST**\n` +
  `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
  `☐ Live working demo (not a video of a demo — actual live)\n` +
  `☐ 1 real user with a quote or feedback\n` +
  `☐ LKR cost/savings number (specific, not a range)\n` +
  `☐ Slide deck: max 6 slides (Problem / Solution / Proof / Business / Team / Ask)\n` +
  `☐ Practised delivery under 3 minutes\n\n` +
  `✨ *Judges fund solutions to real problems — make sure the problem, the proof, and the LKR value are crystal clear!*`;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN LOCAL REPLY BUILDER
// ─────────────────────────────────────────────────────────────────────────────
const buildLocalReply = (message, assessmentContext) => {
  const text = normalise(message);

  // ── 1. Assessment / profile questions ───────────────────────────────────
  if (text.includes('assessment') || text.includes('analyze my') || text.includes('analyse my')
      || text.includes('my result') || text.includes('suggest next step') || text.includes('next step')) {
    return buildAssessmentSummaryReply(assessmentContext);
  }

  // ── 2. SPECIFIC SUGGESTION CHIP HANDLERS (checked before keyword matching) ──
  // "Which Sri Lankan tech career has the best LKR potential?"
  if ((text.includes('best') || text.includes('highest') || text.includes('top')) &&
      (text.includes('lkr') || text.includes('salary') || text.includes('pay') || text.includes('earn') || text.includes('potential'))) {
    return buildBestLkrReply();
  }

  // "What skills do I need for ML engineering?"
  if ((text.includes('skill') || text.includes('what do i need') || text.includes('require'))
      && (text.includes('ml') || text.includes('machine learning') || text.includes('ai engineer'))) {
    return buildMlSkillsReply();
  }

  // "Build a roadmap for a school dropout dashboard"
  if (text.includes('school dropout') || text.includes('dropout dashboard') || text.includes('dropout risk')) {
    return buildSchoolDropoutRoadmapReply();
  }

  // "What certification should I get first?" — no specific role mentioned
  if ((text.includes('certification') || text.includes('certificate') || text.includes('cert'))
      && (text.includes('first') || text.includes('which') || text.includes('best') || text.includes('start') || text.includes('should i'))) {
    return buildFirstCertReply(assessmentContext);
  }

  // "How can I turn my prototype into a business pitch?"
  if (text.includes('prototype') || text.includes('business pitch') || text.includes('pitch')
      || text.includes('commerciali') || text.includes('turn my')) {
    return buildPitchReply();
  }

  // ── 3. Salary comparison — general (no role specified) ───────────────────
  if ((text.includes('salary') || text.includes('earn') || text.includes('income'))
      && (text.includes('compare') || text.includes('which') || text.includes('best') || text.includes('highest'))) {
    return buildBestLkrReply();
  }

  // ── 4. Career card matching — role-specific questions ────────────────────
  const card = pickCareerCard(message);

  // No matching card — helpful generic response
  if (!card) {
    return `**${AI_NAME} — Career Guidance** 🧭\n\nI don't have a built-in card for that specific role yet. Here is a universal framework for any IT career:\n\n**📋 Your 5-Step Action Plan:**\n\n1️⃣ **Research the role** — Search LinkedIn Jobs for your target role + "Sri Lanka". Read 10 job postings and list the top 10 required skills.\n\n2️⃣ **Pick one learning resource** — Choose ONE free course and complete it fully (Coursera, freeCodeCamp, YouTube). Don't jump between 5 courses.\n\n3️⃣ **Build a portfolio project** — Create one real working project that solves a real Sri Lankan problem. Put it on GitHub.\n\n4️⃣ **Add LKR business value** — Calculate how much time or money your project saves a Sri Lankan business. Add that number to your portfolio.\n\n5️⃣ **Apply and network** — Share your project on LinkedIn. Connect with 10 professionals in your target role.\n\n💡 Try asking:\n- *"roadmap to become a Data Scientist"*\n- *"what skills do I need for Cloud Engineering?"*\n- *"which Sri Lankan tech career has the best LKR potential?"*\n\n🚀 Every expert was once a complete beginner!`;
  }

  const personalLine = assessmentContext?.topSkills?.length
    ? `\n\n📊 **Your assessment shows your strongest skills are:** ${assessmentContext.topSkills.slice(0, 3).join(', ')} — these give you a head start!`
    : '';

  // ── 5. Role-specific certification questions ─────────────────────────────
  if (text.includes('certification') || text.includes('certificate') || text.includes('cert')) {
    return `**${AI_NAME} — Certifications for ${card.title}** 🏆\n\n**Best certifications to get (in order):**\n${card.certifications.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n💡 **Pro tip:** Always pair each cert with a working project. A certificate proves you studied. A project proves you can do the work.\n\n**Your portfolio project:**\n📌 ${card.project}\n\n**Sri Lanka salary once certified:** ${card.salary}${personalLine}`;
  }

  // ── 6. Role-specific salary questions ────────────────────────────────────
  if (text.includes('salary') || text.includes('pay') || text.includes('earn') || text.includes('income') || text.includes('lkr')) {
    return `**${AI_NAME} — Salary Insights: ${card.title}** 💰\n\n**Sri Lanka salary range:** ${card.salary}\n\n**How to reach the higher end of the range:**\n\n${card.roadmap.slice(3).map((s, i) => `${i + 4}️⃣ ${s}`).join('\n\n')}\n\n**Skills that command higher salaries:**\n${card.skills.slice(0, 3).map(s => `• ${s}`).join('\n')}\n\n**Portfolio project that justifies a higher salary:**\n📌 ${card.project}${personalLine}`;
  }

  // ── 7. Role-specific skills questions ────────────────────────────────────
  if (text.includes('skill') || text.includes('what do') || text.includes('require') || text.includes('need')) {
    return `**${AI_NAME} — Skills for ${card.title}** 💡\n\n**Essential skills to build:**\n${card.skills.map(s => `• ${s}`).join('\n')}\n\n**Where to start — your first 3 steps:**\n\n1️⃣ ${card.roadmap[0]}\n\n2️⃣ ${card.roadmap[1]}\n\n3️⃣ ${card.roadmap[2]}\n\n**Prove your skills with this project:**\n📌 ${card.project}\n\n**Sri Lanka salary:** ${card.salary}${personalLine}`;
  }

  // ── 8. Roadmap / learning path questions ─────────────────────────────────
  const isRoadmapRequest = ['roadmap', 'learn', 'become', 'start', 'begin', 'how to', 'guide',
    'transition', 'steps', 'path', 'get into', 'break into', 'switch'].some(kw => text.includes(kw));

  if (isRoadmapRequest) {
    const roadmapSteps = card.roadmap.map((step, i) => `${i + 1}️⃣ ${step}`).join('\n\n');
    return `**${AI_NAME} Roadmap: ${card.title}** 🗺️\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🎯 **YOUR STEP-BY-STEP ACTION PLAN**\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${roadmapSteps}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💡 **TOP SKILLS TO BUILD**\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `${card.skills.map(s => `• ${s}`).join('\n')}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🏆 **RECOMMENDED CERTIFICATIONS**\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `${card.certifications.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🚀 **PORTFOLIO PROJECT IDEA**\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `${card.project}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 **SRI LANKA SALARY SIGNAL**\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `${card.salary}${personalLine}\n\n` +
      `✨ *Start today — open Step 1 right now. The roadmap only works if you take action!*`;
  }

  // ── 9. Default general answer for a matched card ─────────────────────────
  return `**${AI_NAME} — Quick Guide: ${card.title}** ⚡\n\n` +
    `**Essential skills:**\n${card.skills.map(s => `• ${s}`).join('\n')}\n\n` +
    `**Quick-start — your first 3 steps:**\n\n` +
    `1️⃣ ${card.roadmap[0]}\n\n` +
    `2️⃣ ${card.roadmap[1]}\n\n` +
    `3️⃣ ${card.roadmap[2]}\n\n` +
    `**Best portfolio project:**\n📌 ${card.project}\n\n` +
    `**Sri Lanka salary:** ${card.salary}\n\n` +
    `💬 Ask me *"full roadmap for ${card.title}"* to see all 5 steps in detail!${personalLine}`;
};

const getReply = async ({ contents, message, assessmentContext }) => {
  try {
    return { reply: await callGemini(contents), mode: 'gemini' };
  } catch (err) {
    return { reply: buildLocalReply(message, assessmentContext), mode: 'local-fallback' };
  }
};

const chatSessions = new Map();
const MAX_HISTORY = 20;

// ─────────────────────────────────────────────────────────────────
// @POST /api/nexus/chat
// Send a message to PathGuide AI
// ─────────────────────────────────────────────────────────────────
router.post('/chat', protect, async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ success: false, error: 'Message is required' });

  // Load history
  let history = chatSessions.get(req.user.id) || [];

  // Build assessment context (latest analyzed assessment)
  let assessmentContext = null;
  try {
    const assessment = await Assessment.findOne({ user: req.user.id, status: 'analyzed' })
      .sort({ createdAt: -1 })
      .populate('predictedCareers.careerPath', 'title industry salaryPotential')
      .lean();
    if (assessment) {
      assessmentContext = {
        topSkills: assessment.skillRatings?.slice(0, 5).map(s => `${s.name} (${s.proficiency}/5)`) || [],
        interests: assessment.extractedInterests?.slice(0, 5) || [],
        topLanguages: assessment.githubData?.topLanguages?.slice(0, 3).map(l => l.language) || [],
        predictedCareers: assessment.predictedCareers?.slice(0, 3).map(p => ({
          title: p.careerPath?.title,
          matchScore: p.matchScore,
          gapSkills: p.gapSkills?.slice(0, 3),
        })) || [],
        aptitudeScore: assessment.githubData?.contributionScore || null,
      };
    }
  } catch (_) { /* Non-critical — continue without context */ }

  try {
    const contents = buildContents(
      history.length > MAX_HISTORY ? history.slice(-MAX_HISTORY) : history,
      message.trim(),
      history.length === 0 ? assessmentContext : null, // inject context only on first message
    );

    const { reply, mode } = await getReply({
      contents,
      message: message.trim(),
      assessmentContext,
    });

    // Update history
    history = [
      ...history,
      { role: 'user', content: message.trim() },
      { role: 'assistant', content: reply },
    ].slice(-MAX_HISTORY);
    chatSessions.set(req.user.id, history);

    res.json({ success: true, data: { reply, historyLength: history.length, mode } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// @DELETE /api/nexus/chat
// Clear conversation history
// ─────────────────────────────────────────────────────────────────
router.delete('/chat', protect, (req, res) => {
  chatSessions.delete(req.user.id);
  res.json({ success: true, message: 'Conversation cleared' });
});

// ─────────────────────────────────────────────────────────────────
// @POST /api/nexus/chat/guest  ← No auth, stateless, 5-message limit
// ─────────────────────────────────────────────────────────────────
router.post('/chat/guest', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ success: false, error: 'Message is required' });
  if (history.length > 10) return res.status(429).json({ success: false, error: 'Guest limit reached. Please sign in for unlimited access.' });

  try {
    const contents = buildContents(history, message.trim(), null);
    const { reply, mode } = await getReply({
      contents,
      message: message.trim(),
      assessmentContext: null,
    });
    res.json({ success: true, data: { reply, mode } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
