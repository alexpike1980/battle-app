// main.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Current active tab
let currentTab = 'featured';

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

function startLiveCountdown(id, endTime) {
  const el = document.getElementById(`timer-${id}`);
  if (!el) return;
  
  function upd() {
    const t = calculateTimeLeft(endTime);
    if (!t) { el.textContent = 'Finished'; clearInterval(iv); }
    else    { el.textContent = `Time Left: ${t}`; }
  }
  const iv = setInterval(upd, 1000); upd();
}

function renderProgressBar(v1=0, v2=0, id) {
  const total = v1+v2, p1 = total ? Math.round(v1/total*100) : 50, p2 = 100-p1;
  return `
    <div class="flex w-full gap-0 mt-3">
      <div class="flex-1 rounded-l-full bg-blue-600 h-10 flex items-center px-3 text-white text-lg font-semibold ${p1===100?'rounded-r-full':''}" style="width:${p1}%;">
        ${v1 ? `${v1} (${p1}%)` : ''}
      </div>
      <div class="flex-1 rounded-r-full bg-green-600 h-10 flex items-center justify-end px-3 text-white text-lg font-semibold ${p2===100?'rounded-l-full':''}" style="width:${p2}%;">
        ${v2 ? `${v2} (${p2}%)` : ''}
      </div>
    </div>
  `;
}

async function fetchAndRenderBattles() {
  const { data: battles, error } = await supabase
    .from('battles')
    .select('id, title, option1, option2, votes1, votes2, ends_at, image1, image2, created_at')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error loading battles:', error.message);
    return;
  }
  
  const container = document.getElementById('battleList');
  container.innerHTML = '';
  
  // Filter battles based on tab
  const now = new Date();
  let filteredBattles = battles;
  
  if (currentTab === 'active') {
    filteredBattles = battles.filter(b => new Date(b.ends_at) > now);
  } else if (currentTab === 'finished') {
    filteredBattles = battles.filter(b => new Date(b.ends_at) <= now);
  } else {
    // For featured tab, we'll show first 5 battles regardless of status
    filteredBattles = battles.slice(0, 5);
  }
  
  if (filteredBattles.length === 0) {
    container.innerHTML = `
      <div class="py-16 text-center text-gray-500">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p class="text-xl font-semibold">No battles found</p>
        <p class="mt-2">Create a new battle to get started!</p>
      </div>
    `;
    return;
  }

  filteredBattles.forEach(b => {
    const active = new Date(b.ends_at) > now;
    const block = document.createElement('div');
    block.className = 'bg-white py-8 px-2 md:px-6 flex flex-col gap-2 border-b border-gray-200 mb-2';
    block.innerHTML = `
      <a href="battle.html?id=${b.id}" class="text-2xl font-semibold mb-2 hover:text-blue-600 transition underline-offset-2 hover:underline inline-block">${b.title}</a>
      <div class="relative flex flex-row gap-2 justify-center items-center">
        <div class="flex flex-col items-center flex-1">
          <img src="${b.image1||'https://via.placeholder.com/300'}" alt="${b.option1}" class="object-cover rounded-lg w-[220px] h-[180px] md:w-[260px] md:h-[180px]" />
          <div class="option-title mt-2">${b.option1}</div>
          <button class="bg-blue-600 text-white py-3 mt-3 rounded-lg font-bold w-full md:w-[90%] text-lg transition hover:bg-blue-700 vote-btn" data-battle="${b.id}" data-opt="votes1">Vote</button>
        </div>
        <div class="absolute z-20 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div class="vs-circle bg-white flex items-center justify-center text-lg font-bold w-14 h-14 border-2 border-white shadow-none">VS</div>
        </div>
        <div class="flex flex-col items-center flex-1">
          <img src="${b.image2||'https://via.placeholder.com/300'}" alt="${b.option2}" class="object-cover rounded-lg w-[220px] h-[180px] md:w-[260px] md:h-[180px]" />
          <div class="option-title mt-2">${b.option2}</div>
          <button class="bg-green-600 text-white py-3 mt-3 rounded-lg font-bold w-full md:w-[90%] text-lg transition hover:bg-green-700 vote-btn" data-battle="${b.id}" data-opt="votes2">Vote</button>
        </div>
      </div>
      ${renderProgressBar(b.votes1, b.votes2, b.id)}
      <div id="timer-${b.id}" class="text-xs text-gray-500 pt-1">${active ? `Time Left: ${calculateTimeLeft(b.ends_at)}` : 'Finished'}</div>
    `;
    container.appendChild(block);
    if (active) startLiveCountdown(b.id, b.ends_at);
  });

  // Add event listeners for vote buttons
  document.querySelectorAll('.vote-btn').forEach(btn => {
    btn.onclick = function() {
      window.openShareModal(this.dataset.battle, this.dataset.opt);
    };
  });
}

