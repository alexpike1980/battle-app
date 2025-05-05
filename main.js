// main.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('createForm');
const submitBtn = document.getElementById('submitBtn');
const battleList = document.getElementById('battleList');
let currentTab = 'active';

submitBtn.addEventListener('click', async () => {
  const title = document.getElementById('title').value;
  const option1 = document.getElementById('option1').value;
  const option2 = document.getElementById('option2').value;
  const duration = parseInt(document.getElementById('duration').value);
  const image1 = document.getElementById('image1').value;
  const image2 = document.getElementById('image2').value;

  const { data, error } = await supabase.from('battles').insert([
    {
      title,
      option1,
      option2,
      duration,
      image1,
      image2,
      created_at: new Date().toISOString()
    }
  ]);

  if (error) {
    console.error('Error creating battle:', error);
  } else {
    console.log('Battle created:', data);
    toggleForm();
    loadBattles();
  }
});

function toggleForm() {
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

window.switchTab = function(tab) {
  currentTab = tab;
  document.getElementById('tab-active').classList.toggle('active', tab === 'active');
  document.getElementById('tab-finished').classList.toggle('active', tab === 'finished');
  loadBattles();
}

async function loadBattles() {
  battleList.innerHTML = 'Loading...';
  const { data: battles, error } = await supabase.from('battles').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error loading battles:', error);
    return;
  }

  const now = new Date();
  const filteredBattles = battles.filter(battle => {
    const created = new Date(battle.created_at);
    const end = new Date(created.getTime() + battle.duration * 60000);
    return currentTab === 'active' ? end > now : end <= now;
  });

  battleList.innerHTML = '';

  filteredBattles.forEach(battle => {
    const created = new Date(battle.created_at);
    const end = new Date(created.getTime() + battle.duration * 60000);

    const block = document.createElement('div');
    block.style.border = '1px solid #ccc';
    block.style.padding = '15px';
    block.style.marginBottom = '15px';
    block.style.borderRadius = '10px';

    block.innerHTML = `
      <h3>${battle.title}</h3>
      <div style="display: flex; justify-content: space-between; gap: 20px;">
        <div style="flex: 1; text-align: center;">
          <div style="aspect-ratio: 1/1; background-size: cover; background-position: center; background-image: url('${battle.image1 || ''}'); border: 1px solid #ccc; border-radius: 10px;"></div>
          <button onclick="vote('${battle.id}', 'option1')" style="margin-top: 10px;">Vote now</button>
        </div>
        <div style="flex: 1; text-align: center;">
          <div style="aspect-ratio: 1/1; background-size: cover; background-position: center; background-image: url('${battle.image2 || ''}'); border: 1px solid #ccc; border-radius: 10px;"></div>
          <button onclick="vote('${battle.id}', 'option2')" style="margin-top: 10px;">Vote now</button>
        </div>
      </div>
    `;

    battleList.appendChild(block);

    updateCountdown(block, end);
    setInterval(() => updateCountdown(block, end), 1000);
  });
}

function updateCountdown(container, endTime) {
  const now = new Date();
  const diff = Math.max(0, endTime - now);
  const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
  const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
  const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');

  let countdownEl = container.querySelector('.countdown');
  if (!countdownEl) {
    countdownEl = document.createElement('div');
    countdownEl.className = 'countdown';
    countdownEl.style.marginTop = '10px';
    container.appendChild(countdownEl);
  }
  countdownEl.textContent = `Time left: ${hours}:${minutes}:${seconds}`;
}

window.vote = async function(battleId, option) {
  alert(`Voted for ${option} in battle ${battleId}`);
};

// Initial load
loadBattles();
