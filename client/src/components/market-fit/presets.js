export const DOMAINS = [
  { id: 'edtech', label: 'EdTech & Schools', tags: ['Education', 'Data', 'UX'] },
  { id: 'agritech', label: 'AgriTech & IoT', tags: ['Agriculture', 'IoT', 'Sensors'] },
  { id: 'sme', label: 'SME Business Tools', tags: ['Business', 'Analytics', 'SQL'] },
  { id: 'security', label: 'Cybersecurity', tags: ['Security', 'Risk', 'Networking'] },
]

export const PROOFS = {
  edtech: [
    { id: 'csv', label: 'Analyze CSV Data', tags: ['Data', 'Excel'] },
    { id: 'interview', label: 'Interview 5+ Users', tags: ['User Research', 'Communication'] },
    { id: 'pilot', label: 'Pilot at a local school', tags: ['Pilot', 'Field Study'] },
  ],
  agritech: [
    { id: 'sensor', label: 'Deploy sensor prototype', tags: ['IoT', 'Electronics'] },
    { id: 'dataset', label: 'Analyze field dataset', tags: ['Data', 'Statistics'] },
    { id: 'pilot', label: 'Pilot in a farm', tags: ['Pilot', 'Field Study'] },
  ],
  sme: [
    { id: 'sales_csv', label: 'Analyze sales CSV', tags: ['Data', 'Excel'] },
    { id: 'interview', label: 'Interview shop owners', tags: ['User Research', 'Communication'] },
    { id: 'dashboard', label: 'Build simple dashboard', tags: ['Dashboard', 'Analytics'] },
  ],
  security: [
    { id: 'audit', label: 'Run quick security checklist', tags: ['Security', 'Risk Assessment'] },
    { id: 'phishing', label: 'Phishing simulation', tags: ['Security', 'Training'] },
    { id: 'pilot', label: 'Pilot controls at one site', tags: ['Pilot', 'Networking'] },
  ],
}