// Tab handling
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Update UI
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      // Update current tab and refresh battles
      currentTab = this.dataset.tab;
      fetchAndRenderBattles();
    });
  });
}

// Handle create battle form submission
function setupCreateBattleForm() {
  const submitBtn = document.getElementById('submitBattleBtn');
  const timeTabs = document.querySelectorAll('.time-tab');
  const durationInput = document.getElementById('duration');
  const datetimePicker = document.getElementById('datetimePicker');
  
  // Set up time unit tabs
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

  // Handle form submission
  submitBtn.addEventListener('click', async function() {
    const title = document.getElementById('title').value;
    const option1 = document.getElementById('option1').value;
    const option2 = document.getElementById('option2').value;
    
    // Basic validation
    if (!title || !option1 || !option2) {
      alert('Please fill in all required fields');
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
    
    // Get image values (for simplicity we'll use placeholder URLs in this example)
    // In a real app, you'd upload the actual images first
    const image1 = 'https://via.placeholder.com/300';
    const image2 = 'https://via.placeholder.com/300';
    
    // Create the battle
    try {
      const { data, error } = await supabase.from('battles').insert([
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
      alert('Could not create battle. Please try again.');
    }
  });
}

// Initialize app
window.addEventListener('load', () => {
  setupTabs();
  setupCreateBattleForm();
  fetchAndRenderBattles();
  
  // Modal close handlers
  document.getElementById('shareCloseBtn')?.addEventListener('click', () => {
    document.getElementById('shareModal').classList.add('hidden');
  });
  document.getElementById('shareModal').addEventListener('click', e => {
    if (e.target.id === 'shareModal') e.target.classList.add('hidden');
  });
});

// Share modal handling
window.openShareModal = function(battleId, option) {
  const modal = document.getElementById('shareModal');
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
        const { data: battle, error: fe } = await supabase
          .from('battles')
          .select('*')
          .eq('id', battleId)
          .single();
          
        if (fe) throw fe;
        
        // Update the vote count locally first (optimistic UI update)
        const battleCard = document.querySelector(`[data-battle="${battleId}"]`).closest('.bg-white');
        const progressBar = battleCard.querySelector('.flex.w-full.gap-0.mt-3');
        
        // Calculate new vote counts
        const newVotes = (battle[col] || 0) + 1;
        const votes1 = col === 'votes1' ? newVotes : battle.votes1;
        const votes2 = col === 'votes2' ? newVotes : battle.votes2;
        
        // Immediately update the UI with new progress bar
        progressBar.outerHTML = renderProgressBar(votes1, votes2, battleId);
        
        // Open share window
        window.open(link.href, '_blank');
        
        // Update the database
        const { error: ue } = await supabase
          .from('battles')
          .update({ [col]: newVotes })
          .eq('id', battleId);
          
        if (ue) throw ue;
        
        // Close the modal
        modal.classList.add('hidden');
      } catch (err) {
        console.error('Error adding vote:', err);
        alert('Could not add your vote. Please try again.');
      }
    };
  });
};
