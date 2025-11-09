let currentUser = null;
let currentTab = 'home';

const API_BASE = 'https://cryptoladder-production.up.railway.app';

// Get Telegram user ID from WebApp
function getTelegramUserId() {
  // Try to get from Telegram WebApp
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
    const user = window.Telegram.WebApp.initDataUnsafe.user;
    if (user && user.id) {
      return user.id;
    }
  }

  // Try alternative: check WebApp.initData string
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
    const id = extractTelegramId(window.Telegram.WebApp.initData);
    if (id) return id;
  }

  // Fallback: parse from URL parameters
  const params = new URLSearchParams(window.location.search);
  const urlId = params.get('tgWebAppData') || params.get('userId') || params.get('user_id');
  if (urlId) return urlId;

  // Last resort: use localStorage or default
  return localStorage.getItem('telegramId') || '1234567890';
}

// Parse Telegram user ID from initData string
function extractTelegramId(initData) {
  if (!initData) return null;

  try {
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');

    if (userStr) {
      const userData = JSON.parse(decodeURIComponent(userStr));
      return userData.id;
    }
  } catch (e) {
    console.log('Error parsing user from initData:', e.message);
  }

  return null;
}

// Initialize app
async function init() {
  const telegramId = getTelegramUserId();

  console.log('Telegram ID:', telegramId);
  localStorage.setItem('telegramId', telegramId);

  // Show initial loading state
  document.getElementById('content').innerHTML = '<div class="loading">Loading...</div>';

  // Load user data
  await loadUser(telegramId);

  // If user doesn't exist on server, create them
  if (!currentUser || !currentUser.user) {
    console.log('Creating new user with ID:', telegramId);
    currentUser = {
      user: {
        id: null,
        telegram_id: telegramId,
        stars: 100,
        has_bought_place: false,
        first_name: 'User'
      },
      stats: { referralCount: 0, activeReferrals: 0 },
      activation: { isActive: false }
    };
  }

  switchTab('home');
}

// Load user data
async function loadUser(telegramId) {
  try {
    const response = await axios.get(`${API_BASE}/api/user/${telegramId}`);
    if (response.data) {
      currentUser = response.data;
      console.log('User loaded:', currentUser);
    }
  } catch (err) {
    console.error('Failed to load user:', err.message);
    // Create a new user object that will allow basic interaction
    currentUser = {
      user: {
        id: null,
        telegram_id: telegramId,
        stars: 0,
        has_bought_place: false,
        first_name: 'Guest',
        created_at: new Date().toISOString()
      },
      stats: { referralCount: 0, activeReferrals: 0 },
      activation: { isActive: false }
    };
  }
}

// Switch tabs
function switchTab(tab) {
  currentTab = tab;
  
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.closest('.tab-btn').classList.add('active');

  // Render content
  renderContent();
}

// Render content based on current tab
function renderContent() {
  const content = document.getElementById('content');
  
  switch (currentTab) {
    case 'home':
      renderHome(content);
      break;
    case 'partners':
      renderPartners(content);
      break;
    case 'income':
      renderIncome(content);
      break;
    case 'profile':
      renderProfile(content);
      break;
  }
}

