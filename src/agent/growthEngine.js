import { INSURANCE_PRODUCTS, LIFE_EVENT_TYPES } from '../data/insuranceCatalog.js';

export class RetailGrowthAgent {
  constructor(config = {}) {
    this.name = 'Magic Insurance Core';
    this.retentionBias = config.retentionBias ?? 0.65; // Higher = prioritize churn defense over raw revenue
    this.crossSellThreshold = config.crossSellThreshold ?? 0.60;
    this.apiKey = config.apiKey || null;
  }

  /**
   * Main Agent Reasoning Pipeline
   * Evaluates customer portfolio, eligibility, adoption likelihood, and Next-Best-Action
   */
  evaluateCustomer(customer) {
    const existingPolicyTypes = (customer.activePolicies || []).map(p => p.type.toLowerCase());
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
          detail: `Customer exhibits ${customer.churnRiskScore}% churn risk driven by recent rate sensitivity and competitor inquiry. Immediate intervention required.`,
          badge: 'High Threat',
          badgeType: 'danger'
        },
        {
          step: '2. Customer Lifetime Value (LTV) Preservation',
          detail: `Customer has generated $${customer.totalAnnualPremium}/yr with lifetime value of $${customer.estimatedLTV.toLocaleString()}.`,
          badge: `LTV $${(customer.estimatedLTV/1000).toFixed(0)}k`,
          badgeType: 'warning'
        },
        {
          step: '3. Next-Best-Action Resolution',
          detail: 'Deploy proactive loyalty rate freeze paired with SmartDrive connected telematics discount (saving client $420/yr).',
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
        headline: 'Secure Household Financial Security for Growing Family'
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
          detail: 'Financial vulnerability: living and mortgage expenses unprotected if primary earner suffers untimely event.',
          badge: 'Coverage Gap: Life',
          badgeType: 'danger'
        },
        {
          step: '3. Next-Best-Action Optimization',
          detail: 'Bundle a 20-Year Term Life policy with 15% multi-line policy discount to secure long-term family stability.',
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
        headline: 'Preempt Lender Hazard Insurance with Comprehensive Dwelling Coverage'
      };

