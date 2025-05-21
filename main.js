// Global variables
let currentTab = 'featured';
let currentBattles = [];
const timers = {};

// DOM ready function
document.addEventListener('DOMContentLoaded', async function() {
  try {
    console.log('Initializing app...');
    
    // Debug HTML structure
    console.log('== HTML Structure Debug ==');
    console.log('Document title:', document.title);
    console.log('All divs on page:', document.querySelectorAll('div').length);
    console.log('Main container exists:', !!document.querySelector('main'));
    console.log('Tabs container exists:', !!document.querySelector('.tabs'));
    console.log('Active tab button:', document.querySelector('.tab-btn.active')?.dataset?.tab || 'None');
    
    // Find potential battle containers
    const potentialContainers = Array.from(document.querySelectorAll('div')).filter(div => 
      div.id?.includes('battle') || 
      div.className?.includes('battle') || 
      div.className?.includes('list') ||
      div.className?.includes('content')
    );
    
    console.log('Potential battle containers:', potentialContainers.map(el => ({
      id: el.id, 
      class: el.className,
      children: el.children.length
    })));
    
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
          Error: Supabase client is not loaded. Make sure you've included the Supabase script in your HTML.
        </div>
      `;
      return;
    }
    
    // Initialize Supabase client
    console.log('Initializing Supabase client...');
    window.supabaseUrl = 'https://oleqibxqfwnvaorqgflp.supabase.co';
    window.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';
    window.supabaseClient = supabase.createClient(window.supabaseUrl, window.supabaseKey);
    
    // Test Supabase connection
    const { data, error } = await window.supabaseClient.from('battles').select('count');
    if (error) {
      console.error('Supabase connection test failed:', error);
      throw new Error(`Supabase connection failed: ${error.message}`);
    }
    
    console.log('Supabase test query result:', data);
    console.log('Supabase initialized successfully');
    
    // Setup tab navigation
    setupTabs();
    
    // Set up battle creation form
    setupCreateBattleForm();
    
    // Set up share and vote handling
    setupEventHandlers();
    
    // Fetch initial battles
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

// Show error message on the page
function showErrorMessage(message) {
  const battlesList = document.getElementById('battlesList');
  if (battlesList) {
    battlesList.innerHTML = `
      <div class="p-4 text-center text-red-500 font-bold">
        ${message}
      </div>
    `;
  }
}

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
  
  // Preview uploaded images - declare variables outside to make them available throughout the function
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
  if (timeTabs.length > 0) {
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
      if (activeTab.dataset.unit === 'date') {
        endsAt = new Date(datetimePicker.value);
      } else {
        const now = new Date();
        const duration = parseInt(durationInput.value) || 60;
        
        if (activeTab.dataset.unit === 'minutes') {
          endsAt = new Date(now.getTime() + duration * 60 * 1000);
        } else if (activeTab.dataset.unit === 'hours') {
          endsAt = new Date(now.getTime() + duration * 60 * 60 * 1000);
        } else if (activeTab.dataset.unit === 'days') {
          endsAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
        }
      }
      
      try {
        // Upload images first
        const image1 = image1File.files.length > 0 
          ? await uploadImage(image1File.files[0], 'battle-images') 
          : 'https://via.placeholder.com/300';
          
        const image2 = image2File.files.length > 0 
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
  const createBtn = document.getElementById('createBtn');
  if (createBtn) {
    createBtn.addEventListener('click', function() {
      document.getElementById('createModal').classList.remove('hidden');
    });
  }
  
  // Close modals
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function() {
      document.getElementById(this.dataset.modal).classList.add('hidden');
    });
  });
  
  // Share battle
  const battlesList = document.getElementById('battlesList');
  if (battlesList) {
    battlesList.addEventListener('click', function(e) {
      if (e.target.classList.contains('share-btn') || e.target.closest('.share-btn')) {
        const btn = e.target.classList.contains('share-btn') ? e.target : e.target.closest('.share-btn');
        const battleId = btn.dataset.battle;
        document.getElementById('shareModal').classList.remove('hidden');
        
        // Set up share buttons
        const battle = currentBattles.find(b => b.id === parseInt(battleId));
        if (battle) {
          const battleUrl = `${window.location.origin}${window.location.pathname}?battle=${battleId}`;
          const shareText = `Vote for ${battle.option1} vs ${battle.option2} in this battle!`;
          
          // Set up share links
          document.getElementById('shareFacebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(battleUrl)}`;
          document.getElementById('shareTwitter').href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(battleUrl)}`;
          document.getElementById('shareReddit').href = `https://www.reddit.com/submit?url=${encodeURIComponent(battleUrl)}&title=${encodeURIComponent(shareText)}`;
        }
      }
    });
  }
  
  // Vote for battle
  if (battlesList) {
    battlesList.addEventListener('click', async function(e) {
      if (e.target.classList.contains('vote-btn')) {
        const battleId = e.target.dataset.battle;
        const voteOpt = e.target.dataset.opt;
        
        try {
          // Check if user already voted
          const userId = localStorage.getItem('userId') || `user_${Math.random().toString(36).substring(2)}`;
          localStorage.setItem('userId', userId);
          
          const voteKey = `vote_${battleId}`;
          if (localStorage.getItem(voteKey)) {
            alert('You have already voted on this battle!');
            return;
          }
          
          // Update vote in database
          const { data, error } = await window.supabaseClient
            .from('battles')
            .select(voteOpt)
            .eq('id', battleId)
            .single();
            
          if (error) throw error;
          
          const currentVotes = data[voteOpt] || 0;
          const updateObj = {};
          updateObj[voteOpt] = currentVotes + 1;
          
          const { error: updateError } = await window.supabaseClient
            .from('battles')
            .update(updateObj)
            .eq('id', battleId);
            
          if (updateError) throw updateError;
          
          // Mark as voted
          localStorage.setItem(voteKey, voteOpt);
          
          // Refresh battles
          await fetchAndRenderBattles();
          
        } catch (err) {
          console.error('Error voting:', err);
          alert('Could not register vote. Please try again.');
        }
      }
    });
  }
}

