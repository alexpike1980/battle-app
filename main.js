// main.js
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
  document.getElementById('tab-' + tab).classList.add('active');
  loadBattles();
}

async function loadBattles() {
  const now = new Date().toISOString();
  const filter = currentTab === 'active' ? 'gt' : 'lte';
  const { data: battles } = await supabase
    .from('battles')
    .select('*')
    .filter('end_time', filter, now)
    .order('end_time', { ascending: false });

  const battleList = document.getElementById('battleList');
  battleList.innerHTML = '';

  battles.forEach(battle => {
    const block = document.createElement('div');
    block.className = 'battle-block';

    const timeRemaining = getTimeRemaining(battle.end_time);
    const option1Votes = battle.votes_option1 || 0;
    const option2Votes = battle.votes_option2 || 0;
    const totalVotes = option1Votes + option2Votes || 1;
    const percent1 = Math.round((option1Votes / totalVotes) * 100);
    const percent2 = 100 - percent1;

    block.innerHTML = `
      <h3>${battle.title}</h3>
      <p>Ends in: <span id="countdown-${battle.id}">${timeRemaining}</span></p>
      <div class="battle-images">
        <div class="battle-image-container">
          ${battle.image1 ? `<img src="${battle.image1}" alt="${battle.option1}">` : ''}
        </div>
        <div class="battle-image-container">
          ${battle.image2 ? `<img src="${battle.image2}" alt="${battle.option2}">` : ''}
        </div>
      </div>
      <div>
        <strong>${battle.option1}</strong>
        <button class="vote-button" onclick="vote(${battle.id}, 1)">Vote Now</button>
        <div class="progress-container">
          <div class="progress-bar option1-bar" style="width:${percent1}%">${percent1}%</div>
        </div>
      </div>
      <div>
        <strong>${battle.option2}</strong>
        <button class="vote-button" onclick="vote(${battle.id}, 2)">Vote Now</button>
        <div class="progress-container">
          <div class="progress-bar option2-bar" style="width:${percent2}%">${percent2}%</div>
        </div>
      </div>
      <div class="social-icons">
        <a href="https://t.me/share/url?url=https://battleapp.com/battle/${battle.id}" target="_blank">📨 Telegram</a>
        <a href="https://wa.me/?text=https://battleapp.com/battle/${battle.id}" target="_blank">📱 WhatsApp</a>
      </div>
    `;

    battleList.appendChild(block);
    updateCountdown(battle.id, battle.end_time);
  });
}

function getTimeRemaining(endTime) {
  const total = Date.parse(endTime) - Date.now();
  if (total <= 0) return '00:00:00';
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / 1000 / 60 / 60));
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateCountdown(id, endTime) {
  setInterval(() => {
    const countdown = document.getElementById(`countdown-${id}`);
    if (countdown) {
      countdown.textContent = getTimeRemaining(endTime);
    }
  }, 1000);
}

async function vote(battleId, option) {
  const field = option === 1 ? 'votes_option1' : 'votes_option2';
  await supabase.rpc('increment_vote', { battle_id: battleId, field_name: field });
  loadBattles();
}

document.getElementById('submitBtn').addEventListener('click', async () => {
  const title = document.getElementById('title').value;
  const option1 = document.getElementById('option1').value;
  const option2 = document.getElementById('option2').value;
  const duration = parseInt(document.getElementById('duration').value);
  const image1 = document.getElementById('image1').value;
  const image2 = document.getElementById('image2').value;
  const end_time = new Date(Date.now() + duration * 60000).toISOString();

  await supabase.from('battles').insert([{ title, option1, option2, image1, image2, end_time }]);
  toggleForm();
  loadBattles();
});

loadBattles();
