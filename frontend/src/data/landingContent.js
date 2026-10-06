import { Bell, Check, ClipboardList, Eye, MessageCircle, Search, Send, ShieldCheck, Users } from 'lucide-react'

export const ecosystemFeatures = [
  {
    icon: ClipboardList,
    title: 'Live status and progress',
    text: 'Follow every complaint from submitted to resolved, with a clear status and progress bar you can check any time.',
  },
  {
    icon: Bell,
    title: 'Update notifications',
    text: 'Get a notification when an officer reviews, acts on or closes your complaint, so you never have to chase.',
  },
  {
    icon: MessageCircle,
    title: 'Ask WaKiL AI',
    text: 'Ask questions in plain language about your complaints and local services, and get an answer straight away.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified updates from your representative',
    text: "See updates from your elected representative's office, marked as verified so you know they are genuine.",
  },
]

export const ecosystemSteps = [
  {
    icon: Send,
    title: 'Report',
    text: 'Describe the issue with WaKiL AI or the complaint form and add the location.',
  },
  {
    icon: Search,
    title: 'Track',
    text: 'Watch the status change and get a notification each time an officer updates it.',
  },
  {
    icon: Check,
    title: 'Get resolved',
    text: 'The issue is fixed and your complaint is closed, with the full history kept for you to see.',
  },
]

// TODO: replace with real API data
export const pilotStats = {
  received: 128,
  resolved: 74,
  avgFirstResponseDays: 2.4,
  pilotAreas: 2,
  categories: [
    { name: 'Roads', count: 47 },
    { name: 'Street lights', count: 31 },
    { name: 'Drainage', count: 28 },
    { name: 'Rubbish', count: 22 },
  ],
}

export const transparencyPoints = [
  'Only aggregated figures are shown publicly. Names, contact details and exact addresses are never published.',
  'Data handling is designed with the Personal Data Protection Act 2010 in mind.',
  'Each resident can see the status history of the complaints they filed.',
]

export const aboutValues = [
  {
    icon: Eye,
    title: 'Transparency',
    text: 'Every complaint has a visible status, and aggregated results are open to everyone.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust',
    text: 'Verified identity and careful data handling protect residents and their representatives.',
  },
  {
    icon: Users,
    title: 'Action',
    text: 'A conversation should lead to a fix, so reports become assigned, tracked work.',
  },
]

export const pilotAreas = [
  { code: 'P121', name: 'Lembah Pantai' },
  { code: 'P130', name: 'Raub' },
]
