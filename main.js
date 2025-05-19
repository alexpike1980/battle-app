console.log("Скрипт main.js загружен");

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA'; // подставь свой актуальный ключ!
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  // Открытие Create Modal с любой кнопки
  ['createBattleBtn', 'createBattleBtnSidebar', 'floatingCreateBtn', 'navFab'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => {
      document.getElementById('createModal').classList.remove('hidden');
    });
  });

  // Закрытие модалки
  const cancelBtn = document.getElementById('cancelCreateBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      document.getElementById('createModal').classList.add('hidden');
    });
  }

  // Tabs: Активный таб
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active', 'border-blue-600'));
      this.classList.add('active', 'border-blue-600');
      // Здесь логика фильтрации батлов, если нужно (фильтрация в fetchAndRenderBattles)
    });
  });

  // Time input tabs (время окончания батла)
  const durationInput = document.getElementById('duration');
  const datetimePicker = document.getElementById('datetimePicker');
  const timeTabs = document.querySelectorAll('.time-tab');
  let selectedUnit = 'minutes';
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

  // Image upload
  async function uploadImage(file) {
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase
      .storage
      .from('battle-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (error) {
      console.error('Ошибка загрузки файла:', error.message);
      return '';
    }
    return `${SUPABASE_URL}/storage/v1/object/public/battle-images/${fileName}`;
  }

  // Human time
  function calculateTimeLeft(endTime) {
    let diff = new Date(endTime) - new Date();
    if (diff <= 0) return '';
    const days = Math.floor(diff / 86400000); diff %= 86400000;
    const hours = Math.floor(diff / 3600000); diff %= 3600000;
    const minutes = Math.floor(diff / 60000); diff %= 60000;
    const seconds = Math.floor(diff / 1000);
    const parts = [];
    if (days) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
    if (seconds) parts.push(`${seconds} sec${seconds > 1 ? 's' : ''}`);
    return parts.join(' ');
  }

  // Таймер для батла
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

  // Прогресс-бар
  function renderProgressBar(v1 = 0, v2 = 0, id) {
    const total = v1 + v2;
    const p1 = total ? Math.round((v1 / total) * 100) : 50;
    const p2 = total ? Math.round((v2 / total) * 100) : 50;
    if (p1 === 100) {
      return `<div id="progress-bar-${id}" class="progress-bar-container"><div class="progress-bar progress-bar-blue full"><span class="progress-text text-left">${v1} votes (100%)</span></div></div>`;
    }
    if (p2 === 100) {
      return `<div id="progress-bar-${id}" class="progress-bar-container"><div class="progress-bar progress-bar-green full"><span class="progress-text text-right">${v2} votes (100%)</span></div></div>`;
    }
    return `<div id="progress-bar-${id}" class="progress-bar-container">
      <div class="progress-bar progress-bar-blue" style="width:${p1}%">
        <span class="progress-text text-left">${v1} votes (${p1}%)</span>
      </div>
      <div class="progress-bar progress-bar-green" style="width:${p2}%">
        <span class="progress-text text-right">${v2} votes (${p2}%)</span>
      </div>
    </div>`;
  }

  // Основной рендер батлов
  async function fetchAndRenderBattles() {
    // Можно добавить фильтрацию по табу если нужно
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
      block.className = 'battle-card border-b border-gray-200 py-4 px-2';
      block.innerHTML = `
        <div class="px-4 pt-2 pb-2">
          <h3 class="text-lg font-bold mb-2">${b.title}</h3>
        </div>
        <div class="battle-images-wrapper flex items-center justify-center mb-2 relative">
          <div class="flex-1 flex flex-col items-center">
            <img src="${b.image1 || 'https://via.placeholder.com/150'}" alt="" class="object-cover w-full max-w-xs rounded-lg" />
            <div class="option-title mt-2">${b.option1}</div>
            <button class="bg-blue-600 text-white py-2 mt-2 w-full rounded-lg font-semibold" onclick="openShareModal('${b.id}','votes1')">Vote</button>
          </div>
          <div class="vs-circle">VS</div>
          <div class="flex-1 flex flex-col items-center">
            <img src="${b.image2 || 'https://via.placeholder.com/150'}" alt="" class="object-cover w-full max-w-xs rounded-lg" />
            <div class="option-title mt-2">${b.option2}</div>
            <button class="bg-green-600 text-white py-2 mt-2 w-full rounded-lg font-semibold" onclick="openShareModal('${b.id}','votes2')">Vote</button>
          </div>
        </div>
        ${renderProgressBar(b.votes1, b.votes2, b.id)}
        <div id="timer-${b.id}" class="text-xs text-gray-500">
          ${active ? `Time to Left: ${calculateTimeLeft(b.ends_at)}` : 'Finished'}
        </div>
      `;
      container.appendChild(block);
      if (active) startLiveCountdown(b.id, b.ends_at);
    });
  }
  fetchAndRenderBattles();

  // Создание батла
  document.getElementById('submitBattleBtn').addEventListener('click', async () => {
    const title = document.getElementById('title').value.trim();
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
      if (selectedUnit === 'hours') ms *= 60;
      if (selectedUnit === 'days') ms *= 1440;
      ends_at = new Date(Date.now() + ms).toISOString();
    }
    // upload images
    const file1 = document.getElementById('image1File').files[0];
    const file2 = document.getElementById('image2File').files[0];
    const image1 = file1 ? await uploadImage(file1) : '';
    const image2 = file2 ? await uploadImage(file2) : '';
    // insert to supabase
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

  // Модальное окно шаринга
  window.openShareModal = (battleId, option) => {
    const modal = document.getElementById('shareModal');
    modal.classList.remove('hidden');
    const url = window.location.href;
    const title = 'Make it count – share to vote!';
    document.getElementById('facebookShare').href =
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`;
    document.getElementById('twitterShare').href =
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    document.getElementById('redditShare').href =
      `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
    // Сброс старых обработчиков
    document.querySelectorAll('#shareModal a').forEach(link => {
      const clone = link.cloneNode(true);
      link.parentNode.replaceChild(clone, link);
    });
    // Навешиваем новый обработчик
    document.querySelectorAll('#shareModal a').forEach(link => {
      link.addEventListener('click', async event => {
        event.preventDefault();
        const shareUrl = link.href;
        const column = (option === 'votes1' ? 'votes1' : 'votes2');
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

  // Закрытие share-модалки
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

});

