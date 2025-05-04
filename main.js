// main.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const battleList = document.getElementById('battleList');
const battleContainer = document.getElementById('battleContainer');
const submitBtn = document.getElementById('submitBtn');
const createForm = document.getElementById('createForm');
let currentTab = 'active';

function toggleForm() {
  createForm.style.display = createForm.style.display === 'none' ? 'block' : 'none';
}

function switchTab(tab) {
  currentTab = tab;
  document.getElementById('tab-active').classList.toggle('active', tab === 'active');
  document.getElementById('tab-finished').classList.toggle('active', tab === 'finished');
  loadBattles();
}

submitBtn.addEventListener('click', async () => {
  const title = document.getElementById('title').value;
  const option1 = document.getElementById('option1').value;
  const option2 = document.getElementById('option2').value;
  const duration = parseInt(document.getElementById('duration').value);
  const image1 = document.getElementById('image1').value;
  const image2 = document.getElementById('image2').value;

  const endsAt = new Date(Date.now() + duration * 60000).toISOString();

  const { error } = await supabase.from('battles').insert([
    { title, option1, option2, image1, image2, ends_at: endsAt }
  ]);

  if (error) {
    alert('Error creating battle');
    console.error(error);
  } else {
    alert('Battle created!');
    loadBattles();
  }
});

function formatTime(seconds) {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
}

function startCountdown(endsAt, element) {
  function updateCountdown() {
    const diff = Math.floor((new Date(endsAt) - new Date()) / 1000);
    if (diff > 0) {
      element.textContent = '⏳ ' + formatTime(diff);
    } else {
      element.textContent = '🛑 Battle ended';
      clearInterval(interval);
      loadBattles();
    }
  }
  updateCountdown();
  const interval = setInterval(updateCountdown, 1000);
}

async function loadBattles() {
  const { data, error } = await supabase.from('battles').select('*').order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading battles:', error);
    return;
  }

  const now = new Date();
  const filtered = data.filter(battle => {
    const endsAt = new Date(battle.ends_at);
    return currentTab === 'active' ? endsAt > now : endsAt <= now;
  });

  battleList.innerHTML = '';
  filtered.forEach(battle => {
    const battleDiv = document.createElement('div');
    battleDiv.style.border = '1px solid #ccc';
    battleDiv.style.borderRadius = '10px';
    battleDiv.style.padding = '15px';
    battleDiv.style.marginBottom = '20px';
    battleDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';

    const countdownEl = document.createElement('div');
    countdownEl.style.fontSize = '16px';
    countdownEl.style.fontWeight = 'bold';
    countdownEl.style.color = '#d00';
    startCountdown(battle.ends_at, countdownEl);

    battleDiv.innerHTML = `
      <h3>${battle.title}</h3>
      <div style="display: flex; justify-content: space-between;">
        <div style="flex: 1; text-align: center;">
          <div style="width: 150px; height: 150px; background: #eee; margin: auto; background-image: url('${battle.image1}'); background-size: cover; background-position: center;"></div>
          <p>${battle.option1}</p>
          <button style="margin-top: 10px;">Vote Now</button>
        </div>
        <div style="flex: 1; text-align: center;">
          <div style="width: 150px; height: 150px; background: #eee; margin: auto; background-image: url('${battle.image2}'); background-size: cover; background-position: center;"></div>
          <p>${battle.option2}</p>
          <button style="margin-top: 10px;">Vote Now</button>
        </div>
      </div>
    `;

    battleDiv.appendChild(countdownEl);
    battleList.appendChild(battleDiv);
  });
}

loadBattles();
window.toggleForm = toggleForm;
window.switchTab = switchTab;
