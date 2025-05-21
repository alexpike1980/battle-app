// Global variables
let currentTab = 'featured';
let currentBattles = [];
const timers = {};

// Global filters object
let currentFilters = {
  search: '',
  category: '',
  sort: 'newest',
  bookmarksOnly: false
};

// DOM ready function
document.addEventListener('DOMContentLoaded', async function() {
  // Track window size for responsive layouts
  window.isMobile = window.innerWidth < 768;
  
  // Update mobile status on resize
  window.addEventListener('resize', function() {
    const wasMobile = window.isMobile;
    window.isMobile = window.innerWidth < 768;
    
    // If mobile status changed, re-render battles
    if (wasMobile !== window.isMobile && currentBattles.length > 0) {
      const battlesList = document.getElementById('battlesList');
      if (battlesList) {
        renderBattles(currentBattles, battlesList);
      }
    }
  });
  
  try {
    console.log('Initializing app...');
    
    // Debug HTML structure
    console.log('== HTML Structure Debug ==');
    console.log('Document title:', document.title);
    
    // If battlesList doesn't exist, let's create it
    let battlesList = document.getElementById('battlesList');
    
    if (!battlesList) {
      console.log('Creating battlesList element');
      // Find the most likely container to append to
      const mainContent = document.querySelector('main') || 
                         document.querySelector('.content') || 
                         document.querySelector('.container') ||
                         document.body;
      
      battlesList = document.createElement('div');
      battlesList.id = 'battlesList';
      battlesList.className = 'battles-container mx-auto p-4';
      
      // Add it to the page
      mainContent.appendChild(battlesList);
      console.log('Added battlesList to:', mainContent.tagName, mainContent.className);
    }
    
    // Check if Supabase client is loaded
    if (typeof supabase === 'undefined') {
      console.error('Error: Supabase client is not loaded');
      battlesList.innerHTML = `
        <div class="p-4 text-center text-red-500">
          Error: Supabase client is not loaded. Make sure you've included the Supabase script in your HTML:
          <pre class="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto"><code>&lt;script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"&gt;&lt;/script&gt;</code></pre>
        </div>
      `;
      return;
    }
    
    // Initialize Supabase client
    console.log('Initializing Supabase client...');
    window.supabaseUrl = 'https://oleqibxqfwnvaorqgflp.supabase.co';
    window.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';
    window.supabaseClient = supabase.createClient(window.supabaseUrl, window.supabaseKey);
    
    // Set up app components
    setupTabs();
    setupCreateBattleForm();
    setupEventHandlers();
    
    // Fetch battles
    await fetchAndRenderBattles();
    
    // Set up timer to refresh battles periodically
    setInterval(fetchAndRenderBattles, 60000); // Every minute
  } catch (err) {
    console.error('Initialization error:', err);
    const battlesList = document.getElementById('battlesList');
    if (battlesList) {
      battlesList.innerHTML = `
        <div class="p-4 text-center text-red-500">
          Error initializing app: ${err.message}
        </div>
      `;
    }
  }
});

// Set up tab navigation
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', async function() {
      const tab = this.dataset.tab;
      
      // Update active state
      tabButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Update current tab and refresh
      currentTab = tab;
      await fetchAndRenderBattles();
    });
  });
}

// Handle image uploads to Supabase storage
async function uploadImage(file, path) {
  if (!file) return null;
  
  try {
    // Create a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;
    
    // Upload the file
    const { data, error } = await window.supabaseClient.storage
      .from('battle-images')
      .upload(filePath, file);
      
    if (error) throw error;
    
    // Get the public URL
    const { data: { publicUrl } } = window.supabaseClient.storage
      .from('battle-images')
      .getPublicUrl(filePath);
      
    return publicUrl;
  } catch (err) {
    console.error('Error uploading image:', err);
    return null;
  }
}

