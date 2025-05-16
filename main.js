console.log("Скрипт main.js загружен");

// Подключение к Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  // Elements for time selection
  const durationInput   = document.getElementById('duration');
  const datetimePicker  = document.getElementById('datetimePicker');
  const timeTabs        = document.querySelectorAll('.time-tab');
  let selectedUnit      = 'minutes';

  // Switch time-tab
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

  // Upload image helper
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
    return `
      <div id="progress-bar-${id}" class="flex w-full rounded-lg overflow-hidden mt-2 mb-2" style="height:40px">
        <div class="flex items-center justify-center bg-blue-600 text-white font-semibold text-base transition-all duration-300" style="width:${p1}%; min-width:48px;">
          ${v1} (${p1}%)
        </div>
        <div class="flex items-center justify-center bg-green-600 text-white font-semibold text-base transition-all duration-300" style="width:${p2}%; min-width:48px;">
          ${v2} (${p2}%)
        </div>
      </div>
    `;
  }

  // Fetch & render all battles
  async function fetchAndRenderBattles() {
    const { data: battles, error } = await supabase
      .from('battles')
      .select('id, title, option1, option2, votes1, votes2, ends_at, created_at, image1, image2')
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
      block.className = 'bg-white px-2 py-6 border-b border-gray-200';
      block.innerHTML = `
        <div class="flex gap-4 items-center relative mb-2">
          <div class="flex-1 flex flex-col items-center">
            <div class="w-full max-w-xs flex flex-col items-center">
              <img src="${b.image1||'https://via.placeholder.com/150'}"
                alt="" class="w-full aspect-square object-cover rounded-xl mx-auto"/>
              <div class="option-title mt-2 mb-1">${b.option1}</div>
              <button class="bg-blue-600 text-white py-3 rounded-lg w-full font-semibold text-lg mt-1"
                onclick="openShareModal('${b.id}','votes1')">Vote</button>
            </div>
          </div>
          <div class="vs-circle" style="position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); z-index:2; background:#fff; width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:1.3rem;">VS</div>
          <div class="flex-1 flex flex-col items-center">
            <div class="w-full max-w-xs flex flex-col items-center">
              <img src="${b.image2||'https://via.placeholder.com/150'}"
                alt="" class="w-full aspect-square object-cover rounded-xl mx-auto"/>
              <div class="option-title mt-2 mb-1">${b.option2}</div>
              <button class="bg-green-600 text-white py-3 rounded-lg w-full font-semibold text-lg mt-1"
                onclick="openShareModal('${b.id}','votes2')">Vote</button>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between mt-1 mb-1 px-2">
          <div class="flex gap-2 items-center text-xs text-gray-500">
            <span class="font-semibold">${new Date(b.created_at).toLocaleDateString()}</span>
            <span>·</span>
            <span class="rounded-full bg-gray-200 text-gray-600 px-2 py-0.5 text-xs">by User</span>
            <span>·</span>
            <span>0 comments</span>
          </div>
          <div id="timer-${b.id}" class="text-xs text-gray-500">${active ? `Time to Left: ${calculateTimeLeft(b.ends_at)}` : 'Finished'}</div>
        </div>
        ${renderProgressBar(b.votes1,b.votes2,b.id)}
      `;
      container.appendChild(block);
      if (active) startLiveCountdown(b.id, b.ends_at);
    });
  }
  fetchAndRenderBattles();

  // Cancel-button для Create-Battle
 const cancelCreateBtn = document.getElementById('cancelCreateBtn');
  if (cancelCreateBtn) {
    cancelCreateBtn.addEventListener('click', () => {
      document.getElementById('createModal').classList.add('hidden');
    });
  }

  // Create-Battle submit
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

  // Sharing-modal
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

    // Remove old handlers
    document.querySelectorAll('#shareModal a').forEach(link => {
      const clone = link.cloneNode(true);
      link.parentNode.replaceChild(clone, link);
    });

    // New handler
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

}); // ← DOMContentLoaded
