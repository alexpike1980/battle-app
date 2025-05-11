console.log("Скрипт main.js загружен");

// Подключение к Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

            const { data, error } = await supabase.storage.from('battle-images').upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
            });

            if (error) {
                console.error(`Ошибка загрузки файла: ${error.message}`);
                return '';
            }

            // Формируем публичный URL вручную
            const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/battle-images/${fileName}`;
            return publicUrl;

        } catch (error) {
            console.error(`Ошибка загрузки изображения: ${error.message}`);
            return '';
        }
    }

    function startLiveCountdown(battleId, endTime) {
        const timerElement = document.getElementById(`timer-${battleId}`);

        function updateTimer() {
            const diff = new Date(endTime) - new Date();
            if (diff <= 0) {
                timerElement.textContent = "Finished";
                clearInterval(interval);
                return;
            }

            const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
            const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
            const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
            timerElement.textContent = `${hours}:${minutes}:${seconds}`;
        }

        // Обновляем таймер каждую секунду
        const interval = setInterval(updateTimer, 1000);
        updateTimer(); // Первый вызов сразу
    }
function renderProgressBar(votes1 = 0, votes2 = 0, battleId) {
    const totalVotes = votes1 + votes2;
    const option1Percent = totalVotes > 0 ? Math.round((votes1 / totalVotes) * 100) : 50;
    const option2Percent = totalVotes > 0 ? Math.round((votes2 / totalVotes) * 100) : 50;

    // Полное заполнение для 100% голосов
    const option1Full = option1Percent === 100 ? 'full' : '';
    const option2Full = option2Percent === 100 ? 'full' : '';
    
    return `
        <div id="progress-bar-${battleId}" class="progress-bar-container">
            <div class="progress-bar progress-bar-blue ${option1Full}" style="width:${option1Percent}%; ${option1Percent === 100 ? 'border-radius: 12px;' : ''}">
                <span class="progress-text text-left">${votes1} votes (${option1Percent}%)</span>
            </div>
            <div class="progress-bar progress-bar-green ${option2Full}" style="width:${option2Percent}%; ${option2Percent === 100 ? 'border-radius: 12px;' : ''}">
                <span class="progress-text text-right">${votes2} votes (${option2Percent}%)</span>
            </div>
        </div>
    `;
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
    const timeLeftId = `timer-${battle.id}`;

    const block = document.createElement('div');
    block.id = `battle-${battle.id}`;
    block.className = 'p-4 bg-white rounded-lg shadow-lg';
 block.innerHTML = `
    <h3 class="text-xl font-semibold mb-3">${battle.title}</h3>
    <div class="flex gap-4 mb-4">
        <div class="flex-1">
            <img src="${battle.image1 || 'https://via.placeholder.com/150'}" alt="Option 1" class="w-full h-40 object-cover rounded-lg" />
            <div class="text-center font-semibold text-lg mt-2">${battle.option1}</div>
            <button class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all w-full mt-2" onclick="openShareModal('${battle.id}', 'votes1')">Vote</button>
        </div>
        <div class="flex-1">
            <img src="${battle.image2 || 'https://via.placeholder.com/150'}" alt="Option 2" class="w-full h-40 object-cover rounded-lg" />
            <div class="text-center font-semibold text-lg mt-2">${battle.option2}</div>
            <button class="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-all w-full mt-2" onclick="openShareModal('${battle.id}', 'votes2')">Vote</button>
        </div>
    </div>
    ${renderProgressBar(votes1, votes2, battle.id)}
    <div id="timer-${battle.id}" class="text-sm text-gray-500">${isActive ? 'Calculating...' : 'Finished'}</div>
`;

   
    container.appendChild(block);

    // Запуск live таймера
    if (isActive) {
        startLiveCountdown(battle.id, battle.ends_at);
    }
});
    } catch (error) {
        console.error("Ошибка загрузки батлов:" + error.message);
    }
}

fetchAndRenderBattles();

// Функция открытия модального окна шаринга
window.openShareModal = function (battleId, option) {
    const modal = document.getElementById("shareModal");
    modal.classList.remove("hidden");

    const url = window.location.href;
    const title = "Make it count – share to vote!";
    
    document.getElementById("facebookShare").href = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url) + "&quote=" + encodeURIComponent(title);
    document.getElementById("twitterShare").href = "https://twitter.com/intent/tweet?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(title);
    document.getElementById("redditShare").href = "https://www.reddit.com/submit?url=" + encodeURIComponent(url) + "&title=" + encodeURIComponent(title);

    // Добавляем обработчик клика для увеличения голосов
    document.querySelectorAll("#shareModal a").forEach(link => {
        link.onclick = async (event) => {
            try {
                const column = option === 'votes1' ? 'votes1' : 'votes2';
                
                // Получаем текущие голоса для баттла
                const { data: battleData, error: fetchError } = await supabase
                    .from('battles')
                    .select(column)
                    .eq('id', battleId)
                    .single();

                if (fetchError) throw fetchError;
                
                // Увеличиваем количество голосов
                const currentVotes = battleData[column] || 0;
                const newVotes = currentVotes + 1;
                
                // Обновляем количество голосов
                const { error } = await supabase
                    .from('battles')
                    .update({ [column]: newVotes })
                    .eq('id', battleId);

                if (error) throw error;
                
                console.log('Голос успешно добавлен');
                
                // Полное обновление карточки баттла
                fetchAndRenderBattles();
                
                // Закрываем модальное окно после шаринга
                modal.classList.add("hidden");
            } catch (error) {
                console.error("Ошибка добавления голоса: " + error.message);
            }
        };
    });
};







// Закрытие модального окна
// Обработчик для модального окна sharing
window.addEventListener("load", () => {
    console.log("Страница полностью загружена");

    const shareModal = document.getElementById("shareModal");
    const shareCloseBtn = document.getElementById("shareCloseBtn");

    // Проверяем, что кнопка вообще найдена
    if (shareCloseBtn) {
        console.log("Кнопка Cancel найдена");

        // Закрываем модальное окно по кнопке Cancel
        shareCloseBtn.addEventListener("click", () => {
            console.log("Закрываем модальное окно sharing");
            shareModal.classList.add("hidden");
        });
    } else {
        console.error("Кнопка Cancel не найдена!");
    }

    // Закрываем модальное окно при клике вне его области
    shareModal.addEventListener("click", (event) => {
        if (event.target === shareModal) {
            console.log("Клик вне контента, закрываем окно");
            shareModal.classList.add("hidden");
        }
    });
});







    // Обработчик для создания батла
    document.getElementById('submitBattleBtn').addEventListener('click', async () => {
        try {
            const title = document.getElementById('title').value.trim();
            const option1 = document.getElementById('option1').value.trim();
            const option2 = document.getElementById('option2').value.trim();
            const duration = parseInt(document.getElementById('duration').value.trim());
            const image1FileInput = document.getElementById('image1File');
            const image2FileInput = document.getElementById('image2File');

            if (!title || !option1 || !option2 || isNaN(duration)) {
                console.error("Пожалуйста, заполните все обязательные поля");
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
                console.error(`Ошибка создания батла: ${error.message}`);
                return;
            }

            console.log("Батл успешно создан");
            document.getElementById('createModal').classList.add('hidden');
            fetchAndRenderBattles();
        } catch (error) {
            console.error(`Ошибка создания батла: ${error.message}`);
        }
    });
});
