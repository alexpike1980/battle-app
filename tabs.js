// --- Animated Tabs ---
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('#battleTabs .tab-btn');
  const indicator = document.getElementById('tabIndicator');
  let activeTab = 0;

  function updateIndicator(idx) {
    const btn = tabs[idx];
    indicator.style.left = btn.offsetLeft + "px";
    indicator.style.width = btn.offsetWidth + "px";
  }

  function activateTab(idx) {
    tabs.forEach((tab, i) => tab.classList.toggle('active', i === idx));
    activeTab = idx;
    updateIndicator(idx);

    // Скрываем ленту, показываем скелетоны
    showSkeletons();
    // Здесь можно отфильтровать батлы, когда будешь делать фильтрацию по статусу
    setTimeout(() => {
      hideSkeletons();
      // renderBattles(tab.dataset.tab) // вставь свою функцию фильтрации батлов
    }, 800); // имитация загрузки
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activateTab(i));
  });

  // Init
  setTimeout(() => updateIndicator(0), 200); // для корректного расчета ширины
  activateTab(0);

  // Create Battle (дублируем кнопку сверху)
  document.getElementById('floatingCreateBtn').onclick = () =>
    document.getElementById('createModal').classList.remove('hidden');
});

// --- Skeleton logic ---
function showSkeletons() {
  document.getElementById('battleList').classList.add('hidden');
  document.getElementById('battleSkeletons').classList.remove('hidden');
}
function hideSkeletons() {
  document.getElementById('battleList').classList.remove('hidden');
  document.getElementById('battleSkeletons').classList.add('hidden');
}

