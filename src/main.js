import './style.css';
import { INITIAL_CUSTOMERS } from './data/customers.js';
import { LIFE_EVENT_TYPES } from './data/insuranceCatalog.js';
import { RetailGrowthAgent } from './agent/growthEngine.js';
import { INITIAL_LEADS, calculateCarInsuranceQuote } from './data/leads.js';

// Application State
const state = {
  customers: [...INITIAL_CUSTOMERS],
  selectedCustomerId: INITIAL_CUSTOMERS[0].id,
  selectedProductId: null,
  currentView: 'command', // 'command' | 'analytics' | 'directory' | 'leads' | 'bind-convert'
  activeBindLeadId: null,
  activeOfferConfig: null,
  activeChannelTab: 'email', // 'email' | 'advisor' | 'push'
  searchQuery: '',
  theme: localStorage.getItem('magic-theme') || localStorage.getItem('aegis-theme') || 'light',
  riskFilter: 'ALL',
  agent: new RetailGrowthAgent({ retentionBias: 0.70 }),
  isSimModalOpen: false,
  selectedSimEventType: 'HOME_PURCHASE',
  leads: [...INITIAL_LEADS],
  leadSearchQuery: '',
  activeLeadCalculator: {
    fullName: 'David Robinson',
    email: 'd.robinson@example.com',
    phone: '(512) 555-0134',
    location: 'Austin, TX',
    insuranceType: 'car',
    carClass: 'sedan',
    drivingExperience: 7,
    sex: 'Female',
    annualMileage: 'commuter',
    record: 'clean'
  },
  currentCalculatedQuote: calculateCarInsuranceQuote({
    drivingExperience: 7,
    carClass: 'sedan',
    sex: 'Female',
    annualMileage: 'commuter',
    record: 'clean'
  }),
  dispatchLog: [
    {
      id: 'DISP-101',
      customerName: 'Marcus Vance',
      channel: 'EMAIL',
      product: 'Homeowners Comprehensive Elite',
      time: '2 hours ago',
      result: 'Delivered (Opened)'
    }
  ]
};

