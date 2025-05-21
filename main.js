// Add tournament functionality
function createTournament() {
  const tournamentModal = document.createElement('div');
  tournamentModal.className = 'modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  
  tournamentModal.innerHTML = `
    <div class="bg-white rounded-lg max-w-2xl w-full mx-4 p-6">
      <h2 class="text-2xl font-bold mb-4">Create Tournament</h2>
      
      <div class="mb-4">
        <label class="block text-gray-700 font-semibold mb-2">Tournament Name</label>
        <input type="text" id="tournamentName" class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter tournament name">
      </div>
      
      <div class="mb-4">
        <label class="block text-gray-700 font-semibold mb-2">Description</label>
        <textarea id="tournamentDescription" class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" placeholder="Describe your tournament"></textarea>
      </div>
      
      <div class="mb-4">
        <label class="block text-gray-700 font-semibold mb-2">Tournament Type</label>
        <select id="tournamentType" class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="single">Single Elimination</option>
          <option value="double">Double Elimination</option>
          <option value="round">Round Robin</option>
        </select>
      </div>
      
      <div class="mb-4">
        <label class="block text-gray-700 font-semibold mb-2">Number of Participants</label>
        <select id="participantCount" class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="4">4 Participants</option>
          <option value="8">8 Participants</option>
          <option value="16">16 Participants</option>
          <option value="32">32 Participants</option>
        </select>
      </div>
      
      <div class="mb-4">
        <label class="block text-gray-700 font-semibold mb-2">Duration per Round</label>
        <div class="flex">
          <input type="number" id="roundDuration" class="w-20 p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500" value="24">
          <select id="durationUnit" class="p-2 border border-l-0 rounded-r focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="hours">Hours</option>
            <option value="days">Days</option>
          </select>
        </div>
      </div>
      
      <div class="flex justify-end gap-2 mt-6">
        <button id="cancelTournament" class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition">Cancel</button>
        <button id="createTournamentBtn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Create Tournament</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(tournamentModal);
  
  // Add event listeners
  document.getElementById('cancelTournament').addEventListener('click', () => {
    tournamentModal.remove();
  });
  
  document.getElementById('createTournamentBtn').addEventListener('click', async () => {
    const name = document.getElementById('tournamentName').value;
    const description = document.getElementById('tournamentDescription').value;
    const type = document.getElementById('tournamentType').value;
    const participantCount = parseInt(document.getElementById('participantCount').value);
    const roundDuration = parseInt(document.getElementById('roundDuration').value);
    const durationUnit = document.getElementById('durationUnit').value;
    
    // Validate inputs
    if (!name) {
      alert('Please enter a tournament name');
      return;
    }
    
    // Convert duration to hours
    let durationHours = roundDuration;
    if (durationUnit === 'days') {
      durationHours *= 24;
    }
    
    try {
      // Create tournament in database
      const { data, error } = await window.supabaseClient.from('tournaments').insert([
        {
          name,
          description,
          type,
          participant_count: participantCount,
          round_duration_hours: durationHours,
          status: 'setup',
          created_by: localStorage.getItem('userId'),
          created_at: new Date().toISOString()
        }
      ]).select();
      
      if (error) throw error;
      
      // Close modal and show success message
      tournamentModal.remove();
      
      // Show confirmation
      showNotification('Tournament created successfully!', 'success');
      
      // Redirect to tournament setup page
      if (data && data[0] && data[0].id) {
        window.location.href = `tournament.html?id=${data[0].id}`;
      }
      
    } catch (err) {
      console.error('Error creating tournament:', err);
      alert('Could not create tournament: ' + err.message);
    }
  });
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 animate-slide-up ${
    type === 'success' ? 'bg-green-600 text-white' : 
    type === 'error' ? 'bg-red-600 text-white' : 
    'bg-blue-600 text-white'
  }`;
  
  notification.innerHTML = `
    <div class="flex items-center justify-between">
      <p>${message}</p>
      <button class="ml-4 text-white hover:text-gray-200 close-notification">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Add close button handler
  notification.querySelector('.close-notification').addEventListener('click', () => {
    notification.remove();
  });
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.remove();
    }
  }, 5000);
}// Render options for multi-option battles (enhanced version)
function renderMultiOptionBattle(battle) {
  const options = [
    { id: 'option1', value: battle.option1, image: battle.image1, votes: battle.votes1 || 0, color: 'blue' },
    { id: 'option2', value: battle.option2, image: battle.image2, votes: battle.votes2 || 0, color: 'green' }
  ];
  
  // Add option3 and option4 if they exist
  if (battle.option3) {
    options.push({ 
      id: 'option3', 
      value: battle.option3, 
      image: battle.image3, 
      votes: battle.votes3 || 0, 
      color: 'purple'
    });
  }
  
  if (battle.option4) {
    options.push({ 
      id: 'option4', 
      value: battle.option4, 
      image: battle.image4, 
      votes: battle.votes4 || 0, 
      color: 'orange'
    });
  }
  
  // Calculate total votes and percentages
  const totalVotes = options.reduce((sum, option) => sum + option.votes, 0);
  options.forEach(option => {
    option.percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
  });
  
  // Sort options by votes (highest first) for the progress bars
  const sortedOptions = [...options].sort((a, b) => b.votes - a.votes);
  
  // Create HTML for the options grid
  let optionsHtml = '';
  let optionsGridClass = 'grid grid-cols-2';
  
  if (options.length > 2) {
    optionsGridClass = options.length === 3 ? 
      'grid grid-cols-3' : 
      'grid grid-cols-2 grid-rows-2';
  }
  
  // Generate options HTML
  options.forEach(option => {
    optionsHtml += `
      <div class="flex flex-col items-center p-2">
        <img src="${option.image || 'https://via.placeholder.com/300'}" 
             alt="${option.value}" 
             class="object-cover rounded-lg w-full h-36 md:h-48">
        <div class="option-title mt-2 text-center">${option.value}</div>
        <button class="bg-${option.color}-600 text-white py-2 mt-2 rounded-lg font-bold w-full transition-all hover:bg-${option.color}-700 hover:shadow-md vote-btn" 
                data-battle="${battle.id}" 
                data-opt="${option.id}">
          Vote
        </button>
      </div>
    `;
  });
  
  // Generate progress bars HTML
  let progressBarsHtml = '';
  sortedOptions.forEach(option => {
    // Ensure a minimum width for visibility
    const width = option.percentage > 0 ? 
      Math.max(option.percentage, 5) + '%' : 
      '0%';
    
    progressBarsHtml += `
      <div class="flex items-center mb-2">
        <div class="w-24 text-sm font-medium">${option.value}:</div>
        <div class="flex-1 bg-gray-200 rounded-full h-5 overflow-hidden">
          <div class="bg-${option.color}-600 h-5 rounded-full text-xs text-white flex items-center pl-2" 
               style="width: ${width}">
            ${option.votes} (${option.percentage}%)
          </div>
        </div>
      </div>
    `;
  });
  
  return `
    <div class="${optionsGridClass} gap-4 mt-4">
      ${optionsHtml}
    </div>
    
    <div id="progress-${battle.id}" class="progress-bar-container mt-4">
      ${progressBarsHtml}
    </div>
  `;
}// Initialize user analytics tracking
function initializeAnalytics() {
  // Create analytics object in localStorage if it doesn't exist
  let analytics = JSON.parse(localStorage.getItem('battleAnalytics') || '{}');
  
  if (!analytics.userId) {
    analytics.userId = `user_${Math.random().toString(36).substring(2)}`;
  }
  
  if (!analytics.sessions) {
    analytics.sessions = [];
  }
  
  if (!analytics.interactions) {
    analytics.interactions = {
      votesPlaced: 0,
      battlesCreated: 0,
      battlesViewed: 0,
      shares: 0,
      bookmarks: 0
    };
  }
  
  // Record new session
  analytics.sessions.push({
    startTime: new Date().toISOString(),
    device: getDeviceInfo(),
    referrer: document.referrer || 'direct'
  });
  
  // Keep only last 10 sessions
  if (analytics.sessions.length > 10) {
    analytics.sessions = analytics.sessions.slice(-10);
  }
  
  // Save updated analytics
  localStorage.setItem('battleAnalytics', JSON.stringify(analytics));
  
  // Set up page view tracking
  trackPageView();
}

// Get device information for analytics
function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
    isMobile: window.innerWidth < 768,
    language: navigator.language
  };
}

// Track page view
function trackPageView() {
  const analytics = JSON.parse(localStorage.getItem('battleAnalytics') || '{}');
  analytics.interactions.battlesViewed++;
  localStorage.setItem('battleAnalytics', JSON.stringify(analytics));
}

// Track user interaction
function trackInteraction(type) {
  const analytics = JSON.parse(localStorage.getItem('battleAnalytics') || '{}');
  
  if (type === 'vote') {
    analytics.interactions.votesPlaced++;
  } else if (type === 'create') {
    analytics.interactions.battlesCreated++;
  } else if (type === 'share') {
    analytics.interactions.shares++;
  } else if (type === 'bookmark') {
    analytics.interactions.bookmarks++;
  }
  
  localStorage.setItem('battleAnalytics', JSON.stringify(analytics));
}// Fetch and render battles based on current tab
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
    
    // Apply filters based on tab and current filters
    if (currentTab === 'featured') {
      // Featured: most votes in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query = query
        .gte('created_at', sevenDaysAgo.toISOString());
    } else if (currentTab === 'active') {
      // Active: not ended yet
      query = query
        .gt('ends_at', now);
    } else if (currentTab === 'finished') {
      // Finished: already ended
      query = query
        .lte('ends_at', now);
    }
    
    // Apply category filter if set
    if (currentFilters.category) {
      query = query.eq('category', currentFilters.category);
    }
    
    // Apply sort order
    if (currentFilters.sort === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (currentFilters.sort === 'popular') {
      // Sort by total votes (votes1 + votes2)
      query = query.order('votes1', { ascending: false }).order('votes2', { ascending: false });
    } else if (currentFilters.sort === 'ending') {
      // Sort by time remaining (for active battles only)
      if (currentTab === 'active') {
        query = query.order('ends_at', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }
    }
    
    // Limit to a reasonable number
    query = query.limit(50);
    
    console.log('Executing query...');
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    
    console.log('Received data:', data);
    let battles = data || [];
    
    // Apply local filters (search, bookmarks)
    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase();
      battles = battles.filter(battle => 
        battle.title.toLowerCase().includes(searchTerm) ||
        battle.option1.toLowerCase().includes(searchTerm) ||
        battle.option2.toLowerCase().includes(searchTerm)
      );
    }
    
    if (currentFilters.bookmarksOnly) {
      battles = battles.filter(battle => 
        localStorage.getItem(`bookmark_${battle.id}`) === 'true'
      );
    }
    
    currentBattles = battles;
    
    // Clear existing timers
    Object.keys(timers).forEach(key => {
      clearInterval(timers[key]);
    });
    
    // Render battles
    if (!currentBattles || currentBattles.length === 0) {
      console.log('No battles found for tab:', currentTab);
      battlesList.innerHTML = `
        <div class="p-4 text-center text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p class="text-xl font-semibold mb-2">No battles found</p>
          <p class="mb-4">${getNoResultsMessage()}</p>
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
    
    // Clear the container first to prevent duplicates
    battlesList.innerHTML = '';
    console.log('Rendering', currentBattles.length, 'battles');
    
    // Create a container for lazy loading
    const fragment = document.createDocumentFragment();
    
    // Render each battle item
    currentBattles.forEach(battle => {
      const isActive = new Date(battle.ends_at) > new Date();
      const battleItem = document.createElement('div');
      battleItem.classList.add('battle-item', 'py-6');
      battleItem.innerHTML = renderBattleItem(battle, isActive);
      
      // Check bookmark status and update the UI
      const bookmarkBtn = battleItem.querySelector('.bookmark-btn');
      if (bookmarkBtn && localStorage.getItem(`bookmark_${battle.id}`) === 'true') {
        bookmarkBtn.classList.remove('text-gray-500');
        bookmarkBtn.classList.add('text-yellow-500');
      }
      
      // Add to fragment instead of directly to DOM
      fragment.appendChild(battleItem);
      
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
    
    // Add all battles to the DOM at once
    battlesList.appendChild(fragment);
    
    // Set up lazy loading for images
    setupLazyLoading();
    
  } catch (err) {
    console.error('Error fetching battles:', err);
    battlesList.innerHTML = `
      <div class="p-4 text-center text-red-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-xl font-semibold mb-2">Could not load battles</p>
        <p>Error: ${err.message}. Please check the console for more details.</p>
        <button id="retryBtn" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Retry</button>
      </div>
    `;
    
    // Add retry button functionality
    document.getElementById('retryBtn')?.addEventListener('click', fetchAndRenderBattles);
  }
}

// Get appropriate message based on current filters
function getNoResultsMessage() {
  if (currentFilters.bookmarksOnly) {
    return "You haven't bookmarked any battles yet.";
  }
  
  if (currentFilters.search) {
    return `No battles found matching "${currentFilters.search}".`;
  }
  
  if (currentFilters.category) {
    return `No battles found in the ${currentFilters.category} category.`;
  }
  
  if (currentTab === 'active') {
    return "There are no active battles right now.";
  }
  
  if (currentTab === 'finished') {
    return "No finished battles found.";
  }
  
  return "No battles found.";
}

// Set up lazy loading for images
function setupLazyLoading() {
  const lazyImages = document.querySelectorAll('.battle-item img');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
          }
          
          imageObserver.unobserve(img);
        }
      });
    });
    
    lazyImages.forEach(img => {
      // Set placeholder and move the real src to data-src
      const originalSrc = img.src;
      if (originalSrc && !originalSrc.includes('placeholder')) {
        img.setAttribute('data-src', originalSrc);
        img.src = 'https://via.placeholder.com/300?text=Loading...';
        imageObserver.observe(img);
      }
    });
  }
}// Load user settings from localStorage
function loadUserSettings() {
  // Check if user ID exists, create if not
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `user_${Math.random().toString(36).substring(2)}`;
    localStorage.setItem('userId', userId);
  }
  
  // Load user theme preference
  const theme = localStorage.getItem('theme') || 'light';
  applyTheme(theme);
  
  // Check for returning user
  const lastVisit = localStorage.getItem('lastVisit');
  const now = new Date().toISOString();
  
  if (lastVisit) {
    // Returning user - calculate days since last visit
    const daysSinceLastVisit = Math.floor((new Date(now) - new Date(lastVisit)) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastVisit > 7) {
      // Show welcome back message for users returning after a week
      showWelcomeBack(daysSinceLastVisit);
    }
  } else {
    // First time user - show onboarding
    showOnboarding();
  }
  
  // Update last visit timestamp
  localStorage.setItem('lastVisit', now);
}

