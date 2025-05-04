import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentTab = 'active';
let page = 0;
const pageSize = 10;
let loading = false;

function toggleForm() {
  const form = document.getElementById('createForm');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}m ${sec}s`;
}

async function loadBattles(reset = false) {
  if (loading) return;
  loading = true;

  if (reset) {
    page = 0;
    document.getElementById('battleList').innerHTML = '';
  }

  const now = new Date().toISOString();
  const condition = currentTab === 'active' ? `gt.ends_at.${now}` : `lte.ends_at.${now}`;

  const { data, error } = await supabase
    .from('battles')
    .select('*')
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)
    .filter('ends_at', condition.split('.')[0], condition.split('.')[1]);

  if (!error && data.length) {
    data.forEach(renderBattle);
    page++;
  }

  loading = false;
}

function renderBattle(battle) {
  const container = document.getElementById('battleList');
  const now = new Date();
  const endsAt = new Date(battle.ends_at);
  const over = now > endsAt;
  const timeLeft = endsAt - now;
  const votes = battle.votes1 + battle.votes2;
  const percent1 = votes ? Math.round(battle.votes1 / votes * 100) : 50;
  const percent2 = 100 - percent1;

  const div = document.createElement('div');
  div.className = 'battle-block';
  div.innerHTML = `
    <h3>${battle.title}</h3>
    <div style="display:flex; gap:10px;">
      <div style="flex:1; text-align:center;">
        <strong>${battle.option1}</strong><br>
        ${battle.image1 ? `<img src="${battle.image1}" style="max-width:100%; max-height:100px;" />` : ''}
        <br><button ${over ? 'disabled' : ''} onclick="showSocialPopup(event, '${battle.id}', 1)">Vote</button>
      </div>
      <div style="flex:1; text-align:center;">
        <strong>${battle.option2}</strong><br>
        ${battle.image2 ? `<img src="${battle.image2}" style="max-width:100%; max-height:100px;" />` : ''}
        <br><button ${over ? 'disabled' : ''} onclick="showSocialPopup(event, '${battle.id}', 2)">Vote</button>
      </div>
    </div>
    <div class="progress-bar">
      <div class="bar-left" style="width: ${percent1}%"></div>
      <div class="bar-right" style="width: ${percent2}%"></div>
      <div class="progress-label">${percent1}% / ${percent2}% — ${battle.votes1 + battle.votes2} votes</div>
    </div>
    <div><strong>${over ? 'Voting ended' : 'Time left: ' + formatTime(timeLeft)}</strong></div>
  `;
  container.appendChild(div);
}

window.showSocialPopup = (event, battleId, option) => {
  const popup = document.getElementById('socialPopup');
  popup.innerHTML = `
    <button onclick="voteAndShare('${battleId}', ${option}, 'twitter')">Twitter</button>
    <button onclick="voteAndShare('${battleId}', ${option}, 'facebook')">Facebook</button>
    <button onclick="voteAndShare('${battleId}', ${option}, 'whatsapp')">WhatsApp</button>
    <button onclick="voteAndShare('${battleId}', ${option}, 'reddit')">Reddit</button>
  `;
  popup.style.display = 'block';
  popup.style.left = `${event.pageX}px`;
  popup.style.top = `${event.pageY}px`;
};

window.voteAndShare = async (battleId, option, platform) => {
  const column = option === 1 ? 'votes1' : 'votes2';
  const url = window.location.href;

  const { error } = await supabase.rpc('increment_vote', {
    battle_id_input: battleId,
    column_name_input: column
  });

  if (!error) {
    document.getElementById('battleList').innerHTML = '';
    page = 0;
    loadBattles(true);
  }

  const text = encodeURIComponent("Check out this battle!");
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    whatsapp: `https://api.whatsapp.com/send?text=${text}%20${url}`,
    reddit: `https://www.reddit.com/submit?url=${url}&title=${text}`
  };

  window.open(shareUrls[platform], '_blank');
  document.getElementById('socialPopup').style.display = 'none';
};

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

  const endsAt = new Date(Date.now() + duration * 60000).toISOString();

  const { error } = await supabase.from('battles').insert([
    { title, option1, option2, votes1: 0, votes2: 0, ends_at: endsAt, image1, image2 }
  ]);

  if (!error) {
    alert('Battle created!');
    toggleForm();
    loadBattles(true);
  } else {
    alert('Error creating battle.');
  }
});

window.switchTab = (tab) => {
  currentTab = tab;
  page = 0;
  document.getElementById('battleList').innerHTML = '';
  loadBattles(true);
};

window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
    loadBattles();
  }
});

loadBattles();
