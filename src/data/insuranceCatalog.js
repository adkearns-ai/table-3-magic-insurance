// Insurance Product Catalog & Life Event Rules (No Emojis)
export const INSURANCE_PRODUCTS = {
  TERM_LIFE: {
    id: 'TERM_LIFE',
    name: 'Family Term Life (20/30-Yr)',
    category: 'Life & Health',
    baseAnnualPremium: 680,
    averageCrossSellLift: 720,
    description: 'Guaranteed financial security replacing income, paying off mortgages, and protecting dependents.',
    retentionImpact: '+24% policy stickiness',
    eligibilityKeywords: ['dependent', 'marriage', 'home', 'mortgage', 'sole-earner'],
    idealLifeStages: ['Family with Dependents', 'Newly Married', 'New Homeowner']
  },
  HOMEOWNERS_PLUS: {
    id: 'HOMEOWNERS_PLUS',
    name: 'Homeowners Comprehensive Elite',
    category: 'Property & Casualty',
    baseAnnualPremium: 1450,
    averageCrossSellLift: 1550,
    description: 'Replacement cost property protection with extended water backup, equipment breakdown, and high-value dwelling coverage.',
    retentionImpact: '+35% policy stickiness (anchor policy)',
    eligibilityKeywords: ['home', 'relocation', 'condo_to_house', 'suburbs'],
    idealLifeStages: ['New Homeowner', 'Relocating', 'High Net Worth']
  },
  UMBRELLA_LIABILITY: {
    id: 'UMBRELLA_LIABILITY',
    name: 'Personal Excess Liability ($1M - $5M)',
    category: 'Liability Shield',
    baseAnnualPremium: 320,
    averageCrossSellLift: 380,
    description: 'Secondary liability safety net protecting personal assets against catastrophic lawsuits and premises injury claims.',
    retentionImpact: '+42% retention when bundled with Auto & Home',
    eligibilityKeywords: ['pool', 'youth_driver', 'rental_property', 'wealth_growth'],
    idealLifeStages: ['Growing Family', 'Household Drivers', 'High Net Worth', 'Property Owner']
  },
  CHILD_EDUCATION_RIDER: {
    id: 'CHILD_EDUCATION_RIDER',
    name: 'Future Scholar Growth Rider',
    category: 'Wealth & Savings',
    baseAnnualPremium: 540,
    averageCrossSellLift: 600,
    description: 'Tax-advantaged cash accumulation rider for education funding with guaranteed insurability for dependents.',
    retentionImpact: '+48% 10-year retention (emotional anchor)',
    eligibilityKeywords: ['dependent', 'education_fund', 'family_planning'],
    idealLifeStages: ['Family with Dependents', 'Young Family']
  },
  CONNECTED_AUTO_BUNDLE: {
    id: 'CONNECTED_AUTO_BUNDLE',
    name: 'SmartDrive EV & Telematics Auto Shield',
    category: 'Auto & Mobility',
    baseAnnualPremium: 1180,
    averageCrossSellLift: 1250,
    description: 'Usage-based telematics auto insurance with dynamic safe-driver cashbacks, EV battery replacement rider, and OEM repair guarantee.',
    retentionImpact: 'Reduces churn by 62% for price-sensitive drivers',
    eligibilityKeywords: ['new_vehicle', 'ev_purchase', 'low_mileage', 'price_sensitive', 'commute_change'],
    idealLifeStages: ['Young Professional', 'Tech Adopter', 'Commuter']
  },
  RETIREMENT_LONGEVITY_ANNUITY: {
    id: 'RETIREMENT_LONGEVITY_ANNUITY',
    name: 'Guaranteed Lifetime Income Annuity',
    category: 'Retirement & Wealth',
    baseAnnualPremium: 3800,
    averageCrossSellLift: 4200,
    description: 'Fixed-indexed lifetime income stream insulating seniors against market downturns and outliving savings.',
    retentionImpact: '+55% account retention into retirement',
    eligibilityKeywords: ['retirement_horizon', 'empty_nest', 'pension_gap'],
    idealLifeStages: ['Pre-Retiree', 'Retiree', 'Senior']
  },
  CYBER_IDENTITY_SHIELD: {
    id: 'CYBER_IDENTITY_SHIELD',
    name: 'Family Cyber & Identity Defense',
    category: 'Specialty Personal',
    baseAnnualPremium: 210,
    averageCrossSellLift: 240,
    description: 'Complete ransomware reimbursement, digital extortion assistance, and 24/7 dark web credit monitoring for the entire household.',
    retentionImpact: '+18% bundle stickiness',
    eligibilityKeywords: ['remote_work', 'tech_worker', 'digital_security'],
    idealLifeStages: ['Connected Family', 'Remote Professional']
  }
};

