// main.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  // ----------- ЕДИНЫЙ обработчик открытия модалки Create Battle -----------
  ['createBattleBtn', 'floatingCreateBtn', 'navFab'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => {
      document.getElementById('createModal').classList.remove('hidden');
    });
  });

  // Кнопка Cancel в модалке
  const cancelCreateBtn = document.getElementById('cancelCreateBtn');
  if (cancelCreateBtn) {
    cancelCreateBtn.addEventListener('click', () => {
      document.getElementById('createModal').classList.add('hidden');
    });
  }

  // ----------- Логика выбора времени -----------
  const durationInput   = document.getElementById('duration');
  const datetimePicker  = document.getElementById('datetimePicker');
  const timeTabs        = document.querySelectorAll('.time-tab');
  let selectedUnit      = 'minutes';

  timeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      timeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      selectedUnit = tab.dataset.unit;
      if (selectedUnit === 'date') {
        durationInput.classList.add('hidden');
        datetimePicker.classList.remove('hidden');
      } else {
        durationInput.classList.remove('hidden');
        datetimePicker.classList.add('hidden');
        durationInput.placeholder = `Enter ${selectedUnit}`;
      }
    });
  });
  document.querySelector(".time-tab[data-unit='minutes']").click();

  // ----------- Функция загрузки изображения -----------
  async function uploadImage(file) {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase
      .storage
      .from('battle-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (error) {
      console.error('Ошибка загрузки файла:', error.message);
      return '';
    }
    return `${SUPABASE_URL}/storage/v1/object/public/battle-images/${fileName}`;
  }

  // ----------- Функции отображения времени и баров (оставляем без изменений!) -----------

  function calculateTimeLeft(endTime) {
    let diff = new Date(endTime) - new Date();
    if (diff <= 0) return '';
    const days    = Math.floor(diff / 86400000); diff %= 86400000;
    const hours   = Math.floor(diff / 3600000);   diff %= 3600000;
    const minutes = Math.floor(diff / 60000);     diff %= 60000;
    const seconds = Math.floor(diff / 1000);
    const parts = [];
    if (days)    parts.push(`${days} day${days>1?'s':''}`);
    if (hours)   parts.push(`${hours} hour${hours>1?'s':''}`);
    if (minutes) parts.push(`${minutes} min${minutes>1?'s':''}`);
    if (seconds) parts.push(`${seconds} sec${seconds>1?'s':''}`);
    return parts.join(' ');
  }

  function startLiveCountdown(battleId, endTime) {
    const el = document.getElementById(`timer-${battleId}`);
    function update() {
      const text = calculateTimeLeft(endTime);
      if (!text) {
        el.textContent = 'Finished';
        clearInterval(iv);
      } else {
        el.textContent = `Time to Left: ${text}`;
      }
    }
    const iv = setInterval(update, 1000);
    update();
  }

  function renderProgressBar(v1 = 0, v2 = 0, id) {
    const total = v1 + v2;
    const p1 = total ? Math.round((v1 / total) * 100) : 50;
    const p2 = total ? Math.round((v2 / total) * 100) : 50;
    if (p1 === 100) {
      return `
        <div id="progress-bar-${id}" class="progress-bar-container">
          <div class="progress-bar progress-bar-blue full">
            <span class="progress-text text-left">${v1} votes (100%)</span>
          </div>
        </div>`;
    }
    if (p2 === 100) {
      return `
        <div id="progress-bar-${id}" class="progress-bar-container">
          <div class="progress-bar progress-bar-green full">
            <span class="progress-text text-right">${v2} votes (100%)</span>
          </div>
        </div>`;
    }
    return `
      <div id="progress-bar-${id}" class="progress-bar-container">
        <div class="progress-bar progress-bar-blue" style="width:${p1}%">
          <span class="progress-text text-left">${v1} votes (${p1}%)</span>
        </div>
        <div class="progress-bar progress-bar-green" style="width:${p2}%">
          <span class="progress-text text-right">${v2} votes (${p2}%)</span>
        </div>
      </div>`;
  }

  // ----------- Загрузка и отображение батлов (оставляем как есть!) -----------
  async function fetchAndRenderBattles() {
    const { data: battles, error } = await supabase
      .from('battles')
      .select('id, title, option1, option2, votes1, votes2, ends_at, image1, image2')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Ошибка загрузки батлов:', error.message);
      return;
    }
    const container = document.getElementById('battleList');
    container.innerHTML = '';
    battles.forEach(b => {
      const active = new Date(b.ends_at) > new Date();
      const block = document.createElement('div');
      block.id = `battle-${b.id}`;
      block.className = 'p-4 bg-white border-b border-gray-200';
      block.innerHTML = `
        <h3 class="text-xl font-semibold mb-3">${b.title}</h3>
        <div class="battle-images-wrapper mb-4">
          <div class="flex-1 text-center">
            <img src="${b.image1||'https://via.placeholder.com/150'}" alt="" class="mx-auto w-40 h-40 object-cover rounded-lg" />
            <div class="option-title">${b.option1}</div>
            <button class="mt-2 bg-blue-600 text-white px-4 py-2 rounded" onclick="openShareModal('${b.id}','votes1')">Vote</button>
          </div>
          <div class="vs-circle">VS</div>
          <div class="flex-1 text-center">
            <img src="${b.image2||'https://via.placeholder.com/150'}" alt="" class="mx-auto w-40 h-40 object-cover rounded-lg" />
            <div class="option-title">${b.option2}</div>
            <button class="mt-2 bg-green-600 text-white px-4 py-2 rounded" onclick="openShareModal('${b.id}','votes2')">Vote</button>
          </div>
        </div>
        ${renderProgressBar(b.votes1, b.votes2, b.id)}
        <div id="timer-${b.id}" class="text-xs text-gray-500">
          ${ active ? `Time to Left: ${calculateTimeLeft(b.ends_at)}` : 'Finished' }
        </div>
      `;
      container.appendChild(block);
      if (active) startLiveCountdown(b.id, b.ends_at);
    });
  }
  fetchAndRenderBattles();

  // ----------- Сабмит создания батла -----------
  document.getElementById('submitBattleBtn').addEventListener('click', async () => {
    const title   = document.getElementById('title').value.trim();
    const option1 = document.getElementById('option1').value.trim();
    const option2 = document.getElementById('option2').value.trim();
    if (!title || !option1 || !option2) {
      return alert('Please fill all required fields');
    }
    let ends_at;
    if (selectedUnit === 'date') {
      const dt = datetimePicker.value;
      if (!dt) return alert('Please pick a date & time');
      ends_at = new Date(dt).toISOString();
    } else {
      const val = parseInt(durationInput.value.trim(), 10);
      if (!val || val <= 0) return alert(`Enter valid ${selectedUnit}`);
      let ms = val * 60000;
      if (selectedUnit==='hours') ms*=60;
      if (selectedUnit==='days')  ms*=1440;
      ends_at = new Date(Date.now()+ms).toISOString();
    }
    const file1 = document.getElementById('image1File').files[0];
    const file2 = document.getElementById('image2File').files[0];
    const image1 = file1 ? await uploadImage(file1) : '';
    const image2 = file2 ? await uploadImage(file2) : '';
    const { error } = await supabase.from('battles').insert({
      title,
      option1,
      option2,
      votes1: 0,
      votes2: 0,
      image1,
      image2,
      ends_at
    });
    if (error) {
      return alert('Error creating battle: ' + error.message);
    }
    document.getElementById('createModal').classList.add('hidden');
    fetchAndRenderBattles();
  });

  // ----------- Логика для шаринга (оставляем как есть!) -----------
  window.openShareModal = (battleId, option) => {
    const modal = document.getElementById('shareModal');
    modal.classList.remove('hidden');
    const url   = window.location.href;
    const title = 'Make it count – share to vote!';
    document.getElementById('facebookShare').href =
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`;
    document.getElementById('twitterShare').href =
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    document.getElementById('redditShare').href =
      `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
    document.querySelectorAll('#shareModal a').forEach(link => {
      const clone = link.cloneNode(true);
      link.parentNode.replaceChild(clone, link);
    });
    document.querySelectorAll('#shareModal a').forEach(link => {
      link.addEventListener('click', async event => {
        event.preventDefault();
        const shareUrl = link.href;
        const column   = (option === 'votes1' ? 'votes1' : 'votes2');
        try {
          const { data: row, error: fe } = await supabase
            .from('battles')
            .select(column)
            .eq('id', battleId)
            .single();
          if (fe) throw fe;
          const newVotes = (row[column] || 0) + 1;
          const { error: ue } = await supabase
            .from('battles')
            .update({ [column]: newVotes })
            .eq('id', battleId);
          if (ue) throw ue;
          await fetchAndRenderBattles();
          modal.classList.add('hidden');
          window.open(shareUrl, '_blank');
        } catch (err) {
          console.error('Ошибка добавления голоса:', err);
        }
      });
    });
  };

  // ----------- Закрытие шаринг-модалки -----------

  window.addEventListener('load', () => {
    const shareM = document.getElementById('shareModal');
    const shareX = document.getElementById('shareCloseBtn');
    if (shareX) {
      shareX.addEventListener('click', () => shareM.classList.add('hidden'));
    }
    shareM.addEventListener('click', e => {
      if (e.target === shareM) shareM.classList.add('hidden');
    });
  });

}); // ← закрываем DOMContentLoaded
