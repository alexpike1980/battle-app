// Enhanced FanShare Battle Platform

(function() {
  'use strict';
  
  // App state
  const state = {
    currentTab: 'featured',
    battles: [],
    timers: {},
    durationType: 'minutes'
  };
  
  // Supabase configuration
  let supabase;
  
  // Mock database for demo purposes
  const mockBattles = [
    {
      id: 1,
      title: "Best Programming Language",
      option1: "JavaScript",
      option2: "Python",
      image1: "https://via.placeholder.com/300x200/3B82F6/white?text=JavaScript",
      image2: "https://via.placeholder.com/300x200/10B981/white?text=Python",
      votes1: 245,
      votes2: 189,
      ends_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      title: "Best Social Media Platform",
      option1: "Twitter/X",
      option2: "Instagram",
      image1: "https://via.placeholder.com/300x200/1DA1F2/white?text=Twitter",
      image2: "https://via.placeholder.com/300x200/E4405F/white?text=Instagram",
      votes1: 167,
      votes2: 203,
      ends_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago (finished)
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      title: "Best Movie Genre",
      option1: "Action",
      option2: "Comedy",
      image1: "https://via.placeholder.com/300x200/DC2626/white?text=Action",
      image2: "https://via.placeholder.com/300x200/F59E0B/white?text=Comedy",
      votes1: 156,
      votes2: 134,
      ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  // Flag to use mock data
  let useMockData = false;
  
  function initSupabase() {
    if (typeof window.supabase === 'undefined') {
      console.error('Supabase client is not loaded. Using mock data for demo.');
      useMockData = true;
      return true;
    }
    
    try {
      // Test with the original Supabase URL
      supabase = window.supabase.createClient(
        'https://hnbmlmqmrugmbxilbnwy.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYm1sbXFtcnVnbWJ4aWxibnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwMTE2NDIsImV4cCI6MjA0OTU4NzY0Mn0.Km_8lolsKV7_l1qKx2WmSMeUy8u4-K_HJ-Y1MNJVfhA'
      );
      console.log('Supabase client created, testing connection...');
      
      // Test the connection immediately
      return testSupabaseConnection();
    } catch (error) {
      console.error('Error initializing Supabase, using mock data:', error);
      useMockData = true;
      return true;
    }
  }
  
  // Test Supabase connection
  async function testSupabaseConnection() {
    try {
      console.log('Testing Supabase connection...');
      const { data, error } = await supabase
        .from('battles')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('Supabase connection test failed:', error);
        console.log('Falling back to mock data');
        useMockData = true;
        return true;
      }
      
      console.log('✅ Supabase connection successful!');
      useMockData = false;
      return true;
    } catch (error) {
      console.error('Supabase connection test error:', error);
      console.log('Falling back to mock data');
      useMockData = true;
      return true;
    }
  }
  
  // Database functions
  async function getBattles() {
    if (useMockData) {
      console.log('Using mock data for battles');
      return new Promise(resolve => {
        setTimeout(() => resolve([...mockBattles]), 500); // Simulate network delay
      });
    }
    
    try {
      const { data, error } = await supabase
        .from('battles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching battles, falling back to mock data:', error);
      useMockData = true;
      return [...mockBattles];
    }
  }
  
  async function createBattle(battleData) {
    if (useMockData) {
      console.log('Creating battle with mock data');
      const newBattle = {
        ...battleData,
        id: Math.max(...mockBattles.map(b => b.id)) + 1,
        created_at: new Date().toISOString()
      };
      mockBattles.unshift(newBattle);
      return new Promise(resolve => {
        setTimeout(() => resolve(newBattle), 300);
      });
    }
    
    try {
      const { data, error } = await supabase
        .from('battles')
        .insert([battleData])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error creating battle:', error);
      throw error;
    }
  }
  
  async function vote(battleId, option) {
    if (useMockData) {
      console.log('Voting with mock data');
      const battle = mockBattles.find(b => b.id === parseInt(battleId));
      if (!battle) throw new Error('Battle not found');
      
      if (new Date(battle.ends_at) <= new Date()) {
        throw new Error('This battle has ended');
      }
      
      battle[option] = (parseInt(battle[option]) || 0) + 1;
      
      return new Promise(resolve => {
        setTimeout(() => resolve(true), 300);
      });
    }
    
    try {
      // Check if battle is still active
      const { data: battle, error: fetchError } = await supabase
        .from('battles')
        .select('ends_at')
        .eq('id', battleId)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (new Date(battle.ends_at) <= new Date()) {
        throw new Error('This battle has ended');
      }
      
      const { data, error } = await supabase.rpc('increment_vote', {
        battle_id: battleId,
        vote_option: option
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error voting:', error);
      throw error;
    }
  }
  
  // Utility functions
  function calculateTimeLeft(endTime) {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }
  
  function renderProgressBar(votes1, votes2) {
    const v1 = parseInt(votes1) || 0;
    const v2 = parseInt(votes2) || 0;
    const total = v1 + v2;
    
    if (total === 0) {
      return `
        <div class="progress-bar-container">
          <div class="progress-segment progress-blue" style="width: 50%;">
            <span class="progress-text">0%</span>
          </div>
          <div class="progress-segment progress-green" style="width: 50%;">
            <span class="progress-text">0%</span>
          </div>
        </div>
      `;
    }
    
    const percent1 = Math.round((v1 / total) * 100);
    const percent2 = 100 - percent1;
    
    return `
      <div class="progress-bar-container">
        <div class="progress-segment progress-blue" style="width: ${percent1}%;">
          <span class="progress-text">${percent1}%</span>
        </div>
        <div class="progress-segment progress-green" style="width: ${percent2}%;">
          <span class="progress-text">${percent2}%</span>
        </div>
      </div>
    `;
  }
  
  // Render a single battle
  function renderBattle(battle, container) {
    const isActive = new Date(battle.ends_at) > new Date();
    const votes1 = parseInt(battle.votes1) || 0;
    const votes2 = parseInt(battle.votes2) || 0;
    const total = votes1 + votes2;
    
    // Determine winner for finished battles
    let winner = null;
    if (!isActive && total > 0) {
      if (votes1 > votes2) winner = 1;
      else if (votes2 > votes1) winner = 2;
      // If votes1 === votes2, winner remains null (tie)
    }
    
    const battleEl = document.createElement('div');
    battleEl.className = 'bg-white py-8 px-2 md:px-6 flex flex-col gap-2 border-b border-gray-200 mb-2';
    
    // Generate button/badge content based on battle status
    let option1Content, option2Content;
    
    if (isActive) {
      // Active battle - show vote buttons
      option1Content = `<button class="bg-blue-600 text-white py-3 mt-3 rounded-lg font-bold w-full md:w-[90%] text-lg transition hover:bg-blue-700 vote-btn cursor-pointer" data-battle="${battle.id}" data-opt="votes1">Vote</button>`;
      option2Content = `<button class="bg-green-600 text-white py-3 mt-3 rounded-lg font-bold w-full md:w-[90%] text-lg transition hover:bg-green-700 vote-btn cursor-pointer" data-battle="${battle.id}" data-opt="votes2">Vote</button>`;
    } else {
      // Finished battle - show winner badge or tie message
      if (winner === 1) {
        option1Content = `<div class="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white py-3 mt-3 rounded-lg font-bold w-full md:w-[90%] text-lg text-center shadow-lg">🏆 WINNER</div>`;
        option2Content = `<div class="mt-3 h-12"></div>`; // Empty space to maintain layout
      } else if (winner === 2) {
        option1Content = `<div class="mt-3 h-12"></div>`; // Empty space to maintain layout
        option2Content = `<div class="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white py-3 mt-3 rounded-lg font-bold w-full md:w-[90%] text-lg text-center shadow-lg">🏆 WINNER</div>`;
      } else {
        // Tie or no votes
        option1Content = `<div class="bg-gray-300 text-gray-600 py-3 mt-3 rounded-lg font-bold w-full md:w-[90%] text-lg text-center">TIE</div>`;
        option2Content = `<div class="bg-gray-300 text-gray-600 py-3 mt-3 rounded-lg font-bold w-full md:w-[90%] text-lg text-center">TIE</div>`;
      }
    }
    
    battleEl.innerHTML = `
      <a href="battle.html?id=${battle.id}" class="text-2xl font-semibold mb-2 hover:text-blue-600 transition underline-offset-2 hover:underline inline-block">${battle.title}</a>
      <div class="relative flex flex-row gap-2 justify-center items-start">
        <div class="flex flex-col items-center flex-1">
          <div class="relative">
            <img src="${battle.image1||'https://via.placeholder.com/300'}" alt="${battle.option1}" class="object-cover rounded-lg w-[220px] h-[180px] md:w-[260px] md:h-[180px]" />
          </div>
          <div class="option-title mt-2 font-semibold ${winner === 1 ? 'text-yellow-600' : ''}">${battle.option1}</div>
          ${option1Content}
        </div>
        <div class="absolute z-20 left-1/2 top-[90px] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div class="vs-circle bg-white flex items-center justify-center text-lg font-bold w-14 h-14 border-2 border-white shadow-none">VS</div>
        </div>
        <div class="flex flex-col items-center flex-1">
          <div class="relative">
            <img src="${battle.image2||'https://via.placeholder.com/300'}" alt="${battle.option2}" class="object-cover rounded-lg w-[220px] h-[180px] md:w-[260px] md:h-[180px]" />
          </div>
          <div class="option-title mt-2 font-semibold ${winner === 2 ? 'text-yellow-600' : ''}">${battle.option2}</div>
          ${option2Content}
        </div>
      </div>
      <div class="mt-4">
        <div id="progress-${battle.id}" class="w-full">
          ${renderProgressBar(battle.votes1, battle.votes2)}
        </div>
      </div>
      <div id="timer-${battle.id}" class="text-xs text-gray-500 pt-1">${isActive ? 'Time Left: ' + calculateTimeLeft(battle.ends_at) : '🏁 Final Results'}</div>
    `;
    
    container.appendChild(battleEl);
    
    // Set up timer for active battles
    if (isActive) {
      state.timers[battle.id] = setInterval(() => {
        const timerEl = document.getElementById(`timer-${battle.id}`);
        if (timerEl) {
          const timeLeft = calculateTimeLeft(battle.ends_at);
          if (timeLeft) {
            timerEl.textContent = 'Time Left: ' + timeLeft;
          } else {
            // Battle just finished, reload to update UI
            timerEl.textContent = '🏁 Final Results';
            clearInterval(state.timers[battle.id]);
            // Reload battles to update button states and show winner
            setTimeout(() => loadBattles(), 1000);
          }
        } else {
          clearInterval(state.timers[battle.id]);
        }
      }, 1000);
    }
  }
  
  // Load and display battles
  function loadBattles() {
    console.log('DEBUG: Looking for battles-container...');
    const container = document.getElementById('battles-container');
    console.log('DEBUG: Container found:', container);
    
    if (!container) {
      console.error('ERROR: battles-container element not found in DOM');
      return;
    }
    
    container.innerHTML = '<div class="text-center py-8 text-gray-500">Loading battles...</div>';
    
    // Clear existing timers
    Object.values(state.timers).forEach(timer => clearInterval(timer));
    state.timers = {};
    
    getBattles().then(battles => {
      if (!battles || battles.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-gray-500">No battles found.</div>';
        return;
      }
      
      state.battles = battles;
      
      // Filter battles based on current tab
      let filteredBattles = battles;
      if (state.currentTab === 'active') {
        filteredBattles = battles.filter(battle => new Date(battle.ends_at) > new Date());
      } else if (state.currentTab === 'finished') {
        filteredBattles = battles.filter(battle => new Date(battle.ends_at) <= new Date());
      }
      
      if (filteredBattles.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-gray-500">No battles in this category.</div>';
        return;
      }
      
      container.innerHTML = '';
      filteredBattles.forEach(battle => renderBattle(battle, container));
      
      // Set up vote buttons after rendering
      setupVoteButtons();
    }).catch(error => {
      console.error('Error loading battles:', error);
      container.innerHTML = '<div class="text-center py-8 text-red-500">Error loading battles. Please try again.</div>';
    });
  }
  
  // Set up vote button event listeners
  function setupVoteButtons() {
    document.querySelectorAll('.vote-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const battleId = this.dataset.battle;
        const option = this.dataset.opt;
        
        if (!battleId || !option) return;
        
        // Disable all vote buttons for this battle
        const battleButtons = document.querySelectorAll(`[data-battle="${battleId}"]`);
        battleButtons.forEach(b => {
          b.disabled = true;
          b.textContent = 'Voting...';
        });
        
        try {
          await vote(battleId, option);
          
          // Show share modal instead of reloading
          window.currentBattleId = battleId;
          openShareModal();
          
          // Update the battle display
          setTimeout(() => {
            loadBattles();
          }, 1000);
          
        } catch (error) {
          alert('Error voting: ' + error.message);
          
          // Re-enable buttons on error
          battleButtons.forEach(b => {
            b.disabled = false;
            b.textContent = 'Vote';
          });
        }
      });
    });
  }
  
  // Tab switching
  function showTab(tabName) {
    state.currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      const isActive = btn.dataset.tab === tabName;
      btn.className = isActive 
        ? 'tab-btn py-4 px-2 border-b-2 border-blue-600 text-blue-600 font-medium'
        : 'tab-btn py-4 px-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700';
    });
    
    // Reload battles for the selected tab
    loadBattles();
  }
  
  // Modal functions
  function openCreateModal() {
    document.getElementById('createModal').style.display = 'flex';
    
    // Reset form
    document.getElementById('battleTitle').value = '';
    document.getElementById('option1').value = '';
    document.getElementById('option2').value = '';
    document.getElementById('image1').value = '';
    document.getElementById('image2').value = '';
    document.getElementById('duration').value = '60';
    document.getElementById('customDate').style.display = 'none';
    
    // Reset duration type
    setDurationType('minutes');
  }
  
  function closeCreateModal() {
    document.getElementById('createModal').style.display = 'none';
  }
  
  function openShareModal() {
    document.getElementById('shareModal').style.display = 'flex';
  }
  
  function closeShareModal() {
    document.getElementById('shareModal').style.display = 'none';
  }
  
  function setDurationType(type) {
    state.durationType = type;
    
    // Update button styles
    const buttons = ['minutesBtn', 'hoursBtn', 'daysBtn', 'customBtn'];
    buttons.forEach(btnId => {
      const btn = document.getElementById(btnId);
      const isActive = (btnId === type + 'Btn') || (btnId === 'customBtn' && type === 'custom');
      btn.className = isActive
        ? 'bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition'
        : 'bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition';
    });
    
    // Show/hide custom date input
    const customDateInput = document.getElementById('customDate');
    const durationInput = document.getElementById('duration');
    
    if (type === 'custom') {
      customDateInput.style.display = 'block';
      durationInput.style.display = 'none';
    } else {
      customDateInput.style.display = 'none';
      durationInput.style.display = 'block';
    }
  }
  
  function pickCustomDate() {
    setDurationType('custom');
  }
  
  // Image upload handler
  function handleImageUpload(input, targetInputId) {
    const file = input.files[0];
    if (!file) return;
    
    // For demo purposes, we'll use a placeholder URL
    // In a real app, you'd upload to a service like Supabase Storage
    const targetInput = document.getElementById(targetInputId);
    targetInput.value = 'https://via.placeholder.com/300x200?text=' + encodeURIComponent(file.name);
  }
  
  // Submit battle
  async function submitBattle() {
    const title = document.getElementById('battleTitle').value.trim();
    const option1 = document.getElementById('option1').value.trim();
    const option2 = document.getElementById('option2').value.trim();
    const image1 = document.getElementById('image1').value.trim();
    const image2 = document.getElementById('image2').value.trim();
    
    if (!title || !option1 || !option2) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Calculate end time
    let endsAt;
    if (state.durationType === 'custom') {
      const customDate = document.getElementById('customDate').value;
      if (!customDate) {
        alert('Please select an end date');
        return;
      }
      endsAt = new Date(customDate);
    } else {
      const duration = parseInt(document.getElementById('duration').value);
      if (!duration || duration < 1) {
        alert('Please enter a valid duration');
        return;
      }
      
      const now = new Date();
      const multiplier = state.durationType === 'minutes' ? 1 : 
                        state.durationType === 'hours' ? 60 : 1440; // 1440 minutes = 1 day
      endsAt = new Date(now.getTime() + (duration * multiplier * 60 * 1000));
    }
    
    const battleData = {
      title,
      option1,
      option2,
      image1: image1 || null,
      image2: image2 || null,
      ends_at: endsAt.toISOString(),
      votes1: 0,
      votes2: 0
    };
    
    try {
      await createBattle(battleData);
      closeCreateModal();
      loadBattles();
      alert('Battle created successfully!');
    } catch (error) {
      alert('Error creating battle: ' + error.message);
    }
  }
  
  // Share functions
  function shareToTwitter() {
    const battleUrl = window.location.origin + '/battle.html?id=' + window.currentBattleId;
    const text = encodeURIComponent('I just voted in this epic battle! Cast your vote too: ');
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(battleUrl)}`;
    window.open(twitterUrl, '_blank');
  }
  
  function copyLink() {
    const battleUrl = window.location.origin + '/battle.html?id=' + window.currentBattleId;
    navigator.clipboard.writeText(battleUrl).then(() => {
      alert('Link copied to clipboard!');
    }).catch(() => {
      alert('Could not copy link. Please copy manually: ' + battleUrl);
    });
  }
  
  // Initialize the app
  async function init() {
    console.log('DEBUG: Initializing app...');
    
    // Check if Supabase is available and test connection
    const dbReady = await initSupabase();
    if (!dbReady) {
      document.body.innerHTML = '<div class="text-center py-8 text-red-500">Error: Could not connect to database</div>';
      return;
    }
    
    // Debug: List all elements with IDs
    console.log('DEBUG: All elements with IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
    
    // Load battles on page load
    loadBattles();
    
    // Set up modal event listeners
    const modal = document.getElementById('createModal');
    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          closeCreateModal();
        }
      });
    }
    
    const shareModal = document.getElementById('shareModal');
    if (shareModal) {
      shareModal.addEventListener('click', function(e) {
        if (e.target === shareModal) {
          closeShareModal();
        }
      });
    }
  }
  
  // Make functions globally available
  window.showTab = showTab;
  window.openCreateModal = openCreateModal;
  window.closeCreateModal = closeCreateModal;
  window.openShareModal = openShareModal;
  window.closeShareModal = closeShareModal;
  window.setDurationType = setDurationType;
  window.pickCustomDate = pickCustomDate;
  window.handleImageUpload = handleImageUpload;
  window.submitBattle = submitBattle;
  window.shareToTwitter = shareToTwitter;
  window.copyLink = copyLink;
  
  // Run when DOM is loaded
  document.addEventListener('DOMContentLoaded', init);
  
})();