// Apply theme to the page
function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
    
    // Add dark mode styles if not already in the document
    if (!document.getElementById('dark-mode-styles')) {
      const darkStyles = document.createElement('style');
      darkStyles.id = 'dark-mode-styles';
      darkStyles.textContent = `
        .dark-mode {
          background-color: #121212;
          color: #f5f5f5;
        }
        
        .dark-mode .bg-white {
          background-color: #1e1e1e;
        }
        
        .dark-mode .border {
          border-color: #2d2d2d;
        }
        
        .dark-mode .text-gray-700 {
          color: #d1d1d1;
        }
        
        .dark-mode .text-gray-500 {
          color: #aaaaaa;
        }
        
        .dark-mode .bg-gray-100 {
          background-color: #2d2d2d;
        }
        
        .dark-mode .bg-gray-200 {
          background-color: #333333;
        }
        
        .dark-mode input, .dark-mode select {
          background-color: #2d2d2d;
          color: #f5f5f5;
          border-color: #444444;
        }
      `;
      document.head.appendChild(darkStyles);
    }
  } else {
    document.body.classList.remove('dark-mode');
  }
}

// Show welcome back message
function showWelcomeBack(days) {
  const welcomeBack = document.createElement('div');
  welcomeBack.className = 'welcome-back fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 animate-slide-up';
  welcomeBack.innerHTML = `
    <div class="flex items-center justify-between">
      <p class="mr-4">Welcome back! It's been ${days} day${days !== 1 ? 's' : ''} since your last visit.</p>
      <button class="close-welcome text-white hover:text-blue-200">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  `;
  
  document.body.appendChild(welcomeBack);
  
  // Add style for animation if not exists
  if (!document.getElementById('welcome-animation')) {
    const style = document.createElement('style');
    style.id = 'welcome-animation';
    style.textContent = `
      @keyframes slide-up {
        0% { transform: translateY(100%); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
      }
      
      .animate-slide-up {
        animation: slide-up 0.5s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Add event listener to close button
  welcomeBack.querySelector('.close-welcome').addEventListener('click', function() {
    welcomeBack.remove();
  });
  
  // Auto-close after 10 seconds
  setTimeout(() => {
    if (document.body.contains(welcomeBack)) {
      welcomeBack.remove();
    }
  }, 10000);
}

// Show onboarding for first-time users
function showOnboarding() {
  // Create the onboarding overlay
  const onboarding = document.createElement('div');
  onboarding.className = 'onboarding-overlay fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50';
  
  onboarding.innerHTML = `
    <div class="onboarding-modal bg-white rounded-lg max-w-md mx-4 p-6 shadow-2xl">
      <h2 class="text-2xl font-bold mb-4">Welcome to FanShare Battles!</h2>
      
      <div class="steps-container">
        <div class="step active" data-step="1">
          <p class="mb-4">Create fun battles between two options and let the community vote!</p>
          <img src="https://via.placeholder.com/350x200?text=Create+Battles" alt="Create battles" class="rounded-lg mb-4">
        </div>
        
        <div class="step hidden" data-step="2">
          <p class="mb-4">Vote on your favorites and share with friends to make your opinion count!</p>
          <img src="https://via.placeholder.com/350x200?text=Vote+and+Share" alt="Vote and share" class="rounded-lg mb-4">
        </div>
        
        <div class="step hidden" data-step="3">
          <p class="mb-4">Track results and see which option the community likes best!</p>
          <img src="https://via.placeholder.com/350x200?text=Track+Results" alt="Track results" class="rounded-lg mb-4">
        </div>
      </div>
      
      <div class="dots-container flex justify-center gap-2 mb-4">
        <span class="dot active" data-step="1"></span>
        <span class="dot" data-step="2"></span>
        <span class="dot" data-step="3"></span>
      </div>
      
      <div class="flex justify-between">
        <button class="prev-btn px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 hidden">Previous</button>
        <button class="next-btn px-4 py-2 bg-blue-600 text-white rounded ml-auto">Next</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(onboarding);
  
  // Add style for onboarding
  if (!document.getElementById('onboarding-styles')) {
    const style = document.createElement('style');
    style.id = 'onboarding-styles';
    style.textContent = `
      .onboarding-overlay {
        z-index: 9999;
      }
      
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: #e2e8f0;
      }
      
      .dot.active {
        background-color: #3b82f6;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Set up navigation between steps
  let currentStep = 1;
  const totalSteps = 3;
  
  const nextBtn = onboarding.querySelector('.next-btn');
  const prevBtn = onboarding.querySelector('.prev-btn');
  
  nextBtn.addEventListener('click', function() {
    if (currentStep < totalSteps) {
      // Move to next step
      onboarding.querySelector(`.step[data-step="${currentStep}"]`).classList.add('hidden');
      onboarding.querySelector(`.dot[data-step="${currentStep}"]`).classList.remove('active');
      
      currentStep++;
      
      onboarding.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('hidden');
      onboarding.querySelector(`.dot[data-step="${currentStep}"]`).classList.add('active');
      
      // Show previous button
      prevBtn.classList.remove('hidden');
      
      // Change next button text on last step
      if (currentStep === totalSteps) {
        nextBtn.textContent = 'Get Started';
      }
    } else {
      // Close onboarding on the last step
      onboarding.remove();
    }
  });
  
  prevBtn.addEventListener('click', function() {
    if (currentStep > 1) {
      // Move to previous step
      onboarding.querySelector(`.step[data-step="${currentStep}"]`).classList.add('hidden');
      onboarding.querySelector(`.dot[data-step="${currentStep}"]`).classList.remove('active');
      
      currentStep--;
      
      onboarding.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('hidden');
      onboarding.querySelector(`.dot[data-step="${currentStep}"]`).classList.add('active');
      
      // Hide previous button on first step
      if (currentStep === 1) {
        prevBtn.classList.add('hidden');
      }
      
      // Reset next button text
      nextBtn.textContent = 'Next';
    }
  });
}// Add filter and search UI to the page
function addFilterAndSearchUI(container) {
  const filterContainer = document.createElement('div');
  filterContainer.className = 'filter-container bg-white sticky top-[112px] z-20 p-4 border-b border-gray-200 mb-4';
  
  filterContainer.innerHTML = `
    <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
      <div class="search-wrapper w-full md:w-1/2 relative">
        <input type="text" id="searchInput" placeholder="Search battles..." 
               class="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
             fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      
      <div class="filter-options flex gap-2 flex-wrap justify-center md:justify-end">
        <select id="categoryFilter" class="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Categories</option>
          <option value="music">Music</option>
          <option value="sports">Sports</option>
          <option value="food">Food</option>
          <option value="movies">Movies</option>
          <option value="technology">Technology</option>
        </select>
        
        <select id="sortFilter" class="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="newest">Newest</option>
          <option value="popular">Most Popular</option>
          <option value="ending">Ending Soon</option>
        </select>
        
        <button id="bookmarksFilter" class="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span>Bookmarks</span>
        </button>
      </div>
    </div>
  `;
  
  // Insert the filter container before the battles list
  container.parentNode.insertBefore(filterContainer, container);
  
  // Set up event listeners for filtering
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const sortFilter = document.getElementById('sortFilter');
  const bookmarksFilter = document.getElementById('bookmarksFilter');
  
  if (searchInput) {
    searchInput.addEventListener('input', debounce(function() {
      currentFilters.search = this.value.toLowerCase();
      fetchAndRenderBattles();
    }, 300));
  }
  
  if (categoryFilter) {
    categoryFilter.addEventListener('change', function() {
      currentFilters.category = this.value;
      fetchAndRenderBattles();
    });
  }
  
  if (sortFilter) {
    sortFilter.addEventListener('change', function() {
      currentFilters.sort = this.value;
      fetchAndRenderBattles();
    });
  }
  
  if (bookmarksFilter) {
    bookmarksFilter.addEventListener('click', function() {
      currentFilters.bookmarksOnly = !currentFilters.bookmarksOnly;
      this.classList.toggle('bg-blue-100');
      this.classList.toggle('text-blue-700');
      this.classList.toggle('bg-gray-100');
      this.classList.toggle('text-gray-700');
      fetchAndRenderBattles();
    });
  }
}

// Debounce function for search input
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

// Global filters object
let currentFilters = {
  search: '',
  category: '',
  sort: 'newest',
  bookmarksOnly: false
};// DOM ready function
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
    
    // Add filter and search elements
    addFilterAndSearchUI(battlesList);
    
    // Set up real-time subscriptions
    setupRealtimeSubscriptions();
    
    // Setup tab navigation
    setupTabs();
    
    // Set up battle creation form
    setupCreateBattleForm();
    
    // Set up share and vote handling
    setupEventHandlers();
    
    // Load user settings
    loadUserSettings();
    
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
});// Create confetti effect for voting
function createConfetti(x, y) {
  const colors = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff'];
  const confettiCount = 50;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = `${x}px`;
    confetti.style.top = `${y}px`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.width = `${Math.random() * 10 + 5}px`;
    confetti.style.height = `${Math.random() * 10 + 5}px`;
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    confetti.style.animationDuration = `${Math.random() * 2 + 1}s`;
    
    document.body.appendChild(confetti);
    
    // Remove confetti after animation
    setTimeout(() => {
      document.body.removeChild(confetti);
    }, 3000);
  }
}// Set up Supabase real-time subscriptions
function setupRealtimeSubscriptions() {
  try {
    console.log('Setting up real-time subscriptions...');
    
    // Subscribe to all changes in the battles table
    const subscription = window.supabaseClient
      .channel('battles-changes')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'battles' }, 
          handleBattleChange)
      .subscribe();
    
    console.log('Real-time subscription established');
    
    // Store the subscription for potential cleanup
    window.battlesSubscription = subscription;
  } catch (err) {
    console.error('Error setting up real-time subscriptions:', err);
  }
}

// Handle real-time battle changes
function handleBattleChange(payload) {
  console.log('Real-time update received:', payload);
  
  try {
    // Extract the changed battle data
    const changedBattle = payload.new;
    
    // Find if this battle is currently displayed
    const existingBattleIndex = currentBattles.findIndex(b => b.id === changedBattle.id);
    
    if (existingBattleIndex >= 0) {
      // Update the battle in our current list
      console.log(`Updating battle ID ${changedBattle.id} in real-time`);
      
      // Update the battle in memory
      currentBattles[existingBattleIndex] = changedBattle;
      
      // Update the progress bar in the DOM
      const progressBarContainer = document.getElementById(`progress-${changedBattle.id}`);
      if (progressBarContainer) {
        progressBarContainer.innerHTML = renderProgressBar(changedBattle.votes1, changedBattle.votes2, changedBattle.id);
        
        // Add animation class
        progressBarContainer.classList.add('progress-updated');
        
        // Remove animation class after animation completes
        setTimeout(() => {
          progressBarContainer.classList.remove('progress-updated');
        }, 1000);
      }
    }
  } catch (err) {
    console.error('Error handling real-time update:', err);
  }
}// Global variables
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
          // Show visual feedback immediately
          e.target.classList.add('bg-opacity-70');
          e.target.innerHTML = '<span class="inline-block animate-pulse">Voting...</span>';
          
          // Create confetti effect
          createConfetti(e.clientX, e.clientY);
          
          // Check if user already voted
          const userId = localStorage.getItem('userId') || `user_${Math.random().toString(36).substring(2)}`;
          localStorage.setItem('userId', userId);
          
          const voteKey = `vote_${battleId}`;
          if (localStorage.getItem(voteKey)) {
            alert('You have already voted on this battle!');
            e.target.classList.remove('bg-opacity-70');
            e.target.innerText = 'Vote';
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
          
          // Reset button state after successful vote
          setTimeout(() => {
            e.target.classList.remove('bg-opacity-70');
            e.target.innerText = 'Voted!';
            
            // Changes the button appearance to indicate already voted
            e.target.disabled = true;
            e.target.classList.add('opacity-75');
            
            // Update the opposite button too
            const oppositeOpt = voteOpt === 'votes1' ? 'votes2' : 'votes1';
            const oppositeBtn = document.querySelector(`.vote-btn[data-battle="${battleId}"][data-opt="${oppositeOpt}"]`);
            if (oppositeBtn) {
              oppositeBtn.disabled = true;
              oppositeBtn.classList.add('opacity-75');
            }
          }, 500);
          
        } catch (err) {
          console.error('Error voting:', err);
          alert('Could not register vote. Please try again.');
          e.target.classList.remove('bg-opacity-70');
          e.target.innerText = 'Vote';
        }
      }
      
      // Handle bookmark button click
      if (e.target.closest('.bookmark-btn')) {
        const bookmarkBtn = e.target.closest('.bookmark-btn');
        const battleId = bookmarkBtn.dataset.battle;
        
        // Toggle bookmark state
        const bookmarkKey = `bookmark_${battleId}`;
        const isBookmarked = localStorage.getItem(bookmarkKey) === 'true';
        
        if (isBookmarked) {
          localStorage.removeItem(bookmarkKey);
          bookmarkBtn.classList.remove('text-yellow-500');
          bookmarkBtn.classList.add('text-gray-500');
        } else {
          localStorage.setItem(bookmarkKey, 'true');
          bookmarkBtn.classList.remove('text-gray-500');
          bookmarkBtn.classList.add('text-yellow-500');
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
  return `
    <div class="battle-item border-b pb-6 hover:bg-gray-50 transition-colors duration-300 rounded-lg p-4">
      <a href="battle.html?id=${b.id}" class="text-2xl font-semibold mb-2 hover:text-blue-600 transition underline-offset-2 hover:underline inline-block">${b.title}</a>
      
      <!-- VS image layout with table-like structure for perfect alignment -->
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
      
      <!-- Options and vote buttons -->
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
      
      <div id="progress-${b.id}" class="progress-bar-container">
        ${renderProgressBar(b.votes1, b.votes2, b.id)}
      </div>
      <div id="timer-${b.id}" class="text-xs text-gray-500 pt-1">${active ? `Time Left: ${calculateTimeLeft(b.ends_at)}` : 'Finished'}</div>
      
      <!-- Share and bookmark buttons -->
      <div class="flex justify-end mt-3 gap-2">
        <button class="text-gray-500 hover:text-blue-600 transition-colors share-btn p-2 rounded-full hover:bg-blue-50" data-battle="${b.id}">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
        <button class="text-gray-500 hover:text-yellow-500 transition-colors bookmark-btn p-2 rounded-full hover:bg-yellow-50" data-battle="${b.id}">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>
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
