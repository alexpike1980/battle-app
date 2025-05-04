import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentTab = 'active';

function toggleForm() {
  const form = document.getElementById('createForm');
  form.style.display = form.style.display === 'none' || form.style.display === '' ? 'block' : 'none';
}

function switchTab(tab) {
  currentTab = tab;
  document.getElementById('tab-active').classList.remove('active');
  document.getElementById('tab-finished').classList.remove('active');
  document.getElementById(`tab-${tab}`).classList.add('active');
  loadBattles();
}

async function loadBattles() {
  const { data, error } = await supabase
    .from('battles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    alert('Error loading battles.');
    return;
  }

  const now = new Date();
  const filtered = data.filter(b => {
    const end = new Date(b.ends_at);
    return currentTab === 'active' ? end > now : end <= now;
  });

  const list = document.getElementById('battleList');
  list.innerHTML = '';

  filtered.forEach(battle => {
    const battleDiv = document.createElement('div');
    battleDiv.style.border = '1px solid #ccc';
    battleDiv.style.padding = '10px';
    battleDiv.style.marginBottom = '10px';
    battleDiv.style.borderRadius = '8px';
    battleDiv.style.backgroundColor = '#f9f9f9';

    const endsAt = new Date(battle.ends_at);
    const totalVotes = battle.votes1 + battle.votes2;
    const percent1 = totalVotes ? Math.round((battle.votes1 / totalVotes) * 100) : 50;
    const percent2 = 100 - percent1;

    battleDiv.innerHTML = `
      <h3>${battle.title}</h3>
      <div id="countdown-${battle.id}" style="font-weight: bold; margin-bottom: 10px;"></div>
      <div style="display: flex; justify-content: space-between; gap: 10px;">
        <div style="flex: 1; text-align: center;">
          <div><strong>${battle.option1}</strong></div>
          <div style="width: 100%; aspect-ratio: 1 / 1; overflow: hidden;">
            <img src="${battle.image1}" style="width: 100%; height: 100%; object-fit: cover;"/>
          </div>
          <button onclick="showSocialPopup(event, '${battle.id}', 1)">Vote now</button>
        </div>
        <div style="flex: 1; text-align: center;">
          <div><strong>${battle.option2}</strong></div>
          <div style="width: 100%; aspect-ratio: 1 / 1; overflow: hidden;">
            <img src="${battle.image2}" style="width: 100%; height: 100%; object-fit: cover;"/>
          </div>
          <button onclick="showSocialPopup(event, '${battle.id}', 2)">Vote now</button>
        </div>
      </div>
      <div style="margin-top: 10px; background: #ccc; height: 20px; border-radius: 10px; overflow: hidden;">
        <div style="height: 100%; background: green; width: ${percent1}%; float: left; color: white; text-align: center; font-size: 12px;">${battle.votes1} (${percent1}%)</div>
        <div style="height: 100%; background: red; width: ${percent2}%; float: left; color: white; text-align: center; font-size: 12px;">${battle.votes2} (${percent2}%)</div>
      </div>
    `;

    list.appendChild(battleDiv);

    const countdownEl = document.getElementById(`countdown-${battle.id}`);
    function updateCountdown() {
      const now = new Date();
      const remaining = Math.max(0, endsAt - now);
      const minutes = Math.floor(remaining / 1000 / 60);
      const seconds = Math.floor((remaining / 1000) % 60);
      countdownEl.textContent = `Time left: ${minutes}m ${seconds}s`;
      if (remaining <= 0) clearInterval(interval);
    }
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
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
    loadBattles();
    toggleForm();
  }
});

window.showSocialPopup = (event, battleId, option) => {
  const popup = document.getElementById('socialPopup');
  popup.innerHTML = `
    <button onclick="voteAndShare('${battleId}', ${option}, 'twitter')">🐦 Twitter</button>
    <button onclick="voteAndShare('${battleId}', ${option}, 'facebook')">📘 Facebook</button>
    <button onclick="voteAndShare('${battleId}', ${option}, 'whatsapp')">🟢 WhatsApp</button>
    <button onclick="voteAndShare('${battleId}', ${option}, 'reddit')">👽 Reddit</button>
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

  loadBattles();
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

loadBattles();
