import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Функция переключения формы создания батла
window.toggleForm = () => {
  const form = document.getElementById('createForm');
  form.style.display = form.style.display === 'none' || form.style.display === '' ? 'block' : 'none';
};

// Создание батла
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
    loadLatestBattle();
    loadAllBattles(); // Перезагружаем список батлов
  }
});

// Загрузка последнего батла (основной батл)
async function loadLatestBattle() {
  const { data, error } = await supabase
    .from('battles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);
  if (error || !data.length) return;
  const battle = data[0];
  renderBattle(battle);
}

// Рендер основного батла
function renderBattle(battle) {
  document.getElementById('battleContainer').innerHTML = `
    <div class="battle">
      <h3>${battle.title}</h3>
      <p><strong>${battle.option1}</strong>: <span id="votes1">${battle.votes1}</span> votes</p>
      <div class="vote-buttons">
        <button onclick="showSocialPopup(event, ${battle.id}, 1)">Vote Now</button>
      </div>
      <p><strong>${battle.option2}</strong>: <span id="votes2">${battle.votes2}</span> votes</p>
      <div class="vote-buttons">
        <button onclick="showSocialPopup(event, ${battle.id}, 2)">Vote Now</button>
      </div>
    </div>
  `;
}

// Отображение popup с кнопками соцсетей
window.showSocialPopup = (event, battleId, option) => {
  const popup = document.getElementById('socialPopup');
  popup.innerHTML = `
    <button onclick="voteAndShare(${battleId}, ${option}, 'twitter')">Twitter</button>
    <button onclick="voteAndShare(${battleId}, ${option}, 'facebook')">Facebook</button>
    <button onclick="voteAndShare(${battleId}, ${option}, 'whatsapp')">WhatsApp</button>
    <button onclick="voteAndShare(${battleId}, ${option}, 'reddit')">Reddit</button>
  `;
  popup.style.display = 'block';
  popup.style.left = event.pageX + 'px';
  popup.style.top = event.pageY + 'px';
};

// Функция голосования и шаринга (использование RPC-функции)
window.voteAndShare = async (battleId, option, platform) => {
  const column = option === 1 ? 'votes1' : 'votes2';
  const url = window.location.href;

  // Используем RPC для инкремента голосов
  const { error } = await supabase.rpc('increment_vote', {
    battle_id_input: battleId,
    column_name_input: column
  });

  if (error) {
    alert('Vote failed.');
    return;
  }

  // Обновляем счетчик в UI
  const voteElem = document.getElementById(`votes${option}`);
  voteElem.textContent = parseInt(voteElem.textContent) + 1;

  // Формируем ссылку для шаринга
  let shareUrl = '';
  const shareText = encodeURIComponent("Check out this battle!");
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

// Загрузка списка батлов с фильтрацией
window.loadAllBattles = async () => {
  const filterValue = document.getElementById('filterSelect').value;
  let query = supabase.from('battles').select('*').order('created_at', { ascending: false });
  
  if (filterValue !== 'all') {
    const days = parseInt(filterValue);
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    // Форматируем в ISO строку
    const isoDate = sinceDate.toISOString();
    query = query.gt('created_at', isoDate);
  }
  
  const { data, error } = await query;
  if (error) {
    console.error('Error loading battles:', error.message);
    return;
  }
  renderBattleList(data);
};

// Рендер таблицы батлов
function renderBattleList(battles) {
  if (!battles.length) {
    document.getElementById('battleTable').innerHTML = "<p>No battles found.</p>";
    return;
  }
  let html = `<table>
    <tr>
      <th>Title</th>
      <th>Option 1</th>
      <th>Option 2</th>
      <th>Created At</th>
    </tr>`;
  battles.forEach(battle => {
    html += `<tr>
      <td>${battle.title}</td>
      <td>${battle.option1} (${battle.votes1} votes)</td>
      <td>${battle.option2} (${battle.votes2} votes)</td>
      <td>${new Date(battle.created_at).toLocaleString()}</td>
    </tr>`;
  });
  html += `</table>`;
  document.getElementById('battleTable').innerHTML = html;
};

// Инициализация загрузки данных при старте
loadLatestBattle();
loadAllBattles();
