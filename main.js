// Import Supabase client from CDN in HTML:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// Global variables
let currentTab = 'featured';
let currentBattles = [];
const timers = {};

// When DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
  try {
    console.log('Initializing app...');
    
    // Check if Supabase client is loaded
    if (typeof supabase === 'undefined') {
      console.error('Error: Supabase client is not loaded');
      document.getElementById('battlesList').innerHTML = `
        <div class="p-4 text-center text-red-500">
          Error: Supabase client is not loaded. Make sure you've included the Supabase script in your HTML.
        </div>
      `;
      return;
    }
    
    // Initialize Supabase client
    const supabaseUrl = 'https://oleqibxqfwnvaorqgflp.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';
    window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
    
    // Setup event listeners
    setupTabs();
    setupEventHandlers();
    
    // Load initial battles
    await fetchAndRenderBattles();
    
  } catch (err) {
    console.error('Initialization error:', err);
  }
});

// Set up tab navigation
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      // Update active tab style
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Update current tab and refresh
      currentTab = this.dataset.tab;
      fetchAndRenderBattles();
    });
  });
}

// Set up event handlers
function setupEventHandlers() {
  // Create battle modal handlers
  document.getElementById('createBattleBtn')?.addEventListener('click', () => {
    document.getElementById('createModal').classList.remove('hidden');
  });
  
  document.getElementById('createBattleBtn2')?.addEventListener('click', () => {
    document.getElementById('createModal').classList.remove('hidden');
  });
  
  document.getElementById('navFab')?.addEventListener('click', () => {
    document.getElementById('createModal').classList.remove('hidden');
  });
  
  document.getElementById('cancelCreateBtn')?.addEventListener('click', () => {
    document.getElementById('createModal').classList.add('hidden');
  });
  
  // Listen for vote button clicks
  document.addEventListener('click', function(e) {
    // Handle vote buttons
    if (e.target.closest('.vote-btn')) {
      const btn = e.target.closest('.vote-btn');
      const battleId = btn.dataset.battle;
      const option = btn.dataset.opt;
      
      openShareModal(battleId, option);
    }
  });
  
  // Setup share modal closing
  document.getElementById('shareCloseBtn')?.addEventListener('click', () => {
    document.getElementById('shareModal').classList.add('hidden');
  });
  
  document.getElementById('shareModal')?.addEventListener('click', e => {
    if (e.target.id === 'shareModal') {
      e.target.classList.add('hidden');
    }
  });
  
  // Handle submit battle form
  document.getElementById('submitBattleBtn')?.addEventListener('click', async function() {
    await handleBattleSubmit(this);
  });
}

// Handle battle form submission
async function handleBattleSubmit(button) {
  button.disabled = true;
  button.textContent = 'Creating...';
  
  try {
    const title = document.getElementById('title').value;
    const option1 = document.getElementById('option1').value;
    const option2 = document.getElementById('option2').value;
    
    // Basic validation
    if (!title || !option1 || !option2) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Calculate expiration time - default 24 hours
    const endsAt = new Date();
    endsAt.setHours(endsAt.getHours() + 24);
    
    // Create battle in Supabase
    const { data, error } = await window.supabaseClient.from('battles').insert([
      {
        title,
        option1,
        option2,
        image1: 'https://via.placeholder.com/300',
        image2: 'https://via.placeholder.com/300',
        votes1: 0,
        votes2: 0,
        ends_at: endsAt.toISOString(),
        created_at: new Date().toISOString()
      }
    ]);
    
    if (error) throw error;
    
    // Close modal and refresh
    document.getElementById('createModal').classList.add('hidden');
    document.getElementById('title').value = '';
    document.getElementById('option1').value = '';
    document.getElementById('option2').value = '';
    
    fetchAndRenderBattles();
    alert('Battle created successfully!');
    
  } catch (err) {
    console.error('Error creating battle:', err);
    alert('Could not create battle: ' + err.message);
  } finally {
    button.disabled = false;
    button.textContent = 'Submit';
  }
}

