import { INSURANCE_PRODUCTS, LIFE_EVENT_TYPES } from '../data/insuranceCatalog.js';

export class RetailGrowthAgent {
  constructor(config = {}) {
    this.name = 'AegisGrowth Core v4.2';
    this.retentionBias = config.retentionBias ?? 0.65; // Higher = prioritize churn defense over raw revenue
    this.crossSellThreshold = config.crossSellThreshold ?? 0.60;
    this.apiKey = config.apiKey || null;
  }

  /**
   * Main Agent Reasoning Pipeline
   * Evaluates a customer's portfolio, life events, churn risk, and generates Next-Best-Action
   */
  evaluateCustomer(customer) {
    const existingPolicyTypes = customer.activePolicies.map(p => p.type.toLowerCase());
    const signals = customer.detectedSignals || [];
    
    // Step 1: Detect Primary Trigger Event
    let primaryEvent = null;
    let highestUrgency = 0;
    
    signals.forEach(sig => {
      const eventDef = LIFE_EVENT_TYPES[sig.type];
      if (eventDef) {
        const urgencyScore = eventDef.urgency === 'CRITICAL' ? 3 : eventDef.urgency === 'HIGH' ? 2 : 1;
        if (urgencyScore > highestUrgency) {
          highestUrgency = urgencyScore;
          primaryEvent = { ...eventDef, signal: sig };
        }
      }
    });

    // Step 2: Identify Coverage Gaps
    const coverageGaps = [];
    const hasHome = existingPolicyTypes.some(t => t.includes('home') || t.includes('property'));
    const hasLife = existingPolicyTypes.some(t => t.includes('life'));
    const hasUmbrella = existingPolicyTypes.some(t => t.includes('umbrella') || t.includes('liability'));
    const hasAuto = existingPolicyTypes.some(t => t.includes('auto'));

    if (!hasLife && (customer.age < 50 || customer.household.includes('Child') || customer.household.includes('Married'))) {
      coverageGaps.push(INSURANCE_PRODUCTS.TERM_LIFE);
    }
    if (!hasHome && (primaryEvent?.id === 'HOME_PURCHASE' || customer.activePolicies.some(p => p.type.includes('Renters')))) {
      coverageGaps.push(INSURANCE_PRODUCTS.HOMEOWNERS_PLUS);
    }
    if (!hasUmbrella && (customer.estimatedLTV > 30000 || customer.household.includes('Teen') || customer.activePolicies.length >= 2)) {
      coverageGaps.push(INSURANCE_PRODUCTS.UMBRELLA_LIABILITY);
    }
    if (customer.household.includes('Newborn') || customer.household.includes('1 Newborn') || customer.detectedSignals.some(s => s.type === 'NEW_CHILD')) {
      coverageGaps.push(INSURANCE_PRODUCTS.CHILD_EDUCATION_RIDER);
    }
    if (customer.age >= 55) {
      coverageGaps.push(INSURANCE_PRODUCTS.RETIREMENT_LONGEVITY_ANNUITY);
    }

    // Step 3: Compute Next-Best-Action (NBA) Decision
    let nextBestAction = null;
    let rationale = [];

    if (customer.churnRiskScore >= 75) {
      // Acute Retention Mode: Immediate churn mitigation offer with rate relief & loyalty bundle
      nextBestAction = {
        type: 'RETENTION_DEFENSE',
        title: 'Priority Rate Lock & Multi-Policy Retention Credit',
        recommendedProduct: INSURANCE_PRODUCTS.CONNECTED_AUTO_BUNDLE,
        bundleDiscountPercent: 22,
        estimatedSavingsForCustomer: 420,
        projectedRetentionLift: '+72% renewal probability',
        projectedARRDelta: '+ $480 ARR (Prevented $3,650 Churn)',
        urgency: 'IMMEDIATE (48-hr SLA)',
        confidence: 0.94,
        headline: 'Retain High-Value Client via Rate-Shield & Telematics Cashback'
      };

      rationale = [
        {
          step: '1. Critical Churn Threat Detected',
          detail: `Customer exhibits ${customer.churnRiskScore}% churn risk driven by recent rate sensitivity and cancellation FAQ visits. High risk of immediate defection to an aggregator.`,
          badge: 'High Threat',
          badgeType: 'danger'
        },
        {
          step: '2. Customer Lifetime Value (LTV) Preservation',
          detail: `Customer has generated $${customer.totalAnnualPremium}/yr over ${customer.tenureYears} years with lifetime value of $${customer.estimatedLTV.toLocaleString()}. Losing this account represents severe loss.`,
          badge: 'LTV $52k',
          badgeType: 'warning'
        },
        {
          step: '3. Next-Best-Action Resolution',
          detail: 'Deploy proactive loyalty rate freeze paired with SmartDrive connected telematics discount (saving client $420/yr) before the renewal notice expires.',
          badge: 'Action: Rate Shield',
          badgeType: 'success'
        }
      ];
    } else if (primaryEvent?.id === 'NEW_CHILD') {
      nextBestAction = {
        type: 'PROACTIVE_CROSS_SELL',
        title: 'Newborn Protection & Family Growth Bundle',
        recommendedProduct: INSURANCE_PRODUCTS.TERM_LIFE,
        secondaryProduct: INSURANCE_PRODUCTS.CHILD_EDUCATION_RIDER,
        bundleDiscountPercent: 15,
        estimatedSavingsForCustomer: 260,
        projectedRetentionLift: '+38% 5-year retention',
        projectedARRDelta: '+$1,220 Net New ARR',
        urgency: 'HIGH (Within 14 days)',
        confidence: 0.96,
        headline: 'Secure Household Financial Security for Baby Lucas'
      };

      rationale = [
        {
          step: '1. Life Event Signal Correlation',
          detail: 'Verified newborn registration flag. Household transitioned to dependent-care status with zero active life insurance policies on file.',
          badge: 'Life Milestone: Baby',
          badgeType: 'info'
        },
        {
          step: '2. Underwriting Exposure Analysis',
          detail: 'Severe financial vulnerability: mortgage & child-rearing expenses unprotected if primary earner suffers untimely event. Customer also experienced auto rate friction.',
          badge: 'Coverage Gap: Life',
          badgeType: 'danger'
        },
        {
          step: '3. Next-Best-Action Optimization',
          detail: 'Bundle a 20-Year Term Life policy with Future Scholar Growth rider, offsetting auto rate increases with a 15% multi-line policy discount.',
          badge: 'Expected Lift +$1,220 ARR',
          badgeType: 'success'
        }
      ];
    } else if (primaryEvent?.id === 'HOME_PURCHASE') {
      nextBestAction = {
        type: 'PROACTIVE_CROSS_SELL',
        title: 'New Homeowner Prestige Anchor Bundle',
        recommendedProduct: INSURANCE_PRODUCTS.HOMEOWNERS_PLUS,
        secondaryProduct: INSURANCE_PRODUCTS.UMBRELLA_LIABILITY,
        bundleDiscountPercent: 20,
        estimatedSavingsForCustomer: 510,
        projectedRetentionLift: '+54% long-term stickiness',
        projectedARRDelta: '+$1,770 Net New ARR',
        urgency: 'CRITICAL (Before Lender Lock)',
        confidence: 0.98,
        headline: 'Preempt Lender Forced-Place Insurance with Comprehensive Coverage'
      };

      rationale = [
        {
          step: '1. Life Event Signal Ingestion',
          detail: 'County public records confirm closed $840k home purchase with private swimming pool permit.',
          badge: 'Deed Registered',
          badgeType: 'info'
        },
        {
          step: '2. Liability & Asset Exposure Gap',
          detail: 'Customer holds only an Auto policy with our agency. High risk of losing property coverage to closing attorney / mortgage partner lender.',
          badge: 'No Homeowner Policy',
          badgeType: 'warning'
        },
        {
          step: '3. Proactive Next-Best-Action',
          detail: 'Offer Homeowners Comprehensive Elite + $2M Personal Umbrella to protect pool premises liability, providing 20% auto-home bundle credit.',
          badge: 'Expected Lift +$1,770 ARR',
          badgeType: 'success'
        }
      ];
    } else if (primaryEvent?.id === 'TEEN_DRIVER') {
      nextBestAction = {
        type: 'RETENTION_AND_PROTECTION',
        title: 'Teen Driver Safety & Umbrella Protection Shield',
        recommendedProduct: INSURANCE_PRODUCTS.UMBRELLA_LIABILITY,
        secondaryProduct: INSURANCE_PRODUCTS.CONNECTED_AUTO_BUNDLE,
        bundleDiscountPercent: 18,
        estimatedSavingsForCustomer: 340,
        projectedRetentionLift: '+44% retention against rate shock',
        projectedARRDelta: '+$700 Net New ARR',
        urgency: 'HIGH',
        confidence: 0.93,
        headline: 'Soften Teen Driver Rate Shock with Good-Student & Telematics Credits'
      };

      rationale = [
        {
          step: '1. Life Event Detected: Dependent Driver',
          detail: 'State DMV sync confirms teen driver Nia added to household. Typically causes 80-120% auto premium rate shock.',
          badge: 'Teen Driver (17)',
          badgeType: 'info'
        },
        {
          step: '2. Catastrophic Liability Exposure',
          detail: 'Affluent household with home and high net worth has zero umbrella liability protection in place.',
          badge: 'Exposed Assets',
          badgeType: 'danger'
        },
        {
          step: '3. Next-Best-Action Solution',
          detail: 'Pair $1M Umbrella coverage with Student Honor Roll and SafeDriver telematics discount to buffer premium increase.',
          badge: 'Action: Umbrella + Discount',
          badgeType: 'success'
        }
      ];
    } else {
      // Default Growth Action
      nextBestAction = {
        type: 'PROACTIVE_CROSS_SELL',
        title: 'Personalized Asset Protection & Loyalty Bundle',
        recommendedProduct: coverageGaps[0] || INSURANCE_PRODUCTS.UMBRELLA_LIABILITY,
        bundleDiscountPercent: 12,
        estimatedSavingsForCustomer: 180,
        projectedRetentionLift: '+25% retention boost',
        projectedARRDelta: '+$550 ARR',
        urgency: 'MEDIUM',
        confidence: 0.89,
        headline: 'Optimize Portfolio with Tailored Multi-Policy Loyalty Discount'
      };

      rationale = [
        {
          step: '1. Portfolio Review & Coverage Audit',
          detail: `Audited ${customer.activePolicies.length} active policies. Identified coverage gap in ${nextBestAction.recommendedProduct.name}.`,
          badge: 'Coverage Optimization',
          badgeType: 'info'
        },
        {
          step: '2. Propensity Scoring',
          detail: 'Customer loyalty tenure and digital engagement indicates high readiness for multi-policy bundling.',
          badge: 'Propensity 89%',
          badgeType: 'success'
        }
      ];
    }

    // Step 4: Synthesize Omnichannel Outreach Collateral
    const omnichannelOffers = this.generateOmnichannelContent(customer, primaryEvent, nextBestAction);

    return {
      evaluatedAt: new Date().toISOString(),
      primaryEvent,
      coverageGaps,
      nextBestAction,
      agentRationale: rationale,
      omnichannelOffers
    };
  }

