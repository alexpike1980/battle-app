import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

async function loadLatestBattle() {
  const { data, error } = await supabase
    .from('battles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    alert('Error loading latest battle');
    return;
  }

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

  const leftImage = battle.image1 || '';
  const rightImage = battle.image2 || '';

  document.getElementById('battleContainer').innerHTML = `
    <div class="battle">
      <h2>${battle.title}</h2>
      <div id="countdown" style="font-weight:bold; margin-bottom: 10px;"></div>
      <div style="display: flex; gap: 20px;">
        <div style="flex: 1; text-align: center;">
          <h3>${battle.option1}</h3>
          ${leftImage ? `<img src="${leftImage}" style="max-width: 100%; max-height: 150px;" />` : ''}
          <button ${isOver ? 'disabled' : ''} onclick="showSocialPopup(event, '${battle.id}', 1)">Vote</button>
        </div>
        <div style="flex: 1; text-align: center;">
          <h3>${battle.option2}</h3>
          ${rightImage ? `<img src="${rightImage}" style="max-width: 100%; max-height: 150px;" />` : ''}
          <button ${isOver ? 'disabled' : ''} onclick="showSocialPopup(event, '${battle.id}', 2)">Vote</button>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-segment green" style="width: ${percent1}%;">${battle.votes1} (${percent1}%)</div>
        <div class="progress-segment red" style="width: ${percent2}%;">${battle.votes2} (${percent2}%)</div>
      </div>
    </div>
  `;

  const countdownEl = document.getElementById('countdown');
  if (!isOver) {
    countdownEl.textContent = 'Time left: ' + formatRemainingTime(timeLeft);
    countdownInterval = setInterval(() => {
      const newTimeLeft = endsAt - new Date();
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
    loadLatestBattle();
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

  if (error) {
    alert('Vote failed.');
    return;
  }

  await loadLatestBattle();

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

loadLatestBattle();
