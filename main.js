// Make sure this is included in your HTML:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// Global variables
let currentTab = 'featured';
let currentBattles = [];
const timers = {};

// Set up the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Check if Supabase is available
  if (typeof supabase === 'undefined') {
    console.error('Supabase client not loaded. Include the script tag in your HTML.');
    return;
  }

  // Set up Supabase client
  const supabaseUrl = 'https://oleqibxqfwnvaorqgflp.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';
  window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

  // Debug log
  console.log('Supabase client initialized');

  // Set up tab navigation
  setupTabs();
  
  // Set up event handlers for buttons
  setupEventHandlers();

  // Load initial battles
  fetchAndRenderBattles();
});

// Set up tab navigation
function setupTabs() {
  // Add event listeners to tab buttons
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      // Update current tab and fetch battles
      currentTab = this.dataset.tab;
      fetchAndRenderBattles();
    });
  });
}

// Set up event handlers for buttons
function setupEventHandlers() {
  // Create battle button
  const createBattleBtn = document.getElementById('createBattleBtn');
  if (createBattleBtn) {
    createBattleBtn.addEventListener('click', function() {
      document.getElementById('createModal').classList.remove('hidden');
    });
  }
  
  // Create battle button (sidebar)
  const createBattleBtn2 = document.getElementById('createBattleBtn2');
  if (createBattleBtn2) {
    createBattleBtn2.addEventListener('click', function() {
      document.getElementById('createModal').classList.remove('hidden');
    });
  }
  
  // Create battle button (mobile)
  const navFab = document.getElementById('navFab');
  if (navFab) {
    navFab.addEventListener('click', function() {
      document.getElementById('createModal').classList.remove('hidden');
    });
  }
  
  // Cancel create battle button
  const cancelCreateBtn = document.getElementById('cancelCreateBtn');
  if (cancelCreateBtn) {
    cancelCreateBtn.addEventListener('click', function() {
      document.getElementById('createModal').classList.add('hidden');
    });
  }
  
  // Share close button
  const shareCloseBtn = document.getElementById('shareCloseBtn');
  if (shareCloseBtn) {
    shareCloseBtn.addEventListener('click', function() {
      document.getElementById('shareModal').classList.add('hidden');
    });
  }
  
  // Click outside share modal to close
  const shareModal = document.getElementById('shareModal');
  if (shareModal) {
    shareModal.addEventListener('click', function(e) {
      if (e.target.id === 'shareModal') {
        shareModal.classList.add('hidden');
      }
    });
  }
}

