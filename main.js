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
  const container = document.getElementById('battleContainer');
  container.classList.add('fade-out');

  setTimeout(() => {
    const totalVotes = battle.votes1 + battle.votes2;
    const percent1 = totalVotes > 0 ? (battle.votes1 / totalVotes) * 100 : 50;
    const percent2 = totalVotes > 0 ? (battle.votes2 / totalVotes) * 100 : 50;

    container.innerHTML = `
      <div class="battle">
        <h3>${battle.title}</h3>
        <div style="display: flex; justify-content: space-between; gap: 10px;">
          <div style="flex: 1; text-align: center;">
            <p><strong>${battle.option1}</strong></p>
            <p class="vote-count"><span id="votes1">${battle.votes1}</span> votes</p>
            <div class="vote-buttons">
              <button onclick="showSocialPopup(event, '${battle.id}', 1)">Vote Now</button>
            </div>
          </div>
          <div style="flex: 1; text-align: center;">
            <p><strong>${battle.option2}</strong></p>
            <p class="vote-count"><span id="votes2">${battle.votes2}</span> votes</p>
            <div class="vote-buttons">
              <button onclick="showSocialPopup(event, '${battle.id}', 2)">Vote Now</button>
            </div>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-left" style="background: #e74c3c; width: ${percent1}%;"></div>
          <div class="progress-right" style="background: #2ecc71; width: ${percent2}%;"></div>
        </div>
      </div>
    `;

    container.classList.remove('fade-out');
    container.classList.add('fade-in');
    setTimeout(() => container.classList.remove('fade-in'), 400);
  }, 300);
}

document.getElementById('submitBtn').addEventListener('click', async () => {
  const title = document.getElementById('title').value.trim();
  const option1 = document.getElementById('option1').value.trim();
  const option2 = document.getElementById('option2').value.trim();

  if (!title || !option1 || !option2) {
    alert("Please fill in all fields.");
    return;
  }

  const { error } = await supabase.from('battles').insert([
    { title, option1, option2, votes1: 0, votes2: 0 }
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

  const { error } = await supabase.rpc('increment_vote', {
    battle_id_input: battleId,
    column_name_input: column
  });

  if (error) {
    alert('Vote failed.');
    return;
  }

  const span = document.getElementById(`votes${option}`);
  span.textContent = parseInt(span.textContent) + 1;

  const { data, error: fetchError } = await supabase
    .from('battles')
    .select('*')
    .eq('id', battleId)
    .single();

  if (!fetchError) {
    renderBattle(data);
  }

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
