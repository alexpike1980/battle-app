// Minimal stable solution - focus only on battle display
(function() {
  // Global variables with safe initialization
  const state = {
    currentTab: 'featured',
    battles: [],
    timers: {}
  };

  // Wait for DOM to be fully loaded
  window.addEventListener('DOMContentLoaded', initializeApp);

  // Initialize the application safely
  function initializeApp() {
    console.log('Initializing app...');
    
    // Safely check for Supabase
    if (typeof supabase === 'undefined') {
      showError('Supabase client is not loaded. Please include the script in your HTML.');
      return;
    }
    
    // Initialize Supabase client with safe error handling
    try {
      const supabaseUrl = 'https://oleqibxqfwnvaorqgflp.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';
      window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
      console.log('Supabase initialized successfully');
    } catch (err) {
      showError('Error initializing Supabase: ' + err.message);
      return;
    }
    
    // Set up event listeners safely
    setupEventListeners();
    
    // Load battles immediately
    loadBattles();
  }

  // Show error message in a visible way
  function showError(message) {
    console.error(message);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'p-4 bg-red-100 text-red-700 rounded-lg mb-4';
    errorDiv.innerHTML = `<p>Error: ${message}</p>`;
    
    // Try to insert at various locations for maximum visibility
    const possibleContainers = [
      document.getElementById('battleList'),
      document.querySelector('main'),
      document.querySelector('.boxed'),
      document.body
    ];
    
    for (const container of possibleContainers) {
      if (container) {
        if (container === document.body) {
          container.prepend(errorDiv);
        } else {
          container.innerHTML = '';
          container.appendChild(errorDiv);
        }
        break;
      }
    }
  }

  // Set up event listeners
  function setupEventListeners() {
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(t => 
          t.classList.remove('active'));
        this.classList.add('active');
        
        // Update current tab and load battles
        state.currentTab = this.dataset.tab || 'featured';
        loadBattles();
      });
    });
    
    // Create battle button(s)
    const createButtons = [
      document.getElementById('createBattleBtn'),
      document.getElementById('createBattleBtn2'),
      document.getElementById('navFab')
    ];
    
    createButtons.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', showCreateModal);
      }
    });
    
    // Close modal button(s)
    const closeButtons = [
      document.getElementById('cancelCreateBtn'),
      document.getElementById('shareCloseBtn')
    ];
    
    closeButtons.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', function() {
          const modalId = this.dataset.modal || 'createModal';
          const modal = document.getElementById(modalId);
          if (modal) {
            modal.classList.add('hidden');
          }
        });
      }
    });
    
    // Background clicks on modals
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', function(e) {
        if (e.target === this) {
          this.classList.add('hidden');
        }
      });
    });
    
    // Submit battle button
    const submitBtn = document.getElementById('submitBattleBtn');
    if (submitBtn) {
      submitBtn.addEventListener('click', handleBattleSubmit);
    }
    
    // Setup image upload previews
    setupImageUploadPreviews();
  }
  
  // Setup image upload previews
  function setupImageUploadPreviews() {
    // Find image upload inputs
    const image1File = document.getElementById('image1File');
    const image2File = document.getElementById('image2File');
    
    if (image1File) {
      // Create preview container if it doesn't exist
      let previewContainer = document.getElementById('image1Preview');
      if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.id = 'image1Preview';
        previewContainer.className = 'mt-2';
        image1File.parentNode.appendChild(previewContainer);
      }
      
      // Add change event listener
      image1File.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
          const reader = new FileReader();
          reader.onload = function(event) {
            previewContainer.innerHTML = `<img src="${event.target.result}" class="rounded-lg w-32 h-32 object-cover">`;
          };
          reader.readAsDataURL(this.files[0]);
        }
      });
    }
    
    if (image2File) {
      // Create preview container if it doesn't exist
      let previewContainer = document.getElementById('image2Preview');
      if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.id = 'image2Preview';
        previewContainer.className = 'mt-2';
        image2File.parentNode.appendChild(previewContainer);
      }
      
      // Add change event listener
      image2File.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
          const reader = new FileReader();
          reader.onload = function(event) {
            previewContainer.innerHTML = `<img src="${event.target.result}" class="rounded-lg w-32 h-32 object-cover">`;
          };
          reader.readAsDataURL(this.files[0]);
        }
      });
    }
  }
  
  // Show create modal
  function showCreateModal() {
    const modal = document.getElementById('createModal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }
  
  // Handle battle submit
  function handleBattleSubmit() {
    const submitBtn = document.getElementById('submitBattleBtn');
    if (!submitBtn) return;
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';
    
    // Get form values
    const title = document.getElementById('title')?.value || '';
    const option1 = document.getElementById('option1')?.value || '';
    const option2 = document.getElementById('option2')?.value || '';
    
    // Validation
    if (!title || !option1 || !option2) {
      alert('Please fill in all required fields');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
      return;
    }
    
    // Calculate end time (24 hours from now)
    const endsAt = new Date();
    endsAt.setHours(endsAt.getHours() + 24);
    
    // Check if we need to upload images
    const image1File = document.getElementById('image1File');
    const image2File = document.getElementById('image2File');
    const hasImage1 = image1File && image1File.files && image1File.files.length > 0;
    const hasImage2 = image2File && image2File.files && image2File.files.length > 0;
    
    // Prepare battle data
    const battleData = {
      title,
      option1,
      option2,
      image1: 'https://via.placeholder.com/300',
      image2: 'https://via.placeholder.com/300',
      votes1: 0,
      votes2: 0,
      ends_at: endsAt.toISOString(),
      created_at: new Date().toISOString()
    };
    
    // If we have images to upload
    if (hasImage1 || hasImage2) {
      const promises = [];
      
      // Upload image 1
      if (hasImage1) {
        promises.push(uploadImage(image1File.files[0], 'battle-images')
          .then(url => {
            if (url) battleData.image1 = url;
          }));
      }
      
      // Upload image 2
      if (hasImage2) {
        promises.push(uploadImage(image2File.files[0], 'battle-images')
          .then(url => {
            if (url) battleData.image2 = url;
          }));
      }
      
      // Wait for uploads to complete
      Promise.all(promises)
        .then(() => createBattle(battleData, submitBtn))
        .catch(err => {
          console.error('Error uploading images:', err);
          alert('Error uploading images. Please try again.');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit';
        });
    } else {
      // No images to upload, create battle directly
      createBattle(battleData, submitBtn);
    }
  }
  
  // Upload image to Supabase storage
  function uploadImage(file, path) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }
      
      try {
        // Create a unique file name
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${path}/${fileName}`;
        
        // Upload the file
        window.supabaseClient.storage
          .from('battle-images')
          .upload(filePath, file)
          .then(({ data, error }) => {
            if (error) {
              console.error('Storage upload error:', error);
              reject(error);
              return;
            }
            
            // Get the public URL
            const { data: { publicUrl } } = window.supabaseClient.storage
              .from('battle-images')
              .getPublicUrl(filePath);
              
            resolve(publicUrl);
          })
          .catch(reject);
      } catch (err) {
        console.error('Error in uploadImage:', err);
        reject(err);
      }
    });
  }
  
  // Create battle in database
  function createBattle(battleData, submitBtn) {
    window.supabaseClient.from('battles').insert([battleData])
      .then(({ data, error }) => {
        if (error) {
          alert('Error creating battle: ' + error.message);
          console.error('Error creating battle:', error);
        } else {
          // Reset form
          document.getElementById('title').value = '';
          document.getElementById('option1').value = '';
          document.getElementById('option2').value = '';
          
          // Clear image previews
          const preview1 = document.getElementById('image1Preview');
          const preview2 = document.getElementById('image2Preview');
          if (preview1) preview1.innerHTML = '';
          if (preview2) preview2.innerHTML = '';
          
          // Reset file inputs
          const image1File = document.getElementById('image1File');
          const image2File = document.getElementById('image2File');
          if (image1File) image1File.value = '';
          if (image2File) image2File.value = '';
          
          // Hide modal
          document.getElementById('createModal').classList.add('hidden');
          
          // Reload battles
          loadBattles();
          
          // Show success message
          alert('Battle created successfully!');
        }
        
        // Reset button
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit';
        }
      })
      .catch(err => {
        alert('Unexpected error: ' + err.message);
        console.error('Unexpected error:', err);
        
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit';
        }
      });
  }

  // Load battles from Supabase
  function loadBattles() {
    // Find container
    const battlesList = document.getElementById('battleList');
    if (!battlesList) {
      console.error('Battle list container not found');
      return;
    }
    
    // Show loading state
    battlesList.innerHTML = '<div class="p-4 text-center">Loading battles...</div>';
    
    // Build query
    const now = new Date().toISOString();
    let query = window.supabaseClient.from('battles').select('*');
    
    // Apply tab filter
    if (state.currentTab === 'active') {
      query = query.gt('ends_at', now);
    } else if (state.currentTab === 'finished') {
      query = query.lte('ends_at', now);
    }
    
    // Sort by created date (newest first)
    query = query.order('created_at', { ascending: false });
    
    // Execute query
    query.then(({ data, error }) => {
      if (error) {
        battlesList.innerHTML = `<div class="p-4 text-center text-red-500">Error loading battles: ${error.message}</div>`;
        console.error('Error loading battles:', error);
        return;
      }
      
      // Update state
      state.battles = data || [];
      
      // Clear timers
      Object.values(state.timers).forEach(timer => clearInterval(timer));
      state.timers = {};
      
      // Handle empty state
      if (state.battles.length === 0) {
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
      state.battles.forEach(battle => renderBattle(battle, battlesList));
      
      // Set up vote buttons
      setupVoteButtons();
    }).catch(err => {
      battlesList.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${err.message}</div>`;
      console.error('Unexpected error:', err);
    });
  }

  // Render a single battle
  function renderBattle(battle, container) {
    const isActive = new Date(battle.ends_at) > new Date();
    
    const battleEl = document.createElement('div');
    battleEl.className = 'bg-white py-8 px-2 md:px-6 flex flex-col gap-2 border-b border-gray-200 mb-2';
    
    battleEl.innerHTML = `
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
      <div class="mt-3 overflow-hidden rounded-full">
        <div id="progress-${battle.id}" class="flex w-full">
          ${renderProgressBar(battle.votes1, battle.votes2)}
        </div>
      </div>
      <div id="timer-${battle.id}" class="text-xs text-gray-500 pt-1">${isActive ? 'Time Left: ' + calculateTimeLeft(battle.ends_at) : 'Finished'}</div>
    `;
    
    container.appendChild(battleEl);
    
    // Set up timer for active battles
    if (isActive) {
      state.timers[battle.id] = setInterval(() => {
        const timerEl = document.getElementById(`timer-${battle.id}`);
        if (timerEl) {
          timerEl.textContent = 'Time Left: ' + calculateTimeLeft(battle.ends_at);
        } else {
          clearInterval(state.timers[battle.id]);
        }
      }, 1000);
    }
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
    
    // Set share links
    const fbShare = document.getElementById('facebookShare');
    const twShare = document.getElementById('twitterShare');
    const rdShare = document.getElementById('redditShare');
    
    if (fbShare) fbShare.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`;
    if (twShare) twShare.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    if (rdShare) rdShare.href = `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
    
    // Clear old event listeners
    document.querySelectorAll('#shareModal a').forEach(link => {
      const clone = link.cloneNode(true);
      if (link.parentNode) {
        link.parentNode.replaceChild(clone, link);
      }
    });
    
    // Add new event listeners
    document.querySelectorAll('#shareModal a').forEach(link => {
      link.onclick = function(event) {
        event.preventDefault();
        
        // Get battle details
        const col = option === 'votes1' ? 'votes1' : 'votes2';
        
        // Get current votes
        window.supabaseClient.from('battles')
          .select('*')
          .eq('id', battleId)
          .single()
          .then(({ data, error }) => {
            if (error) {
              alert('Error getting battle details');
              console.error('Error:', error);
              return;
            }
            
            // Update votes
            const battle = data;
            const newVotes = (battle[col] || 0) + 1;
            const updateObj = {};
            updateObj[col] = newVotes;
            
            window.supabaseClient.from('battles')
              .update(updateObj)
              .eq('id', battleId)
              .then(({ error: updateError }) => {
                if (updateError) {
                  alert('Error updating vote');
                  console.error('Update error:', updateError);
                  return;
                }
                
                // Update UI
                const votes1 = col === 'votes1' ? newVotes : battle.votes1;
                const votes2 = col === 'votes2' ? newVotes : battle.votes2;
                const progressBar = document.getElementById(`progress-${battleId}`);
                
                if (progressBar) {
                  progressBar.innerHTML = renderProgressBar(votes1, votes2);
                }
                
                // Open share window
                window.open(this.href, '_blank');
                
                // Close modal
                modal.classList.add('hidden');
              });
          });
      };
    });
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
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (seconds) parts.push(`${seconds}s`);
    
    return parts.join(' ');
  }

  // Render progress bar
  function renderProgressBar(votes1, votes2) {
    votes1 = parseInt(votes1) || 0;
    votes2 = parseInt(votes2) || 0;
    const total = votes1 + votes2;
    
    // Default to 50/50 if no votes
    let p1 = 50, p2 = 50;
    
    if (total > 0) {
      p1 = Math.round((votes1 / total) * 100);
      p2 = 100 - p1;
    }
    
    // Ensure minimum width for display
    const minWidth = total > 0 ? 10 : 50;
    let w1 = `${p1}%`;
    let w2 = `${p2}%`;
    
    // Adjust for small percentages
    if (p1 < minWidth && total > 0) w1 = `${minWidth}%`;
    if (p2 < minWidth && total > 0) w2 = `${minWidth}%`;
    
    return `
      <div class="flex-1 rounded-l-full bg-blue-600 h-10 flex items-center px-3 text-white text-lg font-semibold" style="width:${w1};">
        ${votes1} (${p1}%)
      </div>
      <div class="flex-1 rounded-r-full bg-green-600 h-10 flex items-center justify-end px-3 text-white text-lg font-semibold" style="width:${w2};">
        ${votes2} (${p2}%)
      </div>
    `;
  }
})();
