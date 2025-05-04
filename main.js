import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function toggleForm() {
  const form = document.getElementById('createForm');
  form.style.display = form.style.display === 'none' || form.style.display === '' ? 'block' : 'none';
}

function formatRemainingTime(ms) {
  if (ms <= 0) return 'Battle ended';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

let countdownInterval;

async function loadAllBattles() {
  const { data, error } = await supabase.from('battles').select('*').order('created_at', { ascending: false });
  if (error) return alert('Error loading battles.');
  const selector = document.getElementById('battleSelector');
  selector.innerHTML = data.map(b => `<option value="${b.id}">${b.title}</option>`).join('');
  if (data.length > 0) renderBattle(data[0]);
}

async function renderBattleById(battleId) {
  const { data, error } = await supabase.from('battles').select('*').eq('id', battleId).single();
  if (error || !data) return;
  renderBattle(data);
}

function renderBattle(battle) {
  clearInterval(countdownInterval);
  const now = new Date();
  const endsAt = new Date(battle.ends_at);
  const msRemaining = endsAt - now;
  const totalVotes = battle.votes1 + battle.votes2;
  const percent1 = totalVotes === 0 ? 50 : Math.round((battle.votes1 / totalVotes) * 100);
  const percent2 = 100 - percent1;

  document.getElementById('battleContainer').innerHTML = `
    <div class="battle">
      <h3>${battle.title}</h3>
      <div class="options">
        <div class="option left">
          <img src="${battle.image1 || ''}" alt="Option 1" class="option-img">
          <p><strong>${battle.option1}</strong></p>
          <p><span id="votes1">${battle.votes1}</span> votes</p>
          <button onclick="showSocialPopup(event, '${battle.id}', 1)" ${msRemaining <= 0 ? 'disabled' : ''}>Vote</button>
        </div>
        <div class="option right">
          <img src="${battle.image2 || ''}" alt="Option 2" class="option-img">
          <p><strong>${battle.option2}</strong></p>
          <p><span id="votes2">${battle.votes2}</span> votes</p>
          <button onclick="showSocialPopup(event, '${battle.id}', 2)" ${msRemaining <= 0 ? 'disabled' : ''}>Vote</button>
        </div>
      </div>
      <div class="progress-container">
        <div class="progress-bar">
          <div class="bar left-bar" style="width: ${percent1}%">${percent1}%</div>
          <div class="bar right-bar" style="width: ${percent2}%">${percent2}%</div>
        </div>
      </div>
      <p id="countdown">${formatRemainingTime(msRemaining)}</p>
    </div>
  `;

  countdownInterval = setInterval(() => {
    const newRemaining = new Date(battle.ends_at) - new Date();
    document.getElementById('countdown').textContent = formatRemainingTime(newRemaining);
    if (newRemaining <= 0) {
      clearInterval(countdownInterval);
      renderBattleById(battle.id);
    }
  }, 1000);
}

document.getElementById('submitBtn').addEventListener('click', async () => {
  const title = document.getElementById('title').value.trim();
  const option1 = document.getElementById('option1').value.trim();
  const option2 = document.getElementById('option2').value.trim();
  const duration = parseInt(document.getElementById('duration').value);
  const image1 = document.getElementById('image1').value.trim();
  const image2 = document.getElementById('image2').value.trim();

  if (!title || !option1 || !option2 || isNaN(duration)) return alert("Fill in all fields.");
  const ends_at = new Date(Date.now() + duration * 60000).toISOString();
  const { error } = await supabase.from('battles').insert([{ title, option1, option2, votes1: 0, votes2: 0, ends_at, image1, image2 }]);
  if (error) return alert('Error creating battle.');
  alert('Battle created!');
  loadAllBattles();
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
  const { error } = await supabase.rpc('increment_vote', { battle_id_input: battleId, column_name_input: column });
  if (error) return alert('Vote failed.');

  const current = parseInt(document.getElementById(`votes${option}`).textContent);
  document.getElementById(`votes${option}`).textContent = current + 1;
  renderBattleById(battleId);

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

document.getElementById('battleSelector').addEventListener('change', e => {
  const battleId = e.target.value;
  if (battleId) renderBattleById(battleId);
});

window.toggleForm = toggleForm;
window.loadAllBattles = loadAllBattles;
loadAllBattles();

