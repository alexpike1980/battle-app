import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA'; // ваш ключ
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
function startLiveCountdown(id,endTime){
  const el = document.getElementById(`timer-${id}`);
  function upd(){
    const t = calculateTimeLeft(endTime);
    if(!t){ el.textContent='Finished'; clearInterval(iv); }
    else { el.textContent=`Time to Left: ${t}`; }
  }
  const iv=setInterval(upd,1000); upd();
}
function renderProgressBar(v1=0,v2=0,id){
  const total = v1+v2, p1 = total?Math.round(v1/total*100):50, p2 = 100-p1;
  return `
    <div class="flex w-full gap-0 mt-3">
      <div class="flex-1 rounded-l-full bg-blue-600 h-10 flex items-center px-3 text-white text-lg font-semibold ${p1===100?'rounded-r-full':''}" style="width:${p1}%;">
        ${v1 ? `${v1} (${p1}%)` : ''}
      </div>
      <div class="flex-1 rounded-r-full bg-green-600 h-10 flex items-center justify-end px-3 text-white text-lg font-semibold ${p2===100?'rounded-l-full':''}" style="width:${p2}%;">
        ${v2 ? `${v2} (${p2}%)` : ''}
      </div>
    </div>
  `;
}

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
    block.className = 'bg-white py-8 px-2 md:px-6 flex flex-col gap-2 border-b border-gray-200 mb-2';
    block.innerHTML = `
      <a href="battle.html?id=${b.id}" class="text-2xl font-semibold mb-2 hover:text-blue-600 transition underline-offset-2 hover:underline inline-block">${b.title}</a>
      <div class="relative flex flex-row gap-2 justify-center items-center">
        <div class="flex flex-col items-center flex-1">
          <img src="${b.image1||'https://via.placeholder.com/300'}" alt="" class="object-cover rounded-lg w-[220px] h-[180px] md:w-[260px] md:h-[180px]" />
          <div class="option-title mt-2">${b.option1}</div>
          <button class="bg-blue-600 text-white py-3 mt-3 rounded-lg font-bold w-full md:w-[90%] text-lg transition hover:bg-blue-700 vote-btn" data-battle="${b.id}" data-opt="votes1">Vote</button>
        </div>
        <div class="absolute z-20 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div class="vs-circle bg-white flex items-center justify-center text-lg font-bold w-14 h-14 border-2 border-white shadow-none">VS</div>
        </div>
        <div class="flex flex-col items-center flex-1">
          <img src="${b.image2||'https://via.placeholder.com/300'}" alt="" class="object-cover rounded-lg w-[220px] h-[180px] md:w-[260px] md:h-[180px]" />
          <div class="option-title mt-2">${b.option2}</div>
          <button class="bg-green-600 text-white py-3 mt-3 rounded-lg font-bold w-full md:w-[90%] text-lg transition hover:bg-green-700 vote-btn" data-battle="${b.id}" data-opt="votes2">Vote</button>
        </div>
      </div>
      ${renderProgressBar(b.votes1, b.votes2, b.id)}
      <div id="timer-${b.id}" class="text-xs text-gray-500 pt-1">${active ? `Time to Left: ${calculateTimeLeft(b.ends_at)}` : 'Finished'}</div>
    `;
    container.appendChild(block);
    if (active) startLiveCountdown(b.id, b.ends_at);
  });

  // === КРИТИЧЕСКИЙ момент ===
  document.querySelectorAll('.vote-btn').forEach(btn => {
    btn.onclick = function() {
      window.openShareModal(this.dataset.battle, this.dataset.opt);
    };
  });
}

fetchAndRenderBattles();

// Глобальная функция для Vote
window.openShareModal = function(battleId, option) {
  const modal = document.getElementById('shareModal');
  modal.classList.remove('hidden');
  const url=location.href, title='Make it count – share to vote!';
  document.getElementById('facebookShare').href=`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`;
  document.getElementById('twitterShare').href =`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
  document.getElementById('redditShare').href  =`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
  document.querySelectorAll('#shareModal a').forEach(link => {
    const clone = link.cloneNode(true);
    link.parentNode.replaceChild(clone, link);
  });
  document.querySelectorAll('#shareModal a').forEach(link => {
    link.onclick = async event => {
      event.preventDefault();
      const col = (option === 'votes1' ? 'votes1' : 'votes2');
      try {
        const { data: row, error: fe } = await supabase
          .from('battles')
          .select(col)
          .eq('id', battleId)
          .single();
        if (fe) throw fe;
        const newVotes = (row[col] || 0) + 1;
        const { error: ue } = await supabase
          .from('battles')
          .update({ [col]: newVotes })
          .eq('id', battleId);
        if (ue) throw ue;
        await fetchAndRenderBattles();
        modal.classList.add('hidden');
        window.open(link.href, '_blank');
      } catch (err) {
        console.error('Ошибка добавления голоса:', err);
      }
    };
  });
};
window.addEventListener('load', () => {
  document.getElementById('shareCloseBtn')?.addEventListener('click', () => {
    document.getElementById('shareModal').classList.add('hidden');
  });
  document.getElementById('shareModal').addEventListener('click', e => {
    if (e.target.id === 'shareModal') e.target.classList.add('hidden');
  });
});
