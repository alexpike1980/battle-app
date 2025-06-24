// Initialize Supabase
const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State
let currentTab = 'featured';
let currentCategory = '';
let durationType = 'minutes';
let currentBattleForShare = null;

// Category configuration
const categories = {
  sports: { emoji: '🏈', name: 'Sports' },
  food: { emoji: '🍔', name: 'Food & Drink' },
  tech: { emoji: '💻', name: 'Technology' },
  entertainment: { emoji: '🎬', name: 'Entertainment' },
  music: { emoji: '🎵', name: 'Music' },
  gaming: { emoji: '🎮', name: 'Gaming' },
  fashion: { emoji: '👗', name: 'Fashion' },
  lifestyle: { emoji: '🏠', name: 'Lifestyle' },
  politics: { emoji: '🏛️', name: 'Politics' },
  classic: { emoji: '⚔️', name: 'Classic Debates' },
  trending: { emoji: '🔥', name: 'Trending' },
  other: { emoji: '📦', name: 'Other' }
};

// Get category display info
function getCategoryDisplay(categoryKey) {
  const cat = categories[categoryKey];
  return cat ? `${cat.emoji} ${cat.name}` : '';
}

// Filter by category
function filterByCategory(category) {
  currentCategory = category;
  
  // Update button styles
  document.querySelectorAll('.category-btn').forEach(btn => {
    if (btn.dataset.category === category) {
      btn.classList.remove('bg-gray-100', 'text-gray-600');
      btn.classList.add('bg-blue-100', 'text-blue-600');
    } else {
      btn.classList.remove('bg-blue-100', 'text-blue-600');
      btn.classList.add('bg-gray-100', 'text-gray-600');
    }
  });
  
  loadBattles();
}

// Tab Management
function showTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.dataset.tab === tab) {
      btn.classList.add('border-blue-600', 'text-blue-600');
      btn.classList.remove('border-transparent', 'text-gray-500');
    } else {
      btn.classList.remove('border-blue-600', 'text-blue-600');
      btn.classList.add('border-transparent', 'text-gray-500');
    }
  });
  loadBattles();
}