// Home tab
function renderHome(container) {
  const { user, stats, activation } = currentUser;
  
  let html = `
    <div class="card">
      <div class="card-title">Balance</div>
      <div class="card-value"><span class="star">⭐️</span> ${user.stars.toFixed(2)}</div>
    </div>
  `;

  if (activation.isActive) {
    const expiresAt = new Date(activation.expiresAt);
    const now = new Date();
    const hoursLeft = Math.floor((expiresAt - now) / (1000 * 60 * 60));
    
    html += `
      <div class="card">
        <div class="card-title">Status</div>
        <span class="status-badge">✓ Active</span>
        <div class="card-subtext">Expires in ${hoursLeft} hours</div>
      </div>
    `;
  } else {
    html += `
      <div class="card">
        <div class="card-title">Status</div>
        <span class="status-badge inactive">✗ Inactive</span>
      </div>
    `;
  }

  if (!user.has_bought_place) {
    html += `
      <div class="card">
        <div class="card-title">Get Started</div>
        <p style="font-size: 13px; margin-bottom: 12px;">Buy a place in the pyramid for <span class="star">⭐️</span> 3</p>
        <button class="btn" onclick="buyPlace()">🚀 Buy Place</button>
      </div>
    `;
  } else {
    html += `
      <div class="card">
        <div class="card-title">Position</div>
        <p style="font-size: 13px;">You have a place in the pyramid!</p>
      </div>
    `;

    if (!activation.isActive) {
      html += `
        <div class="card">
          <div class="card-title">Daily Activation</div>
          <p style="font-size: 13px; margin-bottom: 12px;">Activate to earn stars from your referrals (costs <span class="star">⭐️</span> 10)</p>
          <button class="btn ${user.stars >= 10 ? '' : 'btn-disabled'}" onclick="activate()">⚡ Activate Now</button>
        </div>
      `;
    } else {
      html += `
        <div class="card">
          <div class="card-title">Next Activation Available</div>
          <p style="font-size: 13px; margin-bottom: 12px;">Come back after your activation expires</p>
          <button class="btn btn-disabled">⚡ Activate</button>
        </div>
      `;
    }
  }

  html += `
    <div class="card">
      <div class="card-title">Quick Stats</div>
      <div class="stat-row">
        <span class="stat-label">Referrals</span>
        <span class="stat-value">${stats.referralCount}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Active Referrals</span>
        <span class="stat-value">${stats.activeReferrals}</span>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

// Partners tab
async function renderPartners(container) {
  const { user } = currentUser;
  const telegramId = localStorage.getItem('telegramId');

  let html = `
    <div class="card">
      <div class="card-title">Your Referral Link</div>
      <div class="referral-link">
        <span>https://t.me/cryptoladderbot/miniapp?startapp=ref_${user.telegram_id}</span>
        <button class="copy-btn" onclick="copyReferralLink('${user.telegram_id}')">Copy</button>
      </div>
    </div>
  `;

  const referralCount = currentUser.stats.referralCount;
  let maxDepth = 2;
  if (referralCount >= 15) maxDepth = 3;
  if (referralCount >= 35) maxDepth = 4;
  if (referralCount >= 70) maxDepth = 5;

  html += `
    <div class="depth-info">
      📊 Your earning depth: <strong>${maxDepth} levels</strong><br>
      Next tier at ${referralCount < 15 ? 15 : referralCount < 35 ? 35 : referralCount < 70 ? 70 : '∞'} referrals
    </div>
  `;

  try {
    const response = await axios.get(`${API_BASE}/api/user/${telegramId}/referrals`);
    const referrals = response.data.referrals;

    if (referrals.length === 0) {
      html += `<div class="card"><p style="text-align: center; opacity: 0.7;">No referrals yet. Share your link to get started!</p></div>`;
    } else {
      html += '<div class="card"><div class="card-title">Your Referrals</div>';
      referrals.forEach(ref => {
        html += `
          <div class="list-item">
            <div class="list-item-name">${ref.first_name || 'User'}</div>
            <div class="list-item-value"><span class="star">⭐️</span> ${ref.stars.toFixed(2)}</div>
          </div>
        `;
      });
      html += '</div>';
    }
  } catch (err) {
    console.error('Failed to load referrals:', err);
  }

  container.innerHTML = html;
}

// Income tab
async function renderIncome(container) {
  const telegramId = localStorage.getItem('telegramId');

  let html = `
    <div class="card">
      <div class="card-title">Your Earnings</div>
      <div class="card-value"><span class="star">⭐️</span> ${currentUser.user.stars.toFixed(2)}</div>
    </div>
  `;

  html += `
    <div class="card">
      <div class="card-title">Distribution on Activation</div>
      <p style="font-size: 12px; margin-bottom: 12px;">When you activate (10 stars):</p>
      <div class="stat-row">
        <span class="stat-label">Level 1</span>
        <span class="stat-value">35% (3.5 ⭐️)</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Level 2</span>
        <span class="stat-value">21% (2.1 ⭐️)</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Level 3</span>
        <span class="stat-value">14% (1.4 ⭐️)</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Level 4</span>
        <span class="stat-value">8% (0.8 ⭐️)</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Level 5</span>
        <span class="stat-value">4% (0.4 ⭐️)</span>
      </div>
    </div>
  `;

  html += `
    <div class="card">
      <div class="card-title">Referral Bonus</div>
      <p style="font-size: 12px;">Get 0.5 ⭐️ when your referral activates for the first time (and each subsequent activation)</p>
    </div>
  `;

  try {
    const response = await axios.get(`${API_BASE}/api/user/${telegramId}/transactions?limit=20`);
    const transactions = response.data.transactions;

    if (transactions.length > 0) {
      html += '<div class="card"><div class="card-title">Recent Transactions</div>';
      transactions.forEach(tx => {
        const date = new Date(tx.created_at);
        const typeLabel = tx.type === 'activation_income' ? '📊 Activation' : tx.type === 'referral_bonus' ? '👥 Referral' : '💰 Other';
        html += `
          <div class="list-item">
            <div>
              <div class="list-item-name">${typeLabel}</div>
              <div style="font-size: 11px; opacity: 0.6;">${date.toLocaleDateString()}</div>
            </div>
            <div class="list-item-value">+${tx.amount.toFixed(2)} ⭐️</div>
          </div>
        `;
      });
      html += '</div>';
    }
  } catch (err) {
    console.error('Failed to load transactions:', err);
  }

  container.innerHTML = html;
}

// Profile tab
async function renderProfile(container) {
  const { user } = currentUser;

  let html = `
    <div class="card">
      <div class="card-title">Profile Information</div>
      <div class="stat-row">
        <span class="stat-label">Name</span>
        <span class="stat-value">${user.first_name} ${user.last_name || ''}</span>
      </div>
      ${user.username ? `
        <div class="stat-row">
          <span class="stat-label">Telegram</span>
          <span class="stat-value">@${user.username}</span>
        </div>
      ` : ''}
      <div class="stat-row">
        <span class="stat-label">ID</span>
        <span class="stat-value">${user.telegram_id}</span>
      </div>
    </div>
  `;

  html += `
    <div class="card">
      <div class="card-title">Account Status</div>
      <div class="stat-row">
        <span class="stat-label">Place Purchased</span>
        <span class="stat-value">${user.has_bought_place ? '✓ Yes' : '✗ No'}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Member Since</span>
        <span class="stat-value">${new Date(user.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  `;

  html += `
    <div class="card">
      <div class="card-title">How It Works</div>
      <p style="font-size: 13px; line-height: 1.5;">
        🪜 <strong>Buy a place</strong> (3 ⭐️) to join the pyramid<br><br>
        ⚡ <strong>Activate daily</strong> (10 ⭐️) to earn from your referrals<br><br>
        👥 <strong>Invite friends</strong> with your referral link<br><br>
        💰 <strong>Earn passively</strong> from your network
      </p>
    </div>
  `;

  html += `
    <div class="card">
      <div class="card-title">Support</div>
      <p style="font-size: 13px; margin-bottom: 12px;">Need help? Contact us on Telegram</p>
      <button class="btn btn-secondary" onclick="openTelegram()">📱 Contact Support</button>
    </div>
  `;

  container.innerHTML = html;
}

// Action functions
async function buyPlace() {
  if (currentUser.user.stars < 3) {
    alert('Insufficient stars');
    return;
  }

  try {
    const telegramId = localStorage.getItem('telegramId');
    await axios.post(`${API_BASE}/api/user/buy-place`, {
      telegramId,
      parentId: null
    });
    
    alert('✓ Place purchased! Now activate to start earning.');
    await loadUser(telegramId);
    renderContent();
  } catch (err) {
    alert('✗ Error: ' + (err.response?.data?.error || err.message));
  }
}

async function activate() {
  if (currentUser.user.stars < 10) {
    alert('Insufficient stars');
    return;
  }

  try {
    const telegramId = localStorage.getItem('telegramId');
    await axios.post(`${API_BASE}/api/user/activate`, {
      telegramId
    });
    
    alert('✓ Activated! You will receive stars from your referrals.');
    await loadUser(telegramId);
    renderContent();
  } catch (err) {
    alert('✗ Error: ' + (err.response?.data?.error || err.message));
  }
}

function copyReferralLink(telegramId) {
  const link = `https://t.me/cryptoladderbot/miniapp?startapp=ref_${telegramId}`;
  navigator.clipboard.writeText(link).then(() => {
    alert('✓ Link copied!');
  });
}

function openTelegram() {
  window.open('https://t.me/cryptoladderbot', '_blank');
}

// Initialize on load
init();
