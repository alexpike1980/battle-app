import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentTab = 'current';
let page = 0;
const pageSize = 10;
let loading = false;

document.getElementById('tabCurrent').onclick = () => switchTab('current');
document.getElementById('tabFinished').onclick = () => switchTab('finished');

function toggleForm() {
  const form = document.getElementById('createForm');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function switchTab(tab) {
  currentTab = tab;
  page = 0;
  document.getElementById('battlesList').innerHTML = '';
  loadBattles();
}

async function loadBattles() {
  if (loading) return;
  loading = true;
  document.getElementById('loadingIndicator').style.display = 'block';

  const now = new Date().toISOString();
  const filter = currentTab === 'current' ? `ends_at.gt.${now}` : `ends_at.lte.${now}`;
  const from = page * pageSize;

  const { data, error } = await supabase
    .from('battles')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)
    .filter('ends_at', currentTab === 'current' ? 'gt' : 'lte', now);

  if (error) {
    console.error('Error loading battles:', error);
    loading = false;
    return;
  }

  data.forEach(renderBattleBlock);
  page++;
  loading = false;
  document.getElementById('loadingIndicator').style.display = 'none';
}

function renderBattleBlock(battle) {
  const container = document.getElementById('battlesList');

  const totalVotes = battle.votes1 + battle.votes2;
  const percent1 = totalVotes === 0 ? 50 : Math.round((battle.votes1 / totalVotes) * 100);
  const percent2 = 100 - percent1;

  const isOver = new Date(battle.ends_at) < new Date();
  const timeLeft = new Date(battle.ends_at) - new Date();

  const div = document.createElement('div');
  div.className = 'battle-block';
  div.innerHTML = `
    <h3>${battle.title}</h3>
    <div id="countdown-${battle.id}">${isOver ? 'Voting ended' : 'Time left: ' + formatTime(timeLeft)}</div>
    <div style="display:flex;gap:10px;">
      <div style="flex:1;text-align:center;">
        <div><strong>${battle.option1}</strong></div>
        ${battle.image1 ? `<img src="${battle.image1}" style="max-width:100%;max-height:150px;">` : ''}
        <button ${isOver ? 'disabled' : ''} onclick="showSocialPopup(event, '${battle.id}', 1)">Vote</button>
      </div>
      <div style="flex:1;text-align:center;">
        <div><strong>${battle.option2}</strong></div>
        ${battle.image2 ? `<img src="${battle.image2}" style="max-width:100%;max-height:150px;">` : ''}
        <button ${isOver ? 'disabled' : ''} onclick="showSocialPopup(event, '${battle.id}', 2)">Vote</button>
      </div>
    </div>
    <div class="progress-container">
      <div class="progress-left" style="width:${percent1}%"></div>
      <div class="progress-right" style="width:${percent2}%"></div>
      <div class="progress-text">${battle.votes1} (${percent1}%) — ${battle.votes2} (${percent2}%)</div>
    </div>
  `;

  container.appendChild(div);

  if (!isOver) {
    const countdownEl = div.querySelector(`#countdown-${battle.id}`);
    const interval = setInterval(() => {
      const timeLeft = new Date(battle.ends_at) - new Date();
      if (timeLeft <= 0) {
        countdownEl.textContent = 'Voting ended';
        div.querySelectorAll('button').forEach(btn => btn.disabled = true);
        clearInterval(interval);
      } else {
        countdownEl.textContent = 'Time left: ' + formatTime(timeLeft);
      }
    }, 1000);
  }
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

document.getElementById('submitBtn').onclick = async () => {
  const title = document.getElementById('title').value.trim();
  const option1 = document.getElementById('option1').value.trim();
  const option2 = document.getElementById('option2').value.trim();
  const duration = parseInt(document.getElementById('duration').value.trim());
  const image1 = document.getElementById('image1').value.trim();
  const image2 = document.getElementById('image2').value.trim();

  if (!title || !option1 || !option2 || isNaN(duration)) {
    alert('Please fill all fields');
    return;
  }

  const ends_at = new Date(Date.now() + duration * 60000).toISOString();

  const { error } = await supabase.from('battles').insert([{
    title, option1, option2, votes1: 0, votes2: 0, ends_at, image1, image2
  }]);

  if (error) {
    alert('Error creating battle');
  } else {
    alert('Battle created!');
    toggleForm();
    switchTab('current');
  }
};

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

  await supabase.rpc('increment_vote', {
    battle_id_input: battleId,
    column_name_input: column
  });

  switchTab(currentTab);

  const shareText = encodeURIComponent("Check out this battle!");
  let shareUrl = '';
  if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${url}`;
  if (platform === 'facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  if (platform === 'whatsapp') shareUrl = `https://api.whatsapp.com/send?text=${shareText}%20${url}`;
  if (platform === 'reddit') shareUrl = `https://www.reddit.com/submit?url=${url}&title=${shareText}`;

  window.open(shareUrl, '_blank', 'width=600,height=400');
  document.getElementById('socialPopup').style.display = 'none';
};