// Load battles
async function loadBattles() {
  const container = document.getElementById('battles-container');
  container.innerHTML = '<p class="text-center text-gray-500">Loading battles...</p>';
  
  try {
    let query = supabaseClient.from('battles').select('*');
    
    if (currentTab === 'active') {
      query = query.gt('ends_at', new Date().toISOString());
    } else if (currentTab === 'finished') {
      query = query.lt('ends_at', new Date().toISOString());
    }
    
    const { data: battles, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    if (battles.length === 0) {
      container.innerHTML = '<p class="text-center text-gray-500">No battles found</p>';
      return;
    }
    
    container.innerHTML = battles.map(battle => createBattleCard(battle)).join('');
    
    // Start countdown timers
    battles.forEach(battle => {
      if (new Date(battle.ends_at) > new Date()) {
        startCountdown(battle.id, battle.ends_at);
      }
    });
    
    // Update stats
    updateStats(battles);
  } catch (error) {
    console.error('Error loading battles:', error);
    container.innerHTML = '<p class="text-center text-red-500">Error loading battles</p>';
  }
}

// Create battle card HTML
function createBattleCard(battle) {
  const isActive = new Date(battle.ends_at) > new Date();
  const totalVotes = (battle.votes1 || 0) + (battle.votes2 || 0);
  const percentage1 = totalVotes > 0 ? Math.round((battle.votes1 / totalVotes) * 100) : 50;
  const percentage2 = 100 - percentage1;
  
  return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4">
      <a href="battle.html?id=${battle.id}" class="block mb-4 hover:text-blue-600 transition">
        <h2 class="text-lg sm:text-xl font-bold">${battle.title}</h2>
      </a>
      
      <div class="relative mb-4">
        <div class="flex">
          <div class="flex-1">
            <img src="${battle.image1 || 'https://via.placeholder.com/200'}" 
                 alt="${battle.option1}" 
                 class="w-full h-32 sm:h-40 object-cover rounded-l-lg">
          </div>
          
          <div class="flex-1">
            <img src="${battle.image2 || 'https://via.placeholder.com/200'}" 
                 alt="${battle.option2}" 
                 class="w-full h-32 sm:h-40 object-cover rounded-r-lg">
          </div>
        </div>
        
        <!-- VS Circle positioned absolutely in center -->
        <div class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 vs-circle bg-white w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-sm sm:text-base font-bold">
          VS
        </div>
      </div>
      
      <div class="flex items-center justify-between gap-4">
        <div class="flex-1 text-center">
          <p class="option-title text-sm sm:text-base mb-2">${battle.option1}</p>
        </div>
        
        <div class="flex-1 text-center">
          <p class="option-title text-sm sm:text-base mb-2">${battle.option2}</p>
        </div>
      </div>
      
      <div class="flex items-center justify-between gap-4 mb-3">
        <div class="flex-1">
          <button type="button" onclick="vote('${battle.id}', 'option1'); return false;" 
                  class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base ${!isActive ? 'opacity-50 cursor-not-allowed' : ''}"
                  ${!isActive ? 'disabled' : ''}>
            Vote
          </button>
        </div>
        
        <div class="flex-1">
          <button type="button" onclick="vote('${battle.id}', 'option2'); return false;" 
                  class="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition text-sm sm:text-base ${!isActive ? 'opacity-50 cursor-not-allowed' : ''}"
                  ${!isActive ? 'disabled' : ''}>
            Vote
          </button>
        </div>
      </div>
      
      <div class="progress-bar-container">
        <div class="progress-segment progress-blue" style="width: ${percentage1}%;">
          <span class="progress-text text-xs sm:text-sm">${percentage1}%</span>
        </div>
        <div class="progress-segment progress-green" style="width: ${percentage2}%;">
          <span class="progress-text text-xs sm:text-sm">${percentage2}%</span>
        </div>
      </div>
      
      <div class="flex justify-between items-center mt-3">
        <span class="text-xs sm:text-sm text-gray-500">Total votes: ${totalVotes}</span>
        <span id="timer-${battle.id}" class="text-xs sm:text-sm text-gray-500">
          ${isActive ? 'Calculating...' : 'Finished'}
        </span>
      </div>
      
      <div class="mt-4 flex gap-2">
        <a href="battle.html?id=${battle.id}" 
           class="flex-1 text-center bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition text-sm">
          <span class="hidden sm:inline">View Details</span>
          <span class="sm:hidden">Details</span>
        </a>
        <button onclick="currentBattleForShare = ${JSON.stringify(battle).replace(/"/g, '&quot;')}; openShareModal()" 
                class="flex-1 bg-blue-100 text-blue-600 py-2 rounded-lg hover:bg-blue-200 transition text-sm">
          Share
        </button>
      </div>
    </div>
  `;
}

// Countdown timer
function startCountdown(battleId, endTime) {
  const updateTimer = () => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) {
      const timerEl = document.getElementById(`timer-${battleId}`);
      if (timerEl) {
        timerEl.textContent = 'Finished';
      }
      clearInterval(interval);
      return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    let timeString = 'Time left: ';
    if (days > 0) timeString += `${days}d `;
    if (hours > 0) timeString += `${hours}h `;
    if (minutes > 0) timeString += `${minutes}m `;
    timeString += `${seconds}s`;
    
    const timerEl = document.getElementById(`timer-${battleId}`);
    if (timerEl) {
      timerEl.textContent = timeString;
    }
  };
  
  updateTimer();
  const interval = setInterval(updateTimer, 1000);
}

// Vote function
window.vote = async function(battleId, option) {
  // Prevent any default behavior
  if (window.event) {
    window.event.preventDefault();
    window.event.stopPropagation();
  }
  
  const voteColumn = option === 'option1' ? 'votes1' : 'votes2';
  
  // Find the battle card element more reliably
  const timerEl = document.getElementById(`timer-${battleId}`);
  if (!timerEl) {
    console.error('Could not find battle card');
    return false;
  }
  
  const battleCard = timerEl.closest('.bg-white');
  const voteButtons = battleCard.querySelectorAll('button');
  
  // Disable vote buttons temporarily
  voteButtons.forEach(btn => {
    if (btn.textContent.trim() === 'Vote') {
      btn.disabled = true;
      btn.classList.add('opacity-75');
      btn.textContent = 'Voting...';
    }
  });
  
  try {
    // Get current votes
    const { data: battle, error: fetchError } = await supabaseClient
      .from('battles')
      .select(voteColumn)
      .eq('id', battleId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Update votes
    const newVotes = (battle[voteColumn] || 0) + 1;
    const { error: updateError } = await supabaseClient
      .from('battles')
      .update({ [voteColumn]: newVotes })
      .eq('id', battleId);
    
    if (updateError) throw updateError;
    
    // Show success animation
    showToast('Vote recorded successfully!', 'success');
    
    // Reload battles to show updated votes
    await loadBattles();
    
    // Get updated battle for share modal
    const { data: updatedBattle } = await supabaseClient
      .from('battles')
      .select('*')
      .eq('id', battleId)
      .single();
    
    if (updatedBattle) {
      currentBattleForShare = updatedBattle;
      setTimeout(() => openShareModal(), 500); // Small delay for better UX
    }
  } catch (error) {
    console.error('Error voting:', error);
    alert('Error recording vote. Please try again.');
    
    // Re-enable buttons on error
    voteButtons.forEach(btn => {
      if (btn.textContent.trim() === 'Voting...') {
        btn.disabled = false;
        btn.classList.remove('opacity-75');
        btn.textContent = 'Vote';
      }
    });
  }
  
  return false; // Prevent any form submission
};

// Update stats
function updateStats(battles) {
  const totalBattles = battles.length;
  const activeBattles = battles.filter(b => new Date(b.ends_at) > new Date()).length;
  const totalVotes = battles.reduce((sum, b) => sum + (b.votes1 || 0) + (b.votes2 || 0), 0);
  
  const totalBattlesEl = document.getElementById('total-battles');
  const activeBattlesEl = document.getElementById('active-battles');
  const totalVotesEl = document.getElementById('total-votes');
  
  if (totalBattlesEl) totalBattlesEl.textContent = totalBattles;
  if (activeBattlesEl) activeBattlesEl.textContent = activeBattles;
  if (totalVotesEl) totalVotesEl.textContent = totalVotes;
}

// Modal functions
function openCreateModal() {
  const modal = document.getElementById('createModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeCreateModal() {
  const modal = document.getElementById('createModal');
  if (modal) {
    modal.style.display = 'none';
  }
  
  // Reset form
  const fields = ['battleTitle', 'option1', 'option2', 'image1', 'image2', 'duration', 'customDate', 'battleCategory'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  
  // Remove previews
  removePreview('preview1', 'image1');
  removePreview('preview2', 'image2');
  
  // Reset duration type
  setDurationType('minutes');
}

// Duration type selection
function setDurationType(type) {
  durationType = type;
  
  // Update button styles
  const buttons = {
    minutes: document.getElementById('minutesBtn'),
    hours: document.getElementById('hoursBtn'),
    days: document.getElementById('daysBtn'),
    custom: document.getElementById('customBtn')
  };
  
  Object.entries(buttons).forEach(([key, btn]) => {
    if (btn) {
      if (key === type) {
        btn.classList.remove('bg-gray-300', 'text-gray-700');
        btn.classList.add('bg-blue-600', 'text-white');
      } else {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-300', 'text-gray-700');
      }
    }
  });
  
  // Show/hide inputs
  const durationInput = document.getElementById('duration');
  const customDateInput = document.getElementById('customDate');
  
  if (durationInput && customDateInput) {
    if (type === 'custom') {
      durationInput.classList.add('hidden');
      customDateInput.classList.remove('hidden');
    } else {
      durationInput.classList.remove('hidden');
      customDateInput.classList.add('hidden');
    }
  }
}

function pickCustomDate() {
  setDurationType('custom');
}

// Image handling
function previewImage(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  const img = document.getElementById(previewId + '-img');
  
  if (input && preview && img) {
    const url = input.value;
    if (url) {
      img.src = url;
      preview.classList.remove('hidden');
    } else {
      preview.classList.add('hidden');
    }
  }
}

function removePreview(previewId, inputId) {
  const preview = document.getElementById(previewId);
  const input = document.getElementById(inputId);
  
  if (preview) preview.classList.add('hidden');
  if (input) input.value = '';
}

async function handleImageUpload(input, targetInputId) {
  const file = input.files[0];
  if (!file) return;
  
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('Image size must be less than 5MB');
    return;
  }
  
  // Check file type
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file');
    return;
  }
  
  try {
    // For production, upload to Supabase Storage
    // For now, we'll use data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const targetInput = document.getElementById(targetInputId);
      if (targetInput) {
        targetInput.value = e.target.result;
        previewImage(targetInputId, targetInputId === 'image1' ? 'preview1' : 'preview2');
      }
    };
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('Error uploading image:', error);
    alert('Error uploading image. Please try again.');
  }
}

// Submit battle
async function submitBattle() {
  // Get form values
  const title = document.getElementById('battleTitle')?.value.trim();
  const option1 = document.getElementById('option1')?.value.trim();
  const option2 = document.getElementById('option2')?.value.trim();
  const image1 = document.getElementById('image1')?.value.trim();
  const image2 = document.getElementById('image2')?.value.trim();
  const category = document.getElementById('battleCategory')?.value || null;
  
  // Validation
  if (!title || !option1 || !option2) {
    alert('Please fill in all required fields');
    return;
  }
  
  // Calculate end time
  let endsAt;
  if (durationType === 'custom') {
    const customDate = document.getElementById('customDate')?.value;
    if (!customDate) {
      alert('Please select an end date');
      return;
    }
    endsAt = new Date(customDate).toISOString();
  } else {
    const durationValue = document.getElementById('duration')?.value;
    const duration = parseInt(durationValue) || 60;
    const now = new Date();
    
    switch (durationType) {
      case 'minutes':
        endsAt = new Date(now.getTime() + duration * 60 * 1000).toISOString();
        break;
      case 'hours':
        endsAt = new Date(now.getTime() + duration * 60 * 60 * 1000).toISOString();
        break;
      case 'days':
        endsAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000).toISOString();
        break;
      default:
        endsAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // Default 1 hour
    }
  }
  
  // Ensure end time is in the future
  if (new Date(endsAt) <= new Date()) {
    alert('End time must be in the future');
    return;
  }
  
  try {
    // Create battle object
    const battleData = {
      title,
      option1,
      option2,
      image1: image1 || null,
      image2: image2 || null,
      votes1: 0,
      votes2: 0,
      ends_at: endsAt,
      created_at: new Date().toISOString()
    };
    
    // Only add category if it exists in the database
    if (category) {
      battleData.category = category;
    }
    
    const { data, error } = await supabaseClient.from('battles').insert([battleData]).select();
    
    if (error) throw error;
    
    // Success
    closeCreateModal();
    await loadBattles();
    
    // Show success message
    showToast('Battle created successfully!', 'success');
  } catch (error) {
    console.error('Error creating battle:', error);
    alert('Error creating battle. Please try again.');
  }
}:', error);
    alert('Error creating battle. Please try again.');
  }
}

// Toast notification
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-gray-800';
  toast.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-300`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Fade in
  setTimeout(() => {
    toast.style.opacity = '1';
  }, 10);
  
  // Remove after delay
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Random Battle Generator
function createTestBattle() {
  const battleTemplates = [
    // Sports
    {
      category: 'sports',
      categoryKey: 'sports',
      battles: [
        { title: 'Football vs Basketball', option1: 'Football', option2: 'Basketball', 
          image1: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400', 
          image2: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400' },
        { title: 'Messi vs Ronaldo', option1: 'Messi', option2: 'Ronaldo',
          image1: 'https://images.unsplash.com/photo-1570698473651-b2de99bae12f?w=400',
          image2: 'https://images.unsplash.com/photo-1535901925915-0b1dc8a2e2e1?w=400' },
        { title: 'Tennis vs Golf', option1: 'Tennis', option2: 'Golf',
          image1: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=400',
          image2: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400' },
        { title: 'NBA vs NFL', option1: 'NBA', option2: 'NFL',
          image1: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=400',
          image2: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400' },
        { title: 'Boxing vs MMA', option1: 'Boxing', option2: 'MMA',
          image1: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400',
          image2: 'https://images.unsplash.com/photo-1565033003741-2002cc2e68fd?w=400' },
        { title: 'Olympics vs World Cup', option1: 'Olympics', option2: 'World Cup',
          image1: 'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?w=400',
          image2: 'https://images.unsplash.com/photo-1606924842535-fcc79fe7bdb4?w=400' }
      ]
    },
    // Food
    {
      category: 'food',
      categoryKey: 'food',
      battles: [
        { title: 'Pizza vs Burger', option1: 'Pizza', option2: 'Burger',
          image1: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
          image2: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
        { title: 'Coffee vs Tea', option1: 'Coffee', option2: 'Tea',
          image1: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
          image2: 'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=400' },
        { title: 'Sushi vs Tacos', option1: 'Sushi', option2: 'Tacos',
          image1: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400',
          image2: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400' },
        { title: 'Ice Cream vs Cake', option1: 'Ice Cream', option2: 'Cake',
          image1: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=400',
          image2: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400' },
        { title: 'Pasta vs Rice', option1: 'Pasta', option2: 'Rice',
          image1: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400',
          image2: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400' },
        { title: 'Steak vs Seafood', option1: 'Steak', option2: 'Seafood',
          image1: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
          image2: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400' }
      ]
    },
    // Music
    {
      category: 'music',
      categoryKey: 'music',
      battles: [
        { title: 'Rock vs Hip Hop', option1: 'Rock', option2: 'Hip Hop',
          image1: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
          image2: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400' },
        { title: 'Beatles vs Queen', option1: 'The Beatles', option2: 'Queen',
          image1: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400',
          image2: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400' },
        { title: 'Spotify vs Apple Music', option1: 'Spotify', option2: 'Apple Music',
          image1: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400',
          image2: 'https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=400' },
        { title: 'Vinyl vs Digital', option1: 'Vinyl Records', option2: 'Digital Music',
          image1: 'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?w=400',
          image2: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400' },
        { title: 'Classical vs EDM', option1: 'Classical', option2: 'EDM',
          image1: 'https://images.unsplash.com/photo-1465821185615-20b3c2fbf41b?w=400',
          image2: 'https://images.unsplash.com/photo-1574482620811-1aa16ffe3c82?w=400' },
        { title: 'Live Concert vs Studio Album', option1: 'Live Concert', option2: 'Studio Album',
          image1: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
          image2: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400' }
      ]
    },
    // Tech
    {
      category: 'tech',
      categoryKey: 'tech',
      battles: [
        { title: 'iPhone vs Android', option1: 'iPhone', option2: 'Android',
          image1: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400',
          image2: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400' },
        { title: 'PlayStation vs Xbox', option1: 'PlayStation', option2: 'Xbox',
          image1: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400',
          image2: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400' },
        { title: 'Windows vs Mac', option1: 'Windows', option2: 'Mac',
          image1: 'https://images.unsplash.com/photo-1629654291663-b91ad427698f?w=400',
          image2: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=400' },
        { title: 'Tesla vs Traditional Cars', option1: 'Tesla', option2: 'Traditional Cars',
          image1: 'https://images.unsplash.com/photo-1561580125-028ee3bd62eb?w=400',
          image2: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=400' },
        { title: 'AI vs Human Intelligence', option1: 'AI', option2: 'Human Intelligence',
          image1: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
          image2: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400' },
        { title: 'VR vs AR', option1: 'Virtual Reality', option2: 'Augmented Reality',
          image1: 'https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=400',
          image2: 'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?w=400' }
      ]
    },
    // Movies/TV
    {
      category: 'entertainment',
      categoryKey: 'entertainment',
      battles: [
        { title: 'Marvel vs DC', option1: 'Marvel', option2: 'DC',
          image1: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400',
          image2: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=400' },
        { title: 'Netflix vs Disney+', option1: 'Netflix', option2: 'Disney+',
          image1: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400',
          image2: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400' },
        { title: 'Star Wars vs Star Trek', option1: 'Star Wars', option2: 'Star Trek',
          image1: 'https://images.unsplash.com/photo-1547700055-b61cacebece9?w=400',
          image2: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400' },
        { title: 'Friends vs The Office', option1: 'Friends', option2: 'The Office',
          image1: 'https://images.unsplash.com/photo-1542204625-ca960ca44635?w=400',
          image2: 'https://images.unsplash.com/photo-1568876694728-451bbf694b83?w=400' },
        { title: 'Cinema vs Streaming', option1: 'Cinema', option2: 'Streaming',
          image1: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400',
          image2: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400' },
        { title: 'Action vs Comedy', option1: 'Action Movies', option2: 'Comedy Movies',
          image1: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400',
          image2: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400' }
      ]
    },
    // Lifestyle
    {
      category: 'lifestyle',
      categoryKey: 'lifestyle',
      battles: [
        { title: 'Beach vs Mountains', option1: 'Beach', option2: 'Mountains',
          image1: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
          image2: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400' },
        { title: 'Summer vs Winter', option1: 'Summer', option2: 'Winter',
          image1: 'https://images.unsplash.com/photo-1527004760551-13de3ffd8d3f?w=400',
          image2: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=400' },
        { title: 'City Life vs Country Life', option1: 'City Life', option2: 'Country Life',
          image1: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
          image2: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400' },
        { title: 'Working from Home vs Office', option1: 'Work from Home', option2: 'Work from Office',
          image1: 'https://images.unsplash.com/photo-1565843248736-8c41e6db117b?w=400',
          image2: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400' },
        { title: 'Minimalism vs Maximalism', option1: 'Minimalism', option2: 'Maximalism',
          image1: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
          image2: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400' },
        { title: 'Gym vs Home Workout', option1: 'Gym', option2: 'Home Workout',
          image1: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
          image2: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400' }
      ]
    },
    // Classic debates
    {
      category: 'classic',
      categoryKey: 'classic',
      battles: [
        { title: 'Cats vs Dogs', option1: 'Cats', option2: 'Dogs',
          image1: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
          image2: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400' },
        { title: 'Morning Person vs Night Owl', option1: 'Morning Person', option2: 'Night Owl',
          image1: 'https://images.unsplash.com/photo-1541480601022-2308c0f02487?w=400',
          image2: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=400' },
        { title: 'Books vs Movies', option1: 'Books', option2: 'Movies',
          image1: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
          image2: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400' },
        { title: 'Chocolate vs Vanilla', option1: 'Chocolate', option2: 'Vanilla',
          image1: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
          image2: 'https://images.unsplash.com/photo-1567653418876-5bb0e566e1c2?w=400' },
        { title: 'Introvert vs Extrovert', option1: 'Introvert', option2: 'Extrovert',
          image1: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
          image2: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400' },
        { title: 'Sweet vs Savory', option1: 'Sweet', option2: 'Savory',
          image1: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400',
          image2: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400' }
      ]
    },
    // Trending
    {
      category: 'trending',
      categoryKey: 'trending',
      battles: [
        { title: 'TikTok vs Instagram Reels', option1: 'TikTok', option2: 'Instagram Reels',
          image1: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400',
          image2: 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=400' },
        { title: 'ChatGPT vs Google', option1: 'ChatGPT', option2: 'Google',
          image1: 'https://images.unsplash.com/photo-1676299081847-824916de030a?w=400',
          image2: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400' },
        { title: 'Remote Work vs Office Work', option1: 'Remote Work', option2: 'Office Work',
          image1: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400',
          image2: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400' },
        { title: 'Crypto vs Traditional Banking', option1: 'Cryptocurrency', option2: 'Traditional Banking',
          image1: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400',
          image2: 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=400' },
        { title: 'Influencers vs Celebrities', option1: 'Influencers', option2: 'Celebrities',
          image1: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400',
          image2: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400' },
        { title: 'Metaverse vs Real World', option1: 'Metaverse', option2: 'Real World',
          image1: 'https://images.unsplash.com/photo-1633355444132-695d5876159c?w=400',
          image2: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400' }
      ]
    },
    // Fashion
    {
      category: 'fashion',
      categoryKey: 'fashion',
      battles: [
        { title: 'Sneakers vs Heels', option1: 'Sneakers', option2: 'Heels',
          image1: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
          image2: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400' },
        { title: 'Vintage vs Modern Fashion', option1: 'Vintage', option2: 'Modern',
          image1: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=400',
          image2: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400' },
        { title: 'Comfort vs Style', option1: 'Comfort', option2: 'Style',
          image1: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=400',
          image2: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400' }
      ]
    },
    // Gaming
    {
      category: 'gaming',
      categoryKey: 'gaming',
      battles: [
        { title: 'PC Gaming vs Console Gaming', option1: 'PC Gaming', option2: 'Console Gaming',
          image1: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400',
          image2: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=400' },
        { title: 'Single Player vs Multiplayer', option1: 'Single Player', option2: 'Multiplayer',
          image1: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
          image2: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400' },
        { title: 'RPG vs FPS', option1: 'RPG Games', option2: 'FPS Games',
          image1: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400',
          image2: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400' }
      ]
    }
  ];

  // Select random category
  const randomCategory = battleTemplates[Math.floor(Math.random() * battleTemplates.length)];
  
  // Select random battle from that category
  const randomBattle = randomCategory.battles[Math.floor(Math.random() * randomCategory.battles.length)];
  
  // Pre-fill the form
  const fields = {
    battleTitle: randomBattle.title,
    option1: randomBattle.option1,
    option2: randomBattle.option2,
    image1: randomBattle.image1,
    image2: randomBattle.image2,
    battleCategory: randomCategory.categoryKey || 'other'
  };
  
  Object.entries(fields).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });
  
  // Set random duration
  const durations = [
    { type: 'minutes', value: 30 },
    { type: 'hours', value: 1 },
    { type: 'hours', value: 6 },
    { type: 'hours', value: 12 },
    { type: 'hours', value: 24 },
    { type: 'days', value: 3 },
    { type: 'days', value: 7 }
  ];
  
  const randomDuration = durations[Math.floor(Math.random() * durations.length)];
  setDurationType(randomDuration.type);
  const durationEl = document.getElementById('duration');
  if (durationEl) durationEl.value = randomDuration.value;
  
  // Show preview images
  previewImage('image1', 'preview1');
  previewImage('image2', 'preview2');
  
  // Open modal
  openCreateModal();
  
  // Add a fun message
  const messages = [
    `🎲 Random ${randomCategory.category} battle generated!`,
    `🔥 Hot ${randomCategory.category} debate ready!`,
    `⚡ Epic ${randomCategory.category} showdown!`,
    `🎯 Fresh ${randomCategory.category} battle loaded!`,
    `✨ Exciting ${randomCategory.category} matchup created!`,
    `🚀 New ${randomCategory.category} battle prepared!`,
    `💥 Awesome ${randomCategory.category} versus ready!`
  ];
  
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  showToast(randomMessage, 'success');
}

// Share modal functions
function openShareModal() {
  const modal = document.getElementById('shareModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeShareModal() {
  const modal = document.getElementById('shareModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function shareToTwitter() {
  if (!currentBattleForShare) return;
  
  const text = `Check out this battle: ${currentBattleForShare.title} - ${currentBattleForShare.option1} vs ${currentBattleForShare.option2}! Vote now! 🔥`;
  const url = `${window.location.origin}/battle.html?id=${currentBattleForShare.id}`;
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  
  window.open(shareUrl, '_blank', 'width=550,height=420');
}

function shareToFacebook() {
  if (!currentBattleForShare) return;
  
  const url = `${window.location.origin}/battle.html?id=${currentBattleForShare.id}`;
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  
  window.open(shareUrl, '_blank', 'width=550,height=420');
}

function shareToReddit() {
  if (!currentBattleForShare) return;
  
  const title = `${currentBattleForShare.title} - ${currentBattleForShare.option1} vs ${currentBattleForShare.option2}`;
  const url = `${window.location.origin}/battle.html?id=${currentBattleForShare.id}`;
  const shareUrl = `https://www.reddit.com/submit?title=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  
  window.open(shareUrl, '_blank', 'width=550,height=850');
}

function copyLink() {
  if (!currentBattleForShare) return;
  
  const url = `${window.location.origin}/battle.html?id=${currentBattleForShare.id}`;
  
  // Try modern API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('Link copied to clipboard!', 'success');
    }).catch(() => {
      fallbackCopyToClipboard(url);
    });
  } else {
    fallbackCopyToClipboard(url);
  }
}

function fallbackCopyToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    showToast('Link copied to clipboard!', 'success');
  } catch (err) {
    showToast('Failed to copy link', 'error');
  }
  
  document.body.removeChild(textArea);
}

// Error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Load battles
  loadBattles();
  
  // Set up modal event listeners
  const createModal = document.getElementById('createModal');
  const shareModal = document.getElementById('shareModal');
  
  if (createModal) {
    createModal.addEventListener('click', (e) => {
      if (e.target === createModal) {
        closeCreateModal();
      }
    });
  }
  
  if (shareModal) {
    shareModal.addEventListener('click', (e) => {
      if (e.target === shareModal) {
        closeShareModal();
      }
    });
  }
  
  // Set up keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // ESC to close modals
    if (e.key === 'Escape') {
      closeCreateModal();
      closeShareModal();
    }
    
    // Ctrl/Cmd + K to create new battle
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openCreateModal();
    }
  });
  
  // Auto-refresh battles every 30 seconds
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      loadBattles();
    }
  }, 30000);
  
  // Handle visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      loadBattles();
    }
  });
});

// Export functions for global access
window.showTab = showTab;
window.filterByCategory = filterByCategory;
window.openCreateModal = openCreateModal;
window.closeCreateModal = closeCreateModal;
window.openShareModal = openShareModal;
window.closeShareModal = closeShareModal;
window.setDurationType = setDurationType;
window.pickCustomDate = pickCustomDate;
window.previewImage = previewImage;
window.removePreview = removePreview;
window.handleImageUpload = handleImageUpload;
window.submitBattle = submitBattle;
window.createTestBattle = createTestBattle;
window.shareToTwitter = shareToTwitter;
window.shareToFacebook = shareToFacebook;
window.shareToReddit = shareToReddit;
window.copyLink = copyLink;
