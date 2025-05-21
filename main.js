// Set up the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes progress-pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.01); }
      100% { opacity: 1; transform: scale(1); }
    }
    
    .progress-updated {
      animation: progress-pulse 0.8s ease-in-out;
    }
    
    .progress-container {
      overflow: hidden;
      border-radius: 9999px;
    }
    
    /* Fix for mobile view */
    @media (max-width: 640px) {
      .vs-circle {
        width: 40px !important;
        height: 40px !important;
        font-size: 14px !important;
      }
      
      .search-filter-container {
        padding: 0.75rem 0.5rem;
      }
    }
    
    /* Category tags */
    .category-tag {
      display: inline-block;
      white-space: nowrap;
      font-weight: 600;
    }
    
    /* Trending button highlight */
    .trending-active {
      background: linear-gradient(135deg, #9f7aea, #4c1d95);
    }
  `;
  document.head.appendChild(style);
  
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

  // Add search and filter UI
  addSearchAndFilterUI();
  
  // Setup category field in the create battle form
  setupCategoryField();

  // Set up tab navigation
  setupTabs();
  
  // Set up event handlers for buttons
  setupEventHandlers();

  // Load initial battles
  fetchAndRenderBattles();
});// Setup category field in Create Battle form
function setupCategoryField() {
  const createModal = document.getElementById('createModal');
  if (!createModal) return;
  
  // Find where to insert the category field (after title)
  const titleField = createModal.querySelector('#title');
  if (!titleField) return;
  
  // Create category dropdown field
  const categoryField = document.createElement('div');
  categoryField.className = 'mb-4';
  categoryField.innerHTML = `
    <label class="block text-gray-700 font-medium mb-2">Category</label>
    <select id="battleCategory" class="w-full p-2 border rounded">
      <option value="General">General</option>
      <option value="Music">Music</option>
      <option value="Sports">Sports</option>
      <option value="Food">Food</option>
      <option value="Movies">Movies</option>
      <option value="Technology">Technology</option>
      <option value="Fashion">Fashion</option>
      <option value="Politics">Politics</option>
    </select>
  `;
  
  // Insert after title field
  titleField.parentNode.insertBefore(categoryField, titleField.nextSibling);
  
  // Update the submit handler to include category
  const submitBattleBtn = document.getElementById('submitBattleBtn');
  if (submitBattleBtn) {
    // We'll update the handleBattleSubmit function to include category
  }
}// Add search and filter UI to the page
function addSearchAndFilterUI() {
  // Find the container to add the search bar to
  const container = document.querySelector('.boxed') || document.body;
  const battlesList = document.getElementById('battleList');
  
  if (!container || !battlesList) {
    console.error('Container or battlesList not found');
    return;
  }
  
  // Create search and filter bar
  const searchFilter = document.createElement('div');
  searchFilter.className = 'search-filter-container bg-white p-4 sticky top-[64px] z-20 border-b border-gray-200 shadow-sm';
  
  searchFilter.innerHTML = `
    <div class="flex flex-col md:flex-row gap-3 items-center">
      <!-- Search input -->
      <div class="relative flex-grow w-full md:w-auto">
        <input type="text" id="searchInput" placeholder="Search battles..." class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      
      <!-- Category filter -->
      <div class="w-full md:w-auto">
        <select id="categoryFilter" class="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Categories</option>
          <option value="Music">Music</option>
          <option value="Sports">Sports</option>
          <option value="Food">Food</option>
          <option value="Movies">Movies</option>
          <option value="Technology">Technology</option>
          <option value="Fashion">Fashion</option>
          <option value="Politics">Politics</option>
        </select>
      </div>
      
      <!-- Trending tab button -->
      <button id="trendingTabBtn" class="px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg hover:from-purple-700 hover:to-blue-600 transition flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        Trending
      </button>
    </div>
  `;
  
  // Insert search bar before the battlesList
  battlesList.parentNode.insertBefore(searchFilter, battlesList);
  
  // Add event listeners for search and filter
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const trendingTabBtn = document.getElementById('trendingTabBtn');
  
  // Initialize filter values
  window.searchFilter = '';
  window.categoryFilter = 'all';
  
  // Search input handler with debounce
  let searchTimeout;
  searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      window.searchFilter = this.value;
      fetchAndRenderBattles();
    }, 400); // Debounce for 400ms
  });
  
  // Category filter handler
  categoryFilter.addEventListener('change', function() {
    window.categoryFilter = this.value;
    fetchAndRenderBattles();
  });
  
  // Trending tab handler
  trendingTabBtn.addEventListener('click', function() {
    // Update tab UI
    document.querySelectorAll('.tab-btn').forEach(tab => tab.classList.remove('active'));
    
    // Set current tab
    currentTab = 'trending';
    
    // Highlight trending button
    this.classList.add('active-trending');
    setTimeout(() => {
      this.classList.remove('active-trending');
    }, 300);
    
    // Fetch trending battles
    fetchAndRenderBattles();
  });
  
  // Add trending button styles
  const trendingStyles = document.createElement('style');
  trendingStyles.textContent = `
    .active-trending {
      transform: scale(1.05);
      box-shadow: 0 0 15px rgba(124, 58, 237, 0.5);
    }
  `;
  document.head.appendChild(trendingStyles);
}// Render a battle card with category tags
function renderBattleCard(battle) {
  const isActive = new Date(battle.ends_at) > new Date();
  const isMobile = window.innerWidth < 640;
  
  // Get category or use default
  const category = battle.category || 'General';
  // Map categories to colors
  const categoryColors = {
    'Music': 'bg-purple-100 text-purple-800',
    'Sports': 'bg-blue-100 text-blue-800',
    'Food': 'bg-yellow-100 text-yellow-800',
    'Movies': 'bg-red-100 text-red-800',
    'Technology': 'bg-green-100 text-green-800',
    'Fashion': 'bg-pink-100 text-pink-800',
    'Politics': 'bg-gray-100 text-gray-800',
    'General': 'bg-gray-100 text-gray-600'
  };
  
  const categoryClass = categoryColors[category] || categoryColors['General'];
  
  let battleHTML = `
    <div class="battle-item bg-white p-4 rounded-lg shadow-sm mb-4">
      <div class="flex justify-between items-start mb-3">
        <a href="battle.html?id=${battle.id}" class="text-xl font-semibold block mr-2">${battle.title}</a>
        <span class="category-tag ${categoryClass} text-xs px-2 py-1 rounded-full">${category}</span>
      </div>
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
  
  // Add battle metadata (votes, views, time)
  battleHTML += `
      <div class="mt-4">
        <div class="progress-container">
          <div id="progress-${battle.id}" class="flex w-full">
            ${renderProgressBar(battle.votes1, battle.votes2)}
          </div>
        </div>
      </div>
      <div class="flex justify-between items-center mt-2 text-xs text-gray-500">
        <div id="timer-${battle.id}">
          ${isActive ? `Time Left: ${calculateTimeLeft(battle.ends_at)}` : 'Finished'}
        </div>
        <div class="flex items-center">
          <span class="mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            ${battle.views || 0}
          </span>
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            ${battle.votes1 + battle.votes2 || 0}
          </span>
        </div>
      </div>
    </div>
  `;
  
  return battleHTML;
}// Make sure this is included in your HTML:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// Global variables
let currentTab = 'featured';
let currentBattles = [];
const timers = {};