// Open share modal for voting
function openShareModal(battleId, option) {
  const modal = document.getElementById('shareModal');
  if (!modal) return;
  
  modal.classList.remove('hidden');
  
  const url = `${location.origin}${location.pathname}?battle=${battleId}`;
  const title = 'FANSHARE: Vote in this battle!';
  
  // Set share links
  document.getElementById('facebookShare').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`;
  document.getElementById('twitterShare').href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
  document.getElementById('redditShare').href = `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
  
  // Set up share handlers
  document.querySelectorAll('#shareModal a').forEach(link => {
    // Remove old handlers
    const clone = link.cloneNode(true);
    link.parentNode.replaceChild(clone, link);
    
    // Add new handler
    clone.addEventListener('click', async function(e) {
      e.preventDefault();
      
      try {
        // Which vote column to update
        const col = (option === 'votes1' ? 'votes1' : 'votes2');
        
        // Get current votes
        const { data, error } = await window.supabaseClient
          .from('battles')
          .select(col)
          .eq('id', battleId)
          .single();
          
        if (error) throw error;
        
        // Update votes
        const newVotes = (data[col] || 0) + 1;
        const { error: updateError } = await window.supabaseClient
          .from('battles')
          .update({ [col]: newVotes })
          .eq('id', battleId);
          
        if (updateError) throw updateError;
        
        // Open share window
        window.open(this.href, '_blank');
        
        // Close modal
        modal.classList.add('hidden');
        
        // Refresh battles
        fetchAndRenderBattles();
        
      } catch (err) {
        console.error('Error voting:', err);
        alert('Could not register vote. Please try again.');
      }
    });
  });
}

// Calculate time left for battle
function calculateTimeLeft(endTime) {
  const diff = new Date(endTime) - new Date();
  if (diff <= 0) return 'Finished';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  
  return parts.join(' ');
}

// Render progress bar for battle
function renderProgressBar(v1, v2) {
  const total = v1 + v2;
  
  // Handle zero votes
  if (total === 0) {
    return `
      <div class="flex w-full gap-0 mt-3">
        <div class="flex-1 rounded-l-full bg-blue-600 h-8 flex items-center px-3 text-white" style="width:50%;">
          0 (0%)
        </div>
        <div class="flex-1 rounded-r-full bg-green-600 h-8 flex items-center justify-end px-3 text-white" style="width:50%;">
          0 (0%)
        </div>
      </div>
    `;
  }
  
  // Calculate percentages
  const p1 = Math.round(v1/total*100);
  const p2 = 100 - p1;
  
  return `
    <div class="flex w-full gap-0 mt-3">
      <div class="flex-1 rounded-l-full bg-blue-600 h-8 flex items-center px-3 text-white" style="width:${p1}%;">
        ${v1} (${p1}%)
      </div>
      <div class="flex-1 rounded-r-full bg-green-600 h-8 flex items-center justify-end px-3 text-white" style="width:${p2}%;">
        ${v2} (${p2}%)
      </div>
    </div>
  `;
}

