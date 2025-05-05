import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentTab = 'active';
let countdownIntervals = {};

function toggleForm() {
  const form = document.getElementById('createForm');
  form.style.display = form.style.display === 'none' || form.style.display === '' ? 'block' : 'none';
}

function switchTab(tab) {
  currentTab = tab;
  document.getElementById('tab-active').classList.toggle('active', tab === 'active');
  document.getElementById('tab-finished').classList.toggle('active', tab === 'finished');
  loadAllBattles();
}

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function renderBattleBlock(battle) {
  const now = new Date();
  const endsAt = new Date(battle.ends_at);
  const timeLeft = endsAt - now;
  const isOver = timeLeft <= 0;

  const totalVotes = battle.votes1 + battle.votes2;
  const percent1 = totalVotes === 0 ? 50 : Math.round((battle.votes1 / totalVotes) * 100);
  const percent2 = 100 - percent1;

  const block = document.createElement('div');
  block.className = 'battle-block';
  block.innerHTML = `
    <h3>${battle.title}</h3>
    <div id="countdown-${battle.id}" class="countdown-timer">${isOver ? 'Voting ended' : formatTime(timeLeft)}</div>
    <div class="battle-options">
      <div class="option">
        <strong>${battle.option1}</strong>
        <div class="image-box">${battle.image1 ? `<img src="${battle.image1}" alt="" />` : ''}</div>
        <button ${isOver ? 'disabled' : ''} onclick="showSocialPopup(event, '${battle.id}', 1)">Vote now</button>
      </div>
      <div class="option">
        <strong>${battle.option2}</strong>
        <div class="image-box">${battle.image2 ? `<img src="${battle.image2}" alt="" />` : ''}</div>
        <button ${isOver ? 'disabled' : ''} onclick="showSocialPopup(event, '${battle.id}', 2)">Vote now</button>
      </div>
    </div>
    <div class="progress-bar">
      <div class="bar left" style="width:${percent1}%">${battle.votes1} (${percent1}%)</div>
      <div class="bar right" style="width:${percent2}%">${battle.votes2} (${percent2}%)</div>
    </div>
  `;

  if (!isOver) {
    countdownIntervals[battle.id] = setInterval(() => {
      const newTimeLeft = new Date(battle.ends_at) - new Date();
      const el = document.getElementById(`countdown-${battle.id}`);
      if (newTimeLeft <= 0) {
        clearInterval(countdownIntervals[battle.id]);
        el.textContent = 'Voting ended';
        loadAllBattles();
      } else {
        el.textContent = formatTime(newTimeLeft);
      }
    }, 1000);
  }

  return block;
}

async function loadAllBattles() {
  const { data, error } = await supabase.from('battles').select('*').order('created_at', { ascending: false });
  if (error) {
    alert('Error loading battles');
    return;
  }
  const container = document.getElementById('battleList');
  container.innerHTML = '';
  data.forEach(battle => {
    const now = new Date();
    const endsAt = new Date(battle.ends_at);
    const isOver = now > endsAt;
    if ((currentTab === 'active' && !isOver) || (currentTab === 'finished' && isOver)) {
      const block = renderBattleBlock(battle);
      container.appendChild(block);
    }
  });
}

document.getElementById('submitBtn').addEventListener('click', async () => {
  const title = document.getElementById('title').value.trim();
  const option1 = document.getElementById('option1').value.trim();
  const option2 = document.getElementById('option2').value.trim();
  const duration = parseInt(document.getElementById('duration').value.trim());
  const image1 = document.getElementById('image1').value.trim();
  const image2 = document.getElementById('image2').value.trim();

  if (!title || !option1 || !option2 || isNaN(duration)) {
    alert('Please fill in all required fields.');
    return;
  }

  const endsAt = new Date(Date.now() + duration * 60000).toISOString();

  const { error } = await supabase.from('battles').insert([
    { title, option1, option2, votes1: 0, votes2: 0, ends_at: endsAt, image1, image2 }
  ]);

  if (error) {
    alert('Error creating battle.');
  } else {
    alert('Battle created!');
    toggleForm();
    loadAllBattles();
  }
});

window.showSocialPopup = (event, battleId, option) => {
  const popup = document.getElementById('socialPopup');
  popup.innerHTML = `
    <button onclick="voteAndShare('${battleId}', ${option}, 'twitter')">🐦</button>
    <button onclick="voteAndShare('${battleId}', ${option}, 'facebook')">📘</button>
    <button onclick="voteAndShare('${battleId}', ${option}, 'whatsapp')">🟢</button>
    <button onclick="voteAndShare('${battleId}', ${option}, 'reddit')">👽</button>
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

  loadAllBattles();
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

window.toggleForm = toggleForm;
window.switchTab = switchTab;
window.loadAllBattles = loadAllBattles;

loadAllBattles();