// Handle create battle form submission
function setupCreateBattleForm() {
  const submitBtn = document.getElementById('submitBattleBtn');
  const timeTabs = document.querySelectorAll('.time-tab');
  const durationInput = document.getElementById('duration');
  const datetimePicker = document.getElementById('datetimePicker');
  
  // Preview uploaded images
  const image1File = document.getElementById('image1File');
  const image2File = document.getElementById('image2File');
  let image1Preview, image2Preview;
  
  if (image1File && image2File) {
    image1Preview = document.createElement('div');
    image2Preview = document.createElement('div');
    
    // Add preview containers after file inputs
    image1File.parentNode.appendChild(image1Preview);
    image2File.parentNode.appendChild(image2Preview);
    
    // Show image previews
    image1File.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          image1Preview.innerHTML = `<img src="${e.target.result}" class="mt-2 rounded-lg w-32 h-32 object-cover">`;
        };
        reader.readAsDataURL(this.files[0]);
      }
    });
    
    image2File.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          image2Preview.innerHTML = `<img src="${e.target.result}" class="mt-2 rounded-lg w-32 h-32 object-cover">`;
        };
        reader.readAsDataURL(this.files[0]);
      }
    });
  }
  
  // Set up time unit tabs
  if (timeTabs && timeTabs.length > 0) {
    timeTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        timeTabs.forEach(t => {
          t.classList.remove('active');
        });
        this.classList.add('active');
        
        const unit = this.dataset.unit;
        if (unit === 'date') {
          durationInput.classList.add('hidden');
          datetimePicker.classList.remove('hidden');
          datetimePicker.value = new Date(Date.now() + 24*60*60*1000)
            .toISOString().slice(0, 16); // Tomorrow
        } else {
          durationInput.classList.remove('hidden');
          datetimePicker.classList.add('hidden');
          
          // Update placeholder based on selected time unit
          if (unit === 'minutes') {
            durationInput.placeholder = 'Enter minutes';
            durationInput.value = '60'; // Default 60 minutes
          } else if (unit === 'hours') {
            durationInput.placeholder = 'Enter hours';
            durationInput.value = '24'; // Default 24 hours
          } else if (unit === 'days') {
            durationInput.placeholder = 'Enter days';
            durationInput.value = '7'; // Default 7 days
          }
        }
      });
    });
  }

  // Handle form submission
  if (submitBtn) {
    submitBtn.addEventListener('click', async function() {
      // Show loading state
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating...';
      
      const title = document.getElementById('title').value;
      const option1 = document.getElementById('option1').value;
      const option2 = document.getElementById('option2').value;
      
      // Basic validation
      if (!title || !option1 || !option2) {
        alert('Please fill in all required fields');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
        return;
      }
      
      // Calculate end time
      let endsAt;
      const activeTab = document.querySelector('.time-tab.active');
      if (activeTab && activeTab.dataset.unit === 'date') {
        endsAt = new Date(datetimePicker.value);
      } else {
        const now = new Date();
        const duration = parseInt(durationInput.value) || 60;
        
        if (!activeTab || activeTab.dataset.unit === 'minutes') {
          endsAt = new Date(now.getTime() + duration * 60 * 1000);
        } else if (activeTab.dataset.unit === 'hours') {
          endsAt = new Date(now.getTime() + duration * 60 * 60 * 1000);
        } else if (activeTab.dataset.unit === 'days') {
          endsAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
        }
      }
      
      try {
        // Upload images first
        const image1 = image1File && image1File.files && image1File.files.length > 0 
          ? await uploadImage(image1File.files[0], 'battle-images') 
          : 'https://via.placeholder.com/300';
          
        const image2 = image2File && image2File.files && image2File.files.length > 0 
          ? await uploadImage(image2File.files[0], 'battle-images') 
          : 'https://via.placeholder.com/300';
        
        // Create the battle
        const { data, error } = await window.supabaseClient.from('battles').insert([
          {
            title,
            option1,
            option2,
            image1,
            image2,
            votes1: 0,
            votes2: 0,
            ends_at: endsAt.toISOString(),
            created_at: new Date().toISOString()
          }
        ]);
        
        if (error) throw error;
        
        // Close modal and refresh battles
        document.getElementById('createModal').classList.add('hidden');
        document.getElementById('title').value = '';
        document.getElementById('option1').value = '';
        document.getElementById('option2').value = '';
        
        // Clear image previews if they exist
        if (image1Preview) {
          image1Preview.innerHTML = '';
        }
        if (image2Preview) {
          image2Preview.innerHTML = '';
        }
        
        if (image1File) image1File.value = '';
        if (image2File) image2File.value = '';
        
        // Set current tab to featured and refresh
        currentTab = 'featured';
        document.querySelectorAll('.tab-btn').forEach(t => {
          t.classList.remove('active');
          if (t.dataset.tab === 'featured') {
            t.classList.add('active');
          }
        });
        
        await fetchAndRenderBattles();
        alert('Battle created successfully!');
        
      } catch (err) {
        console.error('Error creating battle:', err);
        alert('Could not create battle: ' + (err.message || 'Unknown error'));
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
      }
    });
  }
}

