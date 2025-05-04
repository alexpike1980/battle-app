import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  const percent2 = totalVotes ? Math.round((battle.votes2 / totalVotes) * 100) : 0;

  const endsAt = new Date(battle.ends_at);
  const now = new Date();
  const isExpired = now >= endsAt;

  document.getElementById('battleContainer').innerHTML = `
    <div class="battle">
      <h3>${battle.title}</h3>
      <p id="countdown"></p>

      <p><strong>${battle.option1}</strong>: <span id="votes1">${battle.votes1}</span> votes</p>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${percent1}%">${percent1}%</div>
      </div>
      <div class="vote-buttons">
        <button ${isExpired ? 'disabled' : ''} onclick="showSocialPopup(event, '${battle.id}', 1)">Vote Now</button>
      </div>

      <p><strong>${battle.option2}</strong>: <span id="votes2">${battle.votes2}</span> votes</p>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${percent2}%">${percent2}%</div>
      </div>
      <div class="vote-buttons">
        <button ${isExpired ? 'disabled' : ''} onclick="showSocialPopup(event, '${battle.id}', 2)">Vote Now</button>
      </div>
    </div>
  `;

  // Обновление таймера
  if (!isExpired) {
    const countdownEl = document.getElementById('countdown');
    const interval = setInterval(() => {
      const now = new Date();
      const diff = endsAt - now;

      if (diff <= 0) {
        clearInterval(interval);
        countdownEl.textContent = 'Voting has ended.';
        document.querySelectorAll('.vote-buttons button').forEach(btn => btn.disabled = true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      countdownEl.textContent = `Time left: ${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
  } else {
    document.getElementById('countdown').textContent = 'Voting has ended.';
  }
}

document.getElementById('submitBtn').addEventListener('click', async () => {
  const title = document.getElementById('title').value.trim();
  const option1 = document.getElementById('option1').value.trim();
  const option2 = document.getElementById('option2').value.trim();
  const endsInHours = parseInt(document.getElementById('duration').value.trim());

  if (!title || !option1 || !option2 || isNaN(endsInHours)) {
    alert("Please fill in all fields, including duration.");
    return;
  }

  const ends_at = new Date(Date.now() + endsInHours * 3600 * 1000).toISOString();

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

  document.getElementById(`votes${option}`).textContent = 
    parseInt(document.getElementById(`votes${option}`).textContent) + 1;

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
  if (battleId) {
    renderBattleById(battleId);
  }
});

window.toggleForm = toggleForm;
window.loadAllBattles = loadAllBattles;

loadAllBattles();