// Infinite scroll
window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    loadBattles();
  }
});

switchTab('current');


function toggleForm() {
  const form = document.getElementById('createForm');
  form.style.display = form.style.display === 'none' || form.style.display === '' ? 'block' : 'none';
}

function formatRemainingTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

let countdownInterval;

async function loadBattles() {
  const { data, error } = await supabase
    .from('battles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return alert('Error loading battles.');

  const selector = document.getElementById('battleSelector');
  selector.innerHTML = data.map(b => `<option value="${b.id}">${b.title}</option>`).join('');

  if (data.length > 0) renderBattle(data[0]);
}

async function renderBattleById(id) {
  const { data, error } = await supabase
    .from('battles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return;
  renderBattle(data);
}

function renderBattle(battle) {
  clearInterval(countdownInterval);

  const now = new Date();
  const endsAt = new Date(battle.ends_at);
  const timeLeft = endsAt - now;
  const isOver = timeLeft <= 0;

  const totalVotes = battle.votes1 + battle.votes2;
  const percent1 = totalVotes === 0 ? 50 : Math.round((battle.votes1 / totalVotes) * 100);
  const percent2 = 100 - percent1;

  const html = `
    <div class="battle">
      <h3>${battle.title}</h3>
      <div id="countdown"></div>
      <div class="vote-options">
        <div class="vote-option">
          <div><strong>${battle.option1}</strong></div>
          ${battle.option1_img ? `<img src="${battle.option1_img}" class="option-img" />` : ''}
          <button ${isOver ? 'disabled' : ''} onclick="showSocialPopup(event, '${battle.id}', 1)">Vote</button>
        </div>
        <div class="vote-option">
          <div><strong>${battle.option2}</strong></div>
          ${battle.option2_img ? `<img src="${battle.option2_img}" class="option-img" />` : ''}
          <button ${isOver ? 'disabled' : ''} onclick="showSocialPopup(event, '${battle.id}', 2)">Vote</button>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-left" style="width:${percent1}%">
          ${battle.votes1} votes (${percent1}%)
        </div>
        <div class="progress-right" style="width:${percent2}%">
          ${battle.votes2} votes (${percent2}%)
        </div>
      </div>
    </div>
  `;

  document.getElementById('battleContainer').innerHTML = html;

  const countdownEl = document.getElementById('countdown');
  if (!isOver) {
    countdownEl.textContent = 'Time left: ' + formatRemainingTime(timeLeft);
    countdownInterval = setInterval(() => {
      const remaining = new Date(battle.ends_at) - new Date();
      if (remaining <= 0) {
        countdownEl.textContent = 'Voting ended';
        document.querySelectorAll('.vote-option button').forEach(b => b.disabled = true);
        clearInterval(countdownInterval);
      } else {
        countdownEl.textContent = 'Time left: ' + formatRemainingTime(remaining);
      }
    }, 1000);
  } else {
    countdownEl.textContent = 'Voting ended';
  }
}

document.getElementById('submitBtn').addEventListener('click', async () => {
  const title = document.getElementById('title').value.trim();
  const option1 = document.getElementById('option1').value.trim();
  const option2 = document.getElementById('option2').value.trim();
  const duration = parseInt(document.getElementById('duration').value.trim());
  const image1 = document.getElementById('image1').value.trim();
  const image2 = document.getElementById('image2').value.trim();

  if (!title || !option1 || !option2 || isNaN(duration)) return alert("Please fill in all required fields.");

  const endsAt = new Date(Date.now() + duration * 60 * 1000).toISOString();

  const { error } = await supabase.from('battles').insert([
    {
      title,
      option1,
      option2,
      votes1: 0,
      votes2: 0,
      ends_at: endsAt,
      option1_img: image1,
      option2_img: image2
    }
  ]);

  if (error) alert('Error creating battle.');
  else {
    alert('Battle created!');
    loadBattles();
    toggleForm();
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

  const { error } = await supabase.rpc('increment_vote', {
    battle_id_input: battleId,
    column_name_input: column
  });

  if (error) return alert('Vote failed.');

  await renderBattleById(battleId);

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
window.loadBattles = loadBattles;

loadBattles();
