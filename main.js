console.log("Скрипт main.js загружен");

// Подключение к Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Функции работы со временем и изображениями
function calculateTimeLeft(endTime) {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return '00:00:00';
    const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

async function uploadImage(file) {
    try {
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage.from('battle-images').upload(fileName, file, {
            cacheControl: '3600', upsert: false
        });
        if (error) throw error;
        return `${SUPABASE_URL}/storage/v1/object/public/battle-images/${fileName}`;
    } catch (error) {
        console.error(`Ошибка загрузки изображения: ${error.message}`);
        return '';
    }
}

function startLiveCountdown(battleId, endTime) {
    const timerElement = document.getElementById(`timer-${battleId}`);
    const interval = setInterval(() => {
        const diff = new Date(endTime) - new Date();
        if (diff <= 0) {
            timerElement.textContent = 'Finished';
            clearInterval(interval);
            return;
        }
        timerElement.textContent = calculateTimeLeft(endTime);
    }, 1000);
}

function renderProgressBar(votes1 = 0, votes2 = 0, battleId) {
    const total = votes1 + votes2;
    const p1 = total ? Math.round((votes1 / total) * 100) : 50;
    const p2 = total ? Math.round((votes2 / total) * 100) : 50;
    if (p1 === 100) {
        return `<div id="progress-bar-${battleId}" class="progress-bar-container">
            <div class="progress-bar progress-bar-blue full"><span class="progress-text text-left">${votes1} votes (100%)</span></div>
        </div>`;
    }
    if (p2 === 100) {
        return `<div id="progress-bar-${battleId}" class="progress-bar-container">
            <div class="progress-bar progress-bar-green full"><span class="progress-text text-right">${votes2} votes (100%)</span></div>
        </div>`;
    }
    return `<div id="progress-bar-${battleId}" class="progress-bar-container">
        <div class="progress-bar progress-bar-blue" style="width:${p1}%"><span class="progress-text text-left">${votes1} votes (${p1}%)</span></div>
        <div class="progress-bar progress-bar-green" style="width:${p2}%"><span class="progress-text text-right">${votes2} votes (${p2}%)</span></div>
    </div>`;
}

async function fetchAndRenderBattles() {
    try {
        const { data: battles, error } = await supabase.from('battles').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        const container = document.getElementById('battleList');
        container.innerHTML = '';
        battles.forEach(b => {
            const isActive = new Date(b.ends_at) > new Date();
            const block = document.createElement('div');
            block.id = `battle-${b.id}`;
            block.className = 'p-4 bg-white rounded-lg shadow-lg';
            block.innerHTML = `
                <h3 class="text-xl font-semibold mb-3">${b.title}</h3>
                <div class="flex gap-4 mb-4">
                    <div class="flex-1">
                        <img src="${b.image1 || 'https://via.placeholder.com/150'}" class="w-full h-40 object-cover rounded-lg" />
                        <div class="text-center font-semibold text-lg mt-2">${b.option1}</div>
                        <button class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all w-full mt-2" onclick="openShareModal('${b.id}','votes1')">Vote</button>
                    </div>
                    <div class="flex-1">
                        <img src="${b.image2 || 'https://via.placeholder.com/150'}" class="w-full h-40 object-cover rounded-lg" />
                        <div class="text-center font-semibold text-lg mt-2">${b.option2}</div>
                        <button class="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-all w-full mt-2" onclick="openShareModal('${b.id}','votes2')">Vote</button>
                    </div>
                </div>
                ${renderProgressBar(b.votes1, b.votes2, b.id)}
                <div id="timer-${b.id}" class="text-sm text-gray-500">${isActive ? calculateTimeLeft(b.ends_at) : 'Finished'}</div>
            `;
            container.appendChild(block);
            if (isActive) startLiveCountdown(b.id, b.ends_at);
        });
    } catch (err) {
        console.error(`Ошибка загрузки батлов: ${err.message}`);
    }
}

window.openShareModal = async (battleId, option) => {
    const modal = document.getElementById('shareModal'); modal.classList.remove('hidden');
    const url = window.location.href; const title = 'Make it count – share to vote!';
    document.getElementById('facebookShare').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`;
    document.getElementById('twitterShare').href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    document.getElementById('redditShare').href = `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
    document.querySelectorAll('#shareModal a').forEach(link => link.onclick = async () => {
        const col = option === 'votes1' ? 'votes1' : 'votes2';
        const { data: d, error: fe } = await supabase.from('battles').select(col).eq('id', battleId).single(); if (fe) throw fe;
        const nv = (d[col]||0)+1;
        const { error } = await supabase.from('battles').update({ [col]: nv }).eq('id', battleId);
        if (error) throw error;
        fetchAndRenderBattles(); modal.classList.add('hidden');
    }).forEach(() => {});
};

window.addEventListener('load', () => {
    const shareModal = document.getElementById('shareModal'), btn = document.getElementById('shareCloseBtn');
    if (btn) btn.onclick = () => shareModal.classList.add('hidden');
    shareModal.onclick = e => { if (e.target === shareModal) shareModal.classList.add('hidden'); };
});

document.addEventListener('DOMContentLoaded', () => {
    // Инициализация табов и форма создания батла
    const durationInput = document.getElementById('duration'), datetimePicker = document.getElementById('datetimePicker');
    let sel = 'minutes';
    document.querySelectorAll('.time-tab').forEach(t => t.onclick = () => {
        document.querySelectorAll('.time-tab').forEach(x=>x.classList.remove('active'));
        t.classList.add('active'); sel = t.dataset.unit;
        if (sel==='date') { durationInput.classList.add('hidden'); datetimePicker.classList.remove('hidden'); }
        else { durationInput.classList.remove('hidden'); datetimePicker.classList.add('hidden'); durationInput.placeholder=`Enter ${sel}`; }
    });
    document.querySelector(".time-tab[data-unit='minutes']").click();

    document.getElementById('submitBattleBtn').onclick = async () => {
        const title = document.getElementById('title').value.trim();
        const o1 = document.getElementById('option1').value.trim();
        const o2 = document.getElementById('option2').value.trim();
        if(!title||!o1||!o2){alert('Пожалуйста, заполните все обязательные поля');return;}
        let ends;
        if(sel==='date') { const v=datetimePicker.value; if(!v){alert('Выберите дату и время');return;} ends=new Date(v).toISOString(); }
        else { const v=durationInput.value.trim(); if(!v){alert(`Введите время в ${sel}`);return;} const n=parseInt(v); if(isNaN(n)||n<=0){alert('Введите корректное время');return;} let ms=n*60000; if(sel==='hours')ms*=60; if(sel==='days')ms*=1440; ends=new Date(Date.now()+ms).toISOString(); }
        const i1=document.getElementById('image1File'), i2=document.getElementById('image2File');
        let u1='',u2=''; if(i1?.files.length)u1=await uploadImage(i1.files[0]); if(i2?.files.length)u2=await uploadImage(i2.files[0]);
        const { error }=await supabase.from('battles').insert({title,o1:o1,option2:o2,votes1:0,votes2:0,image1:u1,image2:u2,ends_at:ends});
        if(error){alert(error.message);return;} document.getElementById('createModal').classList.add('hidden'); fetchAndRenderBattles();
    };
});
