// Подключение к Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fetchAndRenderBattles() {
    const now = new Date().toISOString();
    const { data: battles } = await supabase.from('battles').select('*').order('created_at', { ascending: false });

    const container = document.getElementById('battleList');
    container.innerHTML = '';

    battles.forEach(battle => {
        const isActive = new Date(battle.end_time) > new Date();
        const option1Votes = battle.option1_votes || 0;
        const option2Votes = battle.option2_votes || 0;
        const totalVotes = option1Votes + option2Votes;
        const option1Percent = totalVotes > 0 ? Math.round((option1Votes / totalVotes) * 100) : 0;
        const option2Percent = totalVotes > 0 ? Math.round((option2Votes / totalVotes) * 100) : 0;
        const timeLeft = calculateTimeLeft(battle.end_time);

        const block = document.createElement('div');
        block.className = 'p-4 bg-white rounded-lg shadow-lg';
        block.innerHTML = `
            <h3 class="text-xl font-semibold mb-3">${battle.title}</h3>
            <div class="flex gap-4 mb-4">
                <div class="flex-1">
                    <img src="${battle.image1 || 'https://via.placeholder.com/150'}" alt="Option 1" class="w-full h-40 object-cover rounded-lg" />
                </div>
                <div class="flex-1">
                    <img src="${battle.image2 || 'https://via.placeholder.com/150'}" alt="Option 2" class="w-full h-40 object-cover rounded-lg" />
                </div>
            </div>
            <div class="w-full bg-gray-200 rounded-full overflow-hidden mb-4">
                <div class="bg-blue-600 text-white text-sm leading-none py-1 text-center rounded-full" style="width:${option1Percent}%;">${option1Votes} votes (${option1Percent}%)</div>
                <div class="bg-green-600 text-white text-sm leading-none py-1 text-center rounded-full" style="width:${option2Percent}%;">${option2Votes} votes (${option2Percent}%)</div>
            </div>
            <div class="flex justify-between items-center">
                <button class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all" onclick="shareBattle(${battle.id}, 'option1')">Vote</button>
                <button class="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-all" onclick="shareBattle(${battle.id}, 'option2')">Vote</button>
                <div class="text-sm text-gray-500">${isActive ? `Time left: ${timeLeft}` : 'Finished'}</div>
            </div>
        `;
        container.appendChild(block);

        if (isActive) {
            setInterval(() => {
                const updatedTimeLeft = calculateTimeLeft(battle.end_time);
                block.querySelector('.text-sm.text-gray-500').textContent = `Time left: ${updatedTimeLeft}`;
                if (updatedTimeLeft === '00:00:00') fetchAndRenderBattles();
            }, 1000);
        }
    });
}

function calculateTimeLeft(endTime) {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return '00:00:00';
    const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function shareBattle(battleId, option) {
    const shareUrl = `${window.location.origin}/battle.html?battleId=${battleId}&option=${option}`;
    const shareText = 'Check out this battle and vote!';
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
    vote(battleId, option);
}

async function vote(battleId, option) {
    const { data: battle } = await supabase.from('battles').select('*').eq('id', battleId).single();
    const newVotes = (battle[`${option}_votes`] || 0) + 1;
    await supabase.from('battles').update({ [`${option}_votes`]: newVotes }).eq('id', battleId);
    fetchAndRenderBattles();
}

document.getElementById('createBattleBtn').addEventListener('click', () => {
    document.getElementById('createModal').classList.remove('hidden');
});

document.getElementById('closeModalBtn').addEventListener('click', () => {
    document.getElementById('createModal').classList.add('hidden');
});

document.getElementById('submitBattleBtn').addEventListener('click', async () => {
    const title = document.getElementById('title').value;
    const option1 = document.getElementById('option1').value;
    const option2 = document.getElementById('option2').value;
    const duration = parseInt(document.getElementById('duration').value);
    const image1 = document.getElementById('image1').value;
    const image2 = document.getElementById('image2').value;

    const endTime = new Date(Date.now() + duration * 60000).toISOString();

    await supabase.from('battles').insert({
        title,
        option1,
        option2,
        option1_votes: 0,
        option2_votes: 0,
        end_time: endTime,
        image1,
        image2,
    });

    document.getElementById('createModal').classList.add('hidden');
    fetchAndRenderBattles();
});

fetchAndRenderBattles();