// Render a battle card
function renderBattleCard(battle) {
  const isActive = new Date(battle.ends_at) > new Date();
  const isMobile = window.innerWidth < 768;
  
  let battleHTML = `
    <div class="battle-item bg-white p-4 rounded-lg shadow-sm mb-4">
      <a href="battle.html?id=${battle.id}" class="text-xl font-semibold mb-3 block">${battle.title}</a>
  `;
  
  // Mobile layout
  if (isMobile) {
    battleHTML += `
      <div class="flex flex-col gap-4">
        <div class="w-full">
          <img src="${battle.image1}" alt="${battle.option1}" class="w-full rounded-lg object-cover h-40">
          <div class="mt-2 text-center">${battle.option1}</div>
          <button class="vote-btn bg-blue-600 text-white w-full py-2 rounded-lg mt-2" data-battle="${battle.id}" data-opt="votes1">Vote</button>
        </div>
        
        <div class="flex justify-center">
          <div class="vs-circle bg-white border-2 text-lg font-bold flex items-center justify-center w-10 h-10 rounded-full shadow-md">VS</div>
        </div>
        
        <div class="w-full">
          <img src="${battle.image2}" alt="${battle.option2}" class="w-full rounded-lg object-cover h-40">
          <div class="mt-2 text-center">${battle.option2}</div>
          <button class="vote-btn bg-green-600 text-white w-full py-2 rounded-lg mt-2" data-battle="${battle.id}" data-opt="votes2">Vote</button>
        </div>
      </div>
    `;
  } else {
    // Desktop layout
    battleHTML += `
      <div class="relative">
        <div class="flex justify-between items-start">
          <div class="w-[48%] text-center">
            <img src="${battle.image1}" alt="${battle.option1}" class="rounded-lg object-cover w-full h-48">
            <div class="mt-2">${battle.option1}</div>
            <button class="vote-btn bg-blue-600 text-white w-full py-2 rounded-lg mt-2" data-battle="${battle.id}" data-opt="votes1">Vote</button>
          </div>
          
          <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div class="vs-circle bg-white border-2 text-lg font-bold flex items-center justify-center w-12 h-12 rounded-full">VS</div>
          </div>
          
          <div class="w-[48%] text-center">
            <img src="${battle.image2}" alt="${battle.option2}" class="rounded-lg object-cover w-full h-48">
            <div class="mt-2">${battle.option2}</div>
            <button class="vote-btn bg-green-600 text-white w-full py-2 rounded-lg mt-2" data-battle="${battle.id}" data-opt="votes2">Vote</button>
          </div>
        </div>
      </div>
    `;
  }
  
  // Progress bar and timer
  battleHTML += `
      <div class="mt-4">
        ${renderProgressBar(battle.votes1, battle.votes2)}
      </div>
      <div class="text-xs text-gray-500 mt-2">
        ${isActive ? `Time Left: ${calculateTimeLeft(battle.ends_at)}` : 'Finished'}
      </div>
    </div>
  `;
  
  return battleHTML;
}

// Fetch and render battles
async function fetchAndRenderBattles() {
  const battlesList = document.getElementById('battlesList');
  if (!battlesList) return;
  
  battlesList.innerHTML = '<div class="p-4 text-center">Loading battles...</div>';
  
  try {
    // Build query based on current tab
    const now = new Date().toISOString();
    let query = window.supabaseClient.from('battles').select('*');
    
    if (currentTab === 'active') {
      query = query.gt('ends_at', now);
    } else if (currentTab === 'finished') {
      query = query.lte('ends_at', now);
    }
    
    query = query.order('created_at', { ascending: false });
    
    // Execute query
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Store battles globally
    currentBattles = data || [];
    
    // Clear timers
    Object.keys(timers).forEach(key => clearInterval(timers[key]));
    
    // Check if no battles
    if (currentBattles.length === 0) {
      battlesList.innerHTML = `
        <div class="p-4 text-center">
          <p>No battles found in this category.</p>
          <button class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg" id="createNewBattleBtn">
            Create Your First Battle
          </button>
        </div>
      `;
      
      document.getElementById('createNewBattleBtn')?.addEventListener('click', () => {
        document.getElementById('createModal').classList.remove('hidden');
      });
      
      return;
    }
    
    // Render all battles
    let battlesHTML = '';
    
    currentBattles.forEach(battle => {
      battlesHTML += renderBattleCard(battle);
      
      // Set up timer for active battles
      if (new Date(battle.ends_at) > new Date()) {
        timers[battle.id] = setInterval(() => {
          const timerEl = document.querySelector(`.battle-item:has([data-battle="${battle.id}"]) .text-gray-500`);
          if (timerEl) {
            timerEl.textContent = `Time Left: ${calculateTimeLeft(battle.ends_at)}`;
          } else {
            clearInterval(timers[battle.id]);
          }
        }, 1000);
      }
    });
    
    battlesList.innerHTML = battlesHTML;
    
  } catch (err) {
    console.error('Error fetching battles:', err);
    battlesList.innerHTML = `
      <div class="p-4 text-center text-red-500">
        Error loading battles: ${err.message}
        <button class="block mx-auto mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg" onclick="fetchAndRenderBattles()">
          Try Again
        </button>
      </div>
    `;
  }
}
