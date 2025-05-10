// Подключение к Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oleqibxqfwnvaorqgflp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
        } catch (error) {
            logMessage(`Ошибка создания батла: ${error.message}`, true);
        }
    });
});
