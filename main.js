// Подключение к Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentTab = 'active';

function toggleForm() {
  const form = document.getElementById('createForm');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function switchTab(tab) {
  currentTab = tab;
  document.getElementById('tab-active').classList.remove('active');
  document.getElementById('tab-finished').classList.remove('active');
  document.getElementById(`tab-${tab}`).classList.add('active');
  fetchAndRenderBattles();
}

function calculateTimeLeft(endTime) {
  const diff = new Date(endTime) - new Date();
  if (diff <= 0) return '00:00:00';
  const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
  const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
  const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

async function fetchAndRenderBattles() {
  const now = new Date().toISOString();
  const { data: battles } = await supabase.from('battles')
    .select('*')
    .order('created_at', { ascending: false });

  const filteredBattles = battles.filter(battle =>
    currentTab === 'active' ? new Date(battle.end_time) > new Date() : new Date(battle.end_time) <= new Date()
  );

  const container = document.getElementById('battleList');
  container.innerHTML = '';
  filteredBattles.forEach(battle => {
    const block = document.createElement('div');
    block.className = 'battle-block';
    block.innerHTML = `
      <h3>${battle.title}</h3>
      <div class="battle-images">
        <div>
          <img src="${battle.image1 || ''}" alt="Option 1"/>
          <button class="vote-btn" onclick="vote(${battle.id}, 'option1')">Vote Now</button>
        </div>
        <div>
          <img src="${battle.image2 || ''}" alt="Option 2"/>
          <button class="vote-btn" onclick="vote(${battle.id}, 'option2')">Vote Now</button>
        </div>
      </div>
      <div class="countdown" id="countdown-${battle.id}"></div>
    `;
    container.appendChild(block);
    updateCountdown(battle.id, battle.end_time);
  });
}

function updateCountdown(id, endTime) {
  const element = document.getElementById(`countdown-${id}`);
  function tick() {
    const timeLeft = calculateTimeLeft(endTime);
    element.textContent = `Time left: ${timeLeft}`;
    if (timeLeft === '00:00:00') fetchAndRenderBattles();
  }
  tick();
  setInterval(tick, 1000);
}

async function vote(battleId, option) {
  const { data: battle } = await supabase.from('battles').select('*').eq('id', battleId).single();
  const newVotes = (battle[`${option}_votes`] || 0) + 1;
  await supabase.from('battles').update({ [`${option}_votes`]: newVotes }).eq('id', battleId);
  fetchAndRenderBattles();
}

document.getElementById('submitBtn').addEventListener('click', async () => {
  const title = document.getElementById('title').value;
  const option1 = document.getElementById('option1').value;
  const option2 = document.getElementById('option2').value;
  const duration = parseInt(document.getElementById('duration').value);
  const image1 = document.getElementById('image1').value;
  const image2 = document.getElementById('image2').value;

  const endTime = new Date(Date.now() + duration * 60000).toISOString();

  await supabase.from('battles').insert({
    title,
    option1,
    option2,
    option1_votes: 0,
    option2_votes: 0,
    end_time: endTime,
    image1,
    image2,
  });

  toggleForm();
  fetchAndRenderBattles();
});

window.toggleForm = toggleForm;
window.switchTab = switchTab;
window.vote = vote;

fetchAndRenderBattles();
