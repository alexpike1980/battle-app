import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("Подключение к Supabase создано:", supabase);

function logMessage(message, isError = false) {
    const logContainer = document.getElementById('logContainer');
    const logItem = document.createElement('div');
    logItem.textContent = message;
    logItem.style.color = isError ? 'red' : 'green';
    logContainer.appendChild(logItem);
    console.log(message);
}

document.addEventListener('DOMContentLoaded', () => {
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
        console.log("Попытка загрузить файл:", fileName);

        // Загрузка файла
        const { data, error } = await supabase.storage.from('battle-images').upload(fileName, file);
        if (error) {
            console.error("Ошибка загрузки файла:", error);
            alert("Ошибка загрузки файла: " + error.message);
            return '';
        }

        // Проверяем заголовки
        console.log("Заголовки для запроса:", supabase.auth.headers);

        // Получаем публичный URL через API Supabase
        const { data: publicData, error: publicError } = await supabase.storage.from('battle-images').getPublicUrl(fileName);
        if (publicError) {
            console.error("Ошибка получения публичного URL:", publicError);
            alert("Ошибка получения публичного URL: " + publicError.message);
            return '';
        }

        console.log("Публичный URL изображения:", publicData.publicUrl);
        return publicData.publicUrl;

    } catch (error) {
        console.error("Ошибка загрузки изображения:", error.message);
        alert("Ошибка загрузки изображения: " + error.message);
        return '';
    }
}


    async function fetchAndRenderBattles() {
        try {
            const { data: battles, error } = await supabase.from('battles').select('*').order('created_at', { ascending: false });
            if (error) throw error;

            const container = document.getElementById('battleList');
            if (!container) return;
            container.innerHTML = '';

            battles.forEach(battle => {
                const isActive = new Date(battle.ends_at) > new Date();
                const votes1 = battle.votes1 || 0;
                const votes2 = battle.votes2 || 0;
                const totalVotes = votes1 + votes2;
                const option1Percent = totalVotes > 0 ? Math.round((votes1 / totalVotes) * 100) : 0;
                const option2Percent = totalVotes > 0 ? Math.round((votes2 / totalVotes) * 100) : 0;
                const timeLeft = calculateTimeLeft(battle.ends_at);

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
                        <div class="bg-blue-600 text-white text-sm leading-none py-1 text-center rounded-full" style="width:${option1Percent}%">${votes1} votes (${option1Percent}%)</div>
                        <div class="bg-green-600 text-white text-sm leading-none py-1 text-center rounded-full" style="width:${option2Percent}%">${votes2} votes (${option2Percent}%)</div>
                    </div>
                    <div class="flex justify-between items-center">
                        <button class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all" onclick="shareBattle(${battle.id}, 'votes1')">Vote</button>
                        <button class="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-all" onclick="shareBattle(${battle.id}, 'votes2')">Vote</button>
                        <div class="text-sm text-gray-500">${isActive ? `Time left: ${timeLeft}` : 'Finished'}</div>
                    </div>
                `;
                container.appendChild(block);
            });
        } catch (error) {
            logMessage(`Ошибка загрузки батлов: ${error.message}`, true);
        }
    }

    document.getElementById('submitBattleBtn').addEventListener('click', async () => {
        try {
            const title = document.getElementById('title').value.trim();
            const option1 = document.getElementById('option1').value.trim();
            const option2 = document.getElementById('option2').value.trim();
            const duration = parseInt(document.getElementById('duration').value.trim());
            const image1FileInput = document.getElementById('image1File');
            const image2FileInput = document.getElementById('image2File');

            if (!title || !option1 || !option2 || isNaN(duration)) {
                logMessage("Пожалуйста, заполните все обязательные поля", true);
                return;
            }

            let image1Url = '';
            let image2Url = '';

            if (image1FileInput && image1FileInput.files.length > 0) {
                image1Url = await uploadImage(image1FileInput.files[0]);
            }
            if (image2FileInput && image2FileInput.files.length > 0) {
                image2Url = await uploadImage(image2FileInput.files[0]);
            }

            const ends_at = new Date(Date.now() + duration * 60000).toISOString();

            const { error } = await supabase.from('battles').insert({
                title,
                option1,
                option2,
                votes1: 0,
                votes2: 0,
                image1: image1Url,
                image2: image2Url,
                ends_at: ends_at,
            });

            if (error) {
                logMessage(`Ошибка создания батла: ${error.message}`, true);
                return;
            }

            logMessage("Батл успешно создан");
            document.getElementById('createModal').classList.add('hidden');
            fetchAndRenderBattles();
        } catch (error) {
            logMessage(`Ошибка создания батла: ${error.message}`, true);
        }
    });

    fetchAndRenderBattles();
});
