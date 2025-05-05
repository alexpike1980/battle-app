// Подключение к Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentTab = 'active';

function toggleForm() {
  const form = document.getElementById('createForm');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function switchTab(tab) {
  currentTab = tab;
  document.getElementById('tab-active').classList.toggle('active', tab === 'active');
  document.getElementById('tab-finished').classList.toggle('active', tab === 'finished');
  loadBattles();
}

async function loadBattles() {
  const { data: battles, error } = await supabase.from('battles').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error loading battles:', error);
    return;
  }

  const container = document.getElementById('battleList');
  container.innerHTML = '';
  const now = new Date();

  battles.forEach(battle => {
    const endTime = new Date(battle.created_at);
    endTime.setMinutes(endTime.getMinutes() + battle.duration);
    const isActive = endTime > now;
    if ((currentTab === 'active' && isActive) || (currentTab === 'finished' && !isActive)) {
      const div = document.createElement('div');
      div.className = 'battle-block';

      const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
      const progressPercent = Math.min(100, 100 - ((timeRemaining / (battle.duration * 60)) * 100));

      div.innerHTML = `
        <h3>${battle.title}</h3>
        <div class="battle-images">
          <div style="width: 48%; text-align: center">
            <img src="${battle.image1 || ''}" alt="Option 1" />
            <button class="vote-btn">Vote now</button>
          </div>
          <div style="width: 48%; text-align: center">
            <img src="${battle.image2 || ''}" alt="Option 2" />
            <button class="vote-btn">Vote now</button>
          </div>
        </div>
        <div class="progress-container">
          <div class="progress-bar" style="width: ${progressPercent}%">${Math.floor(progressPercent)}%</div>
        </div>
        <div class="countdown" data-endtime="${endTime.toISOString()}">⏳</div>
        <div class="social-icons" style="margin-top: 10px;">
          <button onclick="shareTo('https://t.me/share/url?url=' + location.href)"><img src="https://cdn-icons-png.flaticon.com/512/2111/2111646.png" />Telegram</button>
          <button onclick="shareTo('https://wa.me/?text=' + encodeURIComponent(location.href))"><img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" />WhatsApp</button>
        </div>
      `;

      container.appendChild(div);
    }
  });
}

function shareTo(url) {
  window.open(url, '_blank');
}

function updateCountdowns() {
  const countdowns = document.querySelectorAll('.countdown');
  const now = new Date();
  countdowns.forEach(el => {
    const end = new Date(el.dataset.endtime);
    const diff = Math.floor((end - now) / 1000);
    if (diff > 0) {
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      el.textContent = `⏳ ${h}:${m}:${s}`;
    } else {
      el.textContent = 'Battle ended';
    }
  });
}

setInterval(updateCountdowns, 1000);

// Обработка создания батла
document.getElementById('submitBtn').addEventListener('click', async () => {
  const title = document.getElementById('title').value;
  const option1 = document.getElementById('option1').value;
  const option2 = document.getElementById('option2').value;
  const duration = parseInt(document.getElementById('duration').value);
  const image1 = document.getElementById('image1').value;
  const image2 = document.getElementById('image2').value;

  if (!title || !option1 || !option2 || !duration) {
    alert('Please fill all required fields.');
    return;
  }

  const { error } = await supabase.from('battles').insert([
    { title, option1, option2, duration, image1, image2 }
  ]);

  if (error) {
    console.error('Error creating battle:', error);
  } else {
    document.getElementById('createForm').style.display = 'none';
    document.getElementById('title').value = '';
    document.getElementById('option1').value = '';
    document.getElementById('option2').value = '';
    document.getElementById('duration').value = '';
    document.getElementById('image1').value = '';
    document.getElementById('image2').value = '';
    loadBattles();
  }
});

// Инициализация
loadBattles();
