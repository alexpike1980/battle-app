import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA'; // обрезано для читаемости

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentTab = 'active';

async function fetchBattles() {
  const { data, error } = await supabase
    .from('battles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching battles:', error);
    return [];
  }

  return data;
}

function switchTab(tab) {
  currentTab = tab;
  document.getElementById('tab-active').classList.toggle('active', tab === 'active');
  document.getElementById('tab-finished').classList.toggle('active', tab === 'finished');
  renderBattleList();
}

function toggleForm() {
  const form = document.getElementById('createForm');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

async function renderBattleList() {
  const battles = await fetchBattles();
  const listContainer = document.getElementById('battleList');
  listContainer.innerHTML = '';

  const now = new Date();

  const filtered = battles.filter(b => {
    const endsAt = new Date(b.ends_at);
    return currentTab === 'active' ? endsAt > now : endsAt <= now;
  });

  filtered.forEach(battle => {
    const totalVotes = battle.votes1 + battle.votes2;
    const percent1 = totalVotes === 0 ? 50 : Math.round((battle.votes1 / totalVotes) * 100);
    const percent2 = 100 - percent1;

    const card = document.createElement('div');
    card.className = 'battle-card';
    card.innerHTML = `
      <h3>${battle.title}</h3>
      <div><strong>${battle.option1}</strong></div>
      ${battle.image1 ? `<img src="${battle.image1}"/>` : ''}
      <div><strong>${battle.option2}</strong></div>
      ${battle.image2 ? `<img src="${battle.image2}"/>` : ''}
      <div class="progress-container">
        <div class="progress-bar" style="width: ${percent1}%; background: green;">${battle.votes1} (${percent1}%)</div>
        <div class="progress-bar" style="width: ${percent2}%; background: red;">${battle.votes2} (${percent2}%)</div>
      </div>
      <div class="social-btns">
        <button onclick="shareBattle('${battle.id}', 1, 'twitter')"><i class="fab fa-twitter"></i></button>
        <button onclick="shareBattle('${battle.id}', 1, 'facebook')"><i class="fab fa-facebook"></i></button>
        <button onclick="shareBattle('${battle.id}', 1, 'whatsapp')"><i class="fab fa-whatsapp"></i></button>
        <button onclick="shareBattle('${battle.id}', 1, 'reddit')"><i class="fab fa-reddit"></i></button>
      </div>
    `;
    listContainer.appendChild(card);
  });
}

document.getElementById('submitBtn').addEventListener('click', async () => {
  const title = document.getElementById('title').value;
  const option1 = document.getElementById('option1').value;
  const option2 = document.getElementById('option2').value;
  const duration = parseInt(document.getElementById('duration').value);
  const image1 = document.getElementById('image1').value;
  const image2 = document.getElementById('image2').value;

  const ends_at = new Date(Date.now() + duration * 60000).toISOString();

  const { error } = await supabase.from('battles').insert([{
    title, option1, option2, image1, image2, votes1: 0, votes2: 0, ends_at
  }]);

  if (error) {
    alert('Error creating battle');
  } else {
    alert('Battle created!');
    renderBattleList();
    toggleForm();
  }
});

window.toggleForm = toggleForm;
window.switchTab = switchTab;
window.shareBattle = (battleId, option, platform) => {
  const url = location.href;
  const text = encodeURIComponent("Check out this battle!");
  let shareUrl = '';

  switch (platform) {
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
      break;
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      break;
    case 'whatsapp':
      shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
      break;
    case 'reddit':
      shareUrl = `https://www.reddit.com/submit?url=${url}&title=${text}`;
      break;
  }

  window.open(shareUrl, '_blank', 'width=600,height=400');
};

renderBattleList();
