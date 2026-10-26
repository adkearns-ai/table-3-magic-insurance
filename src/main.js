import './style.css';
import { INITIAL_CUSTOMERS } from './data/customers.js';
import { LIFE_EVENT_TYPES, INSURANCE_PRODUCTS } from './data/insuranceCatalog.js';
import { RetailGrowthAgent } from './agent/growthEngine.js';

// Application State
const state = {
  customers: [...INITIAL_CUSTOMERS],
  selectedCustomerId: INITIAL_CUSTOMERS[0].id,
  selectedProductId: null, // Selected eligible product for campaign dispatch
  currentView: 'command', // 'command' | 'analytics' | 'directory'
  activeChannelTab: 'email', // 'email' | 'advisor' | 'push' (SMS removed per user request)
  searchQuery: '',
  theme: localStorage.getItem('magic-theme') || localStorage.getItem('aegis-theme') || 'light',
  riskFilter: 'ALL',
  agent: new RetailGrowthAgent({ retentionBias: 0.70 }),
  isSimModalOpen: false,
  selectedSimEventType: 'HOME_PURCHASE',
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

// Main DOM Render Function
function renderApp() {
  const app = document.getElementById('app');
  if (!app) return;

  document.documentElement.setAttribute('data-theme', state.theme);

  const selectedCustomer = state.customers.find(c => c.id === state.selectedCustomerId) || state.customers[0];
  const agentEval = state.agent.evaluateCustomer(selectedCustomer);

  // If selected product not set or no longer eligible, default to top recommended product
  const activeOfferProduct = state.selectedProductId 
    ? (agentEval.eligibleInsurances.find(p => p.id === state.selectedProductId) || agentEval.eligibleInsurances[0])
    : agentEval.eligibleInsurances[0];

  app.innerHTML = `
    <!-- Top Site Navigation & Telemetry -->
    <header class="site-header">
      <div class="header-inner">
        <div class="brand-section">
          <div class="brand-logo-container">
            <img src="/agent-logo.jpg" alt="Magic Insurance Logo" class="brand-logo-img" />
          </div>
          <div class="brand-title-wrap">
            <h1>Magic Insurance</h1>
            <div class="brand-subtitle">
              <span class="pulse-dot"></span>
              Proactive Retail Customer Intelligence & Retention
            </div>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <nav class="nav-tabs" role="tablist">
          <button class="nav-tab-btn ${state.currentView === 'command' ? 'active' : ''}" id="nav-btn-command">
            <span>🚀</span> Command Center
          </button>
          <button class="nav-tab-btn ${state.currentView === 'analytics' ? 'active' : ''}" id="nav-btn-analytics">
            <span>📊</span> Growth Analytics
          </button>
          <button class="nav-tab-btn ${state.currentView === 'directory' ? 'active' : ''}" id="nav-btn-directory">
            <span>👥</span> Customer 360°
          </button>
        </nav>

        <!-- Live Telemetry Stats, Theme Toggle & Simulator Action -->
        <div class="telemetry-bar">
          <div class="metric-pill">
            <span class="metric-pill-label">Monitored Portfolio</span>
            <span class="metric-pill-val">14,820</span>
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
            <span>${state.theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
          </button>
          <button class="action-btn-primary" id="btn-open-simulator">
            <span>⚡</span> Simulate Life Event
          </button>
        </div>
      </div>
    </header>

    <!-- Main Viewport Content -->
    <main class="main-viewport">
      ${state.currentView === 'command' ? renderCommandCenter(selectedCustomer, agentEval, activeOfferProduct) : ''}
      ${state.currentView === 'analytics' ? renderAnalyticsView() : ''}
      ${state.currentView === 'directory' ? renderDirectoryView() : ''}
    </main>

    <!-- Simulator Modal -->
    <div class="modal-overlay ${state.isSimModalOpen ? 'open' : ''}" id="simulator-modal">
      <div class="modal-window">
        <div class="modal-header">
          <div class="modal-title">⚡ Interactive "What-If" Life Event Sandbox</div>
          <button class="modal-close-btn" id="btn-close-sim">&times;</button>
        </div>
        <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:1.15rem;">
          Trigger a real-time life event signal for <strong>${selectedCustomer.name}</strong> to watch Magic Insurance recalculate active coverage, product eligibility, and adoption likelihood.
        </p>

        <div class="sim-events-grid">
          ${Object.values(LIFE_EVENT_TYPES).map(evt => `
            <div class="sim-event-card ${state.selectedSimEventType === evt.id ? 'selected' : ''}" data-event-id="${evt.id}">
              <div class="sim-event-icon">${evt.icon}</div>
              <div class="sim-event-info">
                <div class="sim-event-name">${evt.label}</div>
                <div class="sim-event-urgency">Urgency: ${evt.urgency}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <input 
          type="text" 
          class="sim-custom-note" 
          id="sim-custom-input" 
          placeholder="Optional: custom context (e.g., 'Closed on $750k home with pool in Austin suburbs')" 
        />

        <div class="sim-actions-row">
          <button class="btn-secondary" id="btn-cancel-sim">Cancel</button>
          <button class="action-btn-primary" id="btn-run-simulation">
            <span>⚡</span> Trigger Event & Re-evaluate
          </button>
        </div>
      </div>
    </div>

    <!-- Notification Toast -->
    <div class="toast-notice" id="app-toast">
      <span>✅</span> <span id="toast-text">Offer dispatched successfully!</span>
    </div>
  `;

  attachEventListeners();
}

// Render Command Center (3-Column Layout with Simplified Highlighted Customer)
function renderCommandCenter(customer, evaluation, activeOfferProduct) {
  const filteredCustomers = state.customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(state.searchQuery.toLowerCase()) || 
                          c.location.toLowerCase().includes(state.searchQuery.toLowerCase());
    const matchesRisk = state.riskFilter === 'ALL' || c.churnRiskTier === state.riskFilter;
    return matchesSearch && matchesRisk;
  });

  const nba = evaluation.nextBestAction;
  const currentPolicies = evaluation.currentInsurances || customer.activePolicies || [];
  const eligibleInsurances = evaluation.eligibleInsurances || [];
  const offers = evaluation.omnichannelOffers;

  return `
    <div class="command-grid">
      <!-- Column 1: Customer Portfolio & Live Signals -->
      <section class="glass-panel" aria-label="Customer Portfolio">
        <div class="panel-header">
          <div class="panel-title-wrap">
            <div class="panel-icon-badge">👥</div>
            <h2 class="panel-title">Monitored Accounts</h2>
          </div>
          <span class="badge-counter">${filteredCustomers.length} active</span>
        </div>

        <div class="customer-search-box">
          <span class="search-icon-pos">🔍</span>
          <input 
            type="text" 
            class="customer-search-input" 
            id="cust-search" 
            placeholder="Search customer, location..." 
            value="${state.searchQuery}" 
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
                  <span>${c.detectedSignals[0] ? LIFE_EVENT_TYPES[c.detectedSignals[0].type]?.icon || '⚡' : '🛡️'}</span>
                  <span>${c.detectedSignals[0]?.title.slice(0, 24) || 'Stable Profile'}...</span>
                </div>
                <span>$${c.totalAnnualPremium.toLocaleString()}/yr</span>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Live Ingestion Stream -->
        <div class="signal-stream-section">
          <div class="stream-title-wrap">
            <span class="stream-title">📡 Live Signal Detection Feed</span>
            <span class="pulse-dot"></span>
          </div>
          <div class="live-feed-item">
            <div class="feed-header">
              <span class="feed-title">👶 Newborn Dependent Sync</span>
              <span class="feed-time">10m ago</span>
            </div>
            <span class="feed-source">Austin Vital Stats & Health Registry</span>
          </div>
          <div class="live-feed-item">
            <div class="feed-header">
              <span class="feed-title">🏡 Deed Recorded: $840k Dwelling</span>
              <span class="feed-time">42m ago</span>
            </div>
            <span class="feed-source">Denver County Clerk API</span>
          </div>
          <div class="live-feed-item">
            <div class="feed-header">
              <span class="feed-title">⚠️ Rate Jump + Competitor Search</span>
              <span class="feed-time">1h ago</span>
            </div>
            <span class="feed-source">Fintech Competitor Click Tracker</span>
          </div>
        </div>
      </section>

      <!-- Column 2: Highlighted Person (Simplified & Clear: Current Insurances vs. Eligible Insurances with Likelihood) -->
      <section class="glass-panel" aria-label="Customer Insurance Intelligence">
        <div class="panel-header">
          <div class="panel-title-wrap">
            <div class="panel-icon-badge">📋</div>
            <h2 class="panel-title">Customer Insurance Profile</h2>
          </div>
          <span class="badge-counter">${currentPolicies.length} Active • ${eligibleInsurances.length} Eligible</span>
        </div>

        <!-- Highlighted Person Summary Banner -->
        <div class="active-cust-banner">
          <div class="profile-main-wrap">
            <img src="${customer.avatar}" alt="${customer.name}" class="profile-main-avatar" />
            <div>
              <div class="profile-name">${customer.name}</div>
              <div class="profile-subinfo">${customer.household} • ${customer.location}</div>
            </div>
          </div>
          <div class="profile-metrics-group">
            <div class="profile-stat">
              <div class="stat-title">Client Tenure</div>
              <div class="stat-number">${customer.tenureYears} yrs</div>
            </div>
            <div class="profile-stat">
              <div class="stat-title">Total Premium</div>
              <div class="stat-number">$${customer.totalAnnualPremium.toLocaleString()}/yr</div>
            </div>
            <div class="profile-stat">
              <div class="stat-title">Estimated LTV</div>
              <div class="stat-number" style="color:var(--cyan-primary);">$${customer.estimatedLTV.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <!-- Section 1: What Insurances The Person Has -->
        <div class="current-insurances-section">
          <div class="section-subheading">
            <span>🛡️ Current Insurances (${currentPolicies.length} Active Policies)</span>
            <span style="font-weight:600; text-transform:none; font-family:var(--font-mono); color:var(--text-main);">
              Total: $${customer.totalAnnualPremium.toLocaleString()}/year
            </span>
          </div>

          <div class="current-policies-grid">
            ${currentPolicies.map(p => {
              const icon = p.type.toLowerCase().includes('auto') ? '🚗' : 
                           p.type.toLowerCase().includes('renter') || p.type.toLowerCase().includes('home') ? '🏡' : 
                           p.type.toLowerCase().includes('life') ? '👨‍👩‍👧' : '🛡️';
              return `
                <div class="current-policy-card">
                  <div class="current-policy-top">
                    <span class="current-policy-name">
                      <span>${icon}</span>
                      <span>${p.type}</span>
                    </span>
                    <span class="policy-status-pill">${p.status || 'Active'}</span>
                  </div>
                  <div class="current-policy-bottom">
                    <span>Policy: <strong style="font-family:var(--font-mono);">${p.id}</strong></span>
                    <span class="current-policy-premium">$${p.annualPremium.toLocaleString()}/yr</span>
                  </div>
                  <div style="font-size:0.7rem; color:var(--text-dim); display:flex; justify-content:space-between;">
                    <span>Renewal Date:</span>
                    <span style="font-family:var(--font-mono);">${p.renewalDate || '2027-01-15'}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Section 2: Which Insurances They're Eligible For & The Likelihood They Would Go For Them -->
        <div class="eligible-insurances-section">
          <div class="section-subheading">
            <span>⭐ Eligible Insurances & Adoption Likelihood</span>
            <span style="font-weight:600; text-transform:none; color:var(--cyan-primary);">
              Ranked by Propensity
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
                        <span>${item.icon}</span>
                        <span>${item.name}</span>
                        <span class="eligible-category-tag">${item.category}</span>
                        ${item.isTopRecommendation ? '<span class="policy-status-pill" style="background:#E0F2FE; color:#0369A1; border-color:#BAE6FD;">⭐ Top Recommendation</span>' : ''}
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

                  <!-- Why They're Eligible & Likelihood Driver -->
                  <div class="eligible-reason-box">
                    <strong>Why they would go for it:</strong> ${item.reason}
                  </div>

                  <!-- Price & Outreach Selection Action -->
                  <div class="eligible-card-footer">
                    <div class="eligible-price-info">
                      <span class="eligible-price-val">$${item.discountedPrice}/yr</span>
                      <span style="font-size:0.72rem; color:var(--text-muted); text-decoration:line-through;">$${item.basePrice}/yr</span>
                      <span class="eligible-savings-val">Save $${item.savings}/yr bundle discount</span>
                    </div>
                    <button class="btn-select-offer ${isSelected ? 'selected' : ''}" data-select-product="${item.id}">
                      ${isSelected ? '✓ Selected for Outreach' : 'Select for Outreach'}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </section>

      <!-- Column 3: Proactive Outreach (SMS Removed Per Request) -->
      <section class="glass-panel column-dispatch" aria-label="Omnichannel Dispatcher">
        <div class="panel-header">
          <div class="panel-title-wrap">
            <div class="panel-icon-badge">✉️</div>
            <h2 class="panel-title">Proactive Outreach</h2>
          </div>
          <span class="badge-counter">${activeOfferProduct ? activeOfferProduct.name : 'Personalized'}</span>
        </div>

        <!-- Channel Selector Tabs (SMS completely removed) -->
        <div class="omni-channel-tabs" role="tablist">
          <button class="channel-tab-btn ${state.activeChannelTab === 'email' ? 'active' : ''}" data-channel="email">
            <span>✉️</span> Email Campaign
          </button>
          <button class="channel-tab-btn ${state.activeChannelTab === 'advisor' ? 'active' : ''}" data-channel="advisor">
            <span>📞</span> Advisor Script
          </button>
          <button class="channel-tab-btn ${state.activeChannelTab === 'push' ? 'active' : ''}" data-channel="push">
            <span>📱</span> Mobile App
          </button>
        </div>

        <!-- Dynamic Outreach Preview -->
        <div class="channel-preview-card">
          ${renderChannelPreview(state.activeChannelTab, customer, offers, activeOfferProduct || nba.recommendedProduct, nba)}
        </div>

        <!-- Dispatch Call-to-Action -->
        <div class="dispatch-action-bar">
          <button class="dispatch-cta-btn" id="btn-dispatch-offer">
            <span>🚀</span> Dispatch ${activeOfferProduct ? activeOfferProduct.name : 'Offer'} (1-Click)
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

// Render dynamic preview for Email / Advisor / Push (SMS removed)
function renderChannelPreview(channel, customer, offers, product, nba) {
  const firstName = customer.name.split(' ')[0];
  const prodName = product.name;
  const savings = product.savings || nba.estimatedSavingsForCustomer;

  if (channel === 'email') {
    return `
      <div class="email-meta-header">
        <div class="email-meta-row">To: <span>${customer.name} &lt;${customer.name.toLowerCase().replace(/[^a-z]/g, '.')}@email.com&gt;</span></div>
        <div class="email-meta-row">From: <span>Magic Insurance Advisory &lt;advisor@magicinsurance.com&gt;</span></div>
        <div class="email-subject-line">Subject: Pre-Approved ${prodName} Bundle Savings for ${firstName}</div>
      </div>
      <div class="email-body-text">
Dear ${firstName},

We reviewed your current insurance portfolio to ensure your household coverage matches your recent life milestones.

Based on your current policies and verified eligibility, you have been pre-approved for our <strong>${prodName}</strong> with an active multi-policy bundle discount.

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
        📞 Magic Insurance Advisor Live Call & Consultation Script
      </div>
      <div class="advisor-script-list">
        <div class="advisor-point-card">
          <strong>Warm Introduction:</strong> "Hello ${firstName}, this is your personal Magic Insurance advisor calling to follow up on your account coverage."
        </div>
        <div class="advisor-point-card">
          <strong>Context & Eligibility:</strong> "I noticed your household is now eligible for <strong>${prodName}</strong>. Given your recent milestone, this fills an important safety net gap."
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
          <img src="/agent-logo.jpg" style="width:24px; height:24px; border-radius:4px;" />
          <span style="font-size:0.76rem; font-weight:700; color:var(--text-bright);">Magic Insurance Mobile Portal</span>
          <span style="font-size:0.68rem; color:var(--text-dim); margin-left:auto;">Now</span>
        </div>
        <div style="font-size:0.84rem; font-weight:700; color:var(--text-bright); margin-bottom:0.25rem;">
          ✨ New Eligible Coverage: ${prodName}
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

// Render Growth & Retention Analytics View
function renderAnalyticsView() {
  return `
    <div class="analytics-view-container">
      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-title">Proactive Churn Defended</div>
          <div class="kpi-value">89.4%</div>
          <div class="kpi-trend"><span>↑</span> +14.2% vs reactive retention desk</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Average Policy Cross-Sell ARR</div>
          <div class="kpi-value">+$1,420</div>
          <div class="kpi-trend"><span>↑</span> 3.8x baseline industry conversion</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Life Event Detection Lead Time</div>
          <div class="kpi-value">4.2 Days</div>
          <div class="kpi-trend"><span>⚡</span> 26 days ahead of policy renewal notice</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Customer Lifetime Value (LTV)</div>
          <div class="kpi-value">+31.5%</div>
          <div class="kpi-trend"><span>↑</span> Multi-policy stickiness boost</div>
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
                <span class="bar-label-name">🏡 Home Purchase (Homeowners + Umbrella)</span>
                <span class="bar-label-val">76.4%</span>
              </div>
              <div class="bar-track"><div class="bar-fill" style="width: 76.4%;"></div></div>
            </div>
            <div class="bar-item">
              <div class="bar-label-row">
                <span class="bar-label-name">👶 Welcomed Newborn (Term Life + Child Rider)</span>
                <span class="bar-label-val">68.2%</span>
              </div>
              <div class="bar-track"><div class="bar-fill" style="width: 68.2%;"></div></div>
            </div>
            <div class="bar-item">
              <div class="bar-label-row">
                <span class="bar-label-name">🚗 New Vehicle Delivery (Connected Auto)</span>
                <span class="bar-label-val">62.8%</span>
              </div>
              <div class="bar-track"><div class="bar-fill" style="width: 62.8%;"></div></div>
            </div>
            <div class="bar-item">
              <div class="bar-label-row">
                <span class="bar-label-name">⚠️ Rate Shock Defense (Loyalty Rate Shield)</span>
                <span class="bar-label-val">84.1%</span>
              </div>
              <div class="bar-track"><div class="bar-fill emerald" style="width: 84.1%;"></div></div>
            </div>
            <div class="bar-item">
              <div class="bar-label-row">
                <span class="bar-label-name">🎓 Teen Driver Milestones (Liability Shield)</span>
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
              <div style="font-weight:700; color:var(--rose-danger); margin-bottom:0.2rem;">❌ Legacy Reactive Insurer Model</div>
              <div style="color:var(--text-muted);">
                Waits for annual renewal notice or customer cancellation call. Churn rate averages 15-22% annually. Cross-selling relies on unsolicited blanket cold-calls with less than 3% conversion.
              </div>
            </div>
            <div style="padding:0.75rem; background:rgba(16,185,129,0.08); border-left:3px solid var(--emerald-success); border-radius:var(--radius-sm);">
              <div style="font-weight:700; color:var(--emerald-success); margin-bottom:0.2rem;">✅ Magic Insurance Proactive Model</div>
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

// Render Customer 360° Directory View
function renderDirectoryView() {
  return `
    <div class="glass-panel" style="padding:1.5rem;">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Customer 360° Directory & Policy Inventory</h2>
          <p style="font-size:0.76rem; color:var(--text-muted);">Comprehensive view of customer portfolios, churn propensity, and active life event signals</p>
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

// Event Listeners Wiring
function attachEventListeners() {
  // Navigation
  document.getElementById('nav-btn-command')?.addEventListener('click', () => {
    state.currentView = 'command';
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
      // Restore cursor position
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
        state.selectedProductId = null; // Reset offer product to top recommendation of new customer
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
        showToast(`Selected ${prodId} for proactive outreach campaign!`);
        renderApp();
      }
    });
  });

  // Channel Tabs (Email, Advisor, Mobile App Push - SMS removed)
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
      state.selectedProductId = null; // Re-evaluate top recommendation
      showToast(`Life event simulation triggered! Updated eligibility & adoption likelihood.`);
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

    // Reduce customer's churn risk and update retention
    currentCust.churnRiskScore = Math.max(12, Math.round(currentCust.churnRiskScore * 0.45));
    currentCust.churnRiskTier = currentCust.churnRiskScore > 70 ? 'CRITICAL' : currentCust.churnRiskScore > 40 ? 'MEDIUM' : 'LOW';

    showToast(`Dispatched ${product ? product.name : 'Offer'} via ${state.activeChannelTab.toUpperCase()}! Customer accepted proposal.`);
    renderApp();
  });
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
