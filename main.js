// Minimal stable solution - focus only on battle display
(function() {
  // Global variables with safe initialization
  const state = {
    currentTab: 'featured',
    battles: [],
    timers: {}
  };

  // Wait for DOM to be fully loaded
  window.addEventListener('DOMContentLoaded', initializeApp);

  // Initialize the application safely
  function initializeApp() {
    console.log('Initializing app...');
    
    // Safely check for Supabase
    if (typeof supabase === 'undefined') {
      showError('Supabase client is not loaded. Please include the script in your HTML.');
      return;
    }
    
    // Initialize Supabase client with safe error handling
    try {
      const supabaseUrl = 'https://oleqibxqfwnvaorqgflp.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZXFpYnhxZndudmFvcnFnZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMTQsImV4cCI6MjA2MTkzNzExNH0.AdpIio7ZnNpQRMeY_8Sb1bXqKpmYDeR7QYvAfnssdCA';
      window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
      console.log('Supabase initialized successfully');
    } catch (err) {
      showError('Error initializing Supabase: ' + err.message);
      return;
    }
    
    // Set up event listeners safely
    setupEventListeners();
    
    // Load battles immediately
    loadBattles();
  }

  // Show error message in a visible way
  function showError(message) {
    console.error(message);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'p-4 bg-red-100 text-red-700 rounded-lg mb-4';
    errorDiv.innerHTML = `<p>Error: ${message}</p>`;
    
    // Try to insert at various locations for maximum visibility
    const possibleContainers = [
      document.getElementById('battleList'),
      document.querySelector('main'),
      document.querySelector('.boxed'),
      document.body
    ];
    
    for (const container of possibleContainers) {
      if (container) {
        if (container === document.body) {
          container.prepend(errorDiv);
        } else {
          container.innerHTML = '';
          container.appendChild(errorDiv);
        }
        break;
      }
    }
  }

  // Set up event listeners
  function setupEventListeners() {
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(t => 
          t.classList.remove('active'));
        this.classList.add('active');
        
        // Update current tab and load battles
        state.currentTab = this.dataset.tab || 'featured';
        loadBattles();
      });
    });
    
    // Create battle button(s)
    const createButtons = [
      document.getElementById('createBattleBtn'),
      document.getElementById('createBattleBtn2'),
      document.getElementById('navFab')
    ];
    
    createButtons.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', showCreateModal);
      }
    });
    
    // Close modal button(s)
    const closeButtons = [
      document.getElementById('cancelCreateBtn'),
      document.getElementById('shareCloseBtn')
    ];
    
    closeButtons.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', function() {
          const modalId = this.dataset.modal || 'createModal';
          const modal = document.getElementById(modalId);
          if (modal) {
            modal.classList.add('hidden');
          }
        });
      }
    });
    
    // Background clicks on modals
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', function(e) {
        if (e.target === this) {
          this.classList.add('hidden');
        }
      });
    });
    
    // Submit battle button
    const submitBtn = document.getElementById('submitBattleBtn');
    if (submitBtn) {
      submitBtn.addEventListener('click', handleBattleSubmit);
    }
    
    // Setup image upload previews
    setupImageUploadPreviews();
  }
  
  // Setup image upload previews
  function setupImageUploadPreviews() {
    // Add styles for the image input sections
    const style = document.createElement('style');
    style.textContent = `
      .image-input-container {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
      }
      .image-preview {
        width: 80px;
        height: 80px;
        border-radius: 8px;
        overflow: hidden;
        background-color: #f3f4f6;
        margin-right: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .image-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .image-upload-options {
        flex: 1;
      }
      .image-url-container {
        display: flex;
        margin-bottom: 8px;
      }
      .image-url-container input {
        flex: 1;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 8px 12px;
        margin-right: 8px;
      }
      .url-apply-btn {
        background-color: #6366f1;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 0 12px;
        cursor: pointer;
      }
      .url-apply-btn:hover {
        background-color: #4f46e5;
      }
      .upload-btn {
        background-color: #e5e7eb;
        color: #374151;
        border: none;
        border-radius: 6px;
        padding: 8px 12px;
        cursor: pointer;
        width: 100%;
        text-align: center;
      }
      .upload-btn:hover {
        background-color: #d1d5db;
      }
      .image-preview-placeholder {
        color: #9ca3af;
        font-size: 12px;
        text-align: center;
      }
    `;
    document.head.appendChild(style);
    
    // Find and modify the create battle form
    modifyCreateBattleForm();
    
    // Set up the image preview functionality
    setupImagePreviewHandlers();
  }
  
  // Modify the create battle form layout
  function modifyCreateBattleForm() {
    // Find the main create modal container
    const createModal = document.getElementById('createModal');
    if (!createModal) return;
    
    // Get the main form container
    const formContainer = createModal.querySelector('.modal-content') || createModal;
    
    // Clear the form container and add a new, properly structured form
    formContainer.innerHTML = `
      <h2 class="text-2xl font-bold mb-4">Create New Battle</h2>
      
      <!-- Title input -->
      <div class="mb-4">
        <input type="text" id="title" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Battle title">
      </div>
      
      <!-- Option 1 -->
      <div class="mb-4">
        <input type="text" id="option1" class="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3" placeholder="Option 1">
        
        <div class="flex items-center mb-3">
          <div class="w-[80px] h-[80px] bg-gray-100 rounded-lg mr-3 overflow-hidden flex-shrink-0" id="image1Preview">
            <div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
          </div>
          
          <div class="flex-1">
            <div class="flex mb-2">
              <input type="text" id="image1Url" class="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg" placeholder="Image URL">
              <button type="button" class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-r-lg" data-for="image1">Apply</button>
            </div>
            
            <button type="button" id="image1UploadBtn" class="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg">Upload Image</button>
            <input type="file" id="image1File" accept="image/*" class="hidden">
          </div>
        </div>
      </div>
      
      <!-- Option 2 -->
      <div class="mb-4">
        <input type="text" id="option2" class="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3" placeholder="Option 2">
        
        <div class="flex items-center mb-3">
          <div class="w-[80px] h-[80px] bg-gray-100 rounded-lg mr-3 overflow-hidden flex-shrink-0" id="image2Preview">
            <div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
          </div>
          
          <div class="flex-1">
            <div class="flex mb-2">
              <input type="text" id="image2Url" class="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg" placeholder="Image URL">
              <button type="button" class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-r-lg" data-for="image2">Apply</button>
            </div>
            
            <button type="button" id="image2UploadBtn" class="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg">Upload Image</button>
            <input type="file" id="image2File" accept="image/*" class="hidden">
          </div>
        </div>
      </div>
      
      <!-- Duration selection -->
      <div class="mb-4">
        <div class="flex mb-2">
          <button type="button" class="duration-btn px-4 py-2 rounded-lg mr-2 bg-blue-500 text-white" data-unit="minutes">Minutes</button>
          <button type="button" class="duration-btn px-4 py-2 rounded-lg mr-2 bg-gray-200 text-gray-700" data-unit="hours">Hours</button>
          <button type="button" class="duration-btn px-4 py-2 rounded-lg mr-2 bg-gray-200 text-gray-700" data-unit="days">Days</button>
          <button type="button" class="duration-btn px-4 py-2 rounded-lg bg-gray-200 text-gray-700" data-unit="date">Pick Date</button>
        </div>
        
        <div id="durationInputContainer">
          <input type="number" id="durationValue" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Enter duration in minutes" value="60" min="1">
        </div>
        
        <input type="hidden" id="endsAtValue">
      </div>
      
      <!-- Submit buttons -->
      <div class="flex justify-end">
        <button type="button" id="cancelCreateBtn" class="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg mr-2">Cancel</button>
        <button type="button" id="submitBattleBtn" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg">Submit</button>
      </div>
    `;
    
    // Set up event listeners for the new form elements
    setupDurationControls();
    
    // Set up image upload previews
    setupImagePreviewHandlers();
  }
  
  // Set up the duration controls
  function setupDurationControls() {
    // Get all duration buttons
    const durationBtns = document.querySelectorAll('.duration-btn');
    const durationInput = document.getElementById('durationValue');
    const durationContainer = document.getElementById('durationInputContainer');
    const endsAtInput = document.getElementById('endsAtValue');
    
    if (!durationBtns.length || !durationInput || !durationContainer || !endsAtInput) return;
    
    // Set default unit and calculate end date
    let currentUnit = 'minutes';
    updateEndDate();
    
    // Add click event to each duration button
    durationBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        // Update active button
        durationBtns.forEach(b => {
          b.classList.remove('bg-blue-500', 'text-white');
          b.classList.add('bg-gray-200', 'text-gray-700');
        });
        this.classList.remove('bg-gray-200', 'text-gray-700');
        this.classList.add('bg-blue-500', 'text-white');
        
        // Get the unit
        const unit = this.dataset.unit;
        currentUnit = unit;
        
        // Update input based on selected unit
        if (unit === 'date') {
          // Show date picker
          durationContainer.innerHTML = `
            <input type="datetime-local" id="datePickerInput" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
          `;
          
          // Set min date to now
          const datePickerInput = document.getElementById('datePickerInput');
          if (datePickerInput) {
            const now = new Date();
            const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
            const minDateTime = localDate.toISOString().slice(0, 16);
            
            datePickerInput.min = minDateTime;
            datePickerInput.value = minDateTime;
            
            // Set end date when date picker changes
            datePickerInput.addEventListener('change', function() {
              const selectedDate = new Date(this.value);
              endsAtInput.value = selectedDate.toISOString();
            });
            
            // Trigger change event to set initial value
            const event = new Event('change');
            datePickerInput.dispatchEvent(event);
          }
        } else {
          // Show number input with appropriate placeholder
          durationContainer.innerHTML = `
            <input type="number" id="durationValue" class="w-full px-3 py-2 border border-gray-300 rounded-lg" 
              placeholder="Enter duration in ${unit}" value="${unit === 'minutes' ? '60' : unit === 'hours' ? '24' : '7'}" min="1">
          `;
          
          // Set up event listener for the new input
          const newDurationInput = document.getElementById('durationValue');
          if (newDurationInput) {
            newDurationInput.addEventListener('input', updateEndDate);
            // Trigger input event to calculate initial end date
            updateEndDate();
          }
        }
      });
    });
    
    // Add input event to duration input
    durationInput.addEventListener('input', updateEndDate);
    
    // Function to update the end date based on duration input
    function updateEndDate() {
      const durationInput = document.getElementById('durationValue');
      if (!durationInput) return;
      
      const value = parseInt(durationInput.value) || 0;
      const now = new Date();
      let endDate = new Date(now);
      
      // Calculate end date based on unit
      switch (currentUnit) {
        case 'minutes':
          endDate.setMinutes(now.getMinutes() + value);
          break;
        case 'hours':
          endDate.setHours(now.getHours() + value);
          break;
        case 'days':
          endDate.setDate(now.getDate() + value);
          break;
      }
      
      // Update hidden input
      endsAtInput.value = endDate.toISOString();
    }
  }
  
  // Set up handlers for image previews
  function setupImagePreviewHandlers() {
    // Setup for Image 1
    setupSingleImagePreview('image1');
    
    // Setup for Image 2
    setupSingleImagePreview('image2');
  }
  
  // Setup handlers for a single image preview
  function setupSingleImagePreview(imageId) {
    const fileInput = document.getElementById(`${imageId}File`);
    const urlInput = document.getElementById(`${imageId}Url`);
    const previewEl = document.getElementById(`${imageId}Preview`);
    const uploadBtn = document.getElementById(`${imageId}UploadBtn`);
    const applyBtn = document.querySelector(`.url-apply-btn[data-for="${imageId}"]`);
    
    if (!fileInput || !urlInput || !previewEl || !uploadBtn || !applyBtn) return;
    
    // When upload button is clicked, trigger file input
    uploadBtn.addEventListener('click', () => fileInput.click());
    
    // When file is selected, show preview
    fileInput.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          previewEl.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
          // Clear URL input since we're using a file
          urlInput.value = '';
        };
        reader.readAsDataURL(this.files[0]);
      }
    });
    
    // When apply button is clicked, show URL preview
    applyBtn.addEventListener('click', function() {
      const url = urlInput.value.trim();
      if (url) {
        previewEl.innerHTML = `<img src="${url}" alt="Preview" onerror="this.onerror=null;this.src='https://via.placeholder.com/80?text=Error';">`;
        // Clear file input since we're using a URL
        fileInput.value = '';
      }
    });
    
    // Also apply URL on Enter key
    urlInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        applyBtn.click();
        e.preventDefault();
      }
    });
  }
  
  // Show create modal
  function showCreateModal() {
    const modal = document.getElementById('createModal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }
  
  // Handle battle submit
  function handleBattleSubmit() {
    const submitBtn = document.getElementById('submitBattleBtn');
    if (!submitBtn) return;
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';
    
    // Get form values
    const title = document.getElementById('title')?.value || '';
    const option1 = document.getElementById('option1')?.value || '';
    const option2 = document.getElementById('option2')?.value || '';
    
    // Get image sources (either file or URL)
    const image1Url = document.getElementById('image1Url')?.value || '';
    const image2Url = document.getElementById('image2Url')?.value || '';
    const image1File = document.getElementById('image1File');
    const image2File = document.getElementById('image2File');
    
    // Check which image source to use for each option
    const hasImage1File = image1File && image1File.files && image1File.files.length > 0;
    const hasImage2File = image2File && image2File.files && image2File.files.length > 0;
    const hasImage1Url = image1Url.trim() !== '';
    const hasImage2Url = image2Url.trim() !== '';
    
    // Validation
    if (!title || !option1 || !option2) {
      alert('Please fill in all required fields');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
      return;
    }
    
    // Get end date value
    let endsAt;
    const endsAtValue = document.getElementById('endsAtValue')?.value;
    const datePickerInput = document.getElementById('datePickerInput');
    
    if (datePickerInput) {
      // If date picker is visible, use its value
      endsAt = new Date(datePickerInput.value);
    } else if (endsAtValue) {
      // If hidden input has a value, use it
      endsAt = new Date(endsAtValue);
    } else {
      // Default to 24 hours from now
      endsAt = new Date();
      endsAt.setHours(endsAt.getHours() + 24);
    }
    
    // Validate end date
    if (endsAt <= new Date()) {
      alert('End date must be in the future');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
      return;
    }
    
    // Prepare battle data
    const battleData = {
      title,
      option1,
      option2,
      image1: 'https://via.placeholder.com/300',
      image2: 'https://via.placeholder.com/300',
      votes1: 0,
      votes2: 0,
      ends_at: endsAt.toISOString(),
      created_at: new Date().toISOString()
    };
    
    // Set direct URLs if provided
    if (hasImage1Url) battleData.image1 = image1Url;
    if (hasImage2Url) battleData.image2 = image2Url;
    
    // Check if we need to upload any image files
    if (hasImage1File || hasImage2File) {
      const promises = [];
      
      // Upload image 1 if file is selected
      if (hasImage1File && !hasImage1Url) {
        promises.push(uploadImage(image1File.files[0], 'battle-images')
          .then(url => {
            if (url) battleData.image1 = url;
          }));
      }
      
      // Upload image 2 if file is selected
      if (hasImage2File && !hasImage2Url) {
        promises.push(uploadImage(image2File.files[0], 'battle-images')
          .then(url => {
            if (url) battleData.image2 = url;
          }));
      }
      
      // Wait for uploads to complete
      Promise.all(promises)
        .then(() => createBattle(battleData, submitBtn))
        .catch(err => {
          console.error('Error uploading images:', err);
          alert('Error uploading images. Please try again.');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit';
        });
    } else {
      // No images to upload, create battle directly
      createBattle(battleData, submitBtn);
    }
  }
  
  // Upload image to Supabase storage
  function uploadImage(file, path) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }
      
      try {
        // Create a unique file name
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${path}/${fileName}`;
        
        // Upload the file
        window.supabaseClient.storage
          .from('battle-images')
          .upload(filePath, file)
          .then(({ data, error }) => {
            if (error) {
              console.error('Storage upload error:', error);
              reject(error);
              return;
            }
            
            // Get the public URL
            const { data: { publicUrl } } = window.supabaseClient.storage
              .from('battle-images')
              .getPublicUrl(filePath);
              
            resolve(publicUrl);
          })
          .catch(reject);
      } catch (err) {
        console.error('Error in uploadImage:', err);
        reject(err);
      }
    });
  }
  
  // Create battle in database
  function createBattle(battleData, submitBtn) {
    window.supabaseClient.from('battles').insert([battleData])
      .then(({ data, error }) => {
        if (error) {
          alert('Error creating battle: ' + error.message);
          console.error('Error creating battle:', error);
        } else {
          // Reset form
          document.getElementById('title').value = '';
          document.getElementById('option1').value = '';
          document.getElementById('option2').value = '';
          
          // Clear image inputs and previews
          resetImageInputs('image1');
          resetImageInputs('image2');
          
          // Hide modal
          document.getElementById('createModal').classList.add('hidden');
          
          // Reload battles
          loadBattles();
          
          // Show success message
          alert('Battle created successfully!');
        }
        
        // Reset button
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit';
        }
      })
      .catch(err => {
        alert('Unexpected error: ' + err.message);
        console.error('Unexpected error:', err);
        
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit';
        }
      });
  }
  
  // Reset image inputs and previews
  function resetImageInputs(imageId) {
    const urlInput = document.getElementById(`${imageId}Url`);
    const fileInput = document.getElementById(`${imageId}File`);
    const previewEl = document.getElementById(`${imageId}Preview`);
    
    if (urlInput) urlInput.value = '';
    if (fileInput) fileInput.value = '';
    if (previewEl) {
      previewEl.innerHTML = `<div class="image-preview-placeholder">No Image</div>`;
    }
  }

  // Load battles from Supabase
  function loadBattles() {
    // Find container
    const battlesList = document.getElementById('battleList');
    if (!battlesList) {
      console.error('Battle list container not found');
      return;
    }
    
    // Show loading state
    battlesList.innerHTML = '<div class="p-4 text-center">Loading battles...</div>';
    
    // Build query
    const now = new Date().toISOString();
    let query = window.supabaseClient.from('battles').select('*');
    
    // Apply tab filter
    if (state.currentTab === 'active') {
      query = query.gt('ends_at', now);
    } else if (state.currentTab === 'finished') {
      query = query.lte('ends_at', now);
    }
    
    // Sort by created date (newest first)
    query = query.order('created_at', { ascending: false });
    
    // Execute query
    query.then(({ data, error }) => {
      if (error) {
        battlesList.innerHTML = `<div class="p-4 text-center text-red-500">Error loading battles: ${error.message}</div>`;
        console.error('Error loading battles:', error);
        return;
      }
      
      // Update state
      state.battles = data || [];
      
      // Clear timers
      Object.values(state.timers).forEach(timer => clearInterval(timer));
      state.timers = {};
      
      // Handle empty state
      if (state.battles.length === 0) {
        battlesList.innerHTML = `
          <div class="p-4 text-center">
            <p>No battles found</p>
            <button class="bg-blue-600 text-white px-4 py-2 rounded mt-4" onclick="document.getElementById('createModal').classList.remove('hidden')">
              Create a battle
            </button>
          </div>
        `;
        return;
      }
      
      // Render battles
      battlesList.innerHTML = '';
      state.battles.forEach(battle => renderBattle(battle, battlesList));
      
      // Set up vote buttons
      setupVoteButtons();
    }).catch(err => {
      battlesList.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${err.message}</div>`;
      console.error('Unexpected error:', err);
    });
  }

  // Render a single battle
  function renderBattle(battle, container) {
    const isActive = new Date(battle.ends_at) > new Date();
    
    const battleEl = document.createElement('div');
    battleEl.className = 'bg-white py-8 px-2 md:px-6 flex flex-col gap-2 border-b border-gray-200 mb-2';
    
    battleEl.innerHTML = `
      <a href="battle.html?id=${battle.id}" class="text-2xl font-semibold mb-2 hover:text-blue-600 transition underline-offset-2 hover:underline inline-block">${battle.title}</a>
      <div class="relative flex flex-row gap-2 justify-center items-center">
        <div class="flex flex-col items-center flex-1">
          <img src="${battle.image1||'https://via.placeholder.com/300'}" alt="${battle.option1}" class="object-cover rounded-lg w-[220px] h-[180px] md:w-[260px] md:h-[180px]" />
          <div class="option-title mt-2">${battle.option1}</div>
          <button class="bg-blue-600 text-white py-3 mt-3 rounded-lg font-bold w-full md:w-[90%] text-lg transition hover:bg-blue-700 vote-btn" data-battle="${battle.id}" data-opt="votes1">Vote</button>
        </div>
        <div class="absolute z-20 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div class="vs-circle bg-white flex items-center justify-center text-lg font-bold w-14 h-14 border-2 border-white shadow-none">VS</div>
        </div>
        <div class="flex flex-col items-center flex-1">
          <img src="${battle.image2||'https://via.placeholder.com/300'}" alt="${battle.option2}" class="object-cover rounded-lg w-[220px] h-[180px] md:w-[260px] md:h-[180px]" />
          <div class="option-title mt-2">${battle.option2}</div>
          <button class="bg-green-600 text-white py-3 mt-3 rounded-lg font-bold w-full md:w-[90%] text-lg transition hover:bg-green-700 vote-btn" data-battle="${battle.id}" data-opt="votes2">Vote</button>
        </div>
      </div>
      <div class="mt-3 overflow-hidden rounded-full">
        <div id="progress-${battle.id}" class="flex w-full">
          ${renderProgressBar(battle.votes1, battle.votes2)}
        </div>
      </div>
      <div id="timer-${battle.id}" class="text-xs text-gray-500 pt-1">${isActive ? 'Time Left: ' + calculateTimeLeft(battle.ends_at) : 'Finished'}</div>
    `;
    
    container.appendChild(battleEl);
    
    // Set up timer for active battles
    if (isActive) {
      state.timers[battle.id] = setInterval(() => {
        const timerEl = document.getElementById(`timer-${battle.id}`);
        if (timerEl) {
          timerEl.textContent = 'Time Left: ' + calculateTimeLeft(battle.ends_at);
        } else {
          clearInterval(state.timers[battle.id]);
        }
      }, 1000);
    }
  }

  // Set up vote buttons
  function setupVoteButtons() {
    document.querySelectorAll('.vote-btn').forEach(btn => {
      btn.onclick = function() {
        const battleId = this.dataset.battle;
        const option = this.dataset.opt;
        openShareModal(battleId, option);
      };
    });
  }

  // Open share modal
  function openShareModal(battleId, option) {
    const modal = document.getElementById('shareModal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    
    const url = window.location.href;
    const title = 'FANSHARE: Vote in this battle!';
    
    // Set share links
    const fbShare = document.getElementById('facebookShare');
    const twShare = document.getElementById('twitterShare');
    const rdShare = document.getElementById('redditShare');
    
    if (fbShare) fbShare.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`;
    if (twShare) twShare.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    if (rdShare) rdShare.href = `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
    
    // Clear old event listeners
    document.querySelectorAll('#shareModal a').forEach(link => {
      const clone = link.cloneNode(true);
      if (link.parentNode) {
        link.parentNode.replaceChild(clone, link);
      }
    });
    
    // Add new event listeners
    document.querySelectorAll('#shareModal a').forEach(link => {
      link.onclick = function(event) {
        event.preventDefault();
        
        // Get battle details
        const col = option === 'votes1' ? 'votes1' : 'votes2';
        
        // Get current votes
        window.supabaseClient.from('battles')
          .select('*')
          .eq('id', battleId)
          .single()
          .then(({ data, error }) => {
            if (error) {
              alert('Error getting battle details');
              console.error('Error:', error);
              return;
            }
            
            // Update votes
            const battle = data;
            const newVotes = (battle[col] || 0) + 1;
            const updateObj = {};
            updateObj[col] = newVotes;
            
            window.supabaseClient.from('battles')
              .update(updateObj)
              .eq('id', battleId)
              .then(({ error: updateError }) => {
                if (updateError) {
                  alert('Error updating vote');
                  console.error('Update error:', updateError);
                  return;
                }
                
                // Update UI
                const votes1 = col === 'votes1' ? newVotes : battle.votes1;
                const votes2 = col === 'votes2' ? newVotes : battle.votes2;
                const progressBar = document.getElementById(`progress-${battleId}`);
                
                if (progressBar) {
                  // Prepare the bar for animation
                  progressBar.classList.add('progress-updating');
                  
                  // Update the HTML
                  progressBar.innerHTML = renderProgressBar(votes1, votes2);
                  
                  // Add animation class
                  setTimeout(() => {
                    progressBar.classList.remove('progress-updating');
                    progressBar.classList.add('progress-updated');
                    
                    // Remove animation class after animation completes
                    setTimeout(() => {
                      progressBar.classList.remove('progress-updated');
                    }, 1000);
                  }, 50);
                }
                
                // Open share window
                window.open(this.href, '_blank');
                
                // Close modal
                modal.classList.add('hidden');
              });
          });
      };
    });
  }

  // Calculate time left
  function calculateTimeLeft(endTime) {
    let diff = new Date(endTime) - new Date();
    if (diff <= 0) return '';
    
    const days = Math.floor(diff / 86400000);
    diff %= 86400000;
    const hours = Math.floor(diff / 3600000);
    diff %= 3600000;
    const minutes = Math.floor(diff / 60000);
    diff %= 60000;
    const seconds = Math.floor(diff / 1000);
    
    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (seconds) parts.push(`${seconds}s`);
    
    return parts.join(' ');
  }

  // Render progress bar
  function renderProgressBar(votes1, votes2) {
    votes1 = parseInt(votes1) || 0;
    votes2 = parseInt(votes2) || 0;
    const total = votes1 + votes2;
    
    // Calculate percentages
    let p1 = 0, p2 = 0;
    
    if (total === 0) {
      // No votes yet, show 50/50
      p1 = 50;
      p2 = 50;
    } else {
      // Calculate actual percentages
      p1 = Math.round((votes1 / total) * 100);
      p2 = 100 - p1;
    }
    
    // Ensure minimum visible width (prevent 0% from disappearing)
    const minVisibleWidth = 8; // 8% minimum to show text
    let w1 = `${p1}%`;
    let w2 = `${p2}%`;
    
    // Only apply minimum width if there are votes
    if (total > 0) {
      if (p1 === 0) w1 = `${minVisibleWidth}%`;
      if (p2 === 0) w2 = `${minVisibleWidth}%`;
      
      // Adjust the other side to maintain 100% total
      if (p1 === 0) w2 = `${100 - minVisibleWidth}%`;
      if (p2 === 0) w1 = `${100 - minVisibleWidth}%`;
    }
    
    // Show percentages only when there are votes
    const showPercent = total > 0;
    const percent1 = showPercent ? `(${p1}%)` : '';
    const percent2 = showPercent ? `(${p2}%)` : '';
    
    return `
      <div class="flex-1 rounded-l-full bg-blue-600 h-10 flex items-center px-3 text-white text-lg font-semibold transition-all duration-500 ease-in-out" style="width:${w1};">
        ${votes1} ${percent1}
      </div>
      <div class="flex-1 rounded-r-full bg-green-600 h-10 flex items-center justify-end px-3 text-white text-lg font-semibold transition-all duration-500 ease-in-out" style="width:${w2};">
        ${votes2} ${percent2}
      </div>
    `;
  }
})();
