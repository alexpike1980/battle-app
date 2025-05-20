document.addEventListener('DOMContentLoaded', () => {
  const tabBtns = Array.from(document.querySelectorAll('.tab-btn'));
  const indicator = document.getElementById('tabIndicator');
  let activeTab = tabBtns.find(btn => btn.classList.contains('active')) || tabBtns[0];

  function updateIndicator(btn) {
    const rect = btn.getBoundingClientRect();
    const parentRect = btn.parentNode.getBoundingClientRect();
    indicator.style.width = rect.width + 'px';
    indicator.style.left = (rect.left - parentRect.left) + 'px';
  }

  function activateTab(btn) {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateIndicator(btn);
    // Здесь может быть логика для фильтрации батлов, если нужно
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn));
  });

  if (activeTab) updateIndicator(activeTab);
});