// Set up the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes progress-pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.01); }
      100% { opacity: 1; transform: scale(1); }
    }
    
    .progress-updated {
      animation: progress-pulse 0.8s ease-in-out;
    }
    
    .progress-container {
      overflow: hidden;
      border-radius: 9999px;
    }
    
    /* Fix for mobile view */
    @media (max-width: 640px) {
      .vs-circle {
        width: 40px !important;
        height: 40px !important;
        font-size: 14px !important;
      }
    }
  `;
  document.head.appendChild(style);
  
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

// Update the fetchAndRenderBattles function to use our new renderBattleCard function
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
  
  // Apply filters
  if (window.searchFilter) {
    // Apply search filter if active
    console.log('Applying search filter:', window.searchFilter);
  }
  
  if (window.categoryFilter && window.categoryFilter !== 'all') {
    // Apply category filter if active and not "all"
    console.log('Applying category filter:', window.categoryFilter);
    query = query.eq('category', window.categoryFilter);
  }
  
  // Apply tab filter
  if (currentTab === 'active') {
    // Active battles (not ended yet)
    query = query.gt('ends_at', now);
  } else if (currentTab === 'finished') {
    // Finished battles
    query = query.lte('ends_at', now);
  } else if (currentTab === 'trending') {
    // Trending battles (most votes in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    query = query.gte('created_at', sevenDaysAgo.toISOString());
  }
  
  // Apply sort
  if (currentTab === 'trending') {
    // Sort trending by most votes
    query = query.order('votes1', { ascending: false }).order('votes2', { ascending: false });
  } else {
    // Default sort (newest first)
    query = query.order('created_at', { ascending: false });
  }
  
  // Execute the query
  query.then(({ data, error }) => {
    if (error) {
      console.error('Error fetching battles:', error);
      battlesList.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
      return;
    }
    
    // Store battles globally
    let battles = data || [];
    console.log('Fetched battles:', battles);
    
    // Apply search filter client-side if needed
    if (window.searchFilter && window.searchFilter.trim() !== '') {
      const searchTerm = window.searchFilter.toLowerCase();
      battles = battles.filter(battle => 
        battle.title.toLowerCase().includes(searchTerm) ||
        battle.option1.toLowerCase().includes(searchTerm) ||
        battle.option2.toLowerCase().includes(searchTerm) ||
        (battle.category && battle.category.toLowerCase().includes(searchTerm))
      );
      console.log('After search filter:', battles.length, 'battles');
    }
    
    currentBattles = battles;
    
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
      const battleBlock = document.createElement('div');
      battleBlock.innerHTML = renderBattleCard(battle);
      battlesList.appendChild(battleBlock.firstChild);
      
      // Set up timer for active battles
      if (new Date(battle.ends_at) > new Date()) {
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
        
        // Add animation effect to progress bar
        addProgressBarAnimation(progressBar);
        
      } catch (err) {
        console.error('Error voting:', err);
        alert('Could not register vote: ' + err.message);
      }
    };
  });
}

// Add animation effect to progress bar
function addProgressBarAnimation(element) {
  if (!element) return;
  
  // Add animation class
  element.classList.add('progress-updated');
  
  // Remove animation class after animation completes
  setTimeout(() => {
    element.classList.remove('progress-updated');
  }, 1000);
}

// Render progress bar
function renderProgressBar(votes1, votes2) {
  const total = votes1 + votes2;
  
  // Handle zero votes case properly
  if (total === 0) {
    return `
      <div class="flex-1 rounded-l-full bg-blue-600 h-10 flex items-center px-3 text-white text-lg font-semibold" style="width:50%;">
        0 (0%)
      </div>
      <div class="flex-1 rounded-r-full bg-green-600 h-10 flex items-center justify-end px-3 text-white text-lg font-semibold" style="width:50%;">
        0 (0%)
      </div>
    `;
  }
  
  // Calculate percentages
  const p1 = Math.round((votes1 / total) * 100);
  const p2 = 100 - p1;
  
  // Set minimum width to ensure visibility
  const minWidth = 10; // 10% minimum width to display text
  let w1 = `${p1}%`;
  let w2 = `${p2}%`;
  
  // Handle edge cases with small or zero percentages
  if (p1 === 0) {
    w1 = `${minWidth}%`;
    w2 = `${100 - minWidth}%`;
  } else if (p2 === 0) {
    w1 = `${100 - minWidth}%`;
    w2 = `${minWidth}%`;
  } else if (p1 < minWidth) {
    w1 = `${minWidth}%`;
    w2 = `${100 - minWidth}%`;
  } else if (p2 < minWidth) {
    w1 = `${100 - minWidth}%`;
    w2 = `${minWidth}%`;
  }
  
  // Special case when one side has 100%
  if (p1 === 100) {
    return `
      <div class="flex-1 rounded-full bg-blue-600 h-10 flex items-center px-3 text-white text-lg font-semibold" style="width:100%;">
        ${votes1} (100%)
      </div>
    `;
  } else if (p2 === 100) {
    return `
      <div class="flex-1 rounded-full bg-green-600 h-10 flex items-center justify-end px-3 text-white text-lg font-semibold" style="width:100%;">
        ${votes2} (100%)
      </div>
    `;
  }
  
  // Normal case with both sides having votes
  return `
    <div class="flex-1 rounded-l-full bg-blue-600 h-10 flex items-center px-3 text-white text-lg font-semibold" style="width:${w1};">
      ${votes1} (${p1}%)
    </div>
    <div class="flex-1 rounded-r-full bg-green-600 h-10 flex items-center justify-end px-3 text-white text-lg font-semibold" style="width:${w2};">
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