// Set up event handlers for share and vote
function setupEventHandlers() {
  // Open create modal
  const createBattleBtn = document.getElementById('createBattleBtn');
  const createBattleBtn2 = document.getElementById('createBattleBtn2');
  const navFab = document.getElementById('navFab');
  
  if (createBattleBtn) {
    createBattleBtn.addEventListener('click', function() {
      document.getElementById('createModal').classList.remove('hidden');
    });
  }
  
  if (createBattleBtn2) {
    createBattleBtn2.addEventListener('click', function() {
      document.getElementById('createModal').classList.remove('hidden');
    });
  }
  
  if (navFab) {
    navFab.addEventListener('click', function() {
      document.getElementById('createModal').classList.remove('hidden');
    });
  }
  
  // Close modals
  const cancelCreateBtn = document.getElementById('cancelCreateBtn');
  if (cancelCreateBtn) {
    cancelCreateBtn.addEventListener('click', function() {
      document.getElementById('createModal').classList.add('hidden');
    });
  }
  
  const shareCloseBtn = document.getElementById('shareCloseBtn');
  if (shareCloseBtn) {
    shareCloseBtn.addEventListener('click', function() {
      document.getElementById('shareModal').classList.add('hidden');
    });
  }
  
  // Share modal background click to close
  const shareModal = document.getElementById('shareModal');
  if (shareModal) {
    shareModal.addEventListener('click', function(e) {
      if (e.target.id === 'shareModal') {
        e.target.classList.add('hidden');
      }
    });
  }
  
  // Delegate click events from battlesList to vote buttons
  const battlesList = document.getElementById('battlesList');
  if (battlesList) {
    battlesList.addEventListener('click', function(e) {
      // Find closest vote button if clicked on or within a vote button
      const voteBtn = e.target.closest('.vote-btn');
      if (voteBtn) {
        const battleId = voteBtn.dataset.battle;
        const voteOpt = voteBtn.dataset.opt;
        
        // Call openShareModal with the battle ID and option
        if (typeof window.openShareModal === 'function') {
          window.openShareModal(battleId, voteOpt);
        }
      }
    });
  }
  
  // Setup openShareModal function
  window.openShareModal = function(battleId, option) {
    const modal = document.getElementById('shareModal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    
    const url = `${location.origin}${location.pathname}?battle=${battleId}`;
    const title = 'FANSHARE: Vote in this battle!';
    
    document.getElementById('facebookShare').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`;
    document.getElementById('twitterShare').href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    document.getElementById('redditShare').href = `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
    
    // Reset old handlers
    document.querySelectorAll('#shareModal a').forEach(link => {
      const clone = link.cloneNode(true);
      link.parentNode.replaceChild(clone, link);
    });
    
    // Add new handlers that count votes immediately (simpler UX for testing)
    document.querySelectorAll('#shareModal a').forEach(link => {
      link.onclick = async event => {
        event.preventDefault();
        
        // Which vote column to update
        const col = (option === 'votes1' ? 'votes1' : 'votes2');
        try {
          // First, get the current battle data
          const { data: battle, error: fe } = await window.supabaseClient
            .from('battles')
            .select('*')
            .eq('id', battleId)
            .single();
            
          if (fe) throw fe;
          
          // Calculate new vote counts
          const newVotes = (battle[col] || 0) + 1;
          const votes1 = col === 'votes1' ? newVotes : battle.votes1;
          const votes2 = col === 'votes2' ? newVotes : battle.votes2;
          
          // Open share window
          window.open(link.href, '_blank');
          
          // Update the database
          const { error: ue } = await window.supabaseClient
            .from('battles')
            .update({ [col]: newVotes })
            .eq('id', battleId);
            
          if (ue) throw ue;
          
          // Close the modal
          modal.classList.add('hidden');
          
          // Update the UI - find the progress bar and update it
          const progressBar = document.getElementById(`progress-${battleId}`);
          if (progressBar) {
            progressBar.innerHTML = renderProgressBar(votes1, votes2, battleId);
          }
          
        } catch (err) {
          console.error('Error adding vote:', err);
          alert('Could not add your vote. Please try again.');
        }
      };
    });
  };
}

// Calculate time left for a battle
function calculateTimeLeft(endTime) {
  let diff = new Date(endTime) - new Date();
  if (diff <= 0) return '';
  const days    = Math.floor(diff / 86400000); diff %= 86400000;
  const hours   = Math.floor(diff / 3600000);   diff %= 3600000;
  const minutes = Math.floor(diff / 60000);     diff %= 60000;
  const seconds = Math.floor(diff / 1000);
  const parts = [];
  if (days)    parts.push(`${days} day${days>1?'s':''}`);
  if (hours)   parts.push(`${hours} hour${hours>1?'s':''}`);
  if (minutes) parts.push(`${minutes} min${minutes>1?'s':''}`);
  if (seconds) parts.push(`${seconds} sec${seconds>1?'s':''}`);
  return parts.join(' ');
}

// Render progress bar for votes
function renderProgressBar(v1=0, v2=0, id) {
  const total = v1 + v2;
  
  // Handle zero votes case
  if (total === 0) {
    return `
      <div class="flex w-full gap-0 mt-3">
        <div class="flex-1 rounded-l-full bg-blue-600 h-10 flex items-center px-3 text-white text-lg font-semibold" style="width:50%;">
          0 (0%)
        </div>
        <div class="flex-1 rounded-r-full bg-green-600 h-10 flex items-center justify-end px-3 text-white text-lg font-semibold" style="width:50%;">
          0 (0%)
        </div>
      </div>
    `;
  }
  
  const p1 = Math.round(v1/total*100);
  const p2 = 100-p1;
  
  // Ensure both bars are visible when they have votes
  const minWidth = 60; // Minimum width in pixels to ensure visibility
  let w1 = p1 === 0 ? minWidth : `${p1}%`;
  let w2 = p2 === 0 ? minWidth : `${p2}%`;
  
  // If one percentage is very small, ensure it still shows up
  if (p1 < 10 && p1 > 0) w1 = '10%';
  if (p2 < 10 && p2 > 0) w2 = '10%';
  
  return `
    <div class="flex w-full gap-0 mt-3 transition-all duration-500">
      <div class="flex-1 rounded-l-full bg-blue-600 h-10 flex items-center px-3 text-white text-lg font-semibold ${p1===100?'rounded-r-full':''}" style="width:${w1};">
        ${v1} (${p1}%)
      </div>
      <div class="flex-1 rounded-r-full bg-green-600 h-10 flex items-center justify-end px-3 text-white text-lg font-semibold ${p2===100?'rounded-l-full':''}" style="width:${w2};">
        ${v2} (${p2}%)
      </div>
    </div>
  `;
}

// Render a single battle item
function renderBattleItem(b, active = true) {
  // Check if we're on mobile
  const isMobile = window.innerWidth < 768;
  
  return `
    <div class="battle-item border-b pb-6 hover:bg-gray-50 transition-colors duration-300 rounded-lg p-4">
      <a href="battle.html?id=${b.id}" class="text-2xl font-semibold mb-4 hover:text-blue-600 transition underline-offset-2 hover:underline inline-block">${b.title}</a>
      
      <!-- Mobile-optimized layout -->
      ${isMobile ? `
        <!-- Mobile layout with stacked images -->
        <div class="flex flex-col gap-4 relative">
          <div class="w-full">
            <img src="${b.image1||'https://via.placeholder.com/300'}" alt="${b.option1}" class="object-cover rounded-lg w-full h-48 hover:shadow-lg transition-shadow duration-300" />
            <div class="option-title mt-2 text-center font-semibold">${b.option1}</div>
            <button class="bg-blue-600 text-white py-3 mt-2 rounded-lg font-bold w-full text-lg transition-all duration-300 hover:bg-blue-700 hover:shadow-md vote-btn" data-battle="${b.id}" data-opt="votes1">Vote</button>
          </div>
          
          <!-- VS circle between images -->
          <div class="flex justify-center relative my-2">
            <div class="vs-circle bg-white flex items-center justify-center text-lg font-bold w-14 h-14 border-2 border-white shadow-md">VS</div>
          </div>
          
          <div class="w-full">
            <img src="${b.image2||'https://via.placeholder.com/300'}" alt="${b.option2}" class="object-cover rounded-lg w-full h-48 hover:shadow-lg transition-shadow duration-300" />
            <div class="option-title mt-2 text-center font-semibold">${b.option2}</div>
            <button class="bg-green-600 text-white py-3 mt-2 rounded-lg font-bold w-full text-lg transition-all duration-300 hover:bg-green-700 hover:shadow-md vote-btn" data-battle="${b.id}" data-opt="votes2">Vote</button>
          </div>
        </div>
      ` : `
        <!-- Desktop layout with side-by-side images -->
        <div class="relative flex items-center justify-center mt-4">
          <table class="vs-battle-table w-full">
            <tr>
              <td class="w-1/2 pr-4 text-center align-middle">
                <img src="${b.image1||'https://via.placeholder.com/300'}" alt="${b.option1}" class="object-cover rounded-lg w-[220px] h-[180px] md:w-[260px] md:h-[180px] inline-block hover:shadow-lg transition-shadow duration-300" />
              </td>
              <td class="w-1/2 pl-4 text-center align-middle">
                <img src="${b.image2||'https://via.placeholder.com/300'}" alt="${b.option2}" class="object-cover rounded-lg w-[220px] h-[180px] md:w-[260px] md:h-[180px] inline-block hover:shadow-lg transition-shadow duration-300" />
              </td>
            </tr>
          </table>

          <!-- VS circle positioned absolutely in the center -->
          <div class="absolute" style="z-index: 20;">
            <div class="vs-circle bg-white flex items-center justify-center text-lg font-bold w-14 h-14 border-2 border-white">VS</div>
          </div>
        </div>
        
        <!-- Options and vote buttons for desktop -->
        <div class="flex mt-4">
          <div class="flex flex-col items-center flex-1">
            <div class="option-title mb-2">${b.option1}</div>
            <button class="bg-blue-600 text-white py-3 rounded-lg font-bold w-full md:w-[90%] text-lg transition-all duration-300 hover:bg-blue-700 hover:shadow-md vote-btn" data-battle="${b.id}" data-opt="votes1">Vote</button>
          </div>
          <div class="flex flex-col items-center flex-1">
            <div class="option-title mb-2">${b.option2}</div>
            <button class="bg-green-600 text-white py-3 rounded-lg font-bold w-full md:w-[90%] text-lg transition-all duration-300 hover:bg-green-700 hover:shadow-md vote-btn" data-battle="${b.id}" data-opt="votes2">Vote</button>
          </div>
        </div>
      `}
      
      <div id="progress-${b.id}" class="progress-bar-container mt-6">
        ${renderProgressBar(b.votes1, b.votes2, b.id)}
      </div>
      <div id="timer-${b.id}" class="text-xs text-gray-500 pt-1">${active ? `Time Left: ${calculateTimeLeft(b.ends_at)}` : 'Finished'}</div>
    </div>
  `;
}
}

