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

async function uploadImage(file) {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from('battle-images').upload(fileName, file);
    if (error) throw error;
    const { publicUrl } = await supabase.storage.from('battle-images').getPublicUrl(fileName);
    return publicUrl.publicUrl;
}

document.getElementById('submitBattleBtn').addEventListener('click', async () => {
    const title = document.getElementById('title').value;
    const option1 = document.getElementById('option1').value;
    const option2 = document.getElementById('option2').value;
    const duration = parseInt(document.getElementById('duration').value);
    const image1Url = document.getElementById('image1Url').value.trim();
    const image2Url = document.getElementById('image2Url').value.trim();
    const image1File = document.getElementById('image1File').files[0];
    const image2File = document.getElementById('image2File').files[0];

    let finalImage1 = image1Url;
    let finalImage2 = image2Url;

    if (!finalImage1 && image1File) finalImage1 = await uploadImage(image1File);
    if (!finalImage2 && image2File) finalImage2 = await uploadImage(image2File);

    const endTime = new Date(Date.now() + duration * 60000).toISOString();

    await supabase.from('battles').insert({
        title,
        option1,
        option2,
        option1_votes: 0,
        option2_votes: 0,
        end_time: endTime,
        image1: finalImage1,
        image2: finalImage2,
    });

    document.getElementById('createModal').classList.add('hidden');
    fetchAndRenderBattles();
});

fetchAndRenderBattles();
