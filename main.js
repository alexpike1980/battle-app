import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let countdownInterval = null;

function toggleForm() {
  const form = document.getElementById('createForm');
  form.style.display = form.style.display === 'none' || form.style.display === '' ? 'block' : 'none';
}

async function loadAllBattles() {
  const { data, error } = await supabase
    .from('battles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    alert('Error loading battles.');
    return;
  }

  const selector = document.getElementById('battleSelector');
  selector.innerHTML = data.map(battle => `<option value="${battle.id}">${battle.title}</option>`).join('');

  if (data.length > 0) renderBattle(data[0]);
}

async function renderBattleById(battleId) {
  const { data, error } = await supabase
    .from('battles')
    .select('*')
    .eq('id', battleId)
    .single();

  if (error || !data) return;

  renderBattle(data);
}

function renderBattle(battle) {
  const totalVotes = battle.votes1 + battle.votes2;
  const percent1 = totalVotes ? Math.round((battle.votes1 / totalVotes) * 100) : 0;
  const percent2 = 100 - percent1;
  const now = new Date();
  const end = new Date(battle.ends_at);
  const isExpired = now >= end;

  clearInterval(countdownInterval);

  document.getElementById('battleContainer').innerHTML = `
    <div class="battle">
      <h3>${battle.title}</h3>
      <div class="vote-section">
        <div class="option">
          <strong>${battle.option1}</strong>
          <p><span id="votes1">${battle.votes1}</span> votes</p>
          <button ${isExpired ? 'disabled' : ''} onclick="showSocialPopup(event, '${battle.id}', 1)">Vote</button>
        </div>
        <div class="option">
          <strong>${battle.option2}</strong>
          <p><span id="votes2">${battle.votes2}</span> votes</p>
          <button ${isExpired ? 'disabled' : ''} onclick="showSocialPopup(event, '${battle.id}', 2)">Vote</button>
        </div>
      </div>
      <div class="progress-container">
        <div class="progress-bar-left" style="width: ${percent1}%;">
          <span class="progress-label">${percent1}%</span>
        </div>
        <div class="progress-bar-right" style="width: ${percent2}%;">
          <span class="progress-label">${percent2}%</span>
        </div>
      </div>
      <div class="countdown" id="countdownTimer"></div>
    </div>
  `;

  updateCountdown(end);
}

function updateCountdown(endTime) {
  const countdown = document.getElementById('countdownTimer');
  function tick() {
    const now = new Date();
    const diff = Math.max(0, endTime - now);
    const seconds = Math.floor(diff / 1000) % 60;
    const minutes = Math.floor(diff / 60000) % 60;
    const hours = Math.floor(diff / 3600000) % 24;
    const days = Math.floor(diff / 86400000);

    countdown.textContent = diff > 0
      ? `Time left: ${days}d ${hours}h ${minutes}m ${seconds}s`
      : 'Battle has ended';
  }

  tick();
  countdownInterval = setInterval(tick, 1000);
}

document.getElementById('submitBtn').addEventListener('click', async () => {
  const title = document.getElementById('title').value.trim();
  const option1 = document.getElementById('option1').value.trim();
  const option2 = document.getElementById('option2').value.trim();

  if (!title || !option1 || !option2) {
    alert("Please fill in all fields.");
    return;
  }

  const ends_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h
  const { error } = await supabase.from('battles').insert([
    { title, option1, option2, votes1: 0, votes2: 0, ends_at }
  ]);

  if (error) {
    alert('Error creating battle.');
  } else {
    alert('Battle created!');
    loadAllBattles();
  }
});

window.showSocialPopup = (event, battleId, option) => {
  const popup = document.getElementById('socialPopup');
  popup.innerHTML = `
    <button onclick="voteAndShare('${battleId}', ${option}, 'twitter')">Twitter</button>
    <button onclick="voteAndShare('${battleId}', ${option}, 'facebook')">Facebook</button>
    <button onclick="voteAndShare('${battleId}', ${option}, 'whatsapp')">WhatsApp</button>
    <button onclick="voteAndShare('${battleId}', ${option}, 'reddit')">Reddit</button>
  `;
  popup.style.display = 'block';
  popup.style.left = event.pageX + 'px';
  popup.style.top = event.pageY + 'px';
};

window.voteAndShare = async (battleId, option, platform) => {
  const column = option === 1 ? 'votes1' : 'votes2';
  const url = window.location.href;

  const { data, error } = await supabase.rpc('increment_vote', {
    battle_id_input: battleId,
    column_name_input: column
  });

  if (error) {
    alert('Vote failed.');
    return;
  }

  loadAllBattles(); // Re-render entire battle

  const shareText = encodeURIComponent("Check out this battle!");
  let shareUrl = '';

  switch (platform) {
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${url}`;
      break;
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      break;
    case 'whatsapp':
      shareUrl = `https://api.whatsapp.com/send?text=${shareText}%20${url}`;
      break;
    case 'reddit':
      shareUrl = `https://www.reddit.com/submit?url=${url}&title=${shareText}`;
      break;
  }

  window.open(shareUrl, '_blank', 'width=600,height=400');
  document.getElementById('socialPopup').style.display = 'none';
};

document.getElementById('battleSelector').addEventListener('change', (e) => {
  const battleId = e.target.value;
  if (battleId) renderBattleById(battleId);
});

window.toggleForm = toggleForm;
window.loadAllBattles = loadAllBattles;

loadAllBattles();