// Fetch and render battles
function fetchAndRenderBattles() {
  console.log('Fetching battles for tab:', currentTab);
  
  // Get the container element
  const battlesList = document.getElementById('battleList');
  if (!battlesList) {
    console.error('Battle list container not found');
    return;
  }
  
  // Show loading state
  battlesList.innerHTML = '<div class="p-4 text-center">Loading battles...</div>';
  
  // Build the query
  const now = new Date().toISOString();
  let query = window.supabaseClient.from('battles').select('*');
  
  if (currentTab === 'active') {
    // Active battles (not ended yet)
    query = query.gt('ends_at', now);
  } else if (currentTab === 'finished') {
    // Finished battles
    query = query.lte('ends_at', now);
  }
  
  // Sort by created date (newest first)
  query = query.order('created_at', { ascending: false });
  
  // Execute the query
  query.then(({ data, error }) => {
    if (error) {
      console.error('Error fetching battles:', error);
      battlesList.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
      return;
    }
    
    // Store battles globally
    currentBattles = data || [];
    console.log('Fetched battles:', currentBattles);
    
    // Clear existing timers
    Object.keys(timers).forEach(key => clearInterval(timers[key]));
    
    // Handle empty state
    if (currentBattles.length === 0) {
      battlesList.innerHTML = `
        <div class="p-4 text-center">
          <p>No battles found</p>
          <button class="bg-blue-600 text-white px-4 py-2 rounded mt-4" onclick="document.getElementById('createModal').classList.remove('hidden')">
            Create a battle
          </button>
        </div>
      `;
      return;
    }
    
    // Render battles
    battlesList.innerHTML = '';
    
    currentBattles.forEach(battle => {
      const isActive = new Date(battle.ends_at) > new Date();
      
      const battleBlock = document.createElement('div');
      battleBlock.className = 'bg-white py-8 px-2 md:px-6 flex flex-col gap-2 border-b border-gray-200 mb-2';
      
      battleBlock.innerHTML = `
        <a href="battle.html?id=${battle.id}" class="text-2xl font-semibold mb-2 hover:text-blue-600 transition underline-offset-2 hover:underline inline-block">${battle.title}</a>
        <div class="relative flex flex-row gap-2 justify-center items-center">
          <div class="flex flex-col items-center flex-1">
            <img src="${battle.image1||'https://via.placeholder.com/300'}" alt="${battle.option1}" class="object-cover rounded-lg w-[220px] h-[180px] md:w-[260px] md:h-[180px]" />
            <div class="option-title mt-2">${battle.option1}</div>
            <button class="bg-blue-600 text-white py-3 mt-3 rounded-lg font-bold w-full md:w-[90%] text-lg transition hover:bg-blue-700 vote-btn" data-battle="${battle.id}" data-opt="votes1">Vote</button>
          </div>
          <div class="absolute z-20 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <div class="vs-circle bg-white flex items-center justify-center text-lg font-bold w-14 h-14 border-2 border-white shadow-none">VS</div>
          </div>
          <div class="flex flex-col items-center flex-1">
            <img src="${battle.image2||'https://via.placeholder.com/300'}" alt="${battle.option2}" class="object-cover rounded-lg w-[220px] h-[180px] md:w-[260px] md:h-[180px]" />
            <div class="option-title mt-2">${battle.option2}</div>
            <button class="bg-green-600 text-white py-3 mt-3 rounded-lg font-bold w-full md:w-[90%] text-lg transition hover:bg-green-700 vote-btn" data-battle="${battle.id}" data-opt="votes2">Vote</button>
          </div>
        </div>
        <div id="progress-${battle.id}" class="flex w-full gap-0 mt-3">
          ${renderProgressBar(battle.votes1, battle.votes2)}
        </div>
        <div id="timer-${battle.id}" class="text-xs text-gray-500 pt-1">${isActive ? 'Time Left: ' + calculateTimeLeft(battle.ends_at) : 'Finished'}</div>
      `;
      
      battlesList.appendChild(battleBlock);
      
      // Set up timer for active battles
      if (isActive) {
        timers[battle.id] = setInterval(() => {
          const timerEl = document.getElementById(`timer-${battle.id}`);
          if (timerEl) {
            timerEl.textContent = 'Time Left: ' + calculateTimeLeft(battle.ends_at);
          } else {
            clearInterval(timers[battle.id]);
          }
        }, 1000);
      }
    });
    
    // Set up vote buttons
    setupVoteButtons();
    
  }).catch(err => {
    console.error('Error in fetch:', err);
    battlesList.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${err.message}</div>`;
  });
}

// Set up vote buttons
function setupVoteButtons() {
  document.querySelectorAll('.vote-btn').forEach(btn => {
    btn.onclick = function() {
      const battleId = this.dataset.battle;
      const option = this.dataset.opt;
      openShareModal(battleId, option);
    };
  });
}

// Open share modal
function openShareModal(battleId, option) {
  const modal = document.getElementById('shareModal');
  if (!modal) return;
  
  modal.classList.remove('hidden');
  
  const url = window.location.href;
  const title = 'FANSHARE: Vote in this battle!';
  
  document.getElementById('facebookShare').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`;
  document.getElementById('twitterShare').href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
  document.getElementById('redditShare').href = `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
  
  // Remove old event listeners
  document.querySelectorAll('#shareModal a').forEach(link => {
    const clone = link.cloneNode(true);
    link.parentNode.replaceChild(clone, link);
  });
  
  // Add new event listeners
  document.querySelectorAll('#shareModal a').forEach(link => {
    link.onclick = async function(event) {
      event.preventDefault();
      
      try {
        // Get battle details
        const col = option === 'votes1' ? 'votes1' : 'votes2';
        
        // Get current votes
        const { data: battle, error: fe } = await window.supabaseClient
          .from('battles')
          .select('*')
          .eq('id', battleId)
          .single();
          
        if (fe) throw fe;
        
        // Update votes
        const newVotes = (battle[col] || 0) + 1;
        const updateObj = {};
        updateObj[col] = newVotes;
        
        const { error: ue } = await window.supabaseClient
          .from('battles')
          .update(updateObj)
          .eq('id', battleId);
          
        if (ue) throw ue;
        
        // Update UI
        const votes1 = col === 'votes1' ? newVotes : battle.votes1;
        const votes2 = col === 'votes2' ? newVotes : battle.votes2;
        const progressBar = document.getElementById(`progress-${battleId}`);
        
        if (progressBar) {
          progressBar.innerHTML = renderProgressBar(votes1, votes2);
        }
        
        // Open share window
        window.open(link.href, '_blank');
        
        // Close modal
        modal.classList.add('hidden');
      } catch (err) {
        console.error('Error voting:', err);
        alert('Could not register vote: ' + err.message);
      }
    };
  });
}

// Render progress bar
function renderProgressBar(votes1, votes2) {
  const total = votes1 + votes2;
  let p1 = 50, p2 = 50;
  
  if (total > 0) {
    p1 = Math.round((votes1 / total) * 100);
    p2 = 100 - p1;
  }
  
  return `
    <div class="flex-1 rounded-l-full bg-blue-600 h-10 flex items-center px-3 text-white text-lg font-semibold ${p1===100?'rounded-r-full':''}" style="width:${p1}%;">
      ${votes1} (${p1}%)
    </div>
    <div class="flex-1 rounded-r-full bg-green-600 h-10 flex items-center justify-end px-3 text-white text-lg font-semibold ${p2===100?'rounded-l-full':''}" style="width:${p2}%;">
      ${votes2} (${p2}%)
    </div>
  `;
}

// Calculate time left
function calculateTimeLeft(endTime) {
  let diff = new Date(endTime) - new Date();
  if (diff <= 0) return '';
  
  const days = Math.floor(diff / 86400000);
  diff %= 86400000;
  const hours = Math.floor(diff / 3600000);
  diff %= 3600000;
  const minutes = Math.floor(diff / 60000);
  diff %= 60000;
  const seconds = Math.floor(diff / 1000);
  
  const parts = [];
  if (days) parts.push(`${days} day${days>1?'s':''}`);
  if (hours) parts.push(`${hours} hour${hours>1?'s':''}`);
  if (minutes) parts.push(`${minutes} min${minutes>1?'s':''}`);
  if (seconds) parts.push(`${seconds} sec${seconds>1?'s':''}`);
  
  return parts.join(' ');
}
