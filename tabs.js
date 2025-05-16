document.addEventListener('DOMContentLoaded', () => {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const indicator = document.getElementById('tabIndicator');
  if (!indicator || tabBtns.length === 0) return;

  function updateIndicator() {
    const activeTab = document.querySelector('.tab-btn.active');
    if (!activeTab) return;
    const nav = activeTab.parentElement;
    const rect = nav.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    indicator.style.width = `${tabRect.width}px`;
    indicator.style.left = `${tabRect.left - rect.left}px`;
  }

  function activateTab(tab) {
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tab.classList.add('active');
    updateIndicator();
    // можно вызывать свою подгрузку батлов для нужной вкладки
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn));
  });

  // По умолчанию активируем первый таб
  activateTab(tabBtns[0]);
});