// Main DOM Render Function (Zero Emojis)
function renderApp() {
  const app = document.getElementById('app');
  if (!app) return;

  document.documentElement.setAttribute('data-theme', state.theme);

  const selectedCustomer = state.customers.find(c => c.id === state.selectedCustomerId) || state.customers[0];
  const agentEval = state.agent.evaluateCustomer(selectedCustomer);

  const activeOfferProduct = state.selectedProductId
    ? (agentEval.eligibleInsurances.find(p => p.id === state.selectedProductId) || agentEval.eligibleInsurances[0])
    : agentEval.eligibleInsurances[0];

  app.innerHTML = `
    <!-- Top Site Navigation & Telemetry -->
    <header class="site-header">
      <div class="header-inner">
        <div class="brand-section">
          <div class="brand-logo-container" title="Dubrovnik Castle Emblem">
            <img src="/dubrovnik-castle-logo.jpg" alt="Dubrovnik Castle Emblem" class="brand-logo-img" />
          </div>
          <div class="brand-title-wrap">
            <h1>Magic Insurance</h1>
            <div class="brand-subtitle">
              <span class="pulse-dot"></span>
              Proactive Retail Customer Intelligence & Retention
            </div>
          </div>
        </div>

        <!-- Navigation Tabs (Command Center, Growth Analytics, Customer 360°, New Inbound Leads) -->
        <nav class="nav-tabs" role="tablist">
          <button class="nav-tab-btn ${state.currentView === 'command' ? 'active' : ''}" id="nav-btn-command">
            Command Center
          </button>
          <button class="nav-tab-btn ${state.currentView === 'leads' || state.currentView === 'bind-convert' ? 'active' : ''}" id="nav-btn-leads">
            ${state.currentView === 'bind-convert' ? 'New Inbound Leads › Offer Formulation' : 'New Inbound Leads'}
          </button>
          <button class="nav-tab-btn ${state.currentView === 'analytics' ? 'active' : ''}" id="nav-btn-analytics">
            Growth Analytics
          </button>
          <button class="nav-tab-btn ${state.currentView === 'directory' ? 'active' : ''}" id="nav-btn-directory">
            Customer 360°
          </button>
        </nav>

        <!-- Live Telemetry: High-Likelihood Upsell at Top -->
        <div class="telemetry-bar">
          <div class="metric-pill highlight-metric">
            <span class="metric-pill-label">High-Likelihood Upsell</span>
            <span class="metric-pill-val">$1.24M</span>
          </div>
          <div class="metric-pill success">
            <span class="metric-pill-label">Churn Defended</span>
            <span class="metric-pill-val">89.4%</span>
          </div>
          <div class="metric-pill">
            <span class="metric-pill-label">Net ARR Lift</span>
            <span class="metric-pill-val">+$348.5K</span>
          </div>
          <button class="theme-toggle-btn" id="btn-theme-toggle" title="Switch Theme (Light/Dark)">
            <span>${state.theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
          <button class="action-btn-primary" id="btn-open-simulator">
            Simulate Life Event
          </button>
        </div>
      </div>
    </header>

    <!-- Main Viewport Content -->
    <main class="main-viewport">
      ${state.currentView === 'command' ? renderCommandCenter(selectedCustomer, agentEval, activeOfferProduct) : ''}
      ${state.currentView === 'leads' ? renderLeadsView() : ''}
      ${state.currentView === 'bind-convert' ? renderBindConvertView() : ''}
      ${state.currentView === 'analytics' ? renderAnalyticsView() : ''}
      ${state.currentView === 'directory' ? renderDirectoryView() : ''}
    </main>

    <!-- Simulator Modal (No Emojis) -->
    <div class="modal-overlay ${state.isSimModalOpen ? 'open' : ''}" id="simulator-modal">
      <div class="modal-window">
        <div class="modal-header">
          <div class="modal-title">Interactive Life Event Sandbox</div>
          <button class="modal-close-btn" id="btn-close-sim">&times;</button>
        </div>
        <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:1.15rem;">
          Trigger a life event signal for <strong>${selectedCustomer.name}</strong> to recalculate active coverage, product eligibility, and closing likelihood.
        </p>

        <div class="sim-events-grid">
          ${Object.values(LIFE_EVENT_TYPES).map(evt => `
            <div class="sim-event-card ${state.selectedSimEventType === evt.id ? 'selected' : ''}" data-event-id="${evt.id}">
              <div class="sim-event-info">
                <div class="sim-event-name">${evt.label}</div>
                <div class="sim-event-urgency">Urgency Level: ${evt.urgency}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <input 
          type="text" 
          class="sim-custom-note" 
          id="sim-custom-input" 
          placeholder="Optional: custom context (e.g., 'Closed on $750k home in Austin suburbs')" 
        />

        <div class="sim-actions-row">
          <button class="btn-secondary" id="btn-cancel-sim">Cancel</button>
          <button class="action-btn-primary" id="btn-run-simulation">
            Trigger Event & Re-evaluate
          </button>
        </div>
      </div>
    </div>

    <!-- Notification Toast (No Emojis) -->
    <div class="toast-notice" id="app-toast">
      <span id="toast-text">Action completed successfully</span>
    </div>
  `;

  attachEventListeners();
}

// Render Command Center
function renderCommandCenter(customer, evaluation, activeOfferProduct) {
  const filteredCustomers = state.customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(state.searchQuery.toLowerCase());
    const matchesRisk = state.riskFilter === 'ALL' || c.churnRiskTier === state.riskFilter;
    return matchesSearch && matchesRisk;
  });

  const currentPolicies = evaluation.currentInsurances || customer.activePolicies || [];
  const eligibleInsurances = evaluation.eligibleInsurances || [];

  return `
    <div class="command-grid">
      <!-- Column 1: Customer Portfolio & Live Signals -->
      <section class="glass-panel" aria-label="Customer Portfolio">
        <div class="panel-header">
          <div class="panel-title-wrap">
            <h2 class="panel-title">Monitored Accounts</h2>
          </div>
          <span class="badge-counter">${filteredCustomers.length} active</span>
        </div>

        <div class="customer-search-box">
          <input 
            type="text" 
            class="customer-search-input" 
            id="cust-search" 
            placeholder="Search account, location..." 
            value="${state.searchQuery}" 
            style="padding-left: 0.85rem;"
          />
        </div>

        <div class="customers-list" role="list">
          ${filteredCustomers.map(c => `
            <div 
              class="customer-card ${c.id === customer.id ? 'active' : ''}" 
              data-cust-id="${c.id}"
              role="listitem"
            >
              <div class="cust-card-top">
                <img src="${c.avatar}" alt="${c.name}" class="cust-avatar" />
                <div class="cust-meta">
                  <div class="cust-name">${c.name}</div>
                  <div class="cust-household">${c.household}</div>
                </div>
                <div class="churn-tier-badge ${c.churnRiskTier}">${c.churnRiskScore}% Churn</div>
              </div>
              <div class="cust-card-bottom">
                <div class="cust-signal-summary">
                  <span>${c.detectedSignals[0]?.title.slice(0, 28) || 'Stable Account'}...</span>
                </div>
                <span>$${c.totalAnnualPremium.toLocaleString()}/yr</span>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Live Ingestion Stream -->
        <div class="signal-stream-section">
          <div class="stream-title-wrap">
            <span class="stream-title">Live Signal Detection Feed</span>
            <span class="pulse-dot"></span>
          </div>
          <div class="live-feed-item">
            <div class="feed-header">
              <span class="feed-title">New Dependent Registration Sync</span>
              <span class="feed-time">10m ago</span>
            </div>
            <span class="feed-source">Vital Statistics & Health Registry</span>
          </div>
          <div class="live-feed-item">
            <div class="feed-header">
              <span class="feed-title">Deed Recorded: $840k Dwelling</span>
              <span class="feed-time">42m ago</span>
            </div>
            <span class="feed-source">County Clerk Real Estate API</span>
          </div>
          <div class="live-feed-item">
            <div class="feed-header">
              <span class="feed-title">Rate Adjustment + Aggregator Search</span>
              <span class="feed-time">1h ago</span>
            </div>
            <span class="feed-source">Competitor Quote Activity Tracker</span>
          </div>
        </div>
      </section>

      <!-- Column 2: Highlighted Customer Insurance Profile -->
      <section class="glass-panel column-coverage" aria-label="Customer Insurance Intelligence">
        <div class="panel-header">
          <div class="panel-title-wrap">
            <h2 class="panel-title">Customer Insurance Profile</h2>
          </div>
          <span class="badge-counter">${currentPolicies.length} Active Policies &bull; ${eligibleInsurances.length} Eligible</span>
        </div>

        <!-- Profile Summary Banner -->
        <div class="active-cust-banner">
          <div class="profile-main-wrap">
            <img src="${customer.avatar}" alt="${customer.name}" class="profile-main-avatar" />
            <div>
              <div class="profile-name">${customer.name}</div>
              <div class="profile-subinfo">${customer.household} &bull; ${customer.location}</div>
            </div>
          </div>
          <div class="profile-metrics-group">
            <div class="profile-stat">
              <div class="stat-title">Client Tenure</div>
              <div class="stat-number">${customer.tenureYears} yrs</div>
            </div>
            <div class="profile-stat">
              <div class="stat-title">Active Premium</div>
              <div class="stat-number">$${customer.totalAnnualPremium.toLocaleString()}/yr</div>
            </div>
            <div class="profile-stat">
              <div class="stat-title">Estimated LTV</div>
              <div class="stat-number" style="color:var(--cyan-primary);">$${customer.estimatedLTV.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <!-- Section 1: What Insurances They Have -->
        <div class="current-insurances-section">
          <div class="section-subheading">
            <span>Current Insurances (${currentPolicies.length} Active Policies)</span>
            <span style="font-weight:600; text-transform:none; font-family:var(--font-mono); color:var(--text-main);">
              Total: $${customer.totalAnnualPremium.toLocaleString()}/year
            </span>
          </div>

          <div class="current-policies-grid">
            ${currentPolicies.map(p => `
              <div class="current-policy-card">
                <div class="current-policy-top">
                  <span class="current-policy-name">${p.type}</span>
                  <span class="policy-status-pill">${p.status || 'Active'}</span>
                </div>
                <div class="current-policy-bottom">
                  <span>Policy ID: <strong style="font-family:var(--font-mono);">${p.id}</strong></span>
                  <span class="current-policy-premium">$${p.annualPremium.toLocaleString()}/yr</span>
                </div>
                <div style="font-size:0.7rem; color:var(--text-dim); display:flex; justify-content:space-between;">
                  <span>Renewal Date:</span>
                  <span style="font-family:var(--font-mono);">${p.renewalDate || '2027-01-15'}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Section 2: Which Insurances They're Eligible For & Closing Likelihood -->
        <div class="eligible-insurances-section">
          <div class="section-subheading">
            <span>Eligible Insurances & Closing Likelihood</span>
            <span style="font-weight:600; text-transform:none; color:var(--cyan-primary);">
              Ranked by Eligibility
            </span>
          </div>

          <div class="eligible-cards-list">
            ${eligibleInsurances.map(item => {
    const isSelected = activeOfferProduct?.id === item.id;
    const tierClass = item.likelihood >= 80 ? 'very-high' : item.likelihood >= 65 ? 'high' : 'moderate';
    return `
                <div class="eligible-card ${item.isTopRecommendation ? 'top-nba' : ''} ${isSelected ? 'selected-card' : ''}">
                  <div class="eligible-card-header">
                    <div>
                      <div class="eligible-prod-title">
                        <span>${item.name}</span>
                        <span class="eligible-category-tag">${item.category}</span>
                        ${item.isTopRecommendation ? '<span class="policy-status-pill" style="background:#E0F2FE; color:#0369A1; border-color:#BAE6FD;">Top Recommendation</span>' : ''}
                      </div>
                    </div>
                    <div class="likelihood-badge-pill ${tierClass}">
                      <span>${item.likelihood}% Likelihood</span>
                    </div>
                  </div>

                  <!-- Likelihood Progress Bar -->
                  <div class="likelihood-bar-container">
                    <div class="likelihood-track">
                      <div class="likelihood-fill ${tierClass}" style="width: ${item.likelihood}%;"></div>
                    </div>
                    <span style="font-size:0.7rem; font-weight:700; color:var(--text-dim); font-family:var(--font-mono); min-width:65px; text-align:right;">
                      ${item.likelihoodTier}
                    </span>
                  </div>

                  <!-- Why they would go for it -->
                  <div class="eligible-reason-box">
                    <strong>Why they would go for it:</strong> ${item.reason}
                  </div>

                  <!-- Price & Selection Action -->
                  <div class="eligible-card-footer">
                    <div class="eligible-price-info">
                      <span class="eligible-price-val">$${item.discountedPrice}/yr</span>
                      <span style="font-size:0.72rem; color:var(--text-muted); text-decoration:line-through;">$${item.basePrice}/yr</span>
                      <span class="eligible-savings-val">Save $${item.savings}/yr bundle discount</span>
                    </div>
                    <button class="btn-select-offer ${isSelected ? 'selected' : ''}" data-select-product="${item.id}">
                      ${isSelected ? 'Selected for Outreach' : 'Select for Outreach'}
                    </button>
                  </div>
                </div>
              `;
  }).join('')}
          </div>
        </div>
      </section>

      <!-- Column 3: Proactive Outreach -->
      <section class="glass-panel column-dispatch" aria-label="Omnichannel Dispatcher">
        <div class="panel-header">
          <div class="panel-title-wrap">
            <h2 class="panel-title">Proactive Outreach</h2>
          </div>
          <span class="badge-counter">${activeOfferProduct ? activeOfferProduct.name : 'Personalized'}</span>
        </div>

        <div class="omni-channel-tabs" role="tablist">
          <button class="channel-tab-btn ${state.activeChannelTab === 'email' ? 'active' : ''}" data-channel="email">
            Email Campaign
          </button>
          <button class="channel-tab-btn ${state.activeChannelTab === 'advisor' ? 'active' : ''}" data-channel="advisor">
            Advisor Script
          </button>
          <button class="channel-tab-btn ${state.activeChannelTab === 'push' ? 'active' : ''}" data-channel="push">
            Mobile App
          </button>
        </div>

        <div class="channel-preview-card">
          ${renderChannelPreview(state.activeChannelTab, customer, activeOfferProduct || evaluation.nextBestAction.recommendedProduct, evaluation.nextBestAction)}
        </div>

        <div class="dispatch-action-bar">
          <button class="dispatch-cta-btn" id="btn-dispatch-offer">
            Dispatch ${activeOfferProduct ? activeOfferProduct.name : 'Offer'} (1-Click)
          </button>
          <div class="dispatch-history-log">
            <span>Recent dispatch: <strong>${state.dispatchLog[0]?.product}</strong></span>
            <span>${state.dispatchLog[0]?.result}</span>
          </div>
        </div>
      </section>
    </div>
  `;
}

// Rate calculation engine for formulated offer
function getOfferRateCalculation(lead, config) {
  if (!lead || !config) {
    return {
      monthly: 0,
      annual: 0,
      bundleSavings: 0,
      closingLikelihood: 85,
      essentialMonthly: 0,
      recommendedMonthly: 0,
      eliteMonthly: 0
    };
  }

  const baseQuote = lead.monthlyQuote || 100;

  // Calculate baseline monthly for each tier
  const essentialBase = Math.round(baseQuote * 0.84);
  const recommendedBase = baseQuote;
  const eliteBase = Math.round(baseQuote * 1.30);

  let activeBase = config.selectedTier === 'essential' ? essentialBase :
                   config.selectedTier === 'elite' ? eliteBase :
                   recommendedBase;

  // Deductible adjustment
  let deductibleDelta = 0;
  if (config.deductible === 250) deductibleDelta = 12;
  else if (config.deductible === 1000) deductibleDelta = -10;

  // Liability adjustment
  let liabilityDelta = 0;
  if (config.liabilityLimit === 'standard') liabilityDelta = -6;
  else if (config.liabilityLimit === 'maximum') liabilityDelta = 14;

  // Addons adjustment
  let addonsDelta = 0;
  if (config.addons?.roadside) addonsDelta += 8;
  if (config.addons?.rental) addonsDelta += 6;
  if (config.addons?.glass) addonsDelta += 5;
  if (config.addons?.oemParts) addonsDelta += 12;

  let computedMonthly = Math.max(35, activeBase + deductibleDelta + liabilityDelta + addonsDelta);

  // Agent discretionary discount
  if (config.agentDiscountPercent > 0) {
    computedMonthly = Math.round(computedMonthly * (1 - config.agentDiscountPercent / 100));
  }

  // Custom manual override if provided
  if (config.customMonthlyOverride !== null && config.customMonthlyOverride !== undefined && !isNaN(config.customMonthlyOverride) && config.customMonthlyOverride > 0) {
    computedMonthly = Math.round(Number(config.customMonthlyOverride));
  }

  const annual = Math.round(computedMonthly * 12 * 0.92); // 8% pay-in-full discount
  const bundleSavings = Math.round(annual * 0.18);

  // Dynamic closing likelihood
  let closingLikelihood = lead.closingLikelihood || 88;
  if (config.agentDiscountPercent >= 10) closingLikelihood = Math.min(99, closingLikelihood + 7);
  else if (config.agentDiscountPercent >= 5) closingLikelihood = Math.min(97, closingLikelihood + 4);
  if (config.selectedTier === 'essential') closingLikelihood = Math.min(96, closingLikelihood + 3);
  if (config.selectedTier === 'elite' && config.agentDiscountPercent === 0) closingLikelihood = Math.max(74, closingLikelihood - 4);

  return {
    monthly: computedMonthly,
    annual,
    bundleSavings,
    closingLikelihood,
    essentialMonthly: essentialBase,
    recommendedMonthly: recommendedBase,
    eliteMonthly: eliteBase
  };
}

function initiateBindAndConvert(leadId) {
  const lead = state.leads.find(l => l.id === leadId);
  if (!lead) return;

  state.activeBindLeadId = leadId;
  state.activeOfferConfig = {
    leadId: lead.id,
    selectedTier: 'recommended',
    deductible: 500,
    liabilityLimit: 'enhanced',
    addons: {
      roadside: true,
      rental: false,
      glass: true,
      oemParts: lead.carClassKey === 'ev' || lead.carClassKey === 'luxury'
    },
    agentDiscountPercent: 0,
    paymentFrequency: 'monthly',
    customMonthlyOverride: null,
    effectiveDate: new Date().toISOString().split('T')[0],
    agentNotes: `Inbound inquiry for ${lead.carClass}. Underwriting rating tier: ${lead.tier}.`
  };

  state.currentView = 'bind-convert';
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Render Bind & Convert: Recommended Rates & Formulated Offer View
function renderBindConvertView() {
  const lead = state.leads.find(l => l.id === state.activeBindLeadId) || state.leads[0];
  if (!lead) {
    return `<div style="padding:2rem;">No active lead found. <button class="action-btn-primary" id="btn-back-to-leads">Back to Inbound Leads</button></div>`;
  }

  const config = state.activeOfferConfig || {
    leadId: lead.id,
    selectedTier: 'recommended',
    deductible: 500,
    liabilityLimit: 'enhanced',
    addons: { roadside: true, rental: false, glass: true, oemParts: false },
    agentDiscountPercent: 0,
    paymentFrequency: 'monthly',
    customMonthlyOverride: null,
    effectiveDate: new Date().toISOString().split('T')[0]
  };

  const rates = getOfferRateCalculation(lead, config);
  const initials = lead.fullName.split(' ').map(n => n[0]).join('').slice(0, 2);

  const tierMeta = {
    essential: {
      name: 'Essential Standard',
      desc: 'State compliance and core liability with standard roadside assistance.',
      deductible: '$1,000 Deductible',
      liability: '$50k / $100k / $50k Liability',
      features: ['State Minimum & Bodily Injury ($50k/$100k)', 'Collision & Comprehensive ($1k Deductible)', 'Standard Emergency Roadside Dispatch']
    },
    recommended: {
      name: 'Magic Preferred (AI Recommended)',
      desc: 'Optimal protection tailored for driving record, vehicle class, and high retention.',
      deductible: '$500 Deductible (Recommended)',
      liability: '$100k / $300k / $100k Enhanced Liability',
      features: ['Enhanced Bodily Injury & Property ($100k/$300k)', 'Collision & Comprehensive ($500 Deductible)', '24/7 National Towing & Roadside Assistance', 'Zero-Deductible Full Windshield & Glass', 'Multi-Policy Bundle Savings Credit']
    },
    elite: {
      name: 'Comprehensive Elite',
      desc: 'Maximum coverage with OEM replacement parts, rental reimbursement, and gap protection.',
      deductible: '$250 Deductible',
      liability: '$250k / $500k / $250k Umbrella Ready',
      features: ['Maximum Umbrella-Ready Liability ($250k/$500k)', 'Low $250 Collision & Comprehensive Deductible', 'OEM Genuine Parts Replacement Guarantee', 'Rental Car Reimbursement ($45/day)', 'Full Glass & Comprehensive Gap Protection']
    }
  };

  const currentTierInfo = tierMeta[config.selectedTier] || tierMeta.recommended;

  const liabilityLabels = {
    standard: '$50,000 / $100,000 / $50,000',
    enhanced: '$100,000 / $300,000 / $100,000',
    maximum: '$250,000 / $500,000 / $250,000'
  };

  return `
    <div class="bind-convert-view">
      <!-- Breadcrumb and Top Navigation -->
      <div class="bind-header-bar">
        <div class="bind-breadcrumb">
          <button class="bind-breadcrumb-btn" id="btn-back-to-leads">
            &larr; Back to Inbound Leads Pipeline
          </button>
          <span>/</span>
          <span style="color:var(--text-bright); font-weight:700;">Bind & Convert Offer Formulation</span>
        </div>
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <span class="policy-status-pill" style="background:#E0F2FE; color:#0369A1; border-color:#BAE6FD;">
            Binder Inception Engine
          </span>
          <span class="likelihood-badge-pill ${rates.closingLikelihood >= 88 ? 'very-high' : 'high'}">
            ${rates.closingLikelihood}% Closing Likelihood
          </span>
        </div>
      </div>

      <!-- Applicant Overview Banner -->
      <div class="bind-prospect-banner">
        <div class="bind-prospect-profile">
          <div class="bind-prospect-avatar">${initials}</div>
          <div class="bind-prospect-details">
            <h2>${lead.fullName}</h2>
            <div class="bind-prospect-meta">
              <span>${lead.email}</span>
              <span>&bull;</span>
              <span>${lead.phone}</span>
              <span>&bull;</span>
              <span>${lead.location}</span>
            </div>
          </div>
        </div>

        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <span class="bind-prospect-pill">Vehicle: <strong>${lead.carClass}</strong></span>
          <span class="bind-prospect-pill">Experience: <strong>${lead.drivingExperience} yrs</strong></span>
          <span class="bind-prospect-pill">Record: <strong>${lead.record}</strong></span>
          <span class="bind-prospect-pill">Mileage: <strong>${lead.annualMileage}</strong></span>
          <span class="bind-prospect-pill">Rating Tier: <strong>${lead.tier}</strong></span>
        </div>
      </div>

      <!-- Main Layout Columns: Left = Recommended Rates & Adjustments, Right = Formulated Binder Offer -->
      <div class="bind-layout-columns">
        <div style="display:flex; flex-direction:column; gap:1.5rem;">
          
          <!-- Section 1: Recommended Rates for this Customer -->
          <div class="glass-panel" style="padding:1.5rem;">
            <div class="panel-header" style="margin-bottom:0.25rem;">
              <div>
                <h3 class="panel-title" style="font-size:1.1rem;">Recommended Rates for ${lead.fullName}</h3>
                <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">
                  AI actuarial underwriting recommendations based on applicant's driving record, vehicle class, and risk tier.
                </p>
              </div>
            </div>

            <!-- Tier Cards Grid -->
            <div class="tier-cards-grid">
              <!-- Essential -->
              <div class="tier-rate-card ${config.selectedTier === 'essential' ? 'selected' : ''}" data-select-tier="essential">
                <div>
                  <div class="tier-name">${tierMeta.essential.name}</div>
                  <div class="tier-desc">${tierMeta.essential.desc}</div>
                  <div class="tier-price-display">
                    <span class="tier-price-val">$${rates.essentialMonthly}</span>
                    <span class="tier-price-period">/mo</span>
                  </div>
                  <div class="tier-annual-sub">$${Math.round(rates.essentialMonthly * 12 * 0.92)}/yr (8% pay-in-full discount)</div>
                  <ul class="tier-feature-list">
                    ${tierMeta.essential.features.map(f => `
                      <li class="tier-feature-item">
                        <span class="tier-feature-bullet">&check;</span>
                        <span>${f}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
                <button type="button" class="tier-select-btn">
                  ${config.selectedTier === 'essential' ? 'Selected Package' : 'Select Package'}
                </button>
              </div>

              <!-- Recommended Magic Preferred -->
              <div class="tier-rate-card recommended ${config.selectedTier === 'recommended' ? 'selected' : ''}" data-select-tier="recommended">
                <span class="tier-recommended-ribbon">AI Recommended</span>
                <div>
                  <div class="tier-name">${tierMeta.recommended.name}</div>
                  <div class="tier-desc">${tierMeta.recommended.desc}</div>
                  <div class="tier-price-display">
                    <span class="tier-price-val" style="color:var(--blue-primary);">$${rates.recommendedMonthly}</span>
                    <span class="tier-price-period">/mo</span>
                  </div>
                  <div class="tier-annual-sub">$${lead.annualQuote}/yr (Includes bundle savings)</div>
                  <ul class="tier-feature-list">
                    ${tierMeta.recommended.features.map(f => `
                      <li class="tier-feature-item">
                        <span class="tier-feature-bullet" style="color:var(--emerald-success);">&check;</span>
                        <span>${f}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
                <button type="button" class="tier-select-btn">
                  ${config.selectedTier === 'recommended' ? 'Active Recommended Package' : 'Select Package'}
                </button>
              </div>

              <!-- Elite -->
              <div class="tier-rate-card ${config.selectedTier === 'elite' ? 'selected' : ''}" data-select-tier="elite">
                <div>
                  <div class="tier-name">${tierMeta.elite.name}</div>
                  <div class="tier-desc">${tierMeta.elite.desc}</div>
                  <div class="tier-price-display">
                    <span class="tier-price-val">$${rates.eliteMonthly}</span>
                    <span class="tier-price-period">/mo</span>
                  </div>
                  <div class="tier-annual-sub">$${Math.round(rates.eliteMonthly * 12 * 0.92)}/yr (Premium tier)</div>
                  <ul class="tier-feature-list">
                    ${tierMeta.elite.features.map(f => `
                      <li class="tier-feature-item">
                        <span class="tier-feature-bullet">&check;</span>
                        <span>${f}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
                <button type="button" class="tier-select-btn">
                  ${config.selectedTier === 'elite' ? 'Selected Package' : 'Select Package'}
                </button>
              </div>
            </div>

            <!-- Underwriting Actuarial Factors -->
            <div class="underwriting-breakdown-box" style="margin-top:1.25rem;">
              <div style="font-size:0.75rem; font-weight:700; color:var(--text-bright); text-transform:uppercase; letter-spacing:0.04em;">
                Actuarial Underwriting Factors & Rate Justification
              </div>
              <div class="breakdown-factors-grid">
                <div class="breakdown-factor-item">
                  <span class="factor-label">Driving Record</span>
                  <span class="factor-value">${lead.record.includes('Clean') ? 'Clean Record' : 'Standard'}</span>
                  <span class="factor-credit">${lead.record.includes('Clean') ? '-12% Safe Driver Credit' : 'Base Rate'}</span>
                </div>
                <div class="breakdown-factor-item">
                  <span class="factor-label">Driving Experience</span>
                  <span class="factor-value">${lead.drivingExperience} Years</span>
                  <span class="factor-credit">${lead.drivingExperience >= 5 ? '-8% Seasoned Credit' : 'Standard Tier'}</span>
                </div>
                <div class="breakdown-factor-item">
                  <span class="factor-label">Vehicle Risk Class</span>
                  <span class="factor-value">${lead.carClass.split('(')[0].trim()}</span>
                  <span class="factor-credit" style="color:var(--blue-primary);">5-Star Safety Profile</span>
                </div>
                <div class="breakdown-factor-item">
                  <span class="factor-label">Bundle Incentive</span>
                  <span class="factor-value">Save $${lead.bundleSavings}/yr</span>
                  <span class="factor-credit">Multi-Policy Discount</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Option to Adjust the Offer -->
          <div class="glass-panel" style="padding:1.5rem;" id="adjust-offer-section">
            <div class="panel-header" style="margin-bottom:0.75rem;">
              <div>
                <h3 class="panel-title" style="font-size:1.1rem;">Adjust Offer Parameters</h3>
                <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">
                  As an insurance agent, you can customize coverage limits, deductibles, endorsements, or apply discretionary discounts.
                </p>
              </div>
              <button class="btn-bind-reset" id="btn-reset-offer" style="width:auto; padding:0.35rem 0.75rem;">
                Reset to Recommended
              </button>
            </div>

            <div class="adjust-offer-panel">
              <!-- Deductible Selection -->
              <div class="adjust-field-group">
                <div class="adjust-field-header">
                  <span>Comprehensive & Collision Deductible</span>
                  <span style="font-size:0.7rem; color:var(--text-muted);">Current: $${config.deductible}</span>
                </div>
                <div class="adjust-options-pills">
                  <div class="adjust-option-pill ${config.deductible === 250 ? 'active' : ''}" data-adjust-deductible="250">
                    $250 (+$12/mo)
                  </div>
                  <div class="adjust-option-pill ${config.deductible === 500 ? 'active' : ''}" data-adjust-deductible="500">
                    $500 (Recommended)
                  </div>
                  <div class="adjust-option-pill ${config.deductible === 1000 ? 'active' : ''}" data-adjust-deductible="1000">
                    $1,000 (-$10/mo)
                  </div>
                </div>
              </div>

              <!-- Liability Limit Selection -->
              <div class="adjust-field-group">
                <div class="adjust-field-header">
                  <span>Bodily Injury & Property Damage Limits</span>
                  <span style="font-size:0.7rem; color:var(--text-muted);">${liabilityLabels[config.liabilityLimit]}</span>
                </div>
                <div class="adjust-options-pills">
                  <div class="adjust-option-pill ${config.liabilityLimit === 'standard' ? 'active' : ''}" data-adjust-liability="standard">
                    Standard ($50k/$100k, -$6/mo)
                  </div>
                  <div class="adjust-option-pill ${config.liabilityLimit === 'enhanced' ? 'active' : ''}" data-adjust-liability="enhanced">
                    Enhanced ($100k/$300k, Recommended)
                  </div>
                  <div class="adjust-option-pill ${config.liabilityLimit === 'maximum' ? 'active' : ''}" data-adjust-liability="maximum">
                    Umbrella-Ready ($250k/$500k, +$14/mo)
                  </div>
                </div>
              </div>

              <!-- Optional Add-ons Checkboxes -->
              <div class="adjust-field-group">
                <div class="adjust-field-header">
                  <span>Coverage Endorsements & Add-ons</span>
                  <span style="font-size:0.7rem; color:var(--text-muted);">Toggle to include or exclude</span>
                </div>
                <div class="addons-toggle-grid">
                  <div class="addon-toggle-box ${config.addons.roadside ? 'active' : ''}" data-toggle-addon="roadside">
                    <div class="addon-info">
                      <span class="addon-name">24/7 Roadside Assistance</span>
                      <span class="addon-cost">+$8.00 / mo</span>
                    </div>
                    <input type="checkbox" class="addon-checkbox" ${config.addons.roadside ? 'checked' : ''} />
                  </div>

                  <div class="addon-toggle-box ${config.addons.rental ? 'active' : ''}" data-toggle-addon="rental">
                    <div class="addon-info">
                      <span class="addon-name">Rental Car Reimbursement</span>
                      <span class="addon-cost">+$6.00 / mo ($45/day)</span>
                    </div>
                    <input type="checkbox" class="addon-checkbox" ${config.addons.rental ? 'checked' : ''} />
                  </div>

                  <div class="addon-toggle-box ${config.addons.glass ? 'active' : ''}" data-toggle-addon="glass">
                    <div class="addon-info">
                      <span class="addon-name">Zero-Deductible Full Glass</span>
                      <span class="addon-cost">+$5.00 / mo</span>
                    </div>
                    <input type="checkbox" class="addon-checkbox" ${config.addons.glass ? 'checked' : ''} />
                  </div>

                  <div class="addon-toggle-box ${config.addons.oemParts ? 'active' : ''}" data-toggle-addon="oemParts">
                    <div class="addon-info">
                      <span class="addon-name">OEM Genuine Replacement Parts</span>
                      <span class="addon-cost">+$12.00 / mo</span>
                    </div>
                    <input type="checkbox" class="addon-checkbox" ${config.addons.oemParts ? 'checked' : ''} />
                  </div>
                </div>
              </div>

              <!-- Agent Discretionary Discount & Custom Rate Override -->
              <div class="form-row-dual">
                <div class="adjust-field-group">
                  <label class="form-label">
                    <span>Agent Discretionary Discount</span>
                    <span class="form-label-hint">${config.agentDiscountPercent}% Applied</span>
                  </label>
                  <select class="form-select" id="adjust-agent-discount">
                    <option value="0" ${config.agentDiscountPercent === 0 ? 'selected' : ''}>0% - Standard Recommended Rate</option>
                    <option value="5" ${config.agentDiscountPercent === 5 ? 'selected' : ''}>5% - Preferred Driver Courtesy Discount</option>
                    <option value="10" ${config.agentDiscountPercent === 10 ? 'selected' : ''}>10% - Competitive Price Match Guarantee</option>
                    <option value="15" ${config.agentDiscountPercent === 15 ? 'selected' : ''}>15% - Branch Manager Retention Override</option>
                  </select>
                </div>

                <div class="adjust-field-group">
                  <label class="form-label">
                    <span>Direct Negotiated Monthly Override</span>
                    <span class="form-label-hint">${config.customMonthlyOverride ? `Active: $${config.customMonthlyOverride}/mo` : 'Optional'}</span>
                  </label>
                  <div style="display:flex; gap:0.5rem;">
                    <input 
                      type="number" 
                      class="form-input-text" 
                      id="adjust-custom-rate-input" 
                      placeholder="e.g. 95" 
                      value="${config.customMonthlyOverride || ''}" 
                      style="font-family:var(--font-mono);" 
                    />
                    <button class="action-btn-primary" id="btn-apply-custom-rate" style="padding:0.6rem 0.9rem; font-size:0.75rem;">
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              <!-- Internal Agent Notes -->
              <div class="adjust-field-group">
                <label class="form-label">Agent Underwriting & Binder Notes</label>
                <input 
                  type="text" 
                  class="form-input-text" 
                  id="adjust-agent-notes" 
                  value="${config.agentNotes || ''}" 
                  placeholder="Notes recorded on policy binding..." 
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Formulated Offer & Binder Summary Card -->
        <div>
          <div class="formulated-binder-card">
            <!-- Binder Header -->
            <div class="binder-card-header">
              <div class="binder-logo-title">
                <div style="font-weight:800; font-size:0.95rem; letter-spacing:0.02em;">MAGIC INSURANCE CORE</div>
                <div style="font-size:0.68rem; color:#94A3B8;">Official Digital Policy Binder & Offer Proposal</div>
              </div>
              <div class="binder-seal-badge">OFFER FORMULATED</div>
            </div>

            <!-- Binder Body -->
            <div class="binder-card-body">
              <!-- Proposal Pitch Narrative -->
              <div class="binder-proposal-pitch">
                <strong>Formulated Offer for ${lead.fullName}:</strong>
                Comprehensive coverage on <em>${lead.carClass}</em> under the <strong>${currentTierInfo.name}</strong>. Includes guaranteed 30-day rate lock and zero-lapse digital binder inception.
              </div>

              <!-- Billing Plan Selector -->
              <div style="display:flex; gap:0.5rem; background:var(--bg-darkest); padding:0.25rem; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
                <button 
                  type="button" 
                  class="adjust-option-pill ${config.paymentFrequency === 'monthly' ? 'active' : ''}" 
                  data-payment-freq="monthly"
                  style="padding:0.4rem;"
                >
                  Monthly Payment
                </button>
                <button 
                  type="button" 
                  class="adjust-option-pill ${config.paymentFrequency === 'annual' ? 'active' : ''}" 
                  data-payment-freq="annual"
                  style="padding:0.4rem;"
                >
                  Annual Pay-in-Full (Save 8%)
                </button>
              </div>

              <!-- Itemized Binder Coverages -->
              <div class="binder-items-list">
                <div class="binder-item-row">
                  <span class="binder-item-label">Applicant:</span>
                  <span class="binder-item-val">${lead.fullName}</span>
                </div>
                <div class="binder-item-row">
                  <span class="binder-item-label">Vehicle Insured:</span>
                  <span class="binder-item-val">${lead.carClass}</span>
                </div>
                <div class="binder-item-row">
                  <span class="binder-item-label">Effective Date:</span>
                  <span class="binder-item-val" style="font-family:var(--font-mono);">${config.effectiveDate} (Immediate)</span>
                </div>
                <div class="binder-item-row">
                  <span class="binder-item-label">Policy Tier:</span>
                  <span class="binder-item-val" style="color:var(--blue-primary);">${currentTierInfo.name}</span>
                </div>
                <div class="binder-item-row">
                  <span class="binder-item-label">Bodily Injury Limits:</span>
                  <span class="binder-item-val">${liabilityLabels[config.liabilityLimit]}</span>
                </div>
                <div class="binder-item-row">
                  <span class="binder-item-label">Comp & Collision Deductible:</span>
                  <span class="binder-item-val">$${config.deductible}</span>
                </div>
                <div class="binder-item-row">
                  <span class="binder-item-label">Active Endorsements:</span>
                  <span class="binder-item-val" style="font-size:0.72rem; text-align:right;">
                    ${Object.keys(config.addons).filter(k => config.addons[k]).join(', ') || 'Core Coverage Only'}
                  </span>
                </div>
                ${config.agentDiscountPercent > 0 ? `
                  <div class="binder-item-row" style="color:var(--emerald-success);">
                    <span>Discretionary Agent Discount:</span>
                    <span style="font-weight:700;">-${config.agentDiscountPercent}%</span>
                  </div>
                ` : ''}
                <div class="binder-item-row">
                  <span class="binder-item-label">Multi-Policy Bundle Credit:</span>
                  <span class="binder-item-val" style="color:var(--emerald-success); font-family:var(--font-mono);">Save $${rates.bundleSavings}/yr</span>
                </div>
              </div>

              <!-- Highlighted Pricing Display -->
              <div class="binder-pricing-highlight">
                <div>
                  <div style="font-size:0.7rem; text-transform:uppercase; font-weight:700; color:var(--text-dim); letter-spacing:0.04em;">
                    ${config.paymentFrequency === 'monthly' ? 'Monthly Premium' : 'Annual Pay-in-Full'}
                  </div>
                  <div class="binder-monthly-total">
                    $${config.paymentFrequency === 'monthly' ? rates.monthly : rates.annual}
                    <span style="font-size:0.85rem; font-weight:500; color:var(--text-dim);">
                      ${config.paymentFrequency === 'monthly' ? '/mo' : '/yr'}
                    </span>
                  </div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:0.85rem; font-weight:700; color:var(--text-bright); font-family:var(--font-mono);">
                    ${config.paymentFrequency === 'monthly' ? `$${rates.annual} / year` : `$${rates.monthly} / month equiv.`}
                  </div>
                  <div style="font-size:0.7rem; color:var(--emerald-success); font-weight:600; margin-top:0.2rem;">
                    Down Payment Due: $${config.paymentFrequency === 'monthly' ? rates.monthly : rates.annual}
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="binder-cta-container">
                <button class="btn-bind-accept" id="btn-accept-bind-offer">
                  <span>Accept Offer & Bind Policy</span>
                  <span style="font-size:1.1rem;">&rarr;</span>
                </button>
                <div style="font-size:0.72rem; color:var(--text-muted); text-align:center; line-height:1.35;">
                  Accepting instantly binds policy coverage, logs underwriting terms, and provisions active customer account.
                </div>
                <button class="btn-bind-reset" id="btn-cancel-bind" style="margin-top:0.25rem;">
                  Cancel & Return to Leads
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}


// Render dynamic preview for Email / Advisor / Push (No Emojis)
function renderChannelPreview(channel, customer, product, nba) {
  const firstName = customer.name.split(' ')[0];
  const prodName = product.name;
  const savings = product.savings || nba.estimatedSavingsForCustomer;

  if (channel === 'email') {
    return `
      <div class="email-meta-header">
        <div class="email-meta-row">To: <span>${customer.name} &lt;${customer.name.toLowerCase().replace(/[^a-z]/g, '.')}@email.com&gt;</span></div>
        <div class="email-meta-row">From: <span>Magic Insurance Advisory &lt;advisory@magicinsurance.com&gt;</span></div>
        <div class="email-subject-line">Subject: Pre-Approved ${prodName} Bundle Savings for ${firstName}</div>
      </div>
      <div class="email-body-text">
Dear ${firstName},

We reviewed your active insurance portfolio to ensure your household coverage matches your recent life milestones.

Based on your current policies and verified eligibility, you have been pre-approved for our ${prodName} with an active multi-policy bundle discount.

Key Benefits of Your Tailored Coverage:
• Immediate $${savings}/year bundled savings credited to your account
• Seamless integration with your existing active coverage
• Guaranteed zero lapse in coverage with 1-click binding

Review your personalized proposal below to lock in this preferred member rate.
      </div>
      <div class="email-cta-box">
        <div class="email-cta-btn-preview">Review & Activate ${prodName} (Save $${savings}/yr)</div>
      </div>
    `;
  }

  if (channel === 'advisor') {
    return `
      <div style="font-size:0.78rem; font-weight:700; color:var(--cyan-primary); margin-bottom:0.6rem;">
        Magic Insurance Advisor Consultation Script
      </div>
      <div class="advisor-script-list">
        <div class="advisor-point-card">
          <strong>Warm Introduction:</strong> "Hello ${firstName}, this is your personal Magic Insurance advisor calling to follow up on your account coverage."
        </div>
        <div class="advisor-point-card">
          <strong>Context & Eligibility:</strong> "I noticed your household is now eligible for ${prodName}. Given your recent milestone, this fills an important safety net gap."
        </div>
        <div class="advisor-point-card">
          <strong>Value Proposition:</strong> "Because of your existing loyalty with us, bundling this will save you $${savings}/year directly off your annual bill."
        </div>
        <div class="advisor-point-card">
          <strong>Closing & Binding:</strong> "Shall I send the pre-filled digital binder directly to your portal for electronic signature?"
        </div>
      </div>
    `;
  }

  if (channel === 'push') {
    return `
      <div style="background:var(--bg-card); border:1px solid var(--border-medium); border-radius:var(--radius-md); padding:1rem; margin-top:2rem; box-shadow:var(--shadow-sm);">
        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
          <img src="/dubrovnik-castle-logo.jpg" style="width:24px; height:24px; border-radius:4px;" />
          <span style="font-size:0.76rem; font-weight:700; color:var(--text-bright);">Magic Insurance Mobile Portal</span>
          <span style="font-size:0.68rem; color:var(--text-dim); margin-left:auto;">Now</span>
        </div>
        <div style="font-size:0.84rem; font-weight:700; color:var(--text-bright); margin-bottom:0.25rem;">
          New Eligible Coverage: ${prodName}
        </div>
        <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.75rem;">
          Tap to review your pre-approved proposal with $${savings}/yr multi-policy bundle savings.
        </div>
        <div style="background:var(--blue-primary); color:#FFFFFF; font-weight:700; font-size:0.76rem; text-align:center; padding:0.4rem; border-radius:var(--radius-sm); cursor:pointer;">
          View Pre-Approved Offer
        </div>
      </div>
    `;
  }
}

// Render New Inbound Leads & Rate Quote Intake Page (for Insurance Employees)
function renderLeadsView() {
  const calc = state.activeLeadCalculator;
  const quote = state.currentCalculatedQuote;

  const filteredLeads = state.leads.filter(l => {
    return l.fullName.toLowerCase().includes(state.leadSearchQuery.toLowerCase()) ||
      l.carClass.toLowerCase().includes(state.leadSearchQuery.toLowerCase()) ||
      l.location.toLowerCase().includes(state.leadSearchQuery.toLowerCase());
  });

  const totalPipelineARR = state.leads.reduce((acc, l) => acc + (l.annualQuote || 0), 0);
  const avgMonthlyQuote = Math.round(state.leads.reduce((acc, l) => acc + (l.monthlyQuote || 0), 0) / (state.leads.length || 1));
  const highIntentCount = state.leads.filter(l => l.closingLikelihood >= 85).length;

  return `
    <div class="leads-page-container">
      <!-- Pipeline KPI Metrics -->
      <div class="leads-kpi-row">
        <div class="kpi-card">
          <div class="kpi-title">Inbound Inquiries Queue</div>
          <div class="kpi-value">${state.leads.length} Leads</div>
          <div class="kpi-trend">+4 new inquiries in last 3 hours</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Average Car Insurance Quoted</div>
          <div class="kpi-value">$${avgMonthlyQuote}/mo</div>
          <div class="kpi-trend">Preferred rate tier benchmark</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">High Closing Probability</div>
          <div class="kpi-value">${highIntentCount} (${Math.round((highIntentCount / state.leads.length) * 100)}%)</div>
          <div class="kpi-trend">Lead intent score over 85%</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Quoted Pipeline Value</div>
          <div class="kpi-value">$${(totalPipelineARR / 1000).toFixed(1)}K ARR</div>
          <div class="kpi-trend">Annualized new premium pipeline</div>
        </div>
      </div>

      <!-- Main Layout: Left = Rate Quote Intake Calculator, Right = Inbound Leads Table -->
      <div class="leads-layout-grid">
        <!-- Left Column: Lead Rate Intake & Rating Calculator -->
        <div class="quote-calculator-card">
          <div class="panel-header" style="margin-bottom:0.5rem;">
            <div>
              <h2 class="panel-title">Inbound Rate Quote Intake</h2>
              <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">
                Employee tool to calculate and issue insurance coverage rates when applicants reach out.
              </p>
            </div>
            <span class="policy-status-pill" style="background:#E0F2FE; color:#0369A1; border-color:#BAE6FD;">
              Live Actuarial Rating
            </span>
          </div>

          <!-- Applicant Contact Info -->
          <div class="form-row-dual">
            <div class="form-group-block">
              <label class="form-label">Full Name</label>
              <input type="text" class="form-input-text" id="lead-input-name" value="${calc.fullName}" placeholder="e.g. David Robinson" />
            </div>
            <div class="form-group-block">
              <label class="form-label">Location</label>
              <input type="text" class="form-input-text" id="lead-input-location" value="${calc.location}" placeholder="City, State" />
            </div>
          </div>

          <div class="form-row-dual">
            <div class="form-group-block">
              <label class="form-label">Email Address</label>
              <input type="email" class="form-input-text" id="lead-input-email" value="${calc.email}" placeholder="client@example.com" />
            </div>
            <div class="form-group-block">
              <label class="form-label">Phone Number</label>
              <input type="tel" class="form-input-text" id="lead-input-phone" value="${calc.phone}" placeholder="(512) 555-0100" />
            </div>
          </div>

          <!-- Insurance Type -->
          <div class="form-group-block">
            <label class="form-label">Coverage Requested</label>
            <div class="pill-choice-group">
              <button type="button" class="pill-choice-btn active" data-field="insuranceType" data-val="car">Car Insurance</button>
              <button type="button" class="pill-choice-btn" data-field="insuranceType" data-val="home">Homeowners Insurance</button>
              <button type="button" class="pill-choice-btn" data-field="insuranceType" data-val="life">Family Term Life</button>
            </div>
          </div>

          <!-- Car Specific Underwriting Parameters -->
          <div style="background:#F8FAFC; border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1rem; display:flex; flex-direction:column; gap:0.9rem;">
            <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-dim);">
              Vehicle & Driver Underwriting Criteria
            </div>

            <!-- Driving Experience (Years Driving) -->
            <div class="form-group-block">
              <div class="form-label">
                <span>Driving Experience (Years Driving)</span>
                <span class="form-label-hint" id="exp-display">${calc.drivingExperience} Years Licensed</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="30" 
                value="${calc.drivingExperience}" 
                id="calc-exp-range" 
                style="width:100%; accent-color:var(--blue-primary); cursor:pointer;" 
              />
              <div style="display:flex; justify-content:space-between; font-size:0.68rem; color:var(--text-dim);">
                <span>1 Year (New Driver)</span>
                <span>5 Years (Standard)</span>
                <span>15+ Years (Preferred Veteran)</span>
              </div>
            </div>

            <!-- Class of Car -->
            <div class="form-group-block">
              <label class="form-label">Class of Car</label>
              <select class="form-select" id="calc-car-class">
                <option value="sedan" ${calc.carClass === 'sedan' ? 'selected' : ''}>Midsize Sedan (Honda Accord, Toyota Camry)</option>
                <option value="economy" ${calc.carClass === 'economy' ? 'selected' : ''}>Economy Hatchback (Civic, Corolla)</option>
                <option value="suv" ${calc.carClass === 'suv' ? 'selected' : ''}>Compact / Crossover SUV (RAV4, CR-V)</option>
                <option value="ev" ${calc.carClass === 'ev' ? 'selected' : ''}>Electric Vehicle / EV (Tesla Model 3/Y, Rivian)</option>
                <option value="luxury" ${calc.carClass === 'luxury' ? 'selected' : ''}>Luxury / Sports Car (Porsche, Audi, BMW)</option>
                <option value="truck" ${calc.carClass === 'truck' ? 'selected' : ''}>Full-Size Truck (Ford F-150, Silverado)</option>
              </select>
            </div>

            <!-- Driver Sex -->
            <div class="form-group-block">
              <label class="form-label">Driver Sex (Actuarial Underwriting)</label>
              <div class="pill-choice-group">
                <button type="button" class="pill-choice-btn ${calc.sex === 'Female' ? 'active' : ''}" data-field="sex" data-val="Female">Female</button>
                <button type="button" class="pill-choice-btn ${calc.sex === 'Male' ? 'active' : ''}" data-field="sex" data-val="Male">Male</button>
                <button type="button" class="pill-choice-btn ${calc.sex === 'Other' ? 'active' : ''}" data-field="sex" data-val="Other">Non-binary / Other</button>
              </div>
            </div>

            <!-- Annual Mileage & Driving History -->
            <div class="form-row-dual">
              <div class="form-group-block">
                <label class="form-label">Estimated Mileage</label>
                <select class="form-select" id="calc-mileage">
                  <option value="low" ${calc.annualMileage === 'low' ? 'selected' : ''}>Low (< 8k mi/yr)</option>
                  <option value="commuter" ${calc.annualMileage === 'commuter' ? 'selected' : ''}>Commuter (8k - 12k mi/yr)</option>
                  <option value="high" ${calc.annualMileage === 'high' ? 'selected' : ''}>High (> 15k mi/yr)</option>
                </select>
              </div>
              <div class="form-group-block">
                <label class="form-label">Driving Record</label>
                <select class="form-select" id="calc-record">
                  <option value="clean" ${calc.record === 'clean' ? 'selected' : ''}>Clean Record (0 incidents)</option>
                  <option value="violations" ${calc.record === 'violations' ? 'selected' : ''}>1 Minor Traffic Violation</option>
                  <option value="accident" ${calc.record === 'accident' ? 'selected' : ''}>Accident / Claim in Last 3 Yrs</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Dynamic Quote Output Showcase Card -->
          <div class="quote-result-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:0.75rem; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; color:var(--blue-primary);">
                Estimated Coverage Rate
              </span>
              <span class="likelihood-badge-pill very-high">
                ${quote.closingLikelihood}% Closing Likelihood
              </span>
            </div>

            <div class="quote-rate-highlight">
              <div>
                <span class="quote-rate-val">$${quote.monthly}</span>
                <span class="quote-rate-period">/ month</span>
              </div>
              <div style="text-align:right;">
                <div style="font-size:0.95rem; font-weight:700; font-family:var(--font-mono); color:var(--text-bright);">$${quote.annual} / year</div>
                <div style="font-size:0.68rem; color:var(--emerald-success); font-weight:600;">Includes 8% pay-in-full discount</div>
              </div>
            </div>

            <div class="quote-details-list">
              <div class="quote-detail-item">
                <span class="quote-detail-label">Rating Tier</span>
                <span class="quote-detail-val">${quote.tier}</span>
              </div>
              <div class="quote-detail-item">
                <span class="quote-detail-label">Multi-Policy Bundle Savings</span>
                <span class="quote-detail-val" style="color:var(--emerald-success);">Save $${quote.bundleSavings}/yr</span>
              </div>
            </div>

            <div style="font-size:0.72rem; color:var(--text-muted);">
              Based on ${calc.drivingExperience} years driving experience, ${calc.sex} driver profile, and selected vehicle class.
            </div>
          </div>

          <!-- Submit Buttons -->
          <div style="display:flex; gap:0.75rem; margin-top:0.25rem;">
            <button class="action-btn-primary" id="btn-save-lead" style="flex:1; justify-content:center; padding:0.75rem;">
              Save Lead & Issue Rate Quote
            </button>
          </div>
        </div>

        <!-- Right Column: Inbound Leads Pipeline Table -->
        <div class="glass-panel" style="padding:1.5rem;">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Inbound Customer Rate Inquiries</h2>
              <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">
                Prospective customers who reached out to Magic Insurance requesting rate coverage.
              </p>
            </div>
            <span class="badge-counter">${filteredLeads.length} Inquiries Logged</span>
          </div>

          <!-- Search input -->
          <div class="customer-search-box" style="margin-bottom:1rem;">
            <input 
              type="text" 
              class="customer-search-input" 
              id="lead-search-input" 
              placeholder="Search by prospect name, vehicle class, location..." 
              value="${state.leadSearchQuery}" 
              style="padding-left:0.85rem;"
            />
          </div>

          <!-- Leads Table -->
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:0.82rem; text-align:left;">
              <thead>
                <tr style="border-bottom:1px solid var(--border-medium); color:var(--text-dim); text-transform:uppercase; font-size:0.68rem; letter-spacing:0.05em;">
                  <th style="padding:0.75rem 0.85rem;">Applicant / Contact</th>
                  <th style="padding:0.75rem 0.85rem;">Underwriting Inputs</th>
                  <th style="padding:0.75rem 0.85rem;">Quoted Rate</th>
                  <th style="padding:0.75rem 0.85rem;">Closing Likelihood</th>
                  <th style="padding:0.75rem 0.85rem;">Status</th>
                  <th style="padding:0.75rem 0.85rem; text-align:right;">Employee Action</th>
                </tr>
              </thead>
              <tbody>
                ${filteredLeads.map(l => {
    const statusClass = l.status === 'Binder Ready' ? 'binder-ready' :
      l.status === 'Quote Sent' ? 'quote-sent' : 'follow-up';
    return `
                    <tr class="directory-table-row">
                      <td style="padding:0.85rem 0.85rem;">
                        <div style="font-weight:700; color:var(--text-bright);">${l.fullName}</div>
                        <div style="font-size:0.72rem; color:var(--text-dim);">${l.email} &bull; ${l.phone}</div>
                        <div style="font-size:0.68rem; color:var(--text-muted); margin-top:0.15rem;">Received ${l.receivedAt} from ${l.location}</div>
                      </td>
                      <td style="padding:0.85rem 0.85rem;">
                        <div style="font-weight:600; color:var(--text-main);">${l.carClass}</div>
                        <div style="font-size:0.72rem; color:var(--text-muted);">
                          ${l.drivingExperience} yrs driving &bull; ${l.sex} &bull; ${l.record}
                        </div>
                      </td>
                      <td style="padding:0.85rem 0.85rem;">
                        <div style="font-family:var(--font-mono); font-weight:800; color:var(--blue-primary); font-size:0.95rem;">
                          $${l.monthlyQuote}/mo
                        </div>
                        <div style="font-size:0.7rem; color:var(--text-muted); font-family:var(--font-mono);">$${l.annualQuote}/yr</div>
                      </td>
                      <td style="padding:0.85rem 0.85rem;">
                        <span class="likelihood-badge-pill ${l.closingLikelihood >= 85 ? 'very-high' : 'high'}">
                          ${l.closingLikelihood}% Likelihood
                        </span>
                      </td>
                      <td style="padding:0.85rem 0.85rem;">
                        <span class="lead-status-pill ${statusClass}">${l.status}</span>
                      </td>
                      <td style="padding:0.85rem 0.85rem; text-align:right;">
                        <button class="nav-tab-btn active" style="font-size:0.74rem; padding:0.35rem 0.65rem;" data-convert-lead="${l.id}">
                          Bind & Convert
                        </button>
                      </td>
                    </tr>
                  `;
  }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Rate calculation engine for formulated offer
function getOfferRateCalculation(lead, config) {
  if (!lead || !config) {
    return {
      monthly: 0,
      annual: 0,
      bundleSavings: 0,
      closingLikelihood: 85,
      essentialMonthly: 0,
      recommendedMonthly: 0,
      eliteMonthly: 0
    };
  }

  const baseQuote = lead.monthlyQuote || 100;

  // Calculate baseline monthly for each tier
  const essentialBase = Math.round(baseQuote * 0.84);
  const recommendedBase = baseQuote;
  const eliteBase = Math.round(baseQuote * 1.30);

  let activeBase = config.selectedTier === 'essential' ? essentialBase :
                   config.selectedTier === 'elite' ? eliteBase :
                   recommendedBase;

  // Deductible adjustment
  let deductibleDelta = 0;
  if (config.deductible === 250) deductibleDelta = 12;
  else if (config.deductible === 1000) deductibleDelta = -10;

  // Liability adjustment
  let liabilityDelta = 0;
  if (config.liabilityLimit === 'standard') liabilityDelta = -6;
  else if (config.liabilityLimit === 'maximum') liabilityDelta = 14;

  // Addons adjustment
  let addonsDelta = 0;
  if (config.addons?.roadside) addonsDelta += 8;
  if (config.addons?.rental) addonsDelta += 6;
  if (config.addons?.glass) addonsDelta += 5;
  if (config.addons?.oemParts) addonsDelta += 12;

  let computedMonthly = Math.max(35, activeBase + deductibleDelta + liabilityDelta + addonsDelta);

  // Agent discretionary discount
  if (config.agentDiscountPercent > 0) {
    computedMonthly = Math.round(computedMonthly * (1 - config.agentDiscountPercent / 100));
  }

  // Custom manual override if provided
  if (config.customMonthlyOverride !== null && config.customMonthlyOverride !== undefined && !isNaN(config.customMonthlyOverride) && config.customMonthlyOverride > 0) {
    computedMonthly = Math.round(Number(config.customMonthlyOverride));
  }

  const annual = Math.round(computedMonthly * 12 * 0.92); // 8% pay-in-full discount
  const bundleSavings = Math.round(annual * 0.18);

  // Dynamic closing likelihood
  let closingLikelihood = lead.closingLikelihood || 88;
  if (config.agentDiscountPercent >= 10) closingLikelihood = Math.min(99, closingLikelihood + 7);
  else if (config.agentDiscountPercent >= 5) closingLikelihood = Math.min(97, closingLikelihood + 4);
  if (config.selectedTier === 'essential') closingLikelihood = Math.min(96, closingLikelihood + 3);
  if (config.selectedTier === 'elite' && config.agentDiscountPercent === 0) closingLikelihood = Math.max(74, closingLikelihood - 4);

  return {
    monthly: computedMonthly,
    annual,
    bundleSavings,
    closingLikelihood,
    essentialMonthly: essentialBase,
    recommendedMonthly: recommendedBase,
    eliteMonthly: eliteBase
  };
}

function initiateBindAndConvert(leadId) {
  const lead = state.leads.find(l => l.id === leadId);
  if (!lead) return;

  state.activeBindLeadId = leadId;
  state.activeOfferConfig = {
    leadId: lead.id,
    selectedTier: 'recommended',
    deductible: 500,
    liabilityLimit: 'enhanced',
    addons: {
      roadside: true,
      rental: false,
      glass: true,
      oemParts: lead.carClassKey === 'ev' || lead.carClassKey === 'luxury'
    },
    agentDiscountPercent: 0,
    paymentFrequency: 'monthly',
    customMonthlyOverride: null,
    effectiveDate: new Date().toISOString().split('T')[0],
    agentNotes: `Inbound inquiry for ${lead.carClass}. Underwriting rating tier: ${lead.tier}.`
  };

  state.currentView = 'bind-convert';
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Render Bind & Convert: Recommended Rates & Formulated Offer View
function renderBindConvertView() {
  const lead = state.leads.find(l => l.id === state.activeBindLeadId) || state.leads[0];
  if (!lead) {
    return `<div style="padding:2rem;">No active lead found. <button class="action-btn-primary" id="btn-back-to-leads">Back to Inbound Leads</button></div>`;
  }

  const config = state.activeOfferConfig || {
    leadId: lead.id,
    selectedTier: 'recommended',
    deductible: 500,
    liabilityLimit: 'enhanced',
    addons: { roadside: true, rental: false, glass: true, oemParts: false },
    agentDiscountPercent: 0,
    paymentFrequency: 'monthly',
    customMonthlyOverride: null,
    effectiveDate: new Date().toISOString().split('T')[0]
  };

  const rates = getOfferRateCalculation(lead, config);
  const initials = lead.fullName.split(' ').map(n => n[0]).join('').slice(0, 2);

  const tierMeta = {
    essential: {
      name: 'Essential Standard',
      desc: 'State compliance and core liability with standard roadside assistance.',
      deductible: '$1,000 Deductible',
      liability: '$50k / $100k / $50k Liability',
      features: ['State Minimum & Bodily Injury ($50k/$100k)', 'Collision & Comprehensive ($1k Deductible)', 'Standard Emergency Roadside Dispatch']
    },
    recommended: {
      name: 'Magic Preferred (AI Recommended)',
      desc: 'Optimal protection tailored for driving record, vehicle class, and high retention.',
      deductible: '$500 Deductible (Recommended)',
      liability: '$100k / $300k / $100k Enhanced Liability',
      features: ['Enhanced Bodily Injury & Property ($100k/$300k)', 'Collision & Comprehensive ($500 Deductible)', '24/7 National Towing & Roadside Assistance', 'Zero-Deductible Full Windshield & Glass', 'Multi-Policy Bundle Savings Credit']
    },
    elite: {
      name: 'Comprehensive Elite',
      desc: 'Maximum coverage with OEM replacement parts, rental reimbursement, and gap protection.',
      deductible: '$250 Deductible',
      liability: '$250k / $500k / $250k Umbrella Ready',
      features: ['Maximum Umbrella-Ready Liability ($250k/$500k)', 'Low $250 Collision & Comprehensive Deductible', 'OEM Genuine Parts Replacement Guarantee', 'Rental Car Reimbursement ($45/day)', 'Full Glass & Comprehensive Gap Protection']
    }
  };

  const currentTierInfo = tierMeta[config.selectedTier] || tierMeta.recommended;

  const liabilityLabels = {
    standard: '$50,000 / $100,000 / $50,000',
    enhanced: '$100,000 / $300,000 / $100,000',
    maximum: '$250,000 / $500,000 / $250,000'
  };

  return `
    <div class="bind-convert-view">
      <!-- Breadcrumb and Top Navigation -->
      <div class="bind-header-bar">
        <div class="bind-breadcrumb">
          <button class="bind-breadcrumb-btn" id="btn-back-to-leads">
            &larr; Back to Inbound Leads Pipeline
          </button>
          <span>/</span>
          <span style="color:var(--text-bright); font-weight:700;">Bind & Convert Offer Formulation</span>
        </div>
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <span class="policy-status-pill" style="background:#E0F2FE; color:#0369A1; border-color:#BAE6FD;">
            Binder Inception Engine
          </span>
          <span class="likelihood-badge-pill ${rates.closingLikelihood >= 88 ? 'very-high' : 'high'}">
            ${rates.closingLikelihood}% Closing Likelihood
          </span>
        </div>
      </div>

      <!-- Applicant Overview Banner -->
      <div class="bind-prospect-banner">
        <div class="bind-prospect-profile">
          <div class="bind-prospect-avatar">${initials}</div>
          <div class="bind-prospect-details">
            <h2>${lead.fullName}</h2>
            <div class="bind-prospect-meta">
              <span>${lead.email}</span>
              <span>&bull;</span>
              <span>${lead.phone}</span>
              <span>&bull;</span>
              <span>${lead.location}</span>
            </div>
          </div>
        </div>

        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <span class="bind-prospect-pill">Vehicle: <strong>${lead.carClass}</strong></span>
          <span class="bind-prospect-pill">Experience: <strong>${lead.drivingExperience} yrs</strong></span>
          <span class="bind-prospect-pill">Record: <strong>${lead.record}</strong></span>
          <span class="bind-prospect-pill">Mileage: <strong>${lead.annualMileage}</strong></span>
          <span class="bind-prospect-pill">Rating Tier: <strong>${lead.tier}</strong></span>
        </div>
      </div>

      <!-- Main Layout Columns: Left = Recommended Rates & Adjustments, Right = Formulated Binder Offer -->
      <div class="bind-layout-columns">
        <div style="display:flex; flex-direction:column; gap:1.5rem;">
          
          <!-- Section 1: Recommended Rates for this Customer -->
          <div class="glass-panel" style="padding:1.5rem;">
            <div class="panel-header" style="margin-bottom:0.25rem;">
              <div>
                <h3 class="panel-title" style="font-size:1.1rem;">Recommended Rates for ${lead.fullName}</h3>
                <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">
                  AI actuarial underwriting recommendations based on applicant's driving record, vehicle class, and risk tier.
                </p>
              </div>
            </div>

            <!-- Tier Cards Grid -->
            <div class="tier-cards-grid">
              <!-- Essential -->
              <div class="tier-rate-card ${config.selectedTier === 'essential' ? 'selected' : ''}" data-select-tier="essential">
                <div>
                  <div class="tier-name">${tierMeta.essential.name}</div>
                  <div class="tier-desc">${tierMeta.essential.desc}</div>
                  <div class="tier-price-display">
                    <span class="tier-price-val">$${rates.essentialMonthly}</span>
                    <span class="tier-price-period">/mo</span>
                  </div>
                  <div class="tier-annual-sub">$${Math.round(rates.essentialMonthly * 12 * 0.92)}/yr (8% pay-in-full discount)</div>
                  <ul class="tier-feature-list">
                    ${tierMeta.essential.features.map(f => `
                      <li class="tier-feature-item">
                        <span class="tier-feature-bullet">&check;</span>
                        <span>${f}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
                <button type="button" class="tier-select-btn">
                  ${config.selectedTier === 'essential' ? 'Selected Package' : 'Select Package'}
                </button>
              </div>

              <!-- Recommended Magic Preferred -->
              <div class="tier-rate-card recommended ${config.selectedTier === 'recommended' ? 'selected' : ''}" data-select-tier="recommended">
                <span class="tier-recommended-ribbon">AI Recommended</span>
                <div>
                  <div class="tier-name">${tierMeta.recommended.name}</div>
                  <div class="tier-desc">${tierMeta.recommended.desc}</div>
                  <div class="tier-price-display">
                    <span class="tier-price-val" style="color:var(--blue-primary);">$${rates.recommendedMonthly}</span>
                    <span class="tier-price-period">/mo</span>
                  </div>
                  <div class="tier-annual-sub">$${lead.annualQuote}/yr (Includes bundle savings)</div>
                  <ul class="tier-feature-list">
                    ${tierMeta.recommended.features.map(f => `
                      <li class="tier-feature-item">
                        <span class="tier-feature-bullet" style="color:var(--emerald-success);">&check;</span>
                        <span>${f}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
                <button type="button" class="tier-select-btn">
                  ${config.selectedTier === 'recommended' ? 'Active Recommended Package' : 'Select Package'}
                </button>
              </div>

              <!-- Elite -->
              <div class="tier-rate-card ${config.selectedTier === 'elite' ? 'selected' : ''}" data-select-tier="elite">
                <div>
                  <div class="tier-name">${tierMeta.elite.name}</div>
                  <div class="tier-desc">${tierMeta.elite.desc}</div>
                  <div class="tier-price-display">
                    <span class="tier-price-val">$${rates.eliteMonthly}</span>
                    <span class="tier-price-period">/mo</span>
                  </div>
                  <div class="tier-annual-sub">$${Math.round(rates.eliteMonthly * 12 * 0.92)}/yr (Premium tier)</div>
                  <ul class="tier-feature-list">
                    ${tierMeta.elite.features.map(f => `
                      <li class="tier-feature-item">
                        <span class="tier-feature-bullet">&check;</span>
                        <span>${f}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
                <button type="button" class="tier-select-btn">
                  ${config.selectedTier === 'elite' ? 'Selected Package' : 'Select Package'}
                </button>
              </div>
            </div>

            <!-- Underwriting Actuarial Factors -->
            <div class="underwriting-breakdown-box" style="margin-top:1.25rem;">
              <div style="font-size:0.75rem; font-weight:700; color:var(--text-bright); text-transform:uppercase; letter-spacing:0.04em;">
                Actuarial Underwriting Factors & Rate Justification
              </div>
              <div class="breakdown-factors-grid">
                <div class="breakdown-factor-item">
                  <span class="factor-label">Driving Record</span>
                  <span class="factor-value">${lead.record.includes('Clean') ? 'Clean Record' : 'Standard'}</span>
                  <span class="factor-credit">${lead.record.includes('Clean') ? '-12% Safe Driver Credit' : 'Base Rate'}</span>
                </div>
                <div class="breakdown-factor-item">
                  <span class="factor-label">Driving Experience</span>
                  <span class="factor-value">${lead.drivingExperience} Years</span>
                  <span class="factor-credit">${lead.drivingExperience >= 5 ? '-8% Seasoned Credit' : 'Standard Tier'}</span>
                </div>
                <div class="breakdown-factor-item">
                  <span class="factor-label">Vehicle Risk Class</span>
                  <span class="factor-value">${lead.carClass.split('(')[0].trim()}</span>
                  <span class="factor-credit" style="color:var(--blue-primary);">5-Star Safety Profile</span>
                </div>
                <div class="breakdown-factor-item">
                  <span class="factor-label">Bundle Incentive</span>
                  <span class="factor-value">Save $${lead.bundleSavings}/yr</span>
                  <span class="factor-credit">Multi-Policy Discount</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Option to Adjust the Offer -->
          <div class="glass-panel" style="padding:1.5rem;" id="adjust-offer-section">
            <div class="panel-header" style="margin-bottom:0.75rem;">
              <div>
                <h3 class="panel-title" style="font-size:1.1rem;">Adjust Offer Parameters</h3>
                <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">
                  As an insurance agent, you can customize coverage limits, deductibles, endorsements, or apply discretionary discounts.
                </p>
              </div>
              <button class="btn-bind-reset" id="btn-reset-offer" style="width:auto; padding:0.35rem 0.75rem;">
                Reset to Recommended
              </button>
            </div>

            <div class="adjust-offer-panel">
              <!-- Deductible Selection -->
              <div class="adjust-field-group">
                <div class="adjust-field-header">
                  <span>Comprehensive & Collision Deductible</span>
                  <span style="font-size:0.7rem; color:var(--text-muted);">Current: $${config.deductible}</span>
                </div>
                <div class="adjust-options-pills">
                  <div class="adjust-option-pill ${config.deductible === 250 ? 'active' : ''}" data-adjust-deductible="250">
                    $250 (+$12/mo)
                  </div>
                  <div class="adjust-option-pill ${config.deductible === 500 ? 'active' : ''}" data-adjust-deductible="500">
                    $500 (Recommended)
                  </div>
                  <div class="adjust-option-pill ${config.deductible === 1000 ? 'active' : ''}" data-adjust-deductible="1000">
                    $1,000 (-$10/mo)
                  </div>
                </div>
              </div>

              <!-- Liability Limit Selection -->
              <div class="adjust-field-group">
                <div class="adjust-field-header">
                  <span>Bodily Injury & Property Damage Limits</span>
                  <span style="font-size:0.7rem; color:var(--text-muted);">${liabilityLabels[config.liabilityLimit]}</span>
                </div>
                <div class="adjust-options-pills">
                  <div class="adjust-option-pill ${config.liabilityLimit === 'standard' ? 'active' : ''}" data-adjust-liability="standard">
                    Standard ($50k/$100k, -$6/mo)
                  </div>
                  <div class="adjust-option-pill ${config.liabilityLimit === 'enhanced' ? 'active' : ''}" data-adjust-liability="enhanced">
                    Enhanced ($100k/$300k, Recommended)
                  </div>
                  <div class="adjust-option-pill ${config.liabilityLimit === 'maximum' ? 'active' : ''}" data-adjust-liability="maximum">
                    Umbrella-Ready ($250k/$500k, +$14/mo)
                  </div>
                </div>
              </div>

              <!-- Optional Add-ons Checkboxes -->
              <div class="adjust-field-group">
                <div class="adjust-field-header">
                  <span>Coverage Endorsements & Add-ons</span>
                  <span style="font-size:0.7rem; color:var(--text-muted);">Toggle to include or exclude</span>
                </div>
                <div class="addons-toggle-grid">
                  <div class="addon-toggle-box ${config.addons.roadside ? 'active' : ''}" data-toggle-addon="roadside">
                    <div class="addon-info">
                      <span class="addon-name">24/7 Roadside Assistance</span>
                      <span class="addon-cost">+$8.00 / mo</span>
                    </div>
                    <input type="checkbox" class="addon-checkbox" ${config.addons.roadside ? 'checked' : ''} />
                  </div>

                  <div class="addon-toggle-box ${config.addons.rental ? 'active' : ''}" data-toggle-addon="rental">
                    <div class="addon-info">
                      <span class="addon-name">Rental Car Reimbursement</span>
                      <span class="addon-cost">+$6.00 / mo ($45/day)</span>
                    </div>
                    <input type="checkbox" class="addon-checkbox" ${config.addons.rental ? 'checked' : ''} />
                  </div>

                  <div class="addon-toggle-box ${config.addons.glass ? 'active' : ''}" data-toggle-addon="glass">
                    <div class="addon-info">
                      <span class="addon-name">Zero-Deductible Full Glass</span>
                      <span class="addon-cost">+$5.00 / mo</span>
                    </div>
                    <input type="checkbox" class="addon-checkbox" ${config.addons.glass ? 'checked' : ''} />
                  </div>

                  <div class="addon-toggle-box ${config.addons.oemParts ? 'active' : ''}" data-toggle-addon="oemParts">
                    <div class="addon-info">
                      <span class="addon-name">OEM Genuine Replacement Parts</span>
                      <span class="addon-cost">+$12.00 / mo</span>
                    </div>
                    <input type="checkbox" class="addon-checkbox" ${config.addons.oemParts ? 'checked' : ''} />
                  </div>
                </div>
              </div>

              <!-- Agent Discretionary Discount & Custom Rate Override -->
              <div class="form-row-dual">
                <div class="adjust-field-group">
                  <label class="form-label">
                    <span>Agent Discretionary Discount</span>
                    <span class="form-label-hint">${config.agentDiscountPercent}% Applied</span>
                  </label>
                  <select class="form-select" id="adjust-agent-discount">
                    <option value="0" ${config.agentDiscountPercent === 0 ? 'selected' : ''}>0% - Standard Recommended Rate</option>
                    <option value="5" ${config.agentDiscountPercent === 5 ? 'selected' : ''}>5% - Preferred Driver Courtesy Discount</option>
                    <option value="10" ${config.agentDiscountPercent === 10 ? 'selected' : ''}>10% - Competitive Price Match Guarantee</option>
                    <option value="15" ${config.agentDiscountPercent === 15 ? 'selected' : ''}>15% - Branch Manager Retention Override</option>
                  </select>
                </div>

                <div class="adjust-field-group">
                  <label class="form-label">
                    <span>Direct Negotiated Monthly Override</span>
                    <span class="form-label-hint">${config.customMonthlyOverride ? `Active: $${config.customMonthlyOverride}/mo` : 'Optional'}</span>
                  </label>
                  <div style="display:flex; gap:0.5rem;">
                    <input 
                      type="number" 
                      class="form-input-text" 
                      id="adjust-custom-rate-input" 
                      placeholder="e.g. 95" 
                      value="${config.customMonthlyOverride || ''}" 
                      style="font-family:var(--font-mono);" 
                    />
                    <button class="action-btn-primary" id="btn-apply-custom-rate" style="padding:0.6rem 0.9rem; font-size:0.75rem;">
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              <!-- Internal Agent Notes -->
              <div class="adjust-field-group">
                <label class="form-label">Agent Underwriting & Binder Notes</label>
                <input 
                  type="text" 
                  class="form-input-text" 
                  id="adjust-agent-notes" 
                  value="${config.agentNotes || ''}" 
                  placeholder="Notes recorded on policy binding..." 
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Formulated Offer & Binder Summary Card -->
        <div>
          <div class="formulated-binder-card">
            <!-- Binder Header -->
            <div class="binder-card-header">
              <div class="binder-logo-title">
                <div style="font-weight:800; font-size:0.95rem; letter-spacing:0.02em;">MAGIC INSURANCE CORE</div>
                <div style="font-size:0.68rem; color:#94A3B8;">Official Digital Policy Binder & Offer Proposal</div>
              </div>
              <div class="binder-seal-badge">OFFER FORMULATED</div>
            </div>

            <!-- Binder Body -->
            <div class="binder-card-body">
              <!-- Proposal Pitch Narrative -->
              <div class="binder-proposal-pitch">
                <strong>Formulated Offer for ${lead.fullName}:</strong>
                Comprehensive coverage on <em>${lead.carClass}</em> under the <strong>${currentTierInfo.name}</strong>. Includes guaranteed 30-day rate lock and zero-lapse digital binder inception.
              </div>

              <!-- Billing Plan Selector -->
              <div style="display:flex; gap:0.5rem; background:var(--bg-darkest); padding:0.25rem; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
                <button 
                  type="button" 
                  class="adjust-option-pill ${config.paymentFrequency === 'monthly' ? 'active' : ''}" 
                  data-payment-freq="monthly"
                  style="padding:0.4rem;"
                >
                  Monthly Payment
                </button>
                <button 
                  type="button" 
                  class="adjust-option-pill ${config.paymentFrequency === 'annual' ? 'active' : ''}" 
                  data-payment-freq="annual"
                  style="padding:0.4rem;"
                >
                  Annual Pay-in-Full (Save 8%)
                </button>
              </div>

              <!-- Itemized Binder Coverages -->
              <div class="binder-items-list">
                <div class="binder-item-row">
                  <span class="binder-item-label">Applicant:</span>
                  <span class="binder-item-val">${lead.fullName}</span>
                </div>
                <div class="binder-item-row">
                  <span class="binder-item-label">Vehicle Insured:</span>
                  <span class="binder-item-val">${lead.carClass}</span>
                </div>
                <div class="binder-item-row">
                  <span class="binder-item-label">Effective Date:</span>
                  <span class="binder-item-val" style="font-family:var(--font-mono);">${config.effectiveDate} (Immediate)</span>
                </div>
                <div class="binder-item-row">
                  <span class="binder-item-label">Policy Tier:</span>
                  <span class="binder-item-val" style="color:var(--blue-primary);">${currentTierInfo.name}</span>
                </div>
                <div class="binder-item-row">
                  <span class="binder-item-label">Bodily Injury Limits:</span>
                  <span class="binder-item-val">${liabilityLabels[config.liabilityLimit]}</span>
                </div>
                <div class="binder-item-row">
                  <span class="binder-item-label">Comp & Collision Deductible:</span>
                  <span class="binder-item-val">$${config.deductible}</span>
                </div>
                <div class="binder-item-row">
                  <span class="binder-item-label">Active Endorsements:</span>
                  <span class="binder-item-val" style="font-size:0.72rem; text-align:right;">
                    ${Object.keys(config.addons).filter(k => config.addons[k]).join(', ') || 'Core Coverage Only'}
                  </span>
                </div>
                ${config.agentDiscountPercent > 0 ? `
                  <div class="binder-item-row" style="color:var(--emerald-success);">
                    <span>Discretionary Agent Discount:</span>
                    <span style="font-weight:700;">-${config.agentDiscountPercent}%</span>
                  </div>
                ` : ''}
                <div class="binder-item-row">
                  <span class="binder-item-label">Multi-Policy Bundle Credit:</span>
                  <span class="binder-item-val" style="color:var(--emerald-success); font-family:var(--font-mono);">Save $${rates.bundleSavings}/yr</span>
                </div>
              </div>

              <!-- Highlighted Pricing Display -->
              <div class="binder-pricing-highlight">
                <div>
                  <div style="font-size:0.7rem; text-transform:uppercase; font-weight:700; color:var(--text-dim); letter-spacing:0.04em;">
                    ${config.paymentFrequency === 'monthly' ? 'Monthly Premium' : 'Annual Pay-in-Full'}
                  </div>
                  <div class="binder-monthly-total">
                    $${config.paymentFrequency === 'monthly' ? rates.monthly : rates.annual}
                    <span style="font-size:0.85rem; font-weight:500; color:var(--text-dim);">
                      ${config.paymentFrequency === 'monthly' ? '/mo' : '/yr'}
                    </span>
                  </div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:0.85rem; font-weight:700; color:var(--text-bright); font-family:var(--font-mono);">
                    ${config.paymentFrequency === 'monthly' ? `$${rates.annual} / year` : `$${rates.monthly} / month equiv.`}
                  </div>
                  <div style="font-size:0.7rem; color:var(--emerald-success); font-weight:600; margin-top:0.2rem;">
                    Down Payment Due: $${config.paymentFrequency === 'monthly' ? rates.monthly : rates.annual}
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="binder-cta-container">
                <button class="btn-bind-accept" id="btn-accept-bind-offer">
                  <span>Accept Offer & Bind Policy</span>
                  <span style="font-size:1.1rem;">&rarr;</span>
                </button>
                <div style="font-size:0.72rem; color:var(--text-muted); text-align:center; line-height:1.35;">
                  Accepting instantly binds policy coverage, logs underwriting terms, and provisions active customer account.
                </div>
                <button class="btn-bind-reset" id="btn-cancel-bind" style="margin-top:0.25rem;">
                  Cancel & Return to Leads
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}


// Render Growth & Retention Analytics View (No Emojis)
function renderAnalyticsView() {
  return `
    <div class="analytics-view-container">
      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-title">Proactive Churn Defended</div>
          <div class="kpi-value">89.4%</div>
          <div class="kpi-trend">+14.2% vs reactive retention desk</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Average Policy Cross-Sell ARR</div>
          <div class="kpi-value">+$1,420</div>
          <div class="kpi-trend">3.8x baseline industry conversion</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Life Event Detection Lead Time</div>
          <div class="kpi-value">4.2 Days</div>
          <div class="kpi-trend">26 days ahead of policy renewal notice</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Customer Lifetime Value (LTV)</div>
          <div class="kpi-value">+31.5%</div>
          <div class="kpi-trend">Multi-policy stickiness boost</div>
        </div>
      </div>

      <div class="analytics-charts-grid">
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Life Event Trigger Conversion Rate</h3>
            <p class="chart-subtitle">Percentage of proactive recommendations accepted by insured customers</p>
          </div>
          <div class="bar-chart-list">
            <div class="bar-item">
              <div class="bar-label-row">
                <span class="bar-label-name">Home Purchase (Homeowners + Umbrella)</span>
                <span class="bar-label-val">76.4%</span>
              </div>
              <div class="bar-track"><div class="bar-fill" style="width: 76.4%;"></div></div>
            </div>
            <div class="bar-item">
              <div class="bar-label-row">
                <span class="bar-label-name">Welcomed Dependent (Term Life + Child Rider)</span>
                <span class="bar-label-val">68.2%</span>
              </div>
              <div class="bar-track"><div class="bar-fill" style="width: 68.2%;"></div></div>
            </div>
            <div class="bar-item">
              <div class="bar-label-row">
                <span class="bar-label-name">New Vehicle Delivery (Connected Auto)</span>
                <span class="bar-label-val">62.8%</span>
              </div>
              <div class="bar-track"><div class="bar-fill" style="width: 62.8%;"></div></div>
            </div>
            <div class="bar-item">
              <div class="bar-label-row">
                <span class="bar-label-name">Rate Shock Defense (Loyalty Rate Shield)</span>
                <span class="bar-label-val">84.1%</span>
              </div>
              <div class="bar-track"><div class="bar-fill emerald" style="width: 84.1%;"></div></div>
            </div>
            <div class="bar-item">
              <div class="bar-label-row">
                <span class="bar-label-name">Household Driver Milestones (Liability Shield)</span>
                <span class="bar-label-val">59.5%</span>
              </div>
              <div class="bar-track"><div class="bar-fill" style="width: 59.5%;"></div></div>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Traditional Reactive vs Proactive Agent Model</h3>
            <p class="chart-subtitle">Business impact metrics comparing conventional insurer workflows to Magic Insurance</p>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.9rem; font-size:0.82rem; margin-top:0.5rem;">
            <div style="padding:0.75rem; background:rgba(244,63,94,0.08); border-left:3px solid var(--rose-danger); border-radius:var(--radius-sm);">
              <div style="font-weight:700; color:var(--rose-danger); margin-bottom:0.2rem;">Legacy Reactive Insurer Model</div>
              <div style="color:var(--text-muted);">
                Waits for annual renewal notice or customer cancellation call. Churn rate averages 15-22% annually. Cross-selling relies on unsolicited blanket cold-calls with less than 3% conversion.
              </div>
            </div>
            <div style="padding:0.75rem; background:rgba(16,185,129,0.08); border-left:3px solid var(--emerald-success); border-radius:var(--radius-sm);">
              <div style="font-weight:700; color:var(--emerald-success); margin-bottom:0.2rem;">Magic Insurance Proactive Model</div>
              <div style="color:var(--text-muted);">
                Continuously correlates real-time life telemetry (county records, telematics, health additions, rate adjustments). Identifies coverage gaps and eligible products with adoption likelihood, dispatching tailored offers with 68%+ acceptance.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Rate calculation engine for formulated offer
function getOfferRateCalculation(lead, config) {
  if (!lead || !config) {
    return {
      monthly: 0,
      annual: 0,
      bundleSavings: 0,
      closingLikelihood: 85,
      essentialMonthly: 0,
      recommendedMonthly: 0,
      eliteMonthly: 0
    };
  }

  const baseQuote = lead.monthlyQuote || 100;

  // Calculate baseline monthly for each tier
  const essentialBase = Math.round(baseQuote * 0.84);
  const recommendedBase = baseQuote;
  const eliteBase = Math.round(baseQuote * 1.30);

  let activeBase = config.selectedTier === 'essential' ? essentialBase :
                   config.selectedTier === 'elite' ? eliteBase :
                   recommendedBase;

  // Deductible adjustment
  let deductibleDelta = 0;
  if (config.deductible === 250) deductibleDelta = 12;
  else if (config.deductible === 1000) deductibleDelta = -10;

  // Liability adjustment
  let liabilityDelta = 0;
  if (config.liabilityLimit === 'standard') liabilityDelta = -6;
  else if (config.liabilityLimit === 'maximum') liabilityDelta = 14;

  // Addons adjustment
  let addonsDelta = 0;
  if (config.addons?.roadside) addonsDelta += 8;
  if (config.addons?.rental) addonsDelta += 6;
  if (config.addons?.glass) addonsDelta += 5;
  if (config.addons?.oemParts) addonsDelta += 12;

  let computedMonthly = Math.max(35, activeBase + deductibleDelta + liabilityDelta + addonsDelta);

  // Agent discretionary discount
  if (config.agentDiscountPercent > 0) {
    computedMonthly = Math.round(computedMonthly * (1 - config.agentDiscountPercent / 100));
  }

  // Custom manual override if provided
  if (config.customMonthlyOverride !== null && config.customMonthlyOverride !== undefined && !isNaN(config.customMonthlyOverride) && config.customMonthlyOverride > 0) {
    computedMonthly = Math.round(Number(config.customMonthlyOverride));
  }

  const annual = Math.round(computedMonthly * 12 * 0.92); // 8% pay-in-full discount
  const bundleSavings = Math.round(annual * 0.18);

  // Dynamic closing likelihood
  let closingLikelihood = lead.closingLikelihood || 88;
  if (config.agentDiscountPercent >= 10) closingLikelihood = Math.min(99, closingLikelihood + 7);
  else if (config.agentDiscountPercent >= 5) closingLikelihood = Math.min(97, closingLikelihood + 4);
  if (config.selectedTier === 'essential') closingLikelihood = Math.min(96, closingLikelihood + 3);
  if (config.selectedTier === 'elite' && config.agentDiscountPercent === 0) closingLikelihood = Math.max(74, closingLikelihood - 4);

  return {
    monthly: computedMonthly,
    annual,
    bundleSavings,
    closingLikelihood,
    essentialMonthly: essentialBase,
    recommendedMonthly: recommendedBase,
    eliteMonthly: eliteBase
  };
}

function initiateBindAndConvert(leadId) {
  const lead = state.leads.find(l => l.id === leadId);
  if (!lead) return;

  state.activeBindLeadId = leadId;
  state.activeOfferConfig = {
    leadId: lead.id,
    selectedTier: 'recommended',
    deductible: 500,
    liabilityLimit: 'enhanced',
    addons: {
      roadside: true,
      rental: false,
      glass: true,
      oemParts: lead.carClassKey === 'ev' || lead.carClassKey === 'luxury'
    },
    agentDiscountPercent: 0,
    paymentFrequency: 'monthly',
    customMonthlyOverride: null,
    effectiveDate: new Date().toISOString().split('T')[0],
    agentNotes: `Inbound inquiry for ${lead.carClass}. Underwriting rating tier: ${lead.tier}.`
  };

  state.currentView = 'bind-convert';
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Render Bind & Convert: Recommended Rates & Formulated Offer View
function renderBindConvertView() {
  const lead = state.leads.find(l => l.id === state.activeBindLeadId) || state.leads[0];
  if (!lead) {
    return `<div style="padding:2rem;">No active lead found. <button class="action-btn-primary" id="btn-back-to-leads">Back to Inbound Leads</button></div>`;
  }

  const config = state.activeOfferConfig || {
    leadId: lead.id,
    selectedTier: 'recommended',
    deductible: 500,
    liabilityLimit: 'enhanced',
    addons: { roadside: true, rental: false, glass: true, oemParts: false },
    agentDiscountPercent: 0,
    paymentFrequency: 'monthly',
    customMonthlyOverride: null,
    effectiveDate: new Date().toISOString().split('T')[0]
  };

  const rates = getOfferRateCalculation(lead, config);
  const initials = lead.fullName.split(' ').map(n => n[0]).join('').slice(0, 2);

  const tierMeta = {
    essential: {
      name: 'Essential Standard',
      desc: 'State compliance and core liability with standard roadside assistance.',
      deductible: '$1,000 Deductible',
      liability: '$50k / $100k / $50k Liability',
      features: ['State Minimum & Bodily Injury ($50k/$100k)', 'Collision & Comprehensive ($1k Deductible)', 'Standard Emergency Roadside Dispatch']
    },
    recommended: {
      name: 'Magic Preferred (AI Recommended)',
      desc: 'Optimal protection tailored for driving record, vehicle class, and high retention.',
      deductible: '$500 Deductible (Recommended)',
      liability: '$100k / $300k / $100k Enhanced Liability',
      features: ['Enhanced Bodily Injury & Property ($100k/$300k)', 'Collision & Comprehensive ($500 Deductible)', '24/7 National Towing & Roadside Assistance', 'Zero-Deductible Full Windshield & Glass', 'Multi-Policy Bundle Savings Credit']
    },
    elite: {
      name: 'Comprehensive Elite',
      desc: 'Maximum coverage with OEM replacement parts, rental reimbursement, and gap protection.',
      deductible: '$250 Deductible',
      liability: '$250k / $500k / $250k Umbrella Ready',
      features: ['Maximum Umbrella-Ready Liability ($250k/$500k)', 'Low $250 Collision & Comprehensive Deductible', 'OEM Genuine Parts Replacement Guarantee', 'Rental Car Reimbursement ($45/day)', 'Full Glass & Comprehensive Gap Protection']
    }
  };

  const currentTierInfo = tierMeta[config.selectedTier] || tierMeta.recommended;

  const liabilityLabels = {
    standard: '$50,000 / $100,000 / $50,000',
    enhanced: '$100,000 / $300,000 / $100,000',
    maximum: '$250,000 / $500,000 / $250,000'
  };

  return `
    <div class="bind-convert-view">
      <!-- Breadcrumb and Top Navigation -->
      <div class="bind-header-bar">
        <div class="bind-breadcrumb">
          <button class="bind-breadcrumb-btn" id="btn-back-to-leads">
            &larr; Back to Inbound Leads Pipeline
          </button>
          <span>/</span>
          <span style="color:var(--text-bright); font-weight:700;">Bind & Convert Offer Formulation</span>
        </div>
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <span class="policy-status-pill" style="background:#E0F2FE; color:#0369A1; border-color:#BAE6FD;">
            Binder Inception Engine
          </span>
          <span class="likelihood-badge-pill ${rates.closingLikelihood >= 88 ? 'very-high' : 'high'}">
            ${rates.closingLikelihood}% Closing Likelihood
          </span>
        </div>
      </div>

      <!-- Applicant Overview Banner -->
      <div class="bind-prospect-banner">
        <div class="bind-prospect-profile">
          <div class="bind-prospect-avatar">${initials}</div>
          <div class="bind-prospect-details">
            <h2>${lead.fullName}</h2>
            <div class="bind-prospect-meta">
              <span>${lead.email}</span>
              <span>&bull;</span>
              <span>${lead.phone}</span>
              <span>&bull;</span>
              <span>${lead.location}</span>
            </div>
          </div>
        </div>

        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <span class="bind-prospect-pill">Vehicle: <strong>${lead.carClass}</strong></span>
          <span class="bind-prospect-pill">Experience: <strong>${lead.drivingExperience} yrs</strong></span>
          <span class="bind-prospect-pill">Record: <strong>${lead.record}</strong></span>
          <span class="bind-prospect-pill">Mileage: <strong>${lead.annualMileage}</strong></span>
          <span class="bind-prospect-pill">Rating Tier: <strong>${lead.tier}</strong></span>
        </div>
      </div>

      <!-- Main Layout Columns: Left = Recommended Rates & Adjustments, Right = Formulated Binder Offer -->
      <div class="bind-layout-columns">
        <div style="display:flex; flex-direction:column; gap:1.5rem;">
          
          <!-- Section 1: Recommended Rates for this Customer -->
          <div class="glass-panel" style="padding:1.5rem;">
            <div class="panel-header" style="margin-bottom:0.25rem;">
              <div>
                <h3 class="panel-title" style="font-size:1.1rem;">Recommended Rates for ${lead.fullName}</h3>
                <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">
                  AI actuarial underwriting recommendations based on applicant's driving record, vehicle class, and risk tier.
                </p>
              </div>
            </div>

            <!-- Tier Cards Grid -->
            <div class="tier-cards-grid">
              <!-- Essential -->
              <div class="tier-rate-card ${config.selectedTier === 'essential' ? 'selected' : ''}" data-select-tier="essential">
                <div>
                  <div class="tier-name">${tierMeta.essential.name}</div>
                  <div class="tier-desc">${tierMeta.essential.desc}</div>
                  <div class="tier-price-display">
                    <span class="tier-price-val">$${rates.essentialMonthly}</span>
                    <span class="tier-price-period">/mo</span>
                  </div>
                  <div class="tier-annual-sub">$${Math.round(rates.essentialMonthly * 12 * 0.92)}/yr (8% pay-in-full discount)</div>
                  <ul class="tier-feature-list">
                    ${tierMeta.essential.features.map(f => `
                      <li class="tier-feature-item">
                        <span class="tier-feature-bullet">&check;</span>
                        <span>${f}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
                <button type="button" class="tier-select-btn">
                  ${config.selectedTier === 'essential' ? 'Selected Package' : 'Select Package'}
                </button>
              </div>

              <!-- Recommended Magic Preferred -->
              <div class="tier-rate-card recommended ${config.selectedTier === 'recommended' ? 'selected' : ''}" data-select-tier="recommended">
                <span class="tier-recommended-ribbon">AI Recommended</span>
                <div>
                  <div class="tier-name">${tierMeta.recommended.name}</div>
                  <div class="tier-desc">${tierMeta.recommended.desc}</div>
                  <div class="tier-price-display">
                    <span class="tier-price-val" style="color:var(--blue-primary);">$${rates.recommendedMonthly}</span>
                    <span class="tier-price-period">/mo</span>
                  </div>
                  <div class="tier-annual-sub">$${lead.annualQuote}/yr (Includes bundle savings)</div>
                  <ul class="tier-feature-list">
                    ${tierMeta.recommended.features.map(f => `
                      <li class="tier-feature-item">
                        <span class="tier-feature-bullet" style="color:var(--emerald-success);">&check;</span>
                        <span>${f}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
                <button type="button" class="tier-select-btn">
                  ${config.selectedTier === 'recommended' ? 'Active Recommended Package' : 'Select Package'}
                </button>
              </div>

              <!-- Elite -->
              <div class="tier-rate-card ${config.selectedTier === 'elite' ? 'selected' : ''}" data-select-tier="elite">
                <div>
                  <div class="tier-name">${tierMeta.elite.name}</div>
                  <div class="tier-desc">${tierMeta.elite.desc}</div>
                  <div class="tier-price-display">
                    <span class="tier-price-val">$${rates.eliteMonthly}</span>
                    <span class="tier-price-period">/mo</span>
                  </div>
                  <div class="tier-annual-sub">$${Math.round(rates.eliteMonthly * 12 * 0.92)}/yr (Premium tier)</div>
                  <ul class="tier-feature-list">
                    ${tierMeta.elite.features.map(f => `
                      <li class="tier-feature-item">
                        <span class="tier-feature-bullet">&check;</span>
                        <span>${f}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
                <button type="button" class="tier-select-btn">
                  ${config.selectedTier === 'elite' ? 'Selected Package' : 'Select Package'}
                </button>
              </div>
            </div>

            <!-- Underwriting Actuarial Factors -->
            <div class="underwriting-breakdown-box" style="margin-top:1.25rem;">
              <div style="font-size:0.75rem; font-weight:700; color:var(--text-bright); text-transform:uppercase; letter-spacing:0.04em;">
                Actuarial Underwriting Factors & Rate Justification
              </div>
              <div class="breakdown-factors-grid">
                <div class="breakdown-factor-item">
                  <span class="factor-label">Driving Record</span>
                  <span class="factor-value">${lead.record.includes('Clean') ? 'Clean Record' : 'Standard'}</span>
                  <span class="factor-credit">${lead.record.includes('Clean') ? '-12% Safe Driver Credit' : 'Base Rate'}</span>
                </div>
                <div class="breakdown-factor-item">
                  <span class="factor-label">Driving Experience</span>
                  <span class="factor-value">${lead.drivingExperience} Years</span>
                  <span class="factor-credit">${lead.drivingExperience >= 5 ? '-8% Seasoned Credit' : 'Standard Tier'}</span>
                </div>
                <div class="breakdown-factor-item">
                  <span class="factor-label">Vehicle Risk Class</span>
                  <span class="factor-value">${lead.carClass.split('(')[0].trim()}</span>
                  <span class="factor-credit" style="color:var(--blue-primary);">5-Star Safety Profile</span>
                </div>
                <div class="breakdown-factor-item">
                  <span class="factor-label">Bundle Incentive</span>
                  <span class="factor-value">Save $${lead.bundleSavings}/yr</span>
                  <span class="factor-credit">Multi-Policy Discount</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Option to Adjust the Offer -->
          <div class="glass-panel" style="padding:1.5rem;" id="adjust-offer-section">
            <div class="panel-header" style="margin-bottom:0.75rem;">
              <div>
                <h3 class="panel-title" style="font-size:1.1rem;">Adjust Offer Parameters</h3>
                <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">
                  As an insurance agent, you can customize coverage limits, deductibles, endorsements, or apply discretionary discounts.
                </p>
              </div>
              <button class="btn-bind-reset" id="btn-reset-offer" style="width:auto; padding:0.35rem 0.75rem;">
                Reset to Recommended
              </button>
            </div>

            <div class="adjust-offer-panel">
              <!-- Deductible Selection -->
              <div class="adjust-field-group">
                <div class="adjust-field-header">
                  <span>Comprehensive & Collision Deductible</span>
                  <span style="font-size:0.7rem; color:var(--text-muted);">Current: $${config.deductible}</span>
                </div>
                <div class="adjust-options-pills">
                  <div class="adjust-option-pill ${config.deductible === 250 ? 'active' : ''}" data-adjust-deductible="250">
                    $250 (+$12/mo)
                  </div>
                  <div class="adjust-option-pill ${config.deductible === 500 ? 'active' : ''}" data-adjust-deductible="500">
                    $500 (Recommended)
                  </div>
                  <div class="adjust-option-pill ${config.deductible === 1000 ? 'active' : ''}" data-adjust-deductible="1000">
                    $1,000 (-$10/mo)
                  </div>
                </div>
              </div>

              <!-- Liability Limit Selection -->
              <div class="adjust-field-group">
                <div class="adjust-field-header">
                  <span>Bodily Injury & Property Damage Limits</span>
                  <span style="font-size:0.7rem; color:var(--text-muted);">${liabilityLabels[config.liabilityLimit]}</span>
                </div>
                <div class="adjust-options-pills">
                  <div class="adjust-option-pill ${config.liabilityLimit === 'standard' ? 'active' : ''}" data-adjust-liability="standard">
                    Standard ($50k/$100k, -$6/mo)
                  </div>
                  <div class="adjust-option-pill ${config.liabilityLimit === 'enhanced' ? 'active' : ''}" data-adjust-liability="enhanced">
                    Enhanced ($100k/$300k, Recommended)
                  </div>
                  <div class="adjust-option-pill ${config.liabilityLimit === 'maximum' ? 'active' : ''}" data-adjust-liability="maximum">
                    Umbrella-Ready ($250k/$500k, +$14/mo)
                  </div>
                </div>
              </div>

              <!-- Optional Add-ons Checkboxes -->
              <div class="adjust-field-group">
                <div class="adjust-field-header">
                  <span>Coverage Endorsements & Add-ons</span>
                  <span style="font-size:0.7rem; color:var(--text-muted);">Toggle to include or exclude</span>
                </div>
                <div class="addons-toggle-grid">
                  <div class="addon-toggle-box ${config.addons.roadside ? 'active' : ''}" data-toggle-addon="roadside">
                    <div class="addon-info">
                      <span class="addon-name">24/7 Roadside Assistance</span>
                      <span class="addon-cost">+$8.00 / mo</span>
                    </div>
                    <input type="checkbox" class="addon-checkbox" ${config.addons.roadside ? 'checked' : ''} />
                  </div>

                  <div class="addon-toggle-box ${config.addons.rental ? 'active' : ''}" data-toggle-addon="rental">
                    <div class="addon-info">
                      <span class="addon-name">Rental Car Reimbursement</span>
                      <span class="addon-cost">+$6.00 / mo ($45/day)</span>
                    </div>
                    <input type="checkbox" class="addon-checkbox" ${config.addons.rental ? 'checked' : ''} />
                  </div>

                  <div class="addon-toggle-box ${config.addons.glass ? 'active' : ''}" data-toggle-addon="glass">
                    <div class="addon-info">
                      <span class="addon-name">Zero-Deductible Full Glass</span>
                      <span class="addon-cost">+$5.00 / mo</span>
                    </div>
                    <input type="checkbox" class="addon-checkbox" ${config.addons.glass ? 'checked' : ''} />
                  </div>

                  <div class="addon-toggle-box ${config.addons.oemParts ? 'active' : ''}" data-toggle-addon="oemParts">
                    <div class="addon-info">
                      <span class="addon-name">OEM Genuine Replacement Parts</span>
                      <span class="addon-cost">+$12.00 / mo</span>
                    </div>
                    <input type="checkbox" class="addon-checkbox" ${config.addons.oemParts ? 'checked' : ''} />
                  </div>
                </div>
              </div>

              <!-- Agent Discretionary Discount & Custom Rate Override -->
              <div class="form-row-dual">
                <div class="adjust-field-group">
                  <label class="form-label">
                    <span>Agent Discretionary Discount</span>
                    <span class="form-label-hint">${config.agentDiscountPercent}% Applied</span>
                  </label>
                  <select class="form-select" id="adjust-agent-discount">
                    <option value="0" ${config.agentDiscountPercent === 0 ? 'selected' : ''}>0% - Standard Recommended Rate</option>
                    <option value="5" ${config.agentDiscountPercent === 5 ? 'selected' : ''}>5% - Preferred Driver Courtesy Discount</option>
                    <option value="10" ${config.agentDiscountPercent === 10 ? 'selected' : ''}>10% - Competitive Price Match Guarantee</option>
                    <option value="15" ${config.agentDiscountPercent === 15 ? 'selected' : ''}>15% - Branch Manager Retention Override</option>
                  </select>
                </div>

                <div class="adjust-field-group">
                  <label class="form-label">
                    <span>Direct Negotiated Monthly Override</span>
                    <span class="form-label-hint">${config.customMonthlyOverride ? `Active: $${config.customMonthlyOverride}/mo` : 'Optional'}</span>
                  </label>
                  <div style="display:flex; gap:0.5rem;">
                    <input 
                      type="number" 
                      class="form-input-text" 
                      id="adjust-custom-rate-input" 
                      placeholder="e.g. 95" 
                      value="${config.customMonthlyOverride || ''}" 
                      style="font-family:var(--font-mono);" 
                    />
                    <button class="action-btn-primary" id="btn-apply-custom-rate" style="padding:0.6rem 0.9rem; font-size:0.75rem;">
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              <!-- Internal Agent Notes -->
              <div class="adjust-field-group">
                <label class="form-label">Agent Underwriting & Binder Notes</label>
                <input 
                  type="text" 
                  class="form-input-text" 
                  id="adjust-agent-notes" 
                  value="${config.agentNotes || ''}" 
                  placeholder="Notes recorded on policy binding..." 
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Formulated Offer & Binder Summary Card -->
        <div>
          <div class="formulated-binder-card">
            <!-- Binder Header -->
            <div class="binder-card-header">
              <div class="binder-logo-title">
                <div style="font-weight:800; font-size:0.95rem; letter-spacing:0.02em;">MAGIC INSURANCE CORE</div>
                <div style="font-size:0.68rem; color:#94A3B8;">Official Digital Policy Binder & Offer Proposal</div>
              </div>
              <div class="binder-seal-badge">OFFER FORMULATED</div>
            </div>

            <!-- Binder Body -->
            <div class="binder-card-body">
              <!-- Proposal Pitch Narrative -->
              <div class="binder-proposal-pitch">
                <strong>Formulated Offer for ${lead.fullName}:</strong>
                Comprehensive coverage on <em>${lead.carClass}</em> under the <strong>${currentTierInfo.name}</strong>. Includes guaranteed 30-day rate lock and zero-lapse digital binder inception.
              </div>

              <!-- Billing Plan Selector -->
              <div style="display:flex; gap:0.5rem; background:var(--bg-darkest); padding:0.25rem; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
                <button 
                  type="button" 
                  class="adjust-option-pill ${config.paymentFrequency === 'monthly' ? 'active' : ''}" 
                  data-payment-freq="monthly"
                  style="padding:0.4rem;"
                >
                  Monthly Payment
                </button>
                <button 
                  type="button" 
                  class="adjust-option-pill ${config.paymentFrequency === 'annual' ? 'active' : ''}" 
                  data-payment-freq="annual"
                  style="padding:0.4rem;"
                >
                  Annual Pay-in-Full (Save 8%)
                </button>
              </div>

              <!-- Itemized Binder Coverages -->
              <div class="binder-items-list">
                <div class="binder-item-row">
                  <span class="binder-item-label">Applicant:</span>
                  <span class="binder-item-val">${lead.fullName}</span>
                </div>
                <div class="binder-item-row">
                  <span class="binder-item-label">Vehicle Insured:</span>
                  <span class="binder-item-val">${lead.carClass}</span>
                </div>
                <div class="binder-item-row">
                  <span class="binder-item-label">Effective Date:</span>
                  <span class="binder-item-val" style="font-family:var(--font-mono);">${config.effectiveDate} (Immediate)</span>
                </div>
                <div class="binder-item-row">
                  <span class="binder-item-label">Policy Tier:</span>
                  <span class="binder-item-val" style="color:var(--blue-primary);">${currentTierInfo.name}</span>
                </div>
                <div class="binder-item-row">
                  <span class="binder-item-label">Bodily Injury Limits:</span>
                  <span class="binder-item-val">${liabilityLabels[config.liabilityLimit]}</span>
                </div>
                <div class="binder-item-row">
                  <span class="binder-item-label">Comp & Collision Deductible:</span>
                  <span class="binder-item-val">$${config.deductible}</span>
                </div>
                <div class="binder-item-row">
                  <span class="binder-item-label">Active Endorsements:</span>
                  <span class="binder-item-val" style="font-size:0.72rem; text-align:right;">
                    ${Object.keys(config.addons).filter(k => config.addons[k]).join(', ') || 'Core Coverage Only'}
                  </span>
                </div>
                ${config.agentDiscountPercent > 0 ? `
                  <div class="binder-item-row" style="color:var(--emerald-success);">
                    <span>Discretionary Agent Discount:</span>
                    <span style="font-weight:700;">-${config.agentDiscountPercent}%</span>
                  </div>
                ` : ''}
                <div class="binder-item-row">
                  <span class="binder-item-label">Multi-Policy Bundle Credit:</span>
                  <span class="binder-item-val" style="color:var(--emerald-success); font-family:var(--font-mono);">Save $${rates.bundleSavings}/yr</span>
                </div>
              </div>

              <!-- Highlighted Pricing Display -->
              <div class="binder-pricing-highlight">
                <div>
                  <div style="font-size:0.7rem; text-transform:uppercase; font-weight:700; color:var(--text-dim); letter-spacing:0.04em;">
                    ${config.paymentFrequency === 'monthly' ? 'Monthly Premium' : 'Annual Pay-in-Full'}
                  </div>
                  <div class="binder-monthly-total">
                    $${config.paymentFrequency === 'monthly' ? rates.monthly : rates.annual}
                    <span style="font-size:0.85rem; font-weight:500; color:var(--text-dim);">
                      ${config.paymentFrequency === 'monthly' ? '/mo' : '/yr'}
                    </span>
                  </div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:0.85rem; font-weight:700; color:var(--text-bright); font-family:var(--font-mono);">
                    ${config.paymentFrequency === 'monthly' ? `$${rates.annual} / year` : `$${rates.monthly} / month equiv.`}
                  </div>
                  <div style="font-size:0.7rem; color:var(--emerald-success); font-weight:600; margin-top:0.2rem;">
                    Down Payment Due: $${config.paymentFrequency === 'monthly' ? rates.monthly : rates.annual}
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="binder-cta-container">
                <button class="btn-bind-accept" id="btn-accept-bind-offer">
                  <span>Accept Offer & Bind Policy</span>
                  <span style="font-size:1.1rem;">&rarr;</span>
                </button>
                <div style="font-size:0.72rem; color:var(--text-muted); text-align:center; line-height:1.35;">
                  Accepting instantly binds policy coverage, logs underwriting terms, and provisions active customer account.
                </div>
                <button class="btn-bind-reset" id="btn-cancel-bind" style="margin-top:0.25rem;">
                  Cancel & Return to Leads
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}


// Render Customer 360° Directory View (No Emojis)
function renderDirectoryView() {
  return `
    <div class="glass-panel" style="padding:1.5rem;">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Customer 360° Directory & Policy Inventory</h2>
          <p style="font-size:0.76rem; color:var(--text-muted);">Comprehensive view of customer portfolios, churn liklihood, and active life event signals</p>
        </div>
      </div>

      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.82rem; text-align:left;">
          <thead>
            <tr style="border-bottom:1px solid var(--border-medium); color:var(--text-dim); text-transform:uppercase; font-size:0.7rem; letter-spacing:0.05em;">
              <th style="padding:0.75rem 1rem;">Customer</th>
              <th style="padding:0.75rem 1rem;">Location</th>
              <th style="padding:0.75rem 1rem;">Active Policies</th>
              <th style="padding:0.75rem 1rem;">Current Premium</th>
              <th style="padding:0.75rem 1rem;">Estimated LTV</th>
              <th style="padding:0.75rem 1rem;">Churn Risk</th>
              <th style="padding:0.75rem 1rem;">Primary Signal</th>
              <th style="padding:0.75rem 1rem; text-align:right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${state.customers.map(c => `
              <tr class="directory-table-row">
                <td style="padding:0.85rem 1rem; display:flex; align-items:center; gap:0.6rem;">
                  <img src="${c.avatar}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;" />
                  <div>
                    <div style="font-weight:700; color:var(--text-bright);">${c.name}</div>
                    <div style="font-size:0.72rem; color:var(--text-dim);">${c.household}</div>
                  </div>
                </td>
                <td style="padding:0.85rem 1rem; color:var(--text-muted);">${c.location}</td>
                <td style="padding:0.85rem 1rem;">
                  <span style="font-family:var(--font-mono); font-weight:700; color:var(--cyan-primary);">${c.activePolicies.length}</span>
                  <span style="font-size:0.72rem; color:var(--text-dim);"> (${c.activePolicies.map(p => p.type.split(' ')[0]).join(', ')})</span>
                </td>
                <td style="padding:0.85rem 1rem; font-family:var(--font-mono); color:var(--text-bright);">$${c.totalAnnualPremium.toLocaleString()}/yr</td>
                <td style="padding:0.85rem 1rem; font-family:var(--font-mono); color:var(--cyan-primary);">$${c.estimatedLTV.toLocaleString()}</td>
                <td style="padding:0.85rem 1rem;">
                  <span class="churn-tier-badge ${c.churnRiskTier}">${c.churnRiskScore}% Churn</span>
                </td>
                <td style="padding:0.85rem 1rem; color:var(--text-muted);">
                  ${c.detectedSignals[0]?.title || 'No active signal'}
                </td>
                <td style="padding:0.85rem 1rem; text-align:right;">
                  <button class="nav-tab-btn active" style="font-size:0.76rem; padding:0.35rem 0.75rem;" data-select-cust="${c.id}">
                    View Profile
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Rate calculation engine for formulated offer
function getOfferRateCalculation(lead, config) {
  if (!lead || !config) {
    return {
      monthly: 0,
      annual: 0,
      bundleSavings: 0,
      closingLikelihood: 85,
      essentialMonthly: 0,
      recommendedMonthly: 0,
      eliteMonthly: 0
    };
  }

  const baseQuote = lead.monthlyQuote || 100;

  // Calculate baseline monthly for each tier
  const essentialBase = Math.round(baseQuote * 0.84);
  const recommendedBase = baseQuote;
  const eliteBase = Math.round(baseQuote * 1.30);

  let activeBase = config.selectedTier === 'essential' ? essentialBase :
                   config.selectedTier === 'elite' ? eliteBase :
                   recommendedBase;

  // Deductible adjustment
  let deductibleDelta = 0;
  if (config.deductible === 250) deductibleDelta = 12;
  else if (config.deductible === 1000) deductibleDelta = -10;

  // Liability adjustment
  let liabilityDelta = 0;
  if (config.liabilityLimit === 'standard') liabilityDelta = -6;
  else if (config.liabilityLimit === 'maximum') liabilityDelta = 14;

  // Addons adjustment
  let addonsDelta = 0;
  if (config.addons?.roadside) addonsDelta += 8;
  if (config.addons?.rental) addonsDelta += 6;
  if (config.addons?.glass) addonsDelta += 5;
  if (config.addons?.oemParts) addonsDelta += 12;

  let computedMonthly = Math.max(35, activeBase + deductibleDelta + liabilityDelta + addonsDelta);

  // Agent discretionary discount
  if (config.agentDiscountPercent > 0) {
    computedMonthly = Math.round(computedMonthly * (1 - config.agentDiscountPercent / 100));
  }

  // Custom manual override if provided
  if (config.customMonthlyOverride !== null && config.customMonthlyOverride !== undefined && !isNaN(config.customMonthlyOverride) && config.customMonthlyOverride > 0) {
    computedMonthly = Math.round(Number(config.customMonthlyOverride));
  }

  const annual = Math.round(computedMonthly * 12 * 0.92); // 8% pay-in-full discount
  const bundleSavings = Math.round(annual * 0.18);

  // Dynamic closing likelihood
  let closingLikelihood = lead.closingLikelihood || 88;
  if (config.agentDiscountPercent >= 10) closingLikelihood = Math.min(99, closingLikelihood + 7);
  else if (config.agentDiscountPercent >= 5) closingLikelihood = Math.min(97, closingLikelihood + 4);
  if (config.selectedTier === 'essential') closingLikelihood = Math.min(96, closingLikelihood + 3);
  if (config.selectedTier === 'elite' && config.agentDiscountPercent === 0) closingLikelihood = Math.max(74, closingLikelihood - 4);

  return {
    monthly: computedMonthly,
    annual,
    bundleSavings,
    closingLikelihood,
    essentialMonthly: essentialBase,
    recommendedMonthly: recommendedBase,
    eliteMonthly: eliteBase
  };
}

function initiateBindAndConvert(leadId) {
  const lead = state.leads.find(l => l.id === leadId);
  if (!lead) return;

  state.activeBindLeadId = leadId;
  state.activeOfferConfig = {
    leadId: lead.id,
    selectedTier: 'recommended',
    deductible: 500,
    liabilityLimit: 'enhanced',
    addons: {
      roadside: true,
      rental: false,
      glass: true,
      oemParts: lead.carClassKey === 'ev' || lead.carClassKey === 'luxury'
    },
    agentDiscountPercent: 0,
    paymentFrequency: 'monthly',
    customMonthlyOverride: null,
    effectiveDate: new Date().toISOString().split('T')[0],
    agentNotes: `Inbound inquiry for ${lead.carClass}. Underwriting rating tier: ${lead.tier}.`
  };

  state.currentView = 'bind-convert';
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Render Bind & Convert: Recommended Rates & Formulated Offer View
function renderBindConvertView() {
  const lead = state.leads.find(l => l.id === state.activeBindLeadId) || state.leads[0];
  if (!lead) {
    return `<div style="padding:2rem;">No active lead found. <button class="action-btn-primary" id="btn-back-to-leads">Back to Inbound Leads</button></div>`;
  }

  const config = state.activeOfferConfig || {
    leadId: lead.id,
    selectedTier: 'recommended',
    deductible: 500,
    liabilityLimit: 'enhanced',
    addons: { roadside: true, rental: false, glass: true, oemParts: false },
    agentDiscountPercent: 0,
    paymentFrequency: 'monthly',
    customMonthlyOverride: null,
    effectiveDate: new Date().toISOString().split('T')[0]
  };

  const rates = getOfferRateCalculation(lead, config);
  const initials = lead.fullName.split(' ').map(n => n[0]).join('').slice(0, 2);

  const tierMeta = {
    essential: {
      name: 'Essential Standard',
      desc: 'State compliance and core liability with standard roadside assistance.',
      deductible: '$1,000 Deductible',
      liability: '$50k / $100k / $50k Liability',
      features: ['State Minimum & Bodily Injury ($50k/$100k)', 'Collision & Comprehensive ($1k Deductible)', 'Standard Emergency Roadside Dispatch']
    },
    recommended: {
      name: 'Magic Preferred (AI Recommended)',
      desc: 'Optimal protection tailored for driving record, vehicle class, and high retention.',
      deductible: '$500 Deductible (Recommended)',
      liability: '$100k / $300k / $100k Enhanced Liability',
      features: ['Enhanced Bodily Injury & Property ($100k/$300k)', 'Collision & Comprehensive ($500 Deductible)', '24/7 National Towing & Roadside Assistance', 'Zero-Deductible Full Windshield & Glass', 'Multi-Policy Bundle Savings Credit']
    },
    elite: {
      name: 'Comprehensive Elite',
      desc: 'Maximum coverage with OEM replacement parts, rental reimbursement, and gap protection.',
      deductible: '$250 Deductible',
      liability: '$250k / $500k / $250k Umbrella Ready',
      features: ['Maximum Umbrella-Ready Liability ($250k/$500k)', 'Low $250 Collision & Comprehensive Deductible', 'OEM Genuine Parts Replacement Guarantee', 'Rental Car Reimbursement ($45/day)', 'Full Glass & Comprehensive Gap Protection']
    }
  };

  const currentTierInfo = tierMeta[config.selectedTier] || tierMeta.recommended;

  const liabilityLabels = {
    standard: '$50,000 / $100,000 / $50,000',
    enhanced: '$100,000 / $300,000 / $100,000',
    maximum: '$250,000 / $500,000 / $250,000'
  };

  return `
    <div class="bind-convert-view">
      <!-- Breadcrumb and Top Navigation -->
      <div class="bind-header-bar">
        <div class="bind-breadcrumb">
          <button class="bind-breadcrumb-btn" id="btn-back-to-leads">
            &larr; Back to Inbound Leads Pipeline
          </button>
          <span>/</span>
          <span style="color:var(--text-bright); font-weight:700;">Bind & Convert Offer Formulation</span>
        </div>
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <span class="policy-status-pill" style="background:#E0F2FE; color:#0369A1; border-color:#BAE6FD;">
            Binder Inception Engine
          </span>
          <span class="likelihood-badge-pill ${rates.closingLikelihood >= 88 ? 'very-high' : 'high'}">
            ${rates.closingLikelihood}% Closing Likelihood
          </span>
        </div>
      </div>

      <!-- Applicant Overview Banner -->
      <div class="bind-prospect-banner">
        <div class="bind-prospect-profile">
          <div class="bind-prospect-avatar">${initials}</div>
          <div class="bind-prospect-details">
            <h2>${lead.fullName}</h2>
            <div class="bind-prospect-meta">
              <span>${lead.email}</span>
              <span>&bull;</span>
              <span>${lead.phone}</span>
              <span>&bull;</span>
              <span>${lead.location}</span>
            </div>
          </div>
        </div>

        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <span class="bind-prospect-pill">Vehicle: <strong>${lead.carClass}</strong></span>
          <span class="bind-prospect-pill">Experience: <strong>${lead.drivingExperience} yrs</strong></span>
          <span class="bind-prospect-pill">Record: <strong>${lead.record}</strong></span>
          <span class="bind-prospect-pill">Mileage: <strong>${lead.annualMileage}</strong></span>
          <span class="bind-prospect-pill">Rating Tier: <strong>${lead.tier}</strong></span>
        </div>
      </div>

      <!-- Main Layout Columns: Left = Recommended Rates & Adjustments, Right = Formulated Binder Offer -->
      <div class="bind-layout-columns">
        <div style="display:flex; flex-direction:column; gap:1.5rem;">
          
          <!-- Section 1: Recommended Rates for this Customer -->
          <div class="glass-panel" style="padding:1.5rem;">
            <div class="panel-header" style="margin-bottom:0.25rem;">
              <div>
                <h3 class="panel-title" style="font-size:1.1rem;">Recommended Rates for ${lead.fullName}</h3>
                <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">
                  AI actuarial underwriting recommendations based on applicant's driving record, vehicle class, and risk tier.
                </p>
              </div>
            </div>

            <!-- Tier Cards Grid -->
            <div class="tier-cards-grid">
              <!-- Essential -->
              <div class="tier-rate-card ${config.selectedTier === 'essential' ? 'selected' : ''}" data-select-tier="essential">
                <div>
                  <div class="tier-name">${tierMeta.essential.name}</div>
                  <div class="tier-desc">${tierMeta.essential.desc}</div>
                  <div class="tier-price-display">
                    <span class="tier-price-val">$${rates.essentialMonthly}</span>
                    <span class="tier-price-period">/mo</span>
                  </div>
                  <div class="tier-annual-sub">$${Math.round(rates.essentialMonthly * 12 * 0.92)}/yr (8% pay-in-full discount)</div>
                  <ul class="tier-feature-list">
                    ${tierMeta.essential.features.map(f => `
                      <li class="tier-feature-item">
                        <span class="tier-feature-bullet">&check;</span>
                        <span>${f}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
                <button type="button" class="tier-select-btn">
                  ${config.selectedTier === 'essential' ? 'Selected Package' : 'Select Package'}
                </button>
              </div>

              <!-- Recommended Magic Preferred -->
              <div class="tier-rate-card recommended ${config.selectedTier === 'recommended' ? 'selected' : ''}" data-select-tier="recommended">
                <span class="tier-recommended-ribbon">AI Recommended</span>
                <div>
                  <div class="tier-name">${tierMeta.recommended.name}</div>
                  <div class="tier-desc">${tierMeta.recommended.desc}</div>
                  <div class="tier-price-display">
                    <span class="tier-price-val" style="color:var(--blue-primary);">$${rates.recommendedMonthly}</span>
                    <span class="tier-price-period">/mo</span>
                  </div>
                  <div class="tier-annual-sub">$${lead.annualQuote}/yr (Includes bundle savings)</div>
                  <ul class="tier-feature-list">
                    ${tierMeta.recommended.features.map(f => `
                      <li class="tier-feature-item">
                        <span class="tier-feature-bullet" style="color:var(--emerald-success);">&check;</span>
                        <span>${f}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
                <button type="button" class="tier-select-btn">
                  ${config.selectedTier === 'recommended' ? 'Active Recommended Package' : 'Select Package'}
                </button>
              </div>

              <!-- Elite -->
              <div class="tier-rate-card ${config.selectedTier === 'elite' ? 'selected' : ''}" data-select-tier="elite">
                <div>
                  <div class="tier-name">${tierMeta.elite.name}</div>
                  <div class="tier-desc">${tierMeta.elite.desc}</div>
                  <div class="tier-price-display">
                    <span class="tier-price-val">$${rates.eliteMonthly}</span>
                    <span class="tier-price-period">/mo</span>
                  </div>
                  <div class="tier-annual-sub">$${Math.round(rates.eliteMonthly * 12 * 0.92)}/yr (Premium tier)</div>
                  <ul class="tier-feature-list">
                    ${tierMeta.elite.features.map(f => `
                      <li class="tier-feature-item">
                        <span class="tier-feature-bullet">&check;</span>
                        <span>${f}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
                <button type="button" class="tier-select-btn">
                  ${config.selectedTier === 'elite' ? 'Selected Package' : 'Select Package'}
                </button>
              </div>
            </div>

            <!-- Underwriting Actuarial Factors -->
            <div class="underwriting-breakdown-box" style="margin-top:1.25rem;">
              <div style="font-size:0.75rem; font-weight:700; color:var(--text-bright); text-transform:uppercase; letter-spacing:0.04em;">
                Actuarial Underwriting Factors & Rate Justification
              </div>
              <div class="breakdown-factors-grid">
                <div class="breakdown-factor-item">
                  <span class="factor-label">Driving Record</span>
                  <span class="factor-value">${lead.record.includes('Clean') ? 'Clean Record' : 'Standard'}</span>
                  <span class="factor-credit">${lead.record.includes('Clean') ? '-12% Safe Driver Credit' : 'Base Rate'}</span>
                </div>
                <div class="breakdown-factor-item">
                  <span class="factor-label">Driving Experience</span>
                  <span class="factor-value">${lead.drivingExperience} Years</span>
                  <span class="factor-credit">${lead.drivingExperience >= 5 ? '-8% Seasoned Credit' : 'Standard Tier'}</span>
                </div>
                <div class="breakdown-factor-item">
                  <span class="factor-label">Vehicle Risk Class</span>
                  <span class="factor-value">${lead.carClass.split('(')[0].trim()}</span>
                  <span class="factor-credit" style="color:var(--blue-primary);">5-Star Safety Profile</span>
                </div>
                <div class="breakdown-factor-item">
                  <span class="factor-label">Bundle Incentive</span>
                  <span class="factor-value">Save $${lead.bundleSavings}/yr</span>
                  <span class="factor-credit">Multi-Policy Discount</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Option to Adjust the Offer -->
          <div class="glass-panel" style="padding:1.5rem;" id="adjust-offer-section">
            <div class="panel-header" style="margin-bottom:0.75rem;">
              <div>
                <h3 class="panel-title" style="font-size:1.1rem;">Adjust Offer Parameters</h3>
                <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">
                  As an insurance agent, you can customize coverage limits, deductibles, endorsements, or apply discretionary discounts.
                </p>
              </div>
              <button class="btn-bind-reset" id="btn-reset-offer" style="width:auto; padding:0.35rem 0.75rem;">
                Reset to Recommended
              </button>
            </div>

            <div class="adjust-offer-panel">
              <!-- Deductible Selection -->
              <div class="adjust-field-group">
                <div class="adjust-field-header">
                  <span>Comprehensive & Collision Deductible</span>
                  <span style="font-size:0.7rem; color:var(--text-muted);">Current: $${config.deductible}</span>
                </div>
                <div class="adjust-options-pills">
                  <div class="adjust-option-pill ${config.deductible === 250 ? 'active' : ''}" data-adjust-deductible="250">
                    $250 (+$12/mo)
                  </div>
                  <div class="adjust-option-pill ${config.deductible === 500 ? 'active' : ''}" data-adjust-deductible="500">
                    $500 (Recommended)
                  </div>
                  <div class="adjust-option-pill ${config.deductible === 1000 ? 'active' : ''}" data-adjust-deductible="1000">
                    $1,000 (-$10/mo)
                  </div>
                </div>
              </div>

              <!-- Liability Limit Selection -->
              <div class="adjust-field-group">
                <div class="adjust-field-header">
                  <span>Bodily Injury & Property Damage Limits</span>
                  <span style="font-size:0.7rem; color:var(--text-muted);">${liabilityLabels[config.liabilityLimit]}</span>
                </div>
                <div class="adjust-options-pills">
                  <div class="adjust-option-pill ${config.liabilityLimit === 'standard' ? 'active' : ''}" data-adjust-liability="standard">
                    Standard ($50k/$100k, -$6/mo)
                  </div>
                  <div class="adjust-option-pill ${config.liabilityLimit === 'enhanced' ? 'active' : ''}" data-adjust-liability="enhanced">
                    Enhanced ($100k/$300k, Recommended)
                  </div>
                  <div class="adjust-option-pill ${config.liabilityLimit === 'maximum' ? 'active' : ''}" data-adjust-liability="maximum">
                    Umbrella-Ready ($250k/$500k, +$14/mo)
                  </div>
                </div>
              </div>

              <!-- Optional Add-ons Checkboxes -->
              <div class="adjust-field-group">
                <div class="adjust-field-header">
                  <span>Coverage Endorsements & Add-ons</span>
                  <span style="font-size:0.7rem; color:var(--text-muted);">Toggle to include or exclude</span>
                </div>
                <div class="addons-toggle-grid">
                  <div class="addon-toggle-box ${config.addons.roadside ? 'active' : ''}" data-toggle-addon="roadside">
                    <div class="addon-info">
                      <span class="addon-name">24/7 Roadside Assistance</span>
                      <span class="addon-cost">+$8.00 / mo</span>
                    </div>
                    <input type="checkbox" class="addon-checkbox" ${config.addons.roadside ? 'checked' : ''} />
                  </div>

                  <div class="addon-toggle-box ${config.addons.rental ? 'active' : ''}" data-toggle-addon="rental">
                    <div class="addon-info">
                      <span class="addon-name">Rental Car Reimbursement</span>
                      <span class="addon-cost">+$6.00 / mo ($45/day)</span>
                    </div>
                    <input type="checkbox" class="addon-checkbox" ${config.addons.rental ? 'checked' : ''} />
                  </div>

                  <div class="addon-toggle-box ${config.addons.glass ? 'active' : ''}" data-toggle-addon="glass">
                    <div class="addon-info">
                      <span class="addon-name">Zero-Deductible Full Glass</span>
                      <span class="addon-cost">+$5.00 / mo</span>
                    </div>
                    <input type="checkbox" class="addon-checkbox" ${config.addons.glass ? 'checked' : ''} />
                  </div>

                  <div class="addon-toggle-box ${config.addons.oemParts ? 'active' : ''}" data-toggle-addon="oemParts">
                    <div class="addon-info">
                      <span class="addon-name">OEM Genuine Replacement Parts</span>
                      <span class="addon-cost">+$12.00 / mo</span>
                    </div>
                    <input type="checkbox" class="addon-checkbox" ${config.addons.oemParts ? 'checked' : ''} />
                  </div>
                </div>
              </div>

              <!-- Agent Discretionary Discount & Custom Rate Override -->
              <div class="form-row-dual">
                <div class="adjust-field-group">
                  <label class="form-label">
                    <span>Agent Discretionary Discount</span>
                    <span class="form-label-hint">${config.agentDiscountPercent}% Applied</span>
                  </label>
                  <select class="form-select" id="adjust-agent-discount">
                    <option value="0" ${config.agentDiscountPercent === 0 ? 'selected' : ''}>0% - Standard Recommended Rate</option>
                    <option value="5" ${config.agentDiscountPercent === 5 ? 'selected' : ''}>5% - Preferred Driver Courtesy Discount</option>
                    <option value="10" ${config.agentDiscountPercent === 10 ? 'selected' : ''}>10% - Competitive Price Match Guarantee</option>
                    <option value="15" ${config.agentDiscountPercent === 15 ? 'selected' : ''}>15% - Branch Manager Retention Override</option>
                  </select>
                </div>

                <div class="adjust-field-group">
                  <label class="form-label">
                    <span>Direct Negotiated Monthly Override</span>
                    <span class="form-label-hint">${config.customMonthlyOverride ? `Active: $${config.customMonthlyOverride}/mo` : 'Optional'}</span>
                  </label>
                  <div style="display:flex; gap:0.5rem;">
                    <input 
                      type="number" 
                      class="form-input-text" 
                      id="adjust-custom-rate-input" 
                      placeholder="e.g. 95" 
                      value="${config.customMonthlyOverride || ''}" 
                      style="font-family:var(--font-mono);" 
                    />
                    <button class="action-btn-primary" id="btn-apply-custom-rate" style="padding:0.6rem 0.9rem; font-size:0.75rem;">
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              <!-- Internal Agent Notes -->
              <div class="adjust-field-group">
                <label class="form-label">Agent Underwriting & Binder Notes</label>
                <input 
                  type="text" 
                  class="form-input-text" 
                  id="adjust-agent-notes" 
                  value="${config.agentNotes || ''}" 
                  placeholder="Notes recorded on policy binding..." 
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Formulated Offer & Binder Summary Card -->
        <div>
          <div class="formulated-binder-card">
            <!-- Binder Header -->
            <div class="binder-card-header">
              <div class="binder-logo-title">
                <div style="font-weight:800; font-size:0.95rem; letter-spacing:0.02em;">MAGIC INSURANCE CORE</div>
                <div style="font-size:0.68rem; color:#94A3B8;">Official Digital Policy Binder & Offer Proposal</div>
              </div>
              <div class="binder-seal-badge">OFFER FORMULATED</div>
            </div>

            <!-- Binder Body -->
            <div class="binder-card-body">
              <!-- Proposal Pitch Narrative -->
              <div class="binder-proposal-pitch">
                <strong>Formulated Offer for ${lead.fullName}:</strong>
                Comprehensive coverage on <em>${lead.carClass}</em> under the <strong>${currentTierInfo.name}</strong>. Includes guaranteed 30-day rate lock and zero-lapse digital binder inception.
              </div>

              <!-- Billing Plan Selector -->
              <div style="display:flex; gap:0.5rem; background:var(--bg-darkest); padding:0.25rem; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
                <button 
                  type="button" 
                  class="adjust-option-pill ${config.paymentFrequency === 'monthly' ? 'active' : ''}" 
                  data-payment-freq="monthly"
                  style="padding:0.4rem;"
                >
                  Monthly Payment
                </button>
                <button 
                  type="button" 
                  class="adjust-option-pill ${config.paymentFrequency === 'annual' ? 'active' : ''}" 
                  data-payment-freq="annual"
                  style="padding:0.4rem;"
                >
                  Annual Pay-in-Full (Save 8%)
                </button>
              </div>

              <!-- Itemized Binder Coverages -->
              <div class="binder-items-list">
                <div class="binder-item-row">
                  <span class="binder-item-label">Applicant:</span>
                  <span class="binder-item-val">${lead.fullName}</span>
                </div>
                <div class="binder-item-row">
                  <span class="binder-item-label">Vehicle Insured:</span>
                  <span class="binder-item-val">${lead.carClass}</span>
                </div>
                <div class="binder-item-row">
                  <span class="binder-item-label">Effective Date:</span>
                  <span class="binder-item-val" style="font-family:var(--font-mono);">${config.effectiveDate} (Immediate)</span>
                </div>
                <div class="binder-item-row">
                  <span class="binder-item-label">Policy Tier:</span>
                  <span class="binder-item-val" style="color:var(--blue-primary);">${currentTierInfo.name}</span>
                </div>
                <div class="binder-item-row">
                  <span class="binder-item-label">Bodily Injury Limits:</span>
                  <span class="binder-item-val">${liabilityLabels[config.liabilityLimit]}</span>
                </div>
                <div class="binder-item-row">
                  <span class="binder-item-label">Comp & Collision Deductible:</span>
                  <span class="binder-item-val">$${config.deductible}</span>
                </div>
                <div class="binder-item-row">
                  <span class="binder-item-label">Active Endorsements:</span>
                  <span class="binder-item-val" style="font-size:0.72rem; text-align:right;">
                    ${Object.keys(config.addons).filter(k => config.addons[k]).join(', ') || 'Core Coverage Only'}
                  </span>
                </div>
                ${config.agentDiscountPercent > 0 ? `
                  <div class="binder-item-row" style="color:var(--emerald-success);">
                    <span>Discretionary Agent Discount:</span>
                    <span style="font-weight:700;">-${config.agentDiscountPercent}%</span>
                  </div>
                ` : ''}
                <div class="binder-item-row">
                  <span class="binder-item-label">Multi-Policy Bundle Credit:</span>
                  <span class="binder-item-val" style="color:var(--emerald-success); font-family:var(--font-mono);">Save $${rates.bundleSavings}/yr</span>
                </div>
              </div>

              <!-- Highlighted Pricing Display -->
              <div class="binder-pricing-highlight">
                <div>
                  <div style="font-size:0.7rem; text-transform:uppercase; font-weight:700; color:var(--text-dim); letter-spacing:0.04em;">
                    ${config.paymentFrequency === 'monthly' ? 'Monthly Premium' : 'Annual Pay-in-Full'}
                  </div>
                  <div class="binder-monthly-total">
                    $${config.paymentFrequency === 'monthly' ? rates.monthly : rates.annual}
                    <span style="font-size:0.85rem; font-weight:500; color:var(--text-dim);">
                      ${config.paymentFrequency === 'monthly' ? '/mo' : '/yr'}
                    </span>
                  </div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:0.85rem; font-weight:700; color:var(--text-bright); font-family:var(--font-mono);">
                    ${config.paymentFrequency === 'monthly' ? `$${rates.annual} / year` : `$${rates.monthly} / month equiv.`}
                  </div>
                  <div style="font-size:0.7rem; color:var(--emerald-success); font-weight:600; margin-top:0.2rem;">
                    Down Payment Due: $${config.paymentFrequency === 'monthly' ? rates.monthly : rates.annual}
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="binder-cta-container">
                <button class="btn-bind-accept" id="btn-accept-bind-offer">
                  <span>Accept Offer & Bind Policy</span>
                  <span style="font-size:1.1rem;">&rarr;</span>
                </button>
                <div style="font-size:0.72rem; color:var(--text-muted); text-align:center; line-height:1.35;">
                  Accepting instantly binds policy coverage, logs underwriting terms, and provisions active customer account.
                </div>
                <button class="btn-bind-reset" id="btn-cancel-bind" style="margin-top:0.25rem;">
                  Cancel & Return to Leads
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}


// Event Listeners Wiring
function attachEventListeners() {
  // Navigation
  document.getElementById('nav-btn-command')?.addEventListener('click', () => {
    state.currentView = 'command';
    renderApp();
  });
  document.getElementById('nav-btn-leads')?.addEventListener('click', () => {
    state.currentView = 'leads';
    renderApp();
  });
  document.getElementById('nav-btn-analytics')?.addEventListener('click', () => {
    state.currentView = 'analytics';
    renderApp();
  });
  document.getElementById('nav-btn-directory')?.addEventListener('click', () => {
    state.currentView = 'directory';
    renderApp();
  });

  // Customer Search
  const searchInput = document.getElementById('cust-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderApp();
      const reSearch = document.getElementById('cust-search');
      if (reSearch) {
        reSearch.focus();
        reSearch.setSelectionRange(state.searchQuery.length, state.searchQuery.length);
      }
    });
  }

  // Customer Card Selection
  document.querySelectorAll('.customer-card').forEach(card => {
    card.addEventListener('click', () => {
      const custId = card.getAttribute('data-cust-id');
      if (custId) {
        state.selectedCustomerId = custId;
        state.selectedProductId = null;
        renderApp();
      }
    });
  });

  // Directory View "View Profile"
  document.querySelectorAll('[data-select-cust]').forEach(btn => {
    btn.addEventListener('click', () => {
      const custId = btn.getAttribute('data-select-cust');
      if (custId) {
        state.selectedCustomerId = custId;
        state.selectedProductId = null;
        state.currentView = 'command';
        renderApp();
      }
    });
  });

  // Eligible Insurance Selection for Outreach
  document.querySelectorAll('[data-select-product]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const prodId = btn.getAttribute('data-select-product');
      if (prodId) {
        state.selectedProductId = prodId;
        showToast(`Selected ${prodId} for outreach campaign`);
        renderApp();
      }
    });
  });

  // Channel Tabs (Email, Advisor, Mobile App Push)
  document.querySelectorAll('.channel-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const channel = btn.getAttribute('data-channel');
      if (channel) {
        state.activeChannelTab = channel;
        renderApp();
      }
    });
  });

  // Theme Toggle Button
  document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('magic-theme', state.theme);
    document.documentElement.setAttribute('data-theme', state.theme);
    renderApp();
  });

  // Simulator Modal Open/Close
  document.getElementById('btn-open-simulator')?.addEventListener('click', () => {
    state.isSimModalOpen = true;
    renderApp();
  });
  document.getElementById('btn-close-sim')?.addEventListener('click', () => {
    state.isSimModalOpen = false;
    renderApp();
  });
  document.getElementById('btn-cancel-sim')?.addEventListener('click', () => {
    state.isSimModalOpen = false;
    renderApp();
  });

  // Simulator Event Selection
  document.querySelectorAll('.sim-event-card').forEach(card => {
    card.addEventListener('click', () => {
      state.selectedSimEventType = card.getAttribute('data-event-id');
      document.querySelectorAll('.sim-event-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });

  // Run Simulation
  document.getElementById('btn-run-simulation')?.addEventListener('click', () => {
    const customNote = document.getElementById('sim-custom-input')?.value || '';
    const currentCust = state.customers.find(c => c.id === state.selectedCustomerId);

    if (currentCust) {
      const simResult = state.agent.simulateLifeEvent(currentCust, state.selectedSimEventType, customNote);
      const idx = state.customers.findIndex(c => c.id === currentCust.id);
      if (idx !== -1) {
        state.customers[idx] = simResult.updatedCustomer;
      }
      state.isSimModalOpen = false;
      state.selectedProductId = null;
      showToast(`Life event simulation triggered: updated eligibility & closing likelihood`);
      renderApp();
    }
  });

  // Dispatch Action
  document.getElementById('btn-dispatch-offer')?.addEventListener('click', () => {
    const currentCust = state.customers.find(c => c.id === state.selectedCustomerId);
    const evalData = state.agent.evaluateCustomer(currentCust);
    const product = state.selectedProductId
      ? (evalData.eligibleInsurances.find(p => p.id === state.selectedProductId) || evalData.eligibleInsurances[0])
      : evalData.eligibleInsurances[0];

    const newLog = {
      id: `DISP-${Date.now().toString().slice(-4)}`,
      customerName: currentCust.name,
      channel: state.activeChannelTab.toUpperCase(),
      product: product ? product.name : 'Personalized Bundle',
      time: 'Just now',
      result: 'Delivered (Simulated: Customer Accepted Offer)'
    };
    state.dispatchLog.unshift(newLog);

    currentCust.churnRiskScore = Math.max(12, Math.round(currentCust.churnRiskScore * 0.45));
    currentCust.churnRiskTier = currentCust.churnRiskScore > 70 ? 'CRITICAL' : currentCust.churnRiskScore > 40 ? 'MEDIUM' : 'LOW';

    showToast(`Dispatched ${product ? product.name : 'Offer'} via ${state.activeChannelTab.toUpperCase()}`);
    renderApp();
  });

  // =========================================================================
  // Leads Page Calculator Events
  // =========================================================================
  const expRange = document.getElementById('calc-exp-range');
  if (expRange) {
    expRange.addEventListener('input', (e) => {
      state.activeLeadCalculator.drivingExperience = Number(e.target.value);
      updateQuoteCalculator();
    });
  }

  const carClassSelect = document.getElementById('calc-car-class');
  if (carClassSelect) {
    carClassSelect.addEventListener('change', (e) => {
      state.activeLeadCalculator.carClass = e.target.value;
      updateQuoteCalculator();
    });
  }

  const mileageSelect = document.getElementById('calc-mileage');
  if (mileageSelect) {
    mileageSelect.addEventListener('change', (e) => {
      state.activeLeadCalculator.annualMileage = e.target.value;
      updateQuoteCalculator();
    });
  }

  const recordSelect = document.getElementById('calc-record');
  if (recordSelect) {
    recordSelect.addEventListener('change', (e) => {
      state.activeLeadCalculator.record = e.target.value;
      updateQuoteCalculator();
    });
  }

  // Sex choice buttons
  document.querySelectorAll('.pill-choice-btn[data-field="sex"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-val');
      if (val) {
        state.activeLeadCalculator.sex = val;
        updateQuoteCalculator();
      }
    });
  });

  // Leads search
  const leadSearch = document.getElementById('lead-search-input');
  if (leadSearch) {
    leadSearch.addEventListener('input', (e) => {
      state.leadSearchQuery = e.target.value;
      renderApp();
      const reSearch = document.getElementById('lead-search-input');
      if (reSearch) {
        reSearch.focus();
        reSearch.setSelectionRange(state.leadSearchQuery.length, state.leadSearchQuery.length);
      }
    });
  }

  // Save Lead & Issue Rate Quote
  document.getElementById('btn-save-lead')?.addEventListener('click', () => {
    const nameInput = document.getElementById('lead-input-name')?.value.trim() || 'New Applicant';
    const emailInput = document.getElementById('lead-input-email')?.value.trim() || 'applicant@example.com';
    const phoneInput = document.getElementById('lead-input-phone')?.value.trim() || '(512) 555-0199';
    const locationInput = document.getElementById('lead-input-location')?.value.trim() || 'Austin, TX';

    const carClassLabels = {
      sedan: 'Midsize Sedan',
      economy: 'Economy Hatchback',
      suv: 'Compact SUV',
      ev: 'Electric Vehicle EV',
      luxury: 'Luxury / Sports Car',
      truck: 'Full-size Truck'
    };

    const newLead = {
      id: `LEAD-${Date.now().toString().slice(-3)}`,
      fullName: nameInput,
      email: emailInput,
      phone: phoneInput,
      location: locationInput,
      insuranceType: 'Car Insurance',
      typeKey: 'car',
      carClass: carClassLabels[state.activeLeadCalculator.carClass] || 'Sedan',
      carClassKey: state.activeLeadCalculator.carClass,
      drivingExperience: state.activeLeadCalculator.drivingExperience,
      sex: state.activeLeadCalculator.sex,
      annualMileage: state.activeLeadCalculator.annualMileage === 'high' ? 'High (>15k mi)' : state.activeLeadCalculator.annualMileage === 'low' ? 'Low (<8k mi)' : 'Commuter',
      mileageKey: state.activeLeadCalculator.annualMileage,
      record: state.activeLeadCalculator.record === 'clean' ? 'Clean Record' : 'Prior Incident',
      recordKey: state.activeLeadCalculator.record,
      monthlyQuote: state.currentCalculatedQuote.monthly,
      annualQuote: state.currentCalculatedQuote.annual,
      bundleSavings: state.currentCalculatedQuote.bundleSavings,
      tier: state.currentCalculatedQuote.tier,
      closingLikelihood: state.currentCalculatedQuote.closingLikelihood,
      status: 'Quote Sent',
      receivedAt: 'Just now',
      notes: `Direct inquiry for ${carClassLabels[state.activeLeadCalculator.carClass] || 'Car Insurance'}.`
    };

    state.leads.unshift(newLead);
    showToast(`Rate quote issued for ${nameInput}: $${newLead.monthlyQuote}/mo ($${newLead.annualQuote}/yr). Lead saved!`);
    renderApp();
  });

  // Bind & Convert Lead to Customer Account
  document.querySelectorAll('[data-convert-lead]').forEach(btn => {
    btn.addEventListener('click', () => {
      const leadId = btn.getAttribute('data-convert-lead');
      const lead = state.leads.find(l => l.id === leadId);
      if (lead) {
        // Create new customer profile
        const newCustomer = {
          id: `CUST-${Date.now().toString().slice(-4)}`,
          name: lead.fullName,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
          age: 32,
          household: 'Personal Account',
          location: lead.location,
          occupation: 'Professional',
          tenureYears: 0.1,
          totalAnnualPremium: lead.annualQuote,
          estimatedLTV: lead.annualQuote * 8,
          churnRiskScore: 18,
          churnRiskTier: 'LOW',
          churnDrivers: ['Newly bound account with preferred introductory rate'],
          activePolicies: [
            {
              id: `POL-AUTO-${Date.now().toString().slice(-4)}`,
              type: `Auto Shield (${lead.carClass})`,
              annualPremium: lead.annualQuote,
              status: 'Active',
              renewalDate: '2027-10-26'
            }
          ],
          detectedSignals: [
            {
              id: `SIG-NEW-${Date.now().toString().slice(-3)}`,
              type: 'NEW_VEHICLE',
              title: 'Active Policy Inception & Auto Coverage Bound',
              timestamp: 'Just now',
              source: 'Employee Inbound Intake Portal',
              confidence: 1.0,
              status: 'Active'
            }
          ],
          digitalEngagement: {
            appLoginsLast30Days: 1,
            npsScore: 10,
            sentiment: 'Enthusiastic new policyholder'
          },
          agentStatus: 'ACTIVE_POLICY',
          lastContactDate: 'Today'
        };

        state.customers.unshift(newCustomer);
        state.selectedCustomerId = newCustomer.id;
        state.selectedProductId = null;
        lead.status = 'Binder Ready';
        showToast(`Lead ${lead.fullName} converted to active policyholder!`);
        state.currentView = 'command';
        renderApp();
      }
    });
  });
}

function updateQuoteCalculator() {
  const calc = state.activeLeadCalculator;
  state.currentCalculatedQuote = calculateCarInsuranceQuote({
    drivingExperience: calc.drivingExperience,
    carClass: calc.carClass,
    sex: calc.sex,
    annualMileage: calc.annualMileage,
    record: calc.record
  });
  renderApp();
}

function showToast(message) {
  const toast = document.getElementById('app-toast');
  const text = document.getElementById('toast-text');
  if (toast && text) {
    text.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4500);
  }
}

// Initialize Application
renderApp();
