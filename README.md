# AI-Driven Skill-to-Career Pathway Predictor

Competition-ready MERN prototype for SLIIT Ignite Innovation 2026.

The project now focuses on a clear Science-to-Business story: students enter skills and interests, the system matches them to practical Sri Lanka-relevant career pathways, and each result includes market evidence, LKR salary bands, learning cost/time, customer use cases, and a prototype idea that can become a commercial product.

## Why This Fits Ignite Innovation

- Scientific base: skill inference, weighted scoring, market-signal modelling, data analytics, AI/ML, IoT, cloud, cybersecurity, and human-computer interaction.
- Working prototype: interactive web app with assessment, GitHub skill scan, market-backed matching, and roadmap dashboard.
- Commercial value: each career result explains who pays, why they pay, likely employer/customer types, estimated build cost, and a revenue model.
- Sri Lanka focus: seed data is designed around local ICT/BPM, export services, youth employability, and practical monthly LKR salary estimates.

## Market Sources Used

- Sri Lanka Export Development Board ICT/BPM National Export Strategy: https://www.srilankabusiness.com/national-export-strategy/nes-ict-bpm.html
- SLASSCOM Employability Skills Report 2024: https://slasscom.lk/wp-content/uploads/2024/07/SLASSCOM-EMPLOYABILITY-SKILLS-REPORT-2024.pdf
- Department of Census and Statistics Labour Force Survey 2024: https://www.statistics.gov.lk/Resource/en/LabourForce/Annual_Reports/LFS2024.pdf
- Sri Lanka services export reporting for 2024: https://economynext.com/sri-lanka-services-exports-us3467mn-in-2024-up-8-5-pct-201665/
- SLASSCOM Future Careers Bridge: https://old.slasscom.lk/slasscoms-new-future-careers-bridge-fcb-platform-opens-pathways-to-ict-careers-for-sri-lankas-youth/

## Run Locally

```bash
npm install
npm install --prefix client
npm run seed
npm run dev
```

Create `.env` with:

```env
MONGO_URI=mongodb://localhost:27017/career_pathway_db
JWT_SECRET=replace_with_a_secret
GEMINI_API_KEY=optional_for_simulation_chat
CLIENT_URL=http://localhost:5173
```

## Judge Demo Flow

1. Start at the home page and explain the problem: students often choose careers without local market evidence.
2. Complete the assessment with skills like Python, SQL, Data Analysis, IoT, or Security.
3. Show the results dashboard: match score, skill gaps, Sri Lankan demand score, LKR salary bands, sources, and business use cases.
4. Open the prototype pitch card and explain the scientific principle, target customer, estimated build cost, and revenue model.
5. Run the Career Commercial Simulator to show LKR monthly salary projection, LKR prototype investment, break-even period, skill gaps, and a month-by-month plan from learning to pilot to commercialization.