export const LIFE_EVENT_TYPES = {
  NEW_CHILD: {
    id: 'NEW_CHILD',
    label: 'Welcomed a New Dependent',
    urgency: 'HIGH',
    timeWindowDays: 60,
    signals: ['Hospital birth registry record', 'Maternity leave flag', 'Dependent added to portal', 'Pediatrician claim inquiry'],
    recommendedProducts: ['TERM_LIFE', 'CHILD_EDUCATION_RIDER', 'UMBRELLA_LIABILITY'],
    retentionRiskFactor: 0.15
  },
  HOME_PURCHASE: {
    id: 'HOME_PURCHASE',
    label: 'Purchased a New Home',
    urgency: 'CRITICAL',
    timeWindowDays: 30,
    signals: ['County deed registry update', 'Mortgage pre-approval inquiry', 'Address change request', 'Renters policy termination notice'],
    recommendedProducts: ['HOMEOWNERS_PLUS', 'UMBRELLA_LIABILITY', 'TERM_LIFE'],
    retentionRiskFactor: 0.65
  },
  MARRIAGE: {
    id: 'MARRIAGE',
    label: 'Recently Married',
    urgency: 'MEDIUM',
    timeWindowDays: 90,
    signals: ['Name change on license/portal', 'Spouse added as driver', 'Joint account linked', 'Wedding registry match'],
    recommendedProducts: ['CONNECTED_AUTO_BUNDLE', 'TERM_LIFE', 'HOMEOWNERS_PLUS'],
    retentionRiskFactor: 0.40
  },
  NEW_VEHICLE: {
    id: 'NEW_VEHICLE',
    label: 'Purchased New Vehicle (EV / SUV)',
    urgency: 'HIGH',
    timeWindowDays: 14,
    signals: ['Dealership gap-insurance inquiry', 'DMV registration notice', 'Financing credit pull', 'Auto VIN quote search'],
    recommendedProducts: ['CONNECTED_AUTO_BUNDLE', 'UMBRELLA_LIABILITY'],
    retentionRiskFactor: 0.50
  },
  TEEN_DRIVER: {
    id: 'TEEN_DRIVER',
    label: 'New Eligible Driver in Household',
    urgency: 'HIGH',
    timeWindowDays: 45,
    signals: ['Permit driver addition', 'Dependent added to vehicle policy', 'Inquiry on student driver discount'],
    recommendedProducts: ['UMBRELLA_LIABILITY', 'CONNECTED_AUTO_BUNDLE'],
    retentionRiskFactor: 0.45
  },
  RETIREMENT_HORIZON: {
    id: 'RETIREMENT_HORIZON',
    label: 'Approaching Retirement Milestone',
    urgency: 'MEDIUM',
    timeWindowDays: 180,
    signals: ['Milestone age reached', 'Retirement savings rollover inquiry', 'Downsizing property search', 'Reduced annual mileage reported'],
    recommendedProducts: ['RETIREMENT_LONGEVITY_ANNUITY', 'UMBRELLA_LIABILITY'],
    retentionRiskFactor: 0.35
  },
  PRICE_INCREASE_SHOCK: {
    id: 'PRICE_INCREASE_SHOCK',
    label: 'Renewal Rate Adjustment Sensitivity',
    urgency: 'CRITICAL',
    timeWindowDays: 21,
    signals: ['Renewal invoice adjustment generated', 'Customer visited cancellation FAQ', 'Logged into portal multiple times', 'Competitor aggregator search detected'],
    recommendedProducts: ['CONNECTED_AUTO_BUNDLE'],
    retentionRiskFactor: 0.88
  }
};
