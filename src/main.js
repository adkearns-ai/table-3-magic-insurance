import './style.css';
import { INITIAL_CUSTOMERS } from './data/customers.js';
import { LIFE_EVENT_TYPES, INSURANCE_PRODUCTS } from './data/insuranceCatalog.js';
import { RetailGrowthAgent } from './agent/growthEngine.js';

// Application State
const state = {
  customers: [...INITIAL_CUSTOMERS],
  selectedCustomerId: INITIAL_CUSTOMERS[0].id,
  currentView: 'command', // 'command' | 'analytics' | 'directory'
  activeChannelTab: 'email', // 'email' | 'sms' | 'advisor' | 'push'
  searchQuery: '',
  theme: localStorage.getItem('aegis-theme') || 'light',
  riskFilter: 'ALL',
  agent: new RetailGrowthAgent({ retentionBias: 0.70 }),
  isSimModalOpen: false,
  isSettingsModalOpen: false,
  selectedSimEventType: 'HOME_PURCHASE',
  dispatchLog: [
    {
      id: 'DISP-101',
      customerName: 'Marcus Vance',
      channel: 'Email & In-App',
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

  app.innerHTML = `
    <!-- Top Site Navigation & Telemetry -->
    <header class="site-header">
      <div class="header-inner">
        <div class="brand-section">
          <div class="brand-logo-container">
            <img src="/agent-logo.jpg" alt="AegisGrowth AI Shield" class="brand-logo-img" />
          </div>
          <div class="brand-title-wrap">
            <h1>AegisGrowth AI</h1>
            <div class="brand-subtitle">
              <span class="pulse-dot"></span>
              Autonomous Retail Insurer Growth & Retention Agent
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

        <!-- Live Telemetry Stats & Action -->
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
      ${state.currentView === 'command' ? renderCommandCenter(selectedCustomer, agentEval) : ''}
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
          Select or trigger a real-time life event signal for <strong>${selectedCustomer.name}</strong> to watch the agent re-evaluate coverage gaps, churn risk, and Next-Best-Action recommendations.
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
            <span>⚡</span> Trigger Event & Re-evaluate Agent
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

// Render Command Center (3-Column Layout)
function renderCommandCenter(customer, evaluation) {
  const filteredCustomers = state.customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(state.searchQuery.toLowerCase()) || 
                          c.location.toLowerCase().includes(state.searchQuery.toLowerCase());
    const matchesRisk = state.riskFilter === 'ALL' || c.churnRiskTier === state.riskFilter;
    return matchesSearch && matchesRisk;
  });

  const nba = evaluation.nextBestAction;
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
              <span class="feed-title">⚠️ Rate Jump + Aggregator Visit</span>
              <span class="feed-time">1h ago</span>
            </div>
            <span class="feed-source">Fintech Competitor Click Tracker</span>
          </div>
        </div>
      </section>

      <!-- Column 2: Agent Thought Process & Next-Best-Action -->
      <section class="glass-panel" aria-label="Agent Reasoning and Next-Best-Action">
        <div class="panel-header">
          <div class="panel-title-wrap">
            <div class="panel-icon-badge">🧠</div>
            <h2 class="panel-title">Agent Intelligence & Reasoning</h2>
          </div>
          <span class="model-tag">AegisGrowth Core v4.2</span>
        </div>

        <!-- Active Customer Profile Banner -->
        <div class="active-cust-banner">
          <div class="profile-main-wrap">
            <img src="${customer.avatar}" alt="${customer.name}" class="profile-main-avatar" />
            <div>
              <div class="profile-name">${customer.name}</div>
              <div class="profile-subinfo">${customer.occupation} • ${customer.location}</div>
            </div>
          </div>
          <div class="profile-metrics-group">
            <div class="profile-stat">
              <div class="stat-title">Client Tenure</div>
              <div class="stat-number">${customer.tenureYears} yrs</div>
            </div>
            <div class="profile-stat">
              <div class="stat-title">Current ARR</div>
              <div class="stat-number">$${customer.totalAnnualPremium.toLocaleString()}</div>
            </div>
            <div class="profile-stat">
              <div class="stat-title">Projected LTV</div>
              <div class="stat-number" style="color:var(--cyan-primary);">$${customer.estimatedLTV.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <!-- Active Policies Chips -->
        <div class="active-policies-strip">
          ${customer.activePolicies.map(p => `
            <div class="policy-chip">
              <span>🛡️</span>
              <span>${p.type}</span>
              <span class="policy-chip-premium">$${p.annualPremium}/yr</span>
            </div>
          `).join('')}
        </div>

        <!-- Agent Chain of Thought Pipeline -->
        <div class="agent-brain-container">
          <div class="agent-brain-header">
            <div class="brain-title">
              <span>⚡</span> Autonomous Chain-of-Thought
            </div>
            <span style="font-size:0.72rem; color:var(--text-dim); font-family:var(--font-mono);">
              Latency: 1.14s • Precision: 98.2%
            </span>
          </div>

          <div class="cot-steps-list">
            ${evaluation.agentRationale.map((step, idx) => `
              <div class="cot-step-item">
                <div class="cot-node">${idx + 1}</div>
                <div class="cot-content">
                  <div class="cot-step-title">
                    <span>${step.step}</span>
                    <span class="cot-step-badge ${step.badgeType}">${step.badge}</span>
                  </div>
                  <div class="cot-step-detail">${step.detail}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Next-Best-Action Hero Card -->
        <div class="nba-hero-card">
          <div class="nba-top-bar">
            <div class="nba-type-tag">
              <span>🎯</span> ${nba.type.replace('_', ' ')}
            </div>
            <div class="nba-confidence">Confidence: ${(nba.confidence * 100).toFixed(0)}%</div>
          </div>

          <h3 class="nba-title">${nba.title}</h3>
          <p class="nba-headline">${nba.headline}</p>

          <div class="nba-product-box">
            <div class="nba-product-header">
              <span class="nba-product-name">${nba.recommendedProduct.name}</span>
              <span class="nba-product-price">
                $${(nba.recommendedProduct.baseAnnualPremium * (1 - nba.bundleDiscountPercent/100)).toFixed(0)}/yr
                <span style="font-size:0.7rem; color:var(--text-muted); text-decoration:line-through;">
                  $${nba.recommendedProduct.baseAnnualPremium}/yr
                </span>
              </span>
            </div>
            <p class="nba-product-desc">${nba.recommendedProduct.description}</p>
          </div>

          <div class="nba-impact-metrics">
            <div class="impact-metric-box">
              <div class="impact-label">Customer Savings</div>
              <div class="impact-value">$${nba.estimatedSavingsForCustomer}/yr</div>
            </div>
            <div class="impact-metric-box">
              <div class="impact-label">Retention Impact</div>
              <div class="impact-value" style="color:var(--emerald-success);">${nba.projectedRetentionLift}</div>
            </div>
            <div class="impact-metric-box">
              <div class="impact-label">Insurer Revenue Lift</div>
              <div class="impact-value">${nba.projectedARRDelta}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Column 3: Omnichannel Proactive Engagement & Dispatcher -->
      <section class="glass-panel column-dispatch" aria-label="Omnichannel Dispatcher">
        <div class="panel-header">
          <div class="panel-title-wrap">
            <div class="panel-icon-badge">✉️</div>
            <h2 class="panel-title">Proactive Outreach</h2>
          </div>
          <span class="badge-counter">AI Personalized</span>
        </div>

        <!-- Channel Selector Tabs -->
        <div class="omni-channel-tabs" role="tablist">
          <button class="channel-tab-btn ${state.activeChannelTab === 'email' ? 'active' : ''}" data-channel="email">
            <span>✉️</span> Email
          </button>
          <button class="channel-tab-btn ${state.activeChannelTab === 'sms' ? 'active' : ''}" data-channel="sms">
            <span>💬</span> SMS
          </button>
          <button class="channel-tab-btn ${state.activeChannelTab === 'advisor' ? 'active' : ''}" data-channel="advisor">
            <span>📞</span> Advisor Script
          </button>
          <button class="channel-tab-btn ${state.activeChannelTab === 'push' ? 'active' : ''}" data-channel="push">
            <span>📱</span> Mobile App
          </button>
        </div>

        <!-- Channel Dynamic Preview -->
        <div class="channel-preview-card">
          ${renderChannelPreview(state.activeChannelTab, customer, offers, nba)}
        </div>

        <!-- Dispatch Call-to-Action -->
        <div class="dispatch-action-bar">
          <button class="dispatch-cta-btn" id="btn-dispatch-offer">
            <span>🚀</span> Dispatch Proactive Recommendation (1-Click)
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

// Render dynamic preview for Email / SMS / Advisor / Push
function renderChannelPreview(channel, customer, offers, nba) {
  if (channel === 'email') {
    return `
      <div class="email-meta-header">
        <div class="email-meta-row">To: <span>${customer.name} &lt;${customer.name.toLowerCase().replace(/[^a-z]/g, '.')}@email.com&gt;</span></div>
        <div class="email-meta-row">From: <span>Premier Client Advisory &lt;advisory@insure-growth.com&gt;</span></div>
        <div class="email-subject-line">Subject: ${offers.email.subject}</div>
      </div>
      <div class="email-body-text">${offers.email.body}</div>
      <div class="email-cta-box">
        <div class="email-cta-btn-preview">${offers.email.cta} (Locks in $${nba.estimatedSavingsForCustomer} Savings)</div>
      </div>
    `;
  }

  if (channel === 'sms') {
    return `
      <div class="sms-phone-frame">
        <div style="font-size:0.7rem; color:var(--text-dim); text-align:center; margin-bottom:0.75rem;">
          Today • Verified Insurer Shield
        </div>
        <div class="sms-bubble">
          ${offers.sms.message}
        </div>
        <div class="sms-char-counter">${offers.sms.characterCount} characters • High Urgency</div>
      </div>
    `;
  }

  if (channel === 'advisor') {
    return `
      <div style="font-size:0.78rem; font-weight:700; color:var(--cyan-primary); margin-bottom:0.6rem;">
        📞 Insurance Advisor Live Call & Meeting Script
      </div>
      <div class="advisor-script-list">
        ${offers.advisorScript.map(point => `
          <div class="advisor-point-card">${point}</div>
        `).join('')}
      </div>
    `;
  }

  if (channel === 'push') {
    return `
      <div style="background:#1E293B; border:1px solid var(--border-medium); border-radius:var(--radius-md); padding:1rem; margin-top:2rem;">
        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
          <img src="/agent-logo.jpg" style="width:24px; height:24px; border-radius:4px;" />
          <span style="font-size:0.76rem; font-weight:700; color:var(--text-bright);">AegisMobile Portal</span>
          <span style="font-size:0.68rem; color:var(--text-dim); margin-left:auto;">Now</span>
        </div>
        <div style="font-size:0.84rem; font-weight:700; color:var(--text-bright); margin-bottom:0.25rem;">
          ${offers.pushNotification.title}
        </div>
        <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.75rem;">
          ${offers.pushNotification.body}
        </div>
        <div style="background:var(--cyan-primary); color:#070A11; font-weight:700; font-size:0.76rem; text-align:center; padding:0.4rem; border-radius:var(--radius-sm);">
          ${offers.pushNotification.actionLabel}
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
                <span class="bar-label-name">🚗 New EV Vehicle Delivery (Connected Auto)</span>
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
            <p class="chart-subtitle">Business impact metrics comparing conventional insurer workflows to AegisGrowth AI</p>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.9rem; font-size:0.82rem; margin-top:0.5rem;">
            <div style="padding:0.75rem; background:rgba(244,63,94,0.08); border-left:3px solid var(--rose-danger); border-radius:var(--radius-sm);">
              <div style="font-weight:700; color:#FECDD3; margin-bottom:0.2rem;">❌ Legacy Reactive Insurer Model</div>
              <div style="color:var(--text-muted);">
                Waits for annual renewal notice or customer cancellation call. Churn rate averages 15-22% annually. Cross-selling relies on unsolicited blanket cold-calls with less than 3% conversion.
              </div>
            </div>
            <div style="padding:0.75rem; background:rgba(16,185,129,0.08); border-left:3px solid var(--emerald-success); border-radius:var(--radius-sm);">
              <div style="font-weight:700; color:#A7F3D0; margin-bottom:0.2rem;">✅ AegisGrowth AI Autonomous Model</div>
              <div style="color:var(--text-muted);">
                Continuously correlates real-time life telemetry (county records, telematics, health additions, rate adjustments). Identifies coverage gaps within hours of event occurrence and dispatches pre-approved bundled offers with 68%+ acceptance.
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
                    Launch Agent
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

  // Customer Selection in Command Center
  document.querySelectorAll('.customer-card').forEach(card => {
    card.addEventListener('click', () => {
      const custId = card.getAttribute('data-cust-id');
      if (custId) {
        state.selectedCustomerId = custId;
        renderApp();
      }
    });
  });

  // Customer Selection in Directory Table
  document.querySelectorAll('[data-select-cust]').forEach(btn => {
    btn.addEventListener('click', () => {
      const custId = btn.getAttribute('data-select-cust');
      if (custId) {
        state.selectedCustomerId = custId;
        state.currentView = 'command';
        renderApp();
      }
    });
  });

  // Customer Search
  const searchInput = document.getElementById('cust-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      // Re-render customers list without losing focus
      const listContainer = document.querySelector('.customers-list');
      if (listContainer) {
        const filtered = state.customers.filter(c => 
          c.name.toLowerCase().includes(state.searchQuery.toLowerCase()) || 
          c.location.toLowerCase().includes(state.searchQuery.toLowerCase())
        );
        listContainer.innerHTML = filtered.map(c => `
          <div class="customer-card ${c.id === state.selectedCustomerId ? 'active' : ''}" data-cust-id="${c.id}">
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
        `).join('');

        // Re-attach card clicks
        listContainer.querySelectorAll('.customer-card').forEach(card => {
          card.addEventListener('click', () => {
            state.selectedCustomerId = card.getAttribute('data-cust-id');
            renderApp();
          });
        });
      }
    });
  }

  // Channel Tabs
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
    localStorage.setItem('aegis-theme', state.theme);
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
      // Replace customer in state list
      const idx = state.customers.findIndex(c => c.id === currentCust.id);
      if (idx !== -1) {
        state.customers[idx] = simResult.updatedCustomer;
      }
      state.isSimModalOpen = false;
      showToast(`Life event simulation triggered! Agent generated updated Next-Best-Action.`);
      renderApp();
    }
  });

  // Dispatch Action
  document.getElementById('btn-dispatch-offer')?.addEventListener('click', () => {
    const currentCust = state.customers.find(c => c.id === state.selectedCustomerId);
    const evalData = state.agent.evaluateCustomer(currentCust);
    const nba = evalData.nextBestAction;

    const newLog = {
      id: `DISP-${Date.now().toString().slice(-4)}`,
      customerName: currentCust.name,
      channel: state.activeChannelTab.toUpperCase(),
      product: nba.recommendedProduct.name,
      time: 'Just now',
      result: 'Delivered (Simulated: Customer Accepted Offer)'
    };
    state.dispatchLog.unshift(newLog);

    // Reduce customer's churn risk and update retention
    currentCust.churnRiskScore = Math.max(12, Math.round(currentCust.churnRiskScore * 0.4));
    currentCust.churnRiskTier = currentCust.churnRiskScore > 70 ? 'CRITICAL' : currentCust.churnRiskScore > 40 ? 'MEDIUM' : 'LOW';

    showToast(`Dispatched ${nba.recommendedProduct.name} via ${state.activeChannelTab.toUpperCase()}! Customer accepted proposal.`);
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
