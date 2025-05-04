import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const battleSelector = document.getElementById('battleSelector');
const battleContainer = document.getElementById('battleContainer');
const submitBtn = document.getElementById('submitBtn');

submitBtn.onclick = async () => {
  const title = document.getElementById('title').value;
  const option1 = document.getElementById('option1').value;
  const option2 = document.getElementById('option2').value;
  const option1Image = document.getElementById('option1Image').value;
  const option2Image = document.getElementById('option2Image').value;
  const duration = parseInt(document.getElementById('duration').value);
  const ends_at = new Date(Date.now() + duration * 60000).toISOString();

  await supabase.from('battles').insert({
    title,
    option1,
    option2,
    option1_image: option1Image,
    option2_image: option2Image,
    votes1: 0,
    votes2: 0,
    ends_at
  });

  await loadBattles();
};

function toggleForm() {
  const form = document.getElementById('createForm');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

async function loadBattles() {
  const { data: battles } = await supabase.from('battles').select('*').order('created_at', { ascending: false });

  battleSelector.innerHTML = '';
  battles.forEach(battle => {
    const option = document.createElement('option');
    option.value = battle.id;
    option.textContent = battle.title;
    battleSelector.appendChild(option);
  });

  if (battles.length > 0) {
    loadBattle(battles[0].id);
  }

  battleSelector.onchange = () => {
    loadBattle(battleSelector.value);
  };
}

function formatRemainingTime(ms) {
  const seconds = Math.floor(ms / 1000);
  if (seconds <= 0) return 'Time\'s up!';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

let countdownInterval;

async function loadBattle(id) {
  const { data: battle } = await supabase.from('battles').select('*').eq('id', id).single();

  clearInterval(countdownInterval);
  battleContainer.innerHTML = '';

  const now = new Date();
  const endsAt = new Date(battle.ends_at);
  const remaining = endsAt - now;
  const isExpired = remaining <= 0;

  const leftVotes = battle.votes1;
  const rightVotes = battle.votes2;
  const total = leftVotes + rightVotes;
  const leftPercent = total ? Math.round((leftVotes / total) * 100) : 0;
  const rightPercent = 100 - leftPercent;

  const battleDiv = document.createElement('div');
  battleDiv.className = 'battle';
  battleDiv.innerHTML = `
    <h2>${battle.title}</h2>
    <div class="battle-content">
      <div class="option">
        ${battle.option1_image ? `<img src="${battle.option1_image}" alt="Option 1">` : ''}
        <div>${battle.option1}</div>
        <button ${isExpired ? 'disabled' : ''} onclick="vote('${battle.id}', 'votes1')">Vote</button>
      </div>
      <div class="option">
        ${battle.option2_image ? `<img src="${battle.option2_image}" alt="Option 2">` : ''}
        <div>${battle.option2}</div>
        <button ${isExpired ? 'disabled' : ''} onclick="vote('${battle.id}', 'votes2')">Vote</button>
      </div>
    </div>
    <div class="progress-bar-container">
      <div class="progress-left" style="width: ${leftPercent}%;">${leftPercent}%</div>
      <div class="progress-right" style="width: ${rightPercent}%;">${rightPercent}%</div>
    </div>
    <div class="countdown" id="countdown"></div>
  `;
  battleContainer.appendChild(battleDiv);

  const countdownEl = document.getElementById('countdown');
  countdownEl.textContent = formatRemainingTime(remaining);

  countdownInterval = setInterval(() => {
    const now = new Date();
    const diff = endsAt - now;
    if (diff <= 0) {
      clearInterval(countdownInterval);
      countdownEl.textContent = "Time's up!";
      document.querySelectorAll('button[onclick^="vote"]').forEach(btn => btn.disabled = true);
    } else {
      countdownEl.textContent = formatRemainingTime(diff);
    }
  }, 1000);
}

window.vote = async (id, field) => {
  await supabase.rpc('increment_vote', { row_id: id, field_name: field });
  loadBattle(id);
};

loadBattles();
