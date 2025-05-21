// tabs.js - Handles tab indicator animation

document.addEventListener('DOMContentLoaded', function() {
  const tabIndicator = document.getElementById('tabIndicator');
  const tabs = document.querySelectorAll('.tab-btn');
  
  // Initialize the tab indicator position
  function updateTabIndicator(tab) {
    if (!tabIndicator || !tab) return;
    
    const tabRect = tab.getBoundingClientRect();
    const containerRect = tab.parentElement.getBoundingClientRect();
    
    // Set the width and position of the indicator
    tabIndicator.style.width = `${tabRect.width}px`;
    tabIndicator.style.left = `${tabRect.left - containerRect.left}px`;
  }
  
  // Initial position for the active tab
  const activeTab = document.querySelector('.tab-btn.active');
  if (activeTab) {
    setTimeout(() => updateTabIndicator(activeTab), 100);
  }
  
  // Update indicator when tab is clicked
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      updateTabIndicator(this);
    });
  });
  
  // Update indicator on window resize
  window.addEventListener('resize', () => {
    const currentActiveTab = document.querySelector('.tab-btn.active');
    if (currentActiveTab) {
      updateTabIndicator(currentActiveTab);
    }
  });
});
