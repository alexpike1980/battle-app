import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA'; // обрезано для читаемости

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const battleList = document.getElementById('battleList');
let battles = [];
let currentTab = 'active';

function toggleForm() {
  const form = document.getElementById('createForm');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

document.getElementById('submitBtn').addEventListener('click', () => {
  const title = document.getElementById('title').value;
  const option1 = document.getElementById('option1').value;
  const option2 = document.getElementById('option2').value;
  const duration = parseInt(document.getElementById('duration').value) || 5;
  const image1 = document.getElementById('image1').value;
  const image2 = document.getElementById('image2').value;

  const endsAt = new Date(Date.now() + duration * 60000).toISOString();

  const newBattle = {
    id: Date.now().toString(),
    title,
    option1,
    option2,
    image1,
    image2,
    votes1: 0,
    votes2: 0,
    ends_at: endsAt
  };

  battles.push(newBattle);
  switchTab('active');
  toggleForm();
});

function switchTab(tab) {
  currentTab = tab;
  document.getElementById('tab-active').classList.toggle('active', tab === 'active');
  document.getElementById('tab-finished').classList.toggle('active', tab === 'finished');

  const now = new Date();
  const filtered = battles.filter(b =>
    (tab === 'active' ? new Date(b.ends_at) > now : new Date(b.ends_at) <= now)
  );

  renderBattleList(filtered);
}

function renderBattleList(list) {
  const container = document.getElementById('battleList');
  container.innerHTML = '';

  list.forEach(battle => {
    const block = document.createElement('div');
    block.className = 'battle-block';
    block.id = `battle-${battle.id}`;

    const total = battle.votes1 + battle.votes2;
    const p1 = total ? Math.round((battle.votes1 / total) * 100) : 50;
    const p2 = 100 - p1;

    const endsAt = new Date(battle.ends_at);

    block.innerHTML = `
      <h3>${battle.title}</h3>
      <div id="timer-${battle.id}" style="font-weight: bold; margin-bottom: 10px;"></div>
      <div style="display: flex; justify-content: space-around; flex-wrap: wrap;">
        <div style="text-align: center;">
          <div><strong>${battle.option1}</strong></div>
          <div class="image-box">${battle.image1 ? `<img src="${battle.image1}">` : ''}</div>
          <button class="vote-btn" onclick="showSocialPopup(event, '${battle.id}', 1)">Vote Now</button>
        </div>
        <div style="text-align: center;">
          <div><strong>${battle.option2}</strong></div>
          <div class="image-box">${battle.image2 ? `<img src="${battle.image2}">` : ''}</div>
          <button class="vote-btn" onclick="showSocialPopup(event, '${battle.id}', 2)">Vote Now</button>
        </div>
      </div>
      <div style="margin-top: 10px; background: #eee; height: 20px; border-radius: 10px; overflow: hidden;">
        <div style="height: 100%; background: green; width: ${p1}%; float: left; text-align: center; color: white;">${battle.votes1} (${p1}%)</div>
        <div style="height: 100%; background: red; width: ${p2}%; float: left; text-align: center; color: white;">${battle.votes2} (${p2}%)</div>
      </div>
    `;

    container.appendChild(block);

    const timerEl = block.querySelector(`#timer-${battle.id}`);
    const updateTimer = () => {
      const now = new Date();
      const diff = endsAt - now;
      if (diff <= 0) {
        timerEl.textContent = 'Battle Finished';
        clearInterval(interval);
        switchTab(currentTab);
        return;
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      timerEl.textContent = `Ends in ${m}m ${s}s`;
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
  });
}

window.showSocialPopup = function (event, battleId, option) {
  const popup = document.getElementById('socialPopup');
  popup.innerHTML = `
    <div class="social-icons">
      <a href="https://wa.me/?text=I%20voted%20on%20a%20battle!" target="_blank">
        <img src="https://img.icons8.com/color/48/000000/whatsapp--v1.png" alt="WhatsApp"/>
      </a>
      <a href="https://t.me/share/url?url=http://example.com" target="_blank">
        <img src="https://img.icons8.com/color/48/000000/telegram-app--v1.png" alt="Telegram"/>
      </a>
    </div>
  `;
  popup.style.display = 'block';
  popup.style.left = event.pageX + 'px';
  popup.style.top = event.pageY + 'px';

  const battle = battles.find(b => b.id === battleId);
  if (battle) {
    if (option === 1) battle.votes1 += 1;
    else battle.votes2 += 1;
    switchTab(currentTab);
  }
};

switchTab('active');
