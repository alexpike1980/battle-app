import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA'; // обрезано для читаемости

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const battleList = document.getElementById('battleList');
let allBattles = [];
let currentTab = 'active';

function toggleForm() {
  const form = document.getElementById('createForm');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
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

  const endsAt = new Date(Date.now() + duration * 60000).toISOString();

  const { error } = await supabase.from('battles').insert([
    { title, option1, option2, votes1: 0, votes2: 0, ends_at: endsAt, image1, image2 }
  ]);

  if (error) return alert('Error creating battle.');
  alert('Battle created!');
  toggleForm();
  fetchAndRenderBattles();
});

function switchTab(tab) {
  currentTab = tab;
  document.getElementById('tab-active').classList.toggle('active', tab === 'active');
  document.getElementById('tab-finished').classList.toggle('active', tab === 'finished');
  renderBattleList();
}

async function fetchAndRenderBattles() {
  const { data, error } = await supabase
    .from('battles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return alert('Error loading battles');
  allBattles = data;
  renderBattleList();
}

function renderBattleList() {
  battleList.innerHTML = '';
  const now = new Date();

  const filtered = allBattles.filter(b =>
    currentTab === 'active' ? new Date(b.ends_at) > now : new Date(b.ends_at) <= now
  );

  filtered.forEach(battle => {
    const totalVotes = battle.votes1 + battle.votes2;
    const percent1 = totalVotes ? Math.round((battle.votes1 / totalVotes) * 100) : 50;
    const percent2 = 100 - percent1;

    const div = document.createElement('div');
    div.className = 'battle-block';
    div.innerHTML = `
      <h3>${battle.title}</h3>
      <div style="display: flex; gap: 10px; justify-content: space-around;">
        <div style="text-align: center;">
          <div><strong>${battle.option1}</strong></div>
          <div class="image-box">${battle.image1 ? `<img src="${battle.image1}">` : ''}</div>
        </div>
        <div style="text-align: center;">
          <div><strong>${battle.option2}</strong></div>
          <div class="image-box">${battle.image2 ? `<img src="${battle.image2}">` : ''}</div>
        </div>
      </div>
      <div style="margin-top:10px; background:#ccc; height: 20px; border-radius: 10px; overflow: hidden; display: flex;">
        <div style="width:${percent1}%; background:green; color:white; display:flex; align-items:center; justify-content:center; font-size:12px;">
          ${battle.votes1} (${percent1}%)
        </div>
        <div style="width:${percent2}%; background:red; color:white; display:flex; align-items:center; justify-content:center; font-size:12px;">
          ${battle.votes2} (${percent2}%)
        </div>
      </div>
      <button class="vote-btn" onclick="showSocialPopup(event, '${battle.id}', 1)">Vote Now</button>
    `;
    battleList.appendChild(div);
  });
}

window.showSocialPopup = (event, battleId, option) => {
  const popup = document.getElementById('socialPopup');
  popup.innerHTML = `
    <button class="social-btn" onclick="voteAndShare('${battleId}', ${option}, 'twitter')">
      <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/twitter.svg">Twitter
    </button>
    <button class="social-btn" onclick="voteAndShare('${battleId}', ${option}, 'facebook')">
      <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg">Facebook
    </button>
    <button class="social-btn" onclick="voteAndShare('${battleId}', ${option}, 'whatsapp')">
      <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/whatsapp.svg">WhatsApp
    </button>
    <button class="social-btn" onclick="voteAndShare('${battleId}', ${option}, 'reddit')">
      <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/reddit.svg">Reddit
    </button>
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

  if (error) return alert('Vote failed');
  await fetchAndRenderBattles();

  const shareText = encodeURIComponent("Check out this battle!");
  let shareUrl = '';

  switch (platform) {
    case 'twitter': shareUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${url}`; break;
    case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
    case 'whatsapp': shareUrl = `https://api.whatsapp.com/send?text=${shareText}%20${url}`; break;
    case 'reddit': shareUrl = `https://www.reddit.com/submit?url=${url}&title=${shareText}`; break;
  }

  window.open(shareUrl, '_blank', 'width=600,height=400');
  document.getElementById('socialPopup').style.display = 'none';
};

window.toggleForm = toggleForm;
window.switchTab = switchTab;
fetchAndRenderBattles();