// Calculate time left for a battle
function calculateTimeLeft(endsAt) {
  const now = new Date();
  const end = new Date(endsAt);
  const diff = end - now;
  
  if (diff <= 0) return 'Ended';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return `${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''} ${seconds} sec${seconds !== 1 ? 's' : ''}`;
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
    <div class="flex w-full gap-0 mt-3">
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
  return `
    <div class="border-b pb-6">
      <a href="battle.html?id=${b.id}" class="text-2xl font-semibold mb-2 hover:text-blue-600 transition underline-offset-2 hover:underline inline-block">${b.title}</a>
      
      <!-- VS image layout with table-like structure for perfect alignment -->
      <div class="relative flex items-center justify-center mt-4">
        <table class="vs-battle-table w-full">
          <tr>
            <td class="w-1/2 pr-4 text-center align-middle">
              <img src="${b.image1||'https://via.placeholder.com/300'}" alt="${b.option1}" class="object-cover rounded-lg w-[220px] h-[180px] md:w-[260px] md:h-[180px] inline-block" />
            </td>
            <td class="w-1/2 pl-4 text-center align-middle">
              <img src="${b.image2||'https://via.placeholder.com/300'}" alt="${b.option2}" class="object-cover rounded-lg w-[220px] h-[180px] md:w-[260px] md:h-[180px] inline-block" />
            </td>
          </tr>
        </table>

        <!-- VS circle positioned absolutely in the center -->
        <div class="absolute" style="z-index: 20;">
          <div class="vs-circle bg-white flex items-center justify-center text-lg font-bold w-14 h-14 border-2 border-white">VS</div>
        </div>
      </div>
      
      <!-- Options and vote buttons -->
      <div class="flex mt-4">
        <div class="flex flex-col items-center flex-1">
          <div class="option-title mb-2">${b.option1}</div>
          <button class="bg-blue-600 text-white py-3 rounded-lg font-bold w-full md:w-[90%] text-lg transition hover:bg-blue-700 vote-btn" data-battle="${b.id}" data-opt="votes1">Vote</button>
        </div>
        <div class="flex flex-col items-center flex-1">
          <div class="option-title mb-2">${b.option2}</div>
          <button class="bg-green-600 text-white py-3 rounded-lg font-bold w-full md:w-[90%] text-lg transition hover:bg-green-700 vote-btn" data-battle="${b.id}" data-opt="votes2">Vote</button>
        </div>
      </div>
      
      ${renderProgressBar(b.votes1, b.votes2, b.id)}
      <div id="timer-${b.id}" class="text-xs text-gray-500 pt-1">${active ? `Time Left: ${calculateTimeLeft(b.ends_at)}` : 'Finished'}</div>
    </div>
  `;
}

// Fetch and render battles based on current tab
async function fetchAndRenderBattles() {
  const battlesList = document.getElementById('battlesList');
  if (!battlesList) {
    console.error('Battles list container not found');
    return;
  }
  
  battlesList.innerHTML = '<div class="p-4 text-center">Loading battles...</div>';
  
  try {
    console.log('Fetching battles for tab:', currentTab);
    
    // Make sure supabaseClient is properly initialized
    if (!window.supabaseClient) {
      throw new Error('Supabase client not initialized');
    }
    
    const now = new Date().toISOString();
    let query = window.supabaseClient.from('battles').select('*');
    
    // Log table name and query
    console.log('Querying table: battles');
    
    // Filter by tab
    if (currentTab === 'featured') {
      // Featured: most votes in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query = query
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('votes1', { ascending: false })
        .order('votes2', { ascending: false })
        .limit(10);
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
    
    console.log('Executing query...');
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
    if (!currentBattles || currentBattles.length === 0) {
      console.log('No battles found for tab:', currentTab);
      battlesList.innerHTML = `
        <div class="p-4 text-center text-gray-500">
          No battles found in the ${currentTab} category. <a href="#" id="addBattleLink" class="text-blue-500 underline">Create your first battle</a>
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
    
    // Clear the container first to prevent duplicates
    battlesList.innerHTML = '';
    console.log('Rendering', currentBattles.length, 'battles');
    
    // Render each battle item
    currentBattles.forEach(battle => {
      const isActive = new Date(battle.ends_at) > new Date();
      const battleItem = document.createElement('div');
      battleItem.classList.add('battle-item', 'py-6');
      battleItem.innerHTML = renderBattleItem(battle, isActive);
      battlesList.appendChild(battleItem);
      
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
    
  } catch (err) {
    console.error('Error fetching battles:', err);
    battlesList.innerHTML = `
      <div class="p-4 text-center text-red-500">
        Could not load battles. Error: ${err.message}. Please check the console for more details.
      </div>
    `;
  }
}
