// main.js
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

function getTimeRemaining(endTime) {
  const total = Date.parse(endTime) - Date.now();
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  return { total, hours, minutes, seconds };
}

function renderCountdown(container, endTime) {
  function update() {
    const { total, hours, minutes, seconds } = getTimeRemaining(endTime);
    container.textContent = `Time left: ${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    if (total <= 0) {
      clearInterval(interval);
      container.textContent = 'Battle ended';
    }
  }
  update();
  const interval = setInterval(update, 1000);
}

async function loadBattles() {
  const { data: battles } = await supabase.from('battles').select('*').order('created_at', { ascending: false });
  const list = document.getElementById('battleList');
  list.innerHTML = '';

  const now = new Date();
  const filtered = battles.filter(b => {
    const end = new Date(b.created_at);
    end.setMinutes(end.getMinutes() + b.duration);
    return currentTab === 'active' ? end > now : end <= now;
  });

  filtered.forEach(battle => {
    const block = document.createElement('div');
    block.style.border = '1px solid #ccc';
    block.style.padding = '15px';
    block.style.marginBottom = '15px';
    block.style.borderRadius = '10px';

    const title = document.createElement('h3');
    title.textContent = battle.title;

    const countdown = document.createElement('div');
    renderCountdown(countdown, new Date(new Date(battle.created_at).getTime() + battle.duration * 60000));

    const optionsContainer = document.createElement('div');
    optionsContainer.style.display = 'flex';
    optionsContainer.style.justifyContent = 'space-between';

    const option1 = document.createElement('div');
    option1.innerHTML = `
      <div style="text-align: center">
        ${battle.image1 ? `<img src="${battle.image1}" style="width: 100px; height: 100px; object-fit: cover;"><br/>` : ''}
        <strong>${battle.option1}</strong><br/>
        <button class="vote-btn">Vote Now</button>
      </div>
    `;

    const option2 = document.createElement('div');
    option2.innerHTML = `
      <div style="text-align: center">
        ${battle.image2 ? `<img src="${battle.image2}" style="width: 100px; height: 100px; object-fit: cover;"><br/>` : ''}
        <strong>${battle.option2}</strong><br/>
        <button class="vote-btn">Vote Now</button>
      </div>
    `;

    optionsContainer.appendChild(option1);
    optionsContainer.appendChild(option2);

    const social = document.createElement('div');
    social.innerHTML = `
      <a href="https://wa.me/?text=Check%20out%20this%20battle:%20${encodeURIComponent(window.location.href)}" target="_blank">
        <img src="https://img.icons8.com/color/48/000000/whatsapp--v1.png" style="height:24px;"> Share on WhatsApp
      </a>
    `;

    block.appendChild(title);
    block.appendChild(countdown);
    block.appendChild(optionsContainer);
    block.appendChild(social);

    list.appendChild(block);
  });
}

async function createBattle() {
  const title = document.getElementById('title').value;
  const option1 = document.getElementById('option1').value;
  const option2 = document.getElementById('option2').value;
  const duration = parseInt(document.getElementById('duration').value);
  const image1 = document.getElementById('image1').value;
  const image2 = document.getElementById('image2').value;

  await supabase.from('battles').insert([{ title, option1, option2, duration, image1, image2 }]);

  toggleForm();
  loadBattles();
}

document.getElementById('submitBtn').addEventListener('click', createBattle);

// Инициализация
loadBattles();
window.toggleForm = toggleForm;
window.switchTab = switchTab;