      rationale = [
        {
          step: '1. Life Event Signal Ingestion',
          detail: 'Public deed records confirm closed home purchase with primary residence property deed filing.',
          badge: 'Deed Registered',
          badgeType: 'info'
        },
        {
          step: '2. Churn Prevention Opportunity',
          detail: 'Homebuyers are 4.2x more likely to switch carriers if not proactively provided homeowner binding before closing.',
          badge: 'Lender Churn Window',
          badgeType: 'warning'
        },
        {
          step: '3. Next-Best-Action Resolution',
          detail: 'Deliver instant comprehensive Homeowners Elite binder unlocking a 20% multi-policy discount with auto.',
          badge: 'Auto + Home Anchor',
          badgeType: 'success'
        }
      ];
    } else {
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
          detail: `Audited active policies. Identified coverage gap in ${nextBestAction.recommendedProduct.name}.`,
          badge: 'Coverage Optimization',
          badgeType: 'info'
        },
        {
          step: '2. Propensity Scoring',
          detail: 'Customer loyalty tenure indicates high readiness for multi-policy bundling.',
          badge: 'Propensity 89%',
          badgeType: 'success'
        }
      ];
    }

    // Step 4: Compute Comprehensive Eligible Insurances & Likelihood Scores
    const eligibleInsurances = this.getEligibleInsurances(customer, primaryEvent, nextBestAction);

    // Step 5: Synthesize Omnichannel Outreach Collateral (SMS removed)
    const omnichannelOffers = this.generateOmnichannelContent(customer, primaryEvent, nextBestAction);

    return {
      evaluatedAt: new Date().toISOString(),
      primaryEvent,
      coverageGaps,
      nextBestAction,
      eligibleInsurances,
      currentInsurances: customer.activePolicies || [],
      agentRationale: rationale,
      omnichannelOffers
    };
  }

  /**
   * Systematic Eligibility & Adoption Likelihood Engine
   * Returns what insurances the customer is eligible for, why, and the probability of adoption
   */
  getEligibleInsurances(customer, primaryEvent, nextBestAction) {
    const activeTypes = (customer.activePolicies || []).map(p => p.type.toLowerCase());
    const signals = customer.detectedSignals || [];
    const eventId = primaryEvent?.id || signals[0]?.type || '';
    const topProductId = nextBestAction?.recommendedProduct?.id;

    const list = [];

    // 1. Family Term Life
    const hasLife = activeTypes.some(t => t.includes('life'));
    if (!hasLife) {
      let likelihood = 55;
      let reason = 'Essential income safety net protecting family living expenses.';
      if (eventId === 'NEW_CHILD' || customer.household.includes('Newborn') || customer.household.includes('Child')) {
        likelihood = 95;
        reason = 'Triggered by newborn dependent Lucas: Household currently has $0 active life insurance protection.';
      } else if (customer.household.includes('Married') || customer.age < 45) {
        likelihood = 78;
        reason = 'High propensity: Secure locked-in low premiums to protect mortgage obligations.';
      }
      list.push({
        id: 'TERM_LIFE',
        name: INSURANCE_PRODUCTS.TERM_LIFE.name,
        category: INSURANCE_PRODUCTS.TERM_LIFE.category,
        basePrice: INSURANCE_PRODUCTS.TERM_LIFE.baseAnnualPremium,
        discountedPrice: Math.round(INSURANCE_PRODUCTS.TERM_LIFE.baseAnnualPremium * 0.85),
        savings: 102,
        likelihood,
        likelihoodTier: likelihood >= 80 ? 'VERY HIGH' : likelihood >= 65 ? 'HIGH' : 'MODERATE',
        reason,
        icon: '👨‍👩‍👧',
        isTopRecommendation: topProductId === 'TERM_LIFE'
      });
    }

    // 2. Homeowners Comprehensive Elite
    const hasHome = activeTypes.some(t => t.includes('home') || t.includes('dwelling') || t.includes('property'));
    if (!hasHome) {
      let likelihood = 48;
      let reason = 'Comprehensive dwelling & premises replacement coverage.';
      if (eventId === 'HOME_PURCHASE' || signals.some(s => s.type === 'HOME_PURCHASE')) {
        likelihood = 97;
        reason = 'Triggered by new property deed recording: Replaces existing temporary renters policy with full home coverage.';
      } else if (activeTypes.some(t => t.includes('renters'))) {
        likelihood = 72;
        reason = 'Pre-approved upgrade: Seamless transition from renters to homeowner bundle with locked-in discount.';
      }
      list.push({
        id: 'HOMEOWNERS_PLUS',
        name: INSURANCE_PRODUCTS.HOMEOWNERS_PLUS.name,
        category: INSURANCE_PRODUCTS.HOMEOWNERS_PLUS.category,
        basePrice: INSURANCE_PRODUCTS.HOMEOWNERS_PLUS.baseAnnualPremium,
        discountedPrice: Math.round(INSURANCE_PRODUCTS.HOMEOWNERS_PLUS.baseAnnualPremium * 0.80),
        savings: 290,
        likelihood,
        likelihoodTier: likelihood >= 80 ? 'VERY HIGH' : likelihood >= 65 ? 'HIGH' : 'MODERATE',
        reason,
        icon: '🏡',
        isTopRecommendation: topProductId === 'HOMEOWNERS_PLUS'
      });
    }

    // 3. SmartDrive EV & Telematics Auto Shield
    const hasConnectedAuto = activeTypes.some(t => t.includes('telematics') || t.includes('smartdrive'));
    if (!hasConnectedAuto) {
      let likelihood = 68;
      let reason = 'Usage-based dynamic cashback policy with safe-driver savings.';
      if (customer.churnRiskScore >= 60) {
        likelihood = 92;
        reason = 'Direct churn solution: Counteracts recent rate adjustment with 22% safe-driver cashback.';
      } else if (eventId === 'NEW_VEHICLE') {
        likelihood = 88;
        reason = 'New vehicle purchase triggers dynamic EV / vehicle safe-driver replacement rider.';
      }
      list.push({
        id: 'CONNECTED_AUTO_BUNDLE',
        name: INSURANCE_PRODUCTS.CONNECTED_AUTO_BUNDLE.name,
        category: INSURANCE_PRODUCTS.CONNECTED_AUTO_BUNDLE.category,
        basePrice: INSURANCE_PRODUCTS.CONNECTED_AUTO_BUNDLE.baseAnnualPremium,
        discountedPrice: Math.round(INSURANCE_PRODUCTS.CONNECTED_AUTO_BUNDLE.baseAnnualPremium * 0.78),
        savings: 260,
        likelihood,
        likelihoodTier: likelihood >= 80 ? 'VERY HIGH' : likelihood >= 65 ? 'HIGH' : 'MODERATE',
        reason,
        icon: '🚗',
        isTopRecommendation: topProductId === 'CONNECTED_AUTO_BUNDLE'
      });
    }

    // 4. Personal Excess Liability (Umbrella $1M - $5M)
    const hasUmbrella = activeTypes.some(t => t.includes('umbrella') || t.includes('excess'));
    if (!hasUmbrella) {
      let likelihood = 64;
      let reason = 'Secondary liability safety net protecting personal savings and future earnings.';
      if (customer.estimatedLTV > 30000 || eventId === 'HOME_PURCHASE' || customer.household.includes('Teen')) {
        likelihood = 86;
        reason = 'High-net-worth protection: Defends home equity and family assets against catastrophic liability lawsuits.';
      }
      list.push({
        id: 'UMBRELLA_LIABILITY',
        name: INSURANCE_PRODUCTS.UMBRELLA_LIABILITY.name,
        category: INSURANCE_PRODUCTS.UMBRELLA_LIABILITY.category,
        basePrice: INSURANCE_PRODUCTS.UMBRELLA_LIABILITY.baseAnnualPremium,
        discountedPrice: Math.round(INSURANCE_PRODUCTS.UMBRELLA_LIABILITY.baseAnnualPremium * 0.85),
        savings: 48,
        likelihood,
        likelihoodTier: likelihood >= 80 ? 'VERY HIGH' : likelihood >= 65 ? 'HIGH' : 'MODERATE',
        reason,
        icon: '🛡️',
        isTopRecommendation: topProductId === 'UMBRELLA_LIABILITY'
      });
    }

    // 5. Future Scholar Growth Rider
    const hasChildRider = activeTypes.some(t => t.includes('scholar') || t.includes('education'));
    if (!hasChildRider && (customer.household.includes('Newborn') || customer.household.includes('Child') || eventId === 'NEW_CHILD')) {
      const likelihood = 89;
      list.push({
        id: 'CHILD_EDUCATION_RIDER',
        name: INSURANCE_PRODUCTS.CHILD_EDUCATION_RIDER.name,
        category: INSURANCE_PRODUCTS.CHILD_EDUCATION_RIDER.category,
        basePrice: INSURANCE_PRODUCTS.CHILD_EDUCATION_RIDER.baseAnnualPremium,
        discountedPrice: Math.round(INSURANCE_PRODUCTS.CHILD_EDUCATION_RIDER.baseAnnualPremium * 0.85),
        savings: 81,
        likelihood,
        likelihoodTier: 'VERY HIGH',
        reason: 'College tuition cash accumulation rider locking in guaranteed child insurability.',
        icon: '🎓',
        isTopRecommendation: topProductId === 'CHILD_EDUCATION_RIDER'
      });
    }

    // 6. Family Cyber & Identity Defense
    const hasCyber = activeTypes.some(t => t.includes('cyber') || t.includes('identity'));
    if (!hasCyber) {
      const isTech = customer.occupation.toLowerCase().includes('engineer') || customer.occupation.toLowerCase().includes('designer') || customer.occupation.toLowerCase().includes('vp');
      const likelihood = isTech ? 76 : 58;
      list.push({
        id: 'CYBER_IDENTITY_SHIELD',
        name: INSURANCE_PRODUCTS.CYBER_IDENTITY_SHIELD.name,
        category: INSURANCE_PRODUCTS.CYBER_IDENTITY_SHIELD.category,
        basePrice: INSURANCE_PRODUCTS.CYBER_IDENTITY_SHIELD.baseAnnualPremium,
        discountedPrice: Math.round(INSURANCE_PRODUCTS.CYBER_IDENTITY_SHIELD.baseAnnualPremium * 0.85),
        savings: 32,
        likelihood,
        likelihoodTier: likelihood >= 70 ? 'HIGH' : 'MODERATE',
        reason: '24/7 dark web credit monitoring, ransomware reimbursement, and full family identity recovery.',
        icon: '🔒',
        isTopRecommendation: topProductId === 'CYBER_IDENTITY_SHIELD'
      });
    }

    // Sort by likelihood descending
    list.sort((a, b) => b.likelihood - a.likelihood);
    return list;
  }

  /**
   * Generates tailored communications across channels (SMS removed per user request)
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

As one of our valued clients of over ${customer.tenureYears} years, we’ve been reviewing your coverage. We know rising inflation and vehicle repair costs have impacted premiums across the country, and we want to ensure your rate remains shielded.

We have pre-approved an exclusive ${discount}% Loyalty Rate-Shield credit on your account, paired with our SmartDrive cashback program. This immediately locks in $${savings}/year in direct savings while guaranteeing OEM repair standards.

Review your new protected rate with one click below, or schedule a 5-minute call with your dedicated advisor.`;
    } else if (event?.id === 'NEW_CHILD') {
      emailSubject = `Congratulations on Baby Lucas! A personalized protection gift from Magic Insurance`;
      emailBody = `Hi ${firstName},

Warmest congratulations to you and David on welcoming baby Lucas to the world! Becoming parents is one of life’s most exciting chapters.

As your family grows, making sure Lucas is financially protected through every milestone is paramount. We’ve configured a tailored Family Term Life & Future Scholar bundle specifically for your household.

Because you already trust us with your auto insurance, this unlocks our ${discount}% Multi-Line Parent Discount, saving you $${savings}/year while securing a guaranteed family safety net.

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

    // Channel 2: Agent / Advisor Call Talking Points
    const advisorScript = [
      `Warm Opening: "Hi ${firstName}, this is your personal Magic Insurance advisor calling to touch base and congratulate you on ${event?.label || 'your recent milestone'}."`,
      `Empathy & Context: "I was reviewing your account, and noticed that while your current coverage has served you well, your household needs have evolved."`,
      `Value Proposition: "Instead of waiting for renewal, we can lock in ${productName} today with an active ${discount}% bundle credit, effectively saving you $${savings} annually."`,
      `Objection Handling: "By bundling with your existing policies, the multi-line discount offsets the cost of this extra protection."`,
      `Closing Question: "Shall I send the 1-click binding link to your portal right now so your family is covered starting today?"`
    ];

    // Channel 3: In-App Mobile Push Notification
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

    // Dynamically update churn risk based on simulated event
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
