export const marketFitPresets = [
  {
    id: 'edtech',
    label: 'EdTech & Schools',
    tags: ['Data', 'AI', 'UX', 'research'],
    proofOptions: [
      {
        id: 'csv',
        label: 'Analyze CSV data',
        helper: 'Use attendance, marks, or survey data.',
        signals: ['Data', 'Excel', 'Python'],
      },
      {
        id: 'interviews',
        label: 'Interview 5 users',
        helper: 'Talk to students, teachers, or parents.',
        signals: ['UX', 'research', 'communication'],
      },
      {
        id: 'pilot',
        label: 'Pilot at a local school',
        helper: 'Test in one class, club, or office.',
        signals: ['education', 'social impact', 'validation'],
      },
    ],
  },
  {
    id: 'agritech',
    label: 'AgriTech & IoT',
    tags: ['IoT', 'Agriculture', 'sensors', 'data'],
    proofOptions: [
      {
        id: 'field',
        label: 'Field observation',
        helper: 'Watch real crop, soil, or water conditions.',
        signals: ['Agriculture', 'research'],
      },
      {
        id: 'sensor',
        label: 'Test a sensor reading',
        helper: 'Collect live readings from a device.',
        signals: ['IoT', 'Sensors', 'Electronics'],
      },
      {
        id: 'pilot',
        label: 'Pilot at a farm site',
        helper: 'Try it with a grower or agri officer.',
        signals: ['validation', 'business', 'deployment'],
      },
    ],
  },
  {
    id: 'sme',
    label: 'SME Business Tools',
    tags: ['Data', 'SQL', 'business', 'cloud'],
    proofOptions: [
      {
        id: 'dashboard',
        label: 'Analyze sales or stock data',
        helper: 'Turn records into a simple dashboard.',
        signals: ['Data', 'SQL', 'analytics'],
      },
      {
        id: 'owner',
        label: 'Interview a business owner',
        helper: 'Learn what problem costs money or time.',
        signals: ['business', 'communication', 'research'],
      },
      {
        id: 'pilot',
        label: 'Pilot in a local shop',
        helper: 'Show one workflow that saves time.',
        signals: ['validation', 'Entrepreneurship', 'deployment'],
      },
    ],
  },
  {
    id: 'cyber',
    label: 'Cybersecurity',
    tags: ['Cybersecurity', 'security', 'risk', 'networking'],
    proofOptions: [
      {
        id: 'audit',
        label: 'Run a security checklist',
        helper: 'Check passwords, sharing, and access.',
        signals: ['Security', 'Risk Assessment'],
      },
      {
        id: 'interviews',
        label: 'Interview 5 users',
        helper: 'Ask what threats they actually face.',
        signals: ['research', 'communication'],
      },
      {
        id: 'pilot',
        label: 'Pilot at a local office',
        helper: 'Test in a real school or SME setup.',
        signals: ['validation', 'business', 'networking'],
      },
    ],
  },
]

export const getMarketFitPreset = (presetId) => marketFitPresets.find(item => item.id === presetId) || null