// Helper function to render battles to the DOM
function renderBattles(battles, container) {
  // Clear the container first to prevent duplicates
  container.innerHTML = '';
  console.log('Rendering', battles.length, 'battles');
  
  // Render each battle item
  battles.forEach(battle => {
    const isActive = new Date(battle.ends_at) > new Date();
    const battleItem = document.createElement('div');
    battleItem.classList.add('battle-item', 'py-6');
    battleItem.innerHTML = renderBattleItem(battle, isActive);
    container.appendChild(battleItem);
    
    // Set up timer for active battles
    if (isActive) {
      timers[battle.id] = setInterval(() => {
        const timerEl = document.getElementById(`timer-${battle.id}`);
        if (timerEl) {
          timerEl.textContent = `Time Left: ${calculateTimeLeft(battle.ends_at)}`;
        } else {
          clearInterval(timers[battle.id]);
        }
      }, 1000);
    }
  });
}

// Fetch and render battles based on current tab
async function fetchAndRenderBattles() {
  const battlesList = document.getElementById('battlesList');
  if (!battlesList) {
    console.error('Battles list container not found');
    return;
  }
  
  battlesList.innerHTML = '<div class="p-4 text-center"><div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div><p class="mt-2">Loading battles...</p></div>';
  
  try {
    console.log('Fetching battles for tab:', currentTab);
    
    // Make sure supabaseClient is properly initialized
    if (!window.supabaseClient) {
      throw new Error('Supabase client not initialized');
    }
    
    const now = new Date().toISOString();
    let query = window.supabaseClient.from('battles').select('*');
    
    // Filter by tab and current filters
    if (currentTab === 'featured') {
      // Featured: most recent battles
      query = query.order('created_at', { ascending: false });
    } else if (currentTab === 'active') {
      // Active: not ended yet
      query = query
        .gt('ends_at', now)
        .order('created_at', { ascending: false });
    } else if (currentTab === 'finished') {
      // Finished: already ended
      query = query
        .lte('ends_at', now)
        .order('created_at', { ascending: false });
    }
    
    // Limit to a reasonable number
    query = query.limit(50);
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    
    console.log('Received data:', data);
    currentBattles = data || [];
    
    // Clear existing timers
    Object.keys(timers).forEach(key => {
      clearInterval(timers[key]);
    });
    
    // Render battles
    if (currentBattles.length === 0) {
      battlesList.innerHTML = `
        <div class="p-4 text-center text-gray-500">
          <p class="text-xl font-semibold mb-2">No battles found</p>
          <p class="mb-4">No battles found in the ${currentTab} category.</p>
          <a href="#" id="addBattleLink" class="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Create your first battle</a>
        </div>
      `;
      
      // Add event listener for creating a battle
      const addBattleLink = document.getElementById('addBattleLink');
      if (addBattleLink) {
        addBattleLink.addEventListener('click', function(e) {
          e.preventDefault();
          document.getElementById('createModal').classList.remove('hidden');
        });
      }
      
      return;
    }
    
    // Use the helper function to render battles
    renderBattles(currentBattles, battlesList);
    
  } catch (err) {
    console.error('Error fetching battles:', err);
    battlesList.innerHTML = `
      <div class="p-4 text-center text-red-500">
        <p class="text-xl font-semibold mb-2">Could not load battles</p>
        <p>Error: ${err.message}. Please check the console for more details.</p>
        <button id="retryBtn" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Retry</button>
      </div>
    `;
    
    // Add retry button functionality
    document.getElementById('retryBtn')?.addEventListener('click', fetchAndRenderBattles);
  }
}