  /**
   * Generates tailored communications across 4 real-world insurer channels
   */
  generateOmnichannelContent(customer, event, nba) {
    const firstName = customer.name.split(' ')[0];
    const productName = nba.recommendedProduct.name;
    const discount = nba.bundleDiscountPercent;
    const savings = nba.estimatedSavingsForCustomer;

    // Channel 1: Hyper-Personalized Email
    let emailSubject = '';
    let emailBody = '';

    if (nba.type === 'RETENTION_DEFENSE') {
      emailSubject = `Exclusive Loyalty Rate Protection for the ${customer.name.split('&')[0]} Family`;
      emailBody = `Dear ${firstName},

As one of our valued clients of over ${customer.tenureYears} years, we’ve been reviewing your coverage. We know rising inflation and vehicle costs have impacted premiums across the country, and we want to ensure your rate remains shielded.

We have pre-approved an exclusive 22% Loyalty Rate-Shield credit on your account, paired with our SmartDrive cashback program. This immediately locks in $${savings}/year in direct savings while guaranteeing OEM repair standards.

Review your new protected rate with one click below, or schedule a 5-minute call with your dedicated advisor.`;
    } else if (event?.id === 'NEW_CHILD') {
      emailSubject = `Congratulations on Baby Lucas! A personalized protection gift from your team`;
      emailBody = `Hi ${firstName},

Warmest congratulations to you and David on welcoming baby Lucas to the world! Becoming parents is one of life’s most exciting chapters.

As your family grows, making sure Lucas is financially protected through every milestone is paramount. We’ve configured a tailored Family Term Life & Future Scholar bundle specifically for your household.

Because you already trust us with your auto insurance, this unlocks our 15% Multi-Line Parent Discount, saving you $${savings}/year while securing a $500,000 guaranteed family safety net.

Explore your instant family quote below—no medical exam needed for pre-approved members.`;
    } else if (event?.id === 'HOME_PURCHASE') {
      emailSubject = `Congratulations on your new home in Denver! Let's lock in your bundle savings`;
      emailBody = `Hi ${firstName},

Congratulations on your new home! Closing on a property is a tremendous milestone, and protecting your new investment should be effortless.

Before your closing lender arranges third-party hazard coverage, we’ve created an executive Homeowners Elite proposal with extended dwelling and premises liability. 

By linking this with your existing premier auto policy, you unlock an instant $${savings} annual multi-policy discount with complete replacement-cost backing.`;
    } else {
      emailSubject = `Tailored protection review & ${discount}% multi-policy savings for ${firstName}`;
      emailBody = `Hi ${firstName},

We noticed an opportunity to enhance your coverage with ${productName} while reducing your overall premium by $${savings} through our multi-line loyalty program.

Take a look at your customized rate breakdown below.`;
    }

    // Channel 2: High-Conversion SMS
    let smsText = '';
    if (nba.type === 'RETENTION_DEFENSE') {
      smsText = `Hi ${firstName}, we applied an exclusive $${savings}/yr loyalty rate-lock credit to your policy renewal. Review and confirm your savings before Nov 30: https://insure.ai/p/${customer.id.toLowerCase()}`;
    } else if (event?.id === 'NEW_CHILD') {
      smsText = `Congrats ${firstName}! 👶 We prepared a New Parent Protection Plan for baby Lucas with an instant $${savings}/yr bundle credit. View quote: https://insure.ai/p/${customer.id.toLowerCase()}`;
    } else {
      smsText = `Hi ${firstName}, congrats on your new milestone! We unlocked a ${discount}% bundle discount ($${savings}/yr savings) on your coverage: https://insure.ai/p/${customer.id.toLowerCase()}`;
    }

    // Channel 3: Agent / Advisor Call Talking Points
    const advisorScript = [
      `Warm Opening: "Hi ${firstName}, this is your personal insurance advisor calling to touch base and congratulate you on ${event?.label || 'your recent milestone'}."`,
      `Empathy & Context: "I was reviewing your account, and noticed that while your current coverage has served you well, your household needs have evolved."`,
      `Value Proposition: "Instead of waiting for renewal, we can lock in ${productName} today with an active ${discount}% bundle credit, effectively saving you $${savings} annually."`,
      `Objection Handling (Cost concern): "By bundling with your existing auto policy, the discount almost fully offsets the cost of this extra protection."`,
      `Closing Question: "Shall I send the 1-click binding link to your phone right now so your family is covered starting today?"`
    ];

    // Channel 4: In-App Mobile Push Notification
    const pushNotification = {
      title: nba.type === 'RETENTION_DEFENSE' ? `🛡️ $${savings} Loyalty Credit Available` : `✨ New Milestone Protection Pre-Approved`,
      body: `Tap to review your tailored ${productName} proposal with ${discount}% bundle savings.`,
      actionLabel: 'View Pre-Approved Offer'
    };

    return {
      email: {
        subject: emailSubject,
        body: emailBody,
        cta: 'Review & Activate Policy'
      },
      sms: {
        message: smsText,
        characterCount: smsText.length
      },
      advisorScript: advisorScript,
      pushNotification: pushNotification
    };
  }

