// Inbound leads and rating calculation engine for Magic Insurance (No Emojis)
export const INITIAL_LEADS = [
  {
    id: 'LEAD-101',
    fullName: 'Sophia Martinez',
    email: 'sophia.martinez@example.com',
    phone: '(512) 555-0182',
    location: 'Austin, TX',
    insuranceType: 'Car Insurance',
    typeKey: 'car',
    carClass: 'Electric Vehicle (Tesla Model Y)',
    carClassKey: 'ev',
    drivingExperience: 8,
    sex: 'Female',
    annualMileage: 'Commuter (8,000 - 12,000 mi)',
    mileageKey: 'commuter',
    record: 'Clean (0 incidents)',
    recordKey: 'clean',
    monthlyQuote: 98,
    annualQuote: 1080,
    bundleSavings: 240,
    tier: 'Preferred Safe Driver Tier',
    closingLikelihood: 89,
    status: 'Quote Sent',
    receivedAt: '24 mins ago',
    notes: 'Inquired for rate comparison against current policy renewal.'
  },
  {
    id: 'LEAD-102',
    fullName: 'Alexander Wright',
    email: 'alex.wright@example.com',
    phone: '(303) 555-0149',
    location: 'Denver, CO',
    insuranceType: 'Car Insurance',
    typeKey: 'car',
    carClass: 'Luxury SUV (Porsche Macan)',
    carClassKey: 'luxury',
    drivingExperience: 14,
    sex: 'Male',
    annualMileage: 'Low (< 8,000 mi)',
    mileageKey: 'low',
    record: 'Clean (0 incidents)',
    recordKey: 'clean',
    monthlyQuote: 142,
    annualQuote: 1560,
    bundleSavings: 310,
    tier: 'Prestige Auto Tier',
    closingLikelihood: 92,
    status: 'Follow-up Required',
    receivedAt: '1 hour ago',
    notes: 'Looking for OEM parts replacement guarantee and multi-line discount.'
  },
  {
    id: 'LEAD-103',
    fullName: 'Jessica Taylor',
    email: 'j.taylor@example.com',
    phone: '(206) 555-0193',
    location: 'Seattle, WA',
    insuranceType: 'Car Insurance',
    typeKey: 'car',
    carClass: 'Compact SUV (Subaru Forester)',
    carClassKey: 'suv',
    drivingExperience: 4,
    sex: 'Female',
    annualMileage: 'Commuter (8,000 - 12,000 mi)',
    mileageKey: 'commuter',
    record: 'Clean (0 incidents)',
    recordKey: 'clean',
    monthlyQuote: 114,
    annualQuote: 1250,
    bundleSavings: 220,
    tier: 'Standard Safe Driver',
    closingLikelihood: 85,
    status: 'Binder Ready',
    receivedAt: '3 hours ago',
    notes: 'First vehicle purchase after moving to Washington.'
  },
  {
    id: 'LEAD-104',
    fullName: 'Jordan Miller',
    email: 'jordan.m@example.com',
    phone: '(704) 555-0118',
    location: 'Charlotte, NC',
    insuranceType: 'Car Insurance',
    typeKey: 'car',
    carClass: 'Full-size Truck (Ford F-150)',
    carClassKey: 'truck',
    drivingExperience: 10,
    sex: 'Male',
    annualMileage: 'High (> 15,000 mi)',
    mileageKey: 'high',
    record: '1 Minor Violation',
    recordKey: 'violations',
    monthlyQuote: 138,
    annualQuote: 1520,
    bundleSavings: 280,
    tier: 'Standard Commercial/Personal',
    closingLikelihood: 78,
    status: 'Quote Sent',
    receivedAt: '5 hours ago',
    notes: 'Checking rate with safe-driver telematics app discount.'
  }
];

export function calculateCarInsuranceQuote({
  drivingExperience,
  carClass,
  sex,
  annualMileage = 'commuter',
  record = 'clean'
}) {
  let baseMonthly = 88;

  // Car Class Multipliers
  const classMultipliers = {
    economy: 1.0,
    sedan: 1.1,
    suv: 1.25,
    ev: 1.2,
    luxury: 1.6,
    truck: 1.35
  };
  baseMonthly *= (classMultipliers[carClass] || 1.15);

  // Driving Experience (Years Driving)
  const exp = Number(drivingExperience) || 5;
  if (exp < 3) {
    baseMonthly *= 1.40; // Less experience
  } else if (exp <= 5) {
    baseMonthly *= 1.18;
  } else if (exp <= 10) {
    baseMonthly *= 0.98;
  } else {
    baseMonthly *= 0.85; // 10+ years experience discount
  }

  // Driver Sex Actuarial Rating
  if (sex === 'Male' && exp < 5) {
    baseMonthly *= 1.12;
  } else if (sex === 'Female') {
    baseMonthly *= 0.96;
  }

  // Mileage
  if (annualMileage === 'high') {
    baseMonthly *= 1.15;
  } else if (annualMileage === 'low') {
    baseMonthly *= 0.92;
  }

  // Driving Record
  if (record === 'violations') {
    baseMonthly *= 1.25;
  } else if (record === 'accident') {
    baseMonthly *= 1.45;
  }

  const monthly = Math.round(baseMonthly);
  const annual = Math.round(monthly * 12 * 0.92); // 8% pay-in-full discount
  const bundleSavings = Math.round(annual * 0.18);

  const tier = monthly < 105 ? 'Preferred Safe Driver Tier' : 
               monthly < 145 ? 'Standard Rating Tier' : 
               'Prestige / Specialty Tier';

  const closingLikelihood = exp >= 5 && record === 'clean' ? 91 : 
                            exp >= 3 ? 84 : 74;

  return {
    monthly,
    annual,
    bundleSavings,
    tier,
    closingLikelihood
  };
}
