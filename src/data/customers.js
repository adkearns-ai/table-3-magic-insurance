// High-value realistic customer profiles for insurance next-best-action & retention
export const INITIAL_CUSTOMERS = [
  {
    id: 'CUST-8021',
    name: 'Sarah & David Jenkins',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    age: 34,
    household: 'Married, 1 Newborn (Lucas, 3 months)',
    location: 'Austin, TX',
    occupation: 'Senior UX Designer & Mechanical Engineer',
    tenureYears: 4.2,
    totalAnnualPremium: 1840,
    estimatedLTV: 28500,
    churnRiskScore: 68, // High risk due to rate hike + life transition
    churnRiskTier: 'HIGH',
    churnDrivers: [
      'Auto renewal rate jumped +16% last month',
      'No life insurance coverage with current carrier',
      'Visited "Policy Cancellation FAQ" 3 days ago'
    ],
    activePolicies: [
      { id: 'POL-A109', type: 'Auto Comprehensive (2 Vehicles)', annualPremium: 1460, status: 'Active', renewalDate: '2026-11-15' },
      { id: 'POL-R402', type: 'Renters Liability ($50k contents)', annualPremium: 380, status: 'Active', renewalDate: '2027-02-01' }
    ],
    detectedSignals: [
      {
        id: 'SIG-901',
        type: 'NEW_CHILD',
        title: 'Newborn Lucas Added to Healthcare Registry',
        timestamp: '3 days ago',
        source: 'Vital Statistics & Dependent Enrollment Stream',
        confidence: 0.96,
        status: 'Unaddressed'
      },
      {
        id: 'SIG-902',
        type: 'HOME_PURCHASE',
        title: 'Underwriting Mortgage Ingestion (Austin Suburbs, 4-bed)',
        timestamp: 'Yesterday',
        source: 'Fintech Credit Bureau Ping',
        confidence: 0.88,
        status: 'Emerging'
      }
    ],
    digitalEngagement: {
      appLoginsLast30Days: 9,
      npsScore: 7,
      sentiment: 'Cautionary - Cost Conscious'
    },
    agentStatus: 'ACTION_REQUIRED',
    lastContactDate: '2026-08-10'
  },
  {
    id: 'CUST-4192',
    name: 'Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
    age: 43,
    household: 'Married, 2 Children (Ages 8 & 11)',
    location: 'Denver, CO',
    occupation: 'VP of Engineering',
    tenureYears: 6.5,
    totalAnnualPremium: 2200,
    estimatedLTV: 45000,
    churnRiskScore: 32,
    churnRiskTier: 'LOW',
    churnDrivers: [
      'Competitor shopping detected for umbrella policy',
      'Unprotected high-net-worth real estate exposure'
    ],
    activePolicies: [
      { id: 'POL-A882', type: 'Auto Comprehensive (Porsche Macan & Audi Q7)', annualPremium: 2200, status: 'Active', renewalDate: '2027-04-10' }
    ],
    detectedSignals: [
      {
        id: 'SIG-302',
        type: 'HOME_PURCHASE',
        title: 'Single-Family Home Purchase Closed ($840,000)',
        timestamp: '4 days ago',
        source: 'County Public Deed Registry',
        confidence: 0.99,
        status: 'Unaddressed'
      },
      {
        id: 'SIG-303',
        type: 'PROPERTY_RISK',
        title: 'In-Ground Heated Pool & Trampoline Permit Filed',
        timestamp: '1 week ago',
        source: 'Municipal Permitting API',
        confidence: 0.94,
        status: 'Unaddressed'
      }
    ],
    digitalEngagement: {
      appLoginsLast30Days: 4,
      npsScore: 9,
      sentiment: 'Affluent - Values Seamless Coverage'
    },
    agentStatus: 'ACTION_REQUIRED',
    lastContactDate: '2026-06-20'
  },
  {
    id: 'CUST-1049',
    name: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80',
    age: 59,
    household: 'Empty Nester, Married',
    location: 'Scottsdale, AZ',
    occupation: 'Retired Healthcare Director',
    tenureYears: 11.8,
    totalAnnualPremium: 3650,
    estimatedLTV: 52000,
    churnRiskScore: 82, // Critical churn risk!
    churnRiskTier: 'CRITICAL',
    churnDrivers: [
      'Inquired about policy cancellation penalty via live chat',
      'Competitor aggregator comparison click detected',
      'Claim delay experience on windshield repair last quarter'
    ],
    activePolicies: [
      { id: 'POL-A331', type: 'Premier Auto (Lexus RX & Toyota Highlander)', annualPremium: 1750, status: 'Active', renewalDate: '2026-11-30' },
      { id: 'POL-H012', type: 'Homeowners Prestige ($650k dwelling)', annualPremium: 1900, status: 'Active', renewalDate: '2026-11-30' }
    ],
    detectedSignals: [
      {
        id: 'SIG-771',
        type: 'PRICE_INCREASE_SHOCK',
        title: 'Dual Policy Renewal Notice Sent (+14.5% rate adjustment)',
        timestamp: '5 days ago',
        source: 'Internal Billing & Rating Engine',
        confidence: 1.0,
        status: 'Critical Alert'
      },
      {
        id: 'SIG-772',
        type: 'RETIREMENT_HORIZON',
        title: 'Retirement Milestone: Annual Mileage Dropped by 60%',
        timestamp: '2 weeks ago',
        source: 'Odometer Sync & Connected Vehicle API',
        confidence: 0.92,
        status: 'Unaddressed'
      }
    ],
    digitalEngagement: {
      appLoginsLast30Days: 14,
      npsScore: 5,
      sentiment: 'Frustrated by price hikes, ready to defect'
    },
    agentStatus: 'CRITICAL_RETENTION',
    lastContactDate: '2026-09-02'
  },
  {
    id: 'CUST-5830',
    name: 'Liam Chen',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
    age: 29,
    household: 'Single, First-time home hunter',
    location: 'Seattle, WA',
    occupation: 'Cloud Solutions Architect',
    tenureYears: 2.1,
    totalAnnualPremium: 1100,
    estimatedLTV: 21000,
    churnRiskScore: 48,
    churnRiskTier: 'MEDIUM',
    churnDrivers: [
      'Price sensitive young professional',
      'No multi-policy bundle discount yet applied'
    ],
    activePolicies: [
      { id: 'POL-A540', type: 'Standard Auto (Tesla Model 3)', annualPremium: 1100, status: 'Active', renewalDate: '2027-01-20' }
    ],
    detectedSignals: [
      {
        id: 'SIG-510',
        type: 'NEW_VEHICLE',
        title: 'Delivered New Rivian R1T Electric Vehicle',
        timestamp: '6 days ago',
        source: 'Connected EV Telematics API',
        confidence: 0.95,
        status: 'Unaddressed'
      },
      {
        id: 'SIG-511',
        type: 'MARRIAGE',
        title: 'Engagement Announcement & Joint Lease Agreement',
        timestamp: '2 weeks ago',
        source: 'Digital Footprint & Postal Forwarding',
        confidence: 0.84,
        status: 'Emerging'
      }
    ],
    digitalEngagement: {
      appLoginsLast30Days: 6,
      npsScore: 8,
      sentiment: 'Tech-Savvy, values app automation'
    },
    agentStatus: 'OPPORTUNITY_READY',
    lastContactDate: '2026-07-15'
  },
  {
    id: 'CUST-9281',
    name: 'Amara & Tunde Okafor',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80',
    age: 47,
    household: 'Married, 2 Teenagers (Ages 15 & 17)',
    location: 'Charlotte, NC',
    occupation: 'Pharmacy Chain Owner & Civil Attorney',
    tenureYears: 8.3,
    totalAnnualPremium: 3100,
    estimatedLTV: 58000,
    churnRiskScore: 39,
    churnRiskTier: 'LOW',
    churnDrivers: [
      'Upcoming teen driver rate shock anticipated next month'
    ],
    activePolicies: [
      { id: 'POL-H711', type: 'Homeowners Deluxe ($720k Dwelling)', annualPremium: 1850, status: 'Active', renewalDate: '2027-05-12' },
      { id: 'POL-A912', type: 'Auto Multi-Car (Honda CR-V, BMW X5)', annualPremium: 1250, status: 'Active', renewalDate: '2027-05-12' }
    ],
    detectedSignals: [
      {
        id: 'SIG-219',
        type: 'TEEN_DRIVER',
        title: 'Eldest Daughter Nia (17) Received Driver License',
        timestamp: '1 week ago',
        source: 'State DMV Registration Event Sync',
        confidence: 0.98,
        status: 'Unaddressed'
      }
    ],
    digitalEngagement: {
      appLoginsLast30Days: 5,
      npsScore: 9,
      sentiment: 'Highly loyal, proactive protector'
    },
    agentStatus: 'ACTION_REQUIRED',
    lastContactDate: '2026-05-10'
  }
];