  /**
   * Sandbox Simulator: Ingests an ad-hoc life event and recalculates real-time NBA
   */
  simulateLifeEvent(customer, eventTypeId, customDescription) {
    const eventDef = LIFE_EVENT_TYPES[eventTypeId];
    if (!eventDef) throw new Error(`Unknown life event type: ${eventTypeId}`);

    const newSignal = {
      id: `SIG-SIM-${Date.now().toString().slice(-4)}`,
      type: eventTypeId,
      title: customDescription || eventDef.label,
      timestamp: 'Just now (Simulated Event)',
      source: 'Interactive Event Sandbox & Telemetry Stream',
      confidence: 0.99,
      status: 'Active Simulation'
    };

    // Clone customer and prepend new signal
    const updatedCustomer = {
      ...customer,
      detectedSignals: [newSignal, ...customer.detectedSignals]
    };

    // If event is price shock or home purchase, dynamically update churn risk
    if (eventTypeId === 'PRICE_INCREASE_SHOCK') {
      updatedCustomer.churnRiskScore = Math.min(95, customer.churnRiskScore + 35);
      updatedCustomer.churnRiskTier = 'CRITICAL';
    } else if (eventTypeId === 'HOME_PURCHASE') {
      updatedCustomer.churnRiskScore = Math.min(85, customer.churnRiskScore + 18);
    }

    const evaluation = this.evaluateCustomer(updatedCustomer);
    return {
      updatedCustomer,
      evaluation
    };
  }
}
