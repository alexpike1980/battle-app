console.log("Скрипт main.js загружен");

// Подключение к Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  // Элементы формы времени
  const durationInput = document.getElementById('duration');
  const datetimePicker = document.getElementById('datetimePicker');
  const timeTabs = document.querySelectorAll('.time-tab');
  let selectedUnit = 'minutes'; // минуты по умолчанию

  // Переключение табов (минуты / часы / дни / точная дата)
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

  // Функция загрузки изображения в Storage
  async function uploadImage(file) {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase
      .storage.from('battle-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (error) {
      console.error('Ошибка загрузки файла:', error.message);
      return '';
    }
    // Собираем публичный URL
    return `${SUPABASE_URL}/storage/v1/object/public/battle-images/${fileName}`;
  }

  // Функция вычисления оставшегося времени
  function calculateTimeLeft(endTime) {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return '00:00:00';
    const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  // Live-обновление таймера для каждого баттла
  function startLiveCountdown(battleId, endTime) {
    const el = document.getElementById(`timer-${battleId}`);
    const iv = setInterval(() => {
      const text = calculateTimeLeft(endTime);
      el.textContent = text;
      if (text === '00:00:00') clearInterval(iv);
    }, 1000);
    el.textContent = calculateTimeLeft(endTime);
  }

  // Рендер прогресс-бара результатов
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

  // Загрузка и отображение баттлов
  async function fetchAndRenderBattles() {
    const { data: battles, error } = await supabase
      .from('battles')
      .select('id, title, option1, option2, votes1, votes2, ends_at, image1, image2')
      .order('created_at', { ascending: false });
    if (error) return console.error('Ошибка загрузки батлов:', error.message);

    const container = document.getElementById('battleList');
    container.innerHTML = '';

    battles.forEach(b => {
      const active = new Date(b.ends_at) > new Date();
      const block = document.createElement('div');
      block.id = `battle-${b.id}`;
      block.className = 'p-4 bg-white rounded-lg shadow-lg mb-6';
      block.innerHTML = `
        <h3 class="text-xl font-semibold mb-3">${b.title}</h3>
        <div class="flex gap-4 mb-4">
          <div class="flex-1">
            <img src="${b.image1 || 'https://via.placeholder.com/150'}" alt="Option 1" class="w-full h-40 object-cover rounded-lg" />
            <div class="text-center font-semibold text-lg mt-2">${b.option1}</div>
            <button class="bg-blue-600 text-white py-2 px-4 rounded-lg w-full mt-2" onclick="openShareModal('${b.id}', 'votes1')">Vote</button>
          </div>
          <div class="flex-1">
            <img src="${b.image2 || 'https://via.placeholder.com/150'}" alt="Option 2" class="w-full h-40 object-cover rounded-lg" />
            <div class="text-center font-semibold text-lg mt-2">${b.option2}</div>
            <button class="bg-green-600 text-white py-2 px-4 rounded-lg w-full mt-2" onclick="openShareModal('${b.id}', 'votes2')">Vote</button>
          </div>
        </div>
        ${renderProgressBar(b.votes1, b.votes2, b.id)}
        <div id="timer-${b.id}" class="text-sm text-gray-500">${active ? '' : 'Finished'}</div>
      `;
      container.appendChild(block);

      if (active) startLiveCountdown(b.id, b.ends_at);
    });
  }

  // Инициализация
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

    // Картинки
    const image1File = document.getElementById('image1File').files[0];
    const image2File = document.getElementById('image2File').files[0];
    const image1 = image1File ? await uploadImage(image1File) : '';
    const image2 = image2File ? await uploadImage(image2File) : '';

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

    if (error) return alert('Error creating battle: ' + error.message);
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
// После установки href на ссылки
document.querySelectorAll('#shareModal a').forEach(link => {
  // Сбрасываем предыдущий обработчик, чтобы не накапливались
  link.onclick = null;

  // Вешаем новый обработчик, привязанный к текущему option
  link.onclick = async event => {
    event.preventDefault();
    const shareUrl = link.href;
    const column   = option === 'votes1' ? 'votes1' : 'votes2';

    try {
      // 1) Получаем текущее число голосов
      const { data: battleData, error: fetchError } = await supabase
        .from('battles')
        .select(column)
        .eq('id', battleId)
        .single();
      if (fetchError) throw fetchError;

      // 2) Инкремент и запись в БД
      const newVotes = (battleData[column] || 0) + 1;
      const { error: updError } = await supabase
        .from('battles')
        .update({ [column]: newVotes })
        .eq('id', battleId);
      if (updError) throw updError;

      // 3) Перерисовываем список батлов
      await fetchAndRenderBattles();

      // 4) Закрываем модалку и открываем окно шаринга
      document.getElementById('shareModal').classList.add('hidden');
      window.open(shareUrl, '_blank');
    } catch (err) {
      console.error('Ошибка добавления голоса: ' + err.message);
    }
  };
});
