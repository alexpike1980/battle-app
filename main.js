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
  
  // Flag to use mock data
  let useMockData = false;
  
  function initSupabase() {
    if (typeof window.supabase === 'undefined') {
      console.error('Supabase client is not loaded. Please include the script in your HTML.');
      return false;
    }
    
    try {
      // Updated with your actual Supabase credentials
      supabase = window.supabase.createClient(
        'https://oleqibxqfwnvaorqgflp.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA'
      );
      console.log('Supabase client created with your database credentials');
      
      // Test the connection immediately
      return testSupabaseConnection();
    } catch (error) {
      console.error('Error initializing Supabase:', error);
      return false;
    }
  }
  
  // Test Supabase connection
  async function testSupabaseConnection() {
    try {
      console.log('Testing connection to your Supabase database...');
      const { data, error } = await supabase
        .from('battles')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('Database connection test failed:', error);
        return false;
      }
      
      console.log('✅ Successfully connected to your Supabase database!');
      useMockData = false;
      return true;
    } catch (error) {
      console.error('Database connection test error:', error);
      return false;
    }
  }
  
  // Database functions
  async function getBattles() {
    try {
      const { data, error } = await supabase
        .from('battles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      console.log('=== DATABASE BATTLES ===');
      console.log('Total battles found:', data?.length || 0);
      
      if (data && data.length > 0) {
        data.forEach((battle, index) => {
          console.log(`\n--- Battle ${index + 1} ---`);
          console.log('ID:', battle.id);
          console.log('Title:', battle.title);
          console.log('Option1:', battle.option1);
          console.log('Option2:', battle.option2);
          console.log('Image1 raw:', JSON.stringify(battle.image1));
          console.log('Image2 raw:', JSON.stringify(battle.image2));
          console.log('Image1 length:', battle.image1?.length || 0);
          console.log('Image2 length:', battle.image2?.length || 0);
          console.log('Votes1:', battle.votes1);
          console.log('Votes2:', battle.votes2);
        });
        
        // Show the first battle's full data structure
        console.log('\n=== FIRST BATTLE FULL DATA ===');
        console.log(JSON.stringify(data[0], null, 2));
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching battles from database:', error);
      return [];
    }
  }
  
  async function createBattle(battleData) {
    try {
      console.log('Creating battle in database:', battleData);
      const { data, error } = await supabase
        .from('battles')
        .insert([battleData])
        .select();
      
      if (error) throw error;
      console.log('Battle created successfully:', data[0]);
      return data[0];
    } catch (error) {
      console.error('Error creating battle in database:', error);
      throw error;
    }
  }
  
  async function vote(battleId, option) {
    try {
      console.log(`Voting for battle ${battleId}, option: ${option}`);
      
      // First, get the current battle data
      const { data: battle, error: fetchError } = await supabase
        .from('battles')
        .select('*')
        .eq('id', battleId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Check if battle is still active
      if (new Date(battle.ends_at) <= new Date()) {
        throw new Error('This battle has ended');
      }
      
      // Update the vote count
      const currentVotes = parseInt(battle[option]) || 0;
      const updateData = {};
      updateData[option] = currentVotes + 1;
      
      const { data, error } = await supabase
        .from('battles')
        .update(updateData)
        .eq('id', battleId)
        .select();
      
      if (error) throw error;
      console.log('Vote recorded successfully');
      return data[0];
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
    console.log('=== RENDERING BATTLE ===');
    console.log('Battle title:', battle.title);
    console.log('Battle image1 raw:', battle.image1);
    console.log('Battle image2 raw:', battle.image2);
    
    const isActive = new Date(battle.ends_at) > new Date();
    const votes1 = parseInt(battle.votes1) || 0;
    const votes2 = parseInt(battle.votes2) || 0;
    const total = votes1 + votes2;
    
    // Check if we have real, valid image URLs
    const hasRealImage1 = battle.image1 && battle.image1.trim() !== '' && battle.image1.startsWith('http');
    const hasRealImage2 = battle.image2 && battle.image2.trim() !== '' && battle.image2.startsWith('http');
    
    console.log('Has real image1:', hasRealImage1);
    console.log('Has real image2:', hasRealImage2);
    
    // Determine winner for finished battles
    let winner = null;
    if (!isActive && total > 0) {
      if (votes1 > votes2) winner = 1;
      else if (votes2 > votes1) winner = 2;
    }
    
    const battleEl = document.createElement('div');
    battleEl.className = 'bg-white py-6 px-4 flex flex-col gap-4 border-b border-gray-200 mb-4';
    
    // Generate button/badge content based on battle status
    let option1Content, option2Content;
    
    if (isActive) {
      option1Content = `<button class="bg-blue-600 text-white py-3 mt-3 rounded-lg font-bold w-full text-lg transition hover:bg-blue-700 vote-btn cursor-pointer" data-battle="${battle.id}" data-opt="votes1">Vote</button>`;
      option2Content = `<button class="bg-green-600 text-white py-3 mt-3 rounded-lg font-bold w-full text-lg transition hover:bg-green-700 vote-btn cursor-pointer" data-battle="${battle.id}" data-opt="votes2">Vote</button>`;
    } else {
      if (winner === 1) {
        option1Content = `<div class="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white py-3 mt-3 rounded-lg font-bold w-full text-lg text-center shadow-lg">🏆 WINNER</div>`;
        option2Content = `<div class="mt-3 h-12"></div>`;
      } else if (winner === 2) {
        option1Content = `<div class="mt-3 h-12"></div>`;
        option2Content = `<div class="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white py-3 mt-3 rounded-lg font-bold w-full text-lg text-center shadow-lg">🏆 WINNER</div>`;
      } else {
        option1Content = `<div class="bg-gray-300 text-gray-600 py-3 mt-3 rounded-lg font-bold w-full text-lg text-center">TIE</div>`;
        option2Content = `<div class="bg-gray-300 text-gray-600 py-3 mt-3 rounded-lg font-bold w-full text-lg text-center">TIE</div>`;
      }
    }
    
    // Create image content - either real img tag or CSS placeholder
    const image1Content = hasRealImage1 
      ? `<img src="${battle.image1.trim()}" alt="${battle.option1}" class="object-cover rounded-lg w-full max-w-[280px] h-[200px] sm:w-[240px] sm:h-[180px]" 
           onload="console.log('Image 1 loaded successfully')"
           onerror="console.log('Image 1 failed, hiding'); this.style.display='none'; this.nextElementSibling.style.display='flex';" />
         <div class="hidden w-full max-w-[280px] h-[200px] sm:w-[240px] sm:h-[180px] bg-blue-500 text-white rounded-lg items-center justify-center font-bold text-lg text-center p-4">
           ${battle.option1}
         </div>`
      : `<div class="w-full max-w-[280px] h-[200px] sm:w-[240px] sm:h-[180px] bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-xl text-center p-4 shadow-lg">
           ${battle.option1}
         </div>`;
         
    const image2Content = hasRealImage2 
      ? `<img src="${battle.image2.trim()}" alt="${battle.option2}" class="object-cover rounded-lg w-full max-w-[280px] h-[200px] sm:w-[240px] sm:h-[180px]" 
           onload="console.log('Image 2 loaded successfully')"
           onerror="console.log('Image 2 failed, hiding'); this.style.display='none'; this.nextElementSibling.style.display='flex';" />
         <div class="hidden w-full max-w-[280px] h-[200px] sm:w-[240px] sm:h-[180px] bg-green-500 text-white rounded-lg items-center justify-center font-bold text-lg text-center p-4">
           ${battle.option2}
         </div>`
      : `<div class="w-full max-w-[280px] h-[200px] sm:w-[240px] sm:h-[180px] bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg flex items-center justify-center font-bold text-xl text-center p-4 shadow-lg">
           ${battle.option2}
         </div>`;
    
    battleEl.innerHTML = `
      <div class="max-w-2xl mx-auto w-full">
        <a href="battle.html?id=${battle.id}" class="text-xl md:text-2xl font-semibold mb-4 hover:text-blue-600 transition underline-offset-2 hover:underline inline-block">${battle.title}</a>
        
        <div class="relative flex flex-col sm:flex-row gap-4 justify-center items-center">
          <!-- Option 1 -->
          <div class="flex flex-col items-center w-full sm:w-auto">
            <div class="relative">
              ${image1Content}
            </div>
            <div class="option-title mt-3 font-semibold text-lg text-center ${winner === 1 ? 'text-yellow-600' : ''}">${battle.option1}</div>
            <div class="w-full max-w-[280px] sm:max-w-[240px]">
              ${option1Content}
            </div>
          </div>
          
          <!-- VS Circle -->
          <div class="flex items-center justify-center py-4 sm:py-0">
            <div class="bg-white flex items-center justify-center text-lg font-bold w-14 h-14 border-2 border-gray-200 shadow-md rounded-full">VS</div>
          </div>
          
          <!-- Option 2 -->
          <div class="flex flex-col items-center w-full sm:w-auto">
            <div class="relative">
              ${image2Content}
            </div>
            <div class="option-title mt-3 font-semibold text-lg text-center ${winner === 2 ? 'text-yellow-600' : ''}">${battle.option2}</div>
            <div class="w-full max-w-[280px] sm:max-w-[240px]">
              ${option2Content}
            </div>
          </div>
        </div>
        
        <!-- Progress Bar -->
        <div class="mt-6">
          <div id="progress-${battle.id}" class="w-full max-w-lg mx-auto">
            ${renderProgressBar(battle.votes1, battle.votes2)}
          </div>
        </div>
        
        <!-- Timer -->
        <div id="timer-${battle.id}" class="text-sm text-gray-500 pt-2 text-center">${isActive ? 'Time Left: ' + calculateTimeLeft(battle.ends_at) : '🏁 Final Results'}</div>
      </div>
    `;
    
    console.log('Battle HTML created, appending to container');
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
            timerEl.textContent = '🏁 Final Results';
            clearInterval(state.timers[battle.id]);
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
      console.log('Battles loaded:', battles); // Debug log
      
      if (!battles || battles.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-gray-500">No battles found.</div>';
        updateSidebarStats(0, 0, 0);
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
      
      console.log('Filtered battles for display:', filteredBattles); // Debug log
      
      if (filteredBattles.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-gray-500">No battles in this category.</div>';
        updateSidebarStats(battles.length, battles.filter(b => new Date(b.ends_at) > new Date()).length, 0);
        return;
      }
      
      container.innerHTML = '';
      filteredBattles.forEach(battle => {
        console.log('Rendering battle:', battle); // Debug log
        renderBattle(battle, container);
      });
      
      // Update sidebar stats
      const activeBattles = battles.filter(b => new Date(b.ends_at) > new Date()).length;
      const totalVotes = battles.reduce((sum, b) => sum + (parseInt(b.votes1) || 0) + (parseInt(b.votes2) || 0), 0);
      updateSidebarStats(battles.length, activeBattles, totalVotes);
      
      // Set up vote buttons after rendering
      setupVoteButtons();
    }).catch(error => {
      console.error('Error loading battles:', error);
      container.innerHTML = '<div class="text-center py-8 text-red-500">Error loading battles. Please try again.</div>';
    });
  }
  
  // Update sidebar statistics
  function updateSidebarStats(total, active, votes) {
    const totalEl = document.getElementById('total-battles');
    const activeEl = document.getElementById('active-battles');
    const votesEl = document.getElementById('total-votes');
    
    if (totalEl) totalEl.textContent = total.toLocaleString();
    if (activeEl) activeEl.textContent = active.toLocaleString();
    if (votesEl) votesEl.textContent = votes.toLocaleString();
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
    
    // Hide previews
    document.getElementById('preview1').classList.add('hidden');
    document.getElementById('preview2').classList.add('hidden');
    
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
  
  // Image preview functions
  function previewImage(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const img = document.getElementById(previewId + '-img');
    
    if (input.value.trim()) {
      img.src = input.value;
      preview.classList.remove('hidden');
      
      // Handle image load errors
      img.onerror = function() {
        preview.classList.add('hidden');
      };
    } else {
      preview.classList.add('hidden');
    }
  }
  
  function removePreview(previewId, inputId) {
    document.getElementById(previewId).classList.add('hidden');
    document.getElementById(inputId).value = '';
  }
  
  // Image upload handler with Supabase Storage
  async function handleImageUpload(input, targetInputId) {
    const file = input.files[0];
    if (!file) return;
    
    // Show loading state
    const targetInput = document.getElementById(targetInputId);
    const originalValue = targetInput.value;
    targetInput.value = 'Uploading...';
    targetInput.disabled = true;
    
    try {
      console.log('Uploading file to Supabase Storage:', file.name);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `battle-images/${fileName}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('images')  // Make sure this bucket exists in your Supabase project
        .upload(filePath, file);
      
      if (error) {
        console.error('Upload error:', error);
        throw error;
      }
      
      console.log('File uploaded successfully:', data);
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);
      
      console.log('Public URL:', publicUrl);
      
      // Set the URL in the input
      targetInput.value = publicUrl;
      targetInput.disabled = false;
      
      // Trigger preview
      const previewId = targetInputId === 'image1' ? 'preview1' : 'preview2';
      previewImage(targetInputId, previewId);
      
      alert('Image uploaded successfully!');
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image: ' + error.message);
      
      // Restore original state
      targetInput.value = originalValue;
      targetInput.disabled = false;
    }
  }
  
  // Test function to create a battle with working images
  async function createTestBattle() {
    try {
      const testBattle = {
        title: "Cat vs Dog",
        option1: "Cat",
        option2: "Dog", 
        image1: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&h=200&fit=crop",
        image2: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&h=200&fit=crop",
        votes1: 0,
        votes2: 0,
        ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      };
      
      console.log('Creating test battle:', testBattle);
      const result = await createBattle(testBattle);
      console.log('Test battle created:', result);
      
      // Reload battles to show the new one
      loadBattles();
      alert('Test battle created with real images!');
    } catch (error) {
      console.error('Error creating test battle:', error);
      alert('Error creating test battle: ' + error.message);
    }
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
  
  function shareToFacebook() {
    const battleUrl = window.location.origin + '/battle.html?id=' + window.currentBattleId;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(battleUrl)}`;
    window.open(facebookUrl, '_blank');
  }
  
  function shareToReddit() {
    const battleUrl = window.location.origin + '/battle.html?id=' + window.currentBattleId;
    const title = encodeURIComponent('Epic Battle - Vote Now!');
    const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(battleUrl)}&title=${title}`;
    window.open(redditUrl, '_blank');
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
    console.log('🚀 Initializing FanShare Battle App...');
    
    // Check if Supabase is available and test connection
    const dbReady = await initSupabase();
    if (!dbReady) {
      document.getElementById('battles-container').innerHTML = '<div class="text-center py-8 text-red-500">❌ Error: Could not connect to database. Please try again later.</div>';
      return;
    }
    
    // Test storage access
    await testStorageAccess();
    
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
    
    console.log('✅ App initialized successfully!');
  }
  
  // Test storage access and provide setup instructions
  async function testStorageAccess() {
    try {
      console.log('Testing Supabase Storage access...');
      
      // Try to list buckets
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Storage access error:', error);
        console.log('📋 SETUP REQUIRED: Please create a storage bucket named "images" in your Supabase dashboard');
        return;
      }
      
      console.log('Available storage buckets:', data);
      
      // Check if 'images' bucket exists
      const imagesBucket = data.find(bucket => bucket.name === 'images');
      if (!imagesBucket) {
        console.warn('⚠️ SETUP REQUIRED: Please create a storage bucket named "images" in your Supabase dashboard');
        console.log('Instructions:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to Storage');
        console.log('3. Create a new bucket named "images"');
        console.log('4. Set it to public if you want images to be publicly accessible');
      } else {
        console.log('✅ Images bucket found and ready to use');
      }
    } catch (error) {
      console.error('Storage test failed:', error);
      console.log('📋 SETUP REQUIRED: Please set up Supabase Storage');
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
  window.shareToFacebook = shareToFacebook;
  window.shareToReddit = shareToReddit;
  window.copyLink = copyLink;
  window.previewImage = previewImage;
  window.removePreview = removePreview;
  window.createTestBattle = createTestBattle;
  
  // Run when DOM is loaded
  document.addEventListener('DOMContentLoaded', init);
  
})();
