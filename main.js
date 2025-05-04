import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA'; // обрезано для читаемости

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function toggleForm() {
  const form = document.getElementById('createForm');
  form.style.display = form.style.display === 'none' || form.style.display === '' ? 'block' : 'none';
}

let countdownInterval;

function formatRemainingTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

async function renderBattleById(battleId) {
  const { data, error } = await supabase
    .from('battles')
    .select('*')
    .eq('id', battleId)
    .single();

  if (!data || error) return;
  renderBattle(data);
}

function renderBattle(battle) {
  const now = new Date();
  const endsAt = new Date(battle.ends_at);
  const timeLeft = endsAt - now;
  const isOver = timeLeft <= 0;

  const totalVotes = battle.votes1 + battle.votes2;
  const percent1 = totalVotes === 0 ? 50 : Math.round((battle.votes1 / totalVotes) * 100);
  const percent2 = 100 - percent1;

  clearInterval(countdownInterval);

  document.getElementById('battleContainer').innerHTML = `
    <h3>${battle.title}</h3>
    <div id="countdown" style="font-weight:bold;margin-bottom:10px;"></div>
    <div style="display: flex; justify-content: space-between; gap: 10px;">
      <div style="flex: 1; text-align: center;">
        <div><strong>${battle.option1}</strong></div>
        ${battle.image1 ? `<img src="${battle.image1}" style="max-width:100%;max-height:150px;" />` : ''}
        <button ${isOver ? 'disabled' : ''} onclick="showSocialPopup(event, '${battle.id}', 1)">Vote</button>
      </div>
      <div style="flex: 1; text-align: center;">
        <div><strong>${battle.option2}</strong></div>
        ${battle.image2 ? `<img src="${battle.image2}" style="max-width:100%;max-height:150px;" />` : ''}
        <button ${isOver ? 'disabled' : ''} onclick="showSocialPopup(event, '${battle.id}', 2)">Vote</button>
      </div>
    </div>
    <div style="margin-top: 10px; background: #ccc; height: 20px; border-radius: 10px; overflow: hidden; position: relative;">
      <div style="height: 100%; background: green; width: ${percent1}%; float: left; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">
        ${battle.votes1} (${percent1}%)
      </div>
      <div style="height: 100%; background: red; width: ${percent2}%; float: left; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">
        ${battle.votes2} (${percent2}%)
      </div>
    </div>
  `;

  const countdownEl = document.getElementById('countdown');
  if (!isOver) {
    countdownEl.textContent = 'Time left: ' + formatRemainingTime(timeLeft);
    countdownInterval = setInterval(() => {
      const newTimeLeft = new Date(battle.ends_at) - new Date();
      if (newTimeLeft <= 0) {
        countdownEl.textContent = 'Voting ended';
        document.querySelectorAll('#battleContainer button').forEach(btn => btn.disabled = true);
        clearInterval(countdownInterval);
      } else {
        countdownEl.textContent = 'Time left: ' + formatRemainingTime(newTimeLeft);
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

  if (!title || !option1 || !option2 || isNaN(duration)) {
    alert("Please fill in all required fields.");
    return;
  }

  const endsAt = new Date(Date.now() + duration * 60 * 1000).toISOString();

  const { error } = await supabase.from('battles').insert([
    { title, option1, option2, votes1: 0, votes2: 0, ends_at: endsAt, image1, image2 }
  ]);

  if (error) {
    alert('Error creating battle.');
  } else {
    alert('Battle created!');
    switchTab(currentTab); // обновим текущую вкладку
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

  if (error) {
    alert('Vote failed.');
    return;
  }

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

let currentTab = 'active';

async function switchTab(tab) {
  currentTab = tab;
  document.getElementById('tab-active').classList.toggle('active', tab === 'active');
  document.getElementById('tab-finished').classList.toggle('active', tab === 'finished');

  const { data, error } = await supabase
    .from('battles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    alert('Error loading battles.');
    return;
  }

  const now = new Date();

  const filtered = data.filter(b => {
    const endsAt = new Date(b.ends_at);
    return tab === 'active' ? endsAt > now : endsAt <= now;
  });

  const listContainer = document.getElementById('battleList');
  listContainer.innerHTML = filtered.length
    ? filtered.map(b => `
        <div style="margin-bottom: 10px;">
          <strong>${b.title}</strong>
          <button onclick="renderBattleById('${b.id}')">View</button>
        </div>
      `).join('')
    : `<div>No ${tab === 'active' ? 'active' : 'finished'} battles.</div>`;
}

// Экспорт функций
window.toggleForm = toggleForm;
window.renderBattleById = renderBattleById;
window.switchTab = switchTab;

// Инициализация
switchTab('active');
