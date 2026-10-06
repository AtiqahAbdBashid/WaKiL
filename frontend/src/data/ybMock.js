// TODO: replace with real API data
export const ybUser = {
  name: 'Service Officer P121',
  initials: 'SO',
  role: 'Lembah Pantai',
  area: 'YB Office',
}

export const watchedAreas = [
  { name: 'Taman Sri Muda', tone: 'brand' },
  { name: 'Section 25', tone: 'accent' },
  { name: 'Section 27', tone: 'mint' },
]

export const constituency = { name: 'Lembah Pantai (P121)', note: 'Pilot · sample data' }

// TODO: replace with real API data
export const ybComplaints = [
  { id: '0008', title: 'Two street lights out on main road', area: 'Taman Sri Muda', category: 'Street lights', date: '23 Sep 2026', status: 'New', group: 'This week' },
  { id: '0006', title: 'Fallen tree branch blocking lane', area: 'Section 31', category: 'Roads', date: '22 Sep 2026', status: 'New', group: 'This week' },
  { id: '0009', title: 'Missing drain cover near the school', area: 'Section 31', category: 'Drainage', date: '22 Sep 2026', status: 'New', group: 'This week' },
  { id: '0003', title: 'Deep pothole at junction', area: 'Section 25', category: 'Roads', date: '19 Sep 2026', status: 'In Action', group: 'This week' },
  { id: '0007', title: 'Overflowing public bins at market', area: 'Section 27', category: 'Rubbish', date: '18 Sep 2026', status: 'In Review', group: 'Earlier' },
  { id: '0010', title: 'Road sinking near the bus stop', area: 'Section 27', category: 'Roads', date: '10 Sep 2026', status: 'In Review', group: 'Earlier' },
  { id: '0004', title: 'Drain blocked after rain', area: 'Section 25', category: 'Drainage', date: '5 Sep 2026', status: 'In Action', group: 'Earlier' },
  { id: '0005', title: 'Cracked pavement outside the school', area: 'Section 31', category: 'Roads', date: '3 Sep 2026', status: 'Resolved', group: 'Earlier' },
  { id: '0002', title: 'Uncollected rubbish behind the shops', area: 'Section 27', category: 'Rubbish', date: '30 Aug 2026', status: 'Resolved', group: 'Earlier' },
  { id: '0001', title: 'Flickering street light on Jalan 3', area: 'Taman Sri Muda', category: 'Street lights', date: '28 Aug 2026', status: 'Resolved', group: 'Earlier' },
]

export const categoryBars = {
  Roads: 'bg-brand',
  'Street lights': 'bg-accent',
  Drainage: 'bg-violet',
  Rubbish: 'bg-mint',
}

export const officers = [
  { name: 'Aina', initials: 'A', tone: 'brand' },
  { name: 'Kumar', initials: 'K', tone: 'mint' },
  { name: 'Farid', initials: 'F', tone: 'accent' },
  { name: 'Mei', initials: 'M', tone: 'neutral' },
]

// x, y and r are percentages of the map box
export const hotspots = [
  { area: 'Section 25', x: 56, y: 62, r: 15, color: 'bg-accent', hot: true },
  { area: 'Taman Sri Muda', x: 22, y: 42, r: 9, color: 'bg-accent' },
  { area: 'Section 31', x: 78, y: 26, r: 7, color: 'bg-mint' },
  { area: 'Section 27', x: 85, y: 76, r: 8, color: 'bg-violet' },
]
