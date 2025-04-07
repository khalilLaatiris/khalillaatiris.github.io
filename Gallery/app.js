// Generate dynamic image containers
const gallery = document.querySelector('.gallery-container');
// Image processing configuration
const IMAGE_DIR = './img/';
const VALID_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif']);

// Fetch and process images
(async function initGallery() {
    try {
        // 1. Fetch image list from server
        const response = await fetch(`${IMAGE_DIR}list.json`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        // 2. Process image list
        const imageList = await response.json();
        const processedImages = await Promise.allSettled(
            imageList.map(async (filename) => {
                const imgUrl = `${IMAGE_DIR}${filename}`;
                const imgMeta = await validateImage(imgUrl);
                return { ...imgMeta, filename };
            })
        );

        // 3. Handle results and create gallery items
        processedImages.forEach((result) => {
            if (result.status === 'fulfilled') {
                createImageElement(result.value);
            } else {
                console.error('Image failed validation:', result.reason);
            }
        });
    } catch (error) {
        console.error('Gallery initialization failed:', error);
        displayErrorToUser();
    }
})();

async function validateImage(url) {
    // Check image accessibility and metadata
    const headResponse = await fetch(url, { method: 'HEAD' });
    if (!headResponse.ok) throw new Error('Invalid image URL');
    
    const mimeType = headResponse.headers.get('Content-Type');
    if (!VALID_MIME_TYPES.has(mimeType)) throw new Error('Unsupported image format');
    
    const size = headResponse.headers.get('Content-Length');
    return { url, mimeType, size };
}

function createImageElement(meta) {
    const container = document.createElement('div');
    container.className = 'image-container';
    container.dataset.meta = JSON.stringify({
        filename: meta.filename,
        size: meta.size,
        type: meta.mimeType
    });

    const img = new Image();
    img.loading = 'lazy';
    img.alt = `Landscape ${meta.filename}`;
    img.src = meta.url;
    
    container.appendChild(img);
    gallery.appendChild(container);
}

function displayErrorToUser() {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = 'Failed to load gallery. Please try again later.';
    gallery.appendChild(errorDiv);
}

// Modal functionality
const modalOverlay = document.querySelector('.modal-overlay');
const modalImage = document.querySelector('.modal-image');
const closeBtn = document.querySelector('.close-btn');

function openModal(imgSrc) {
    document.body.classList.add('modal-open');
    modalImage.src = imgSrc;
    modalOverlay.classList.add('active');
}

function closeModal() {
    document.body.classList.remove('modal-open');
    modalOverlay.classList.remove('active');
}

// Event listeners
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay || e.target.classList.contains('close-btn')) {
        closeModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        closeModal();
    }
});

// Delegate click events for dynamic images
document.querySelector('.gallery-container').addEventListener('click', (e) => {
    const imageContainer = e.target.closest('.image-container');
    if (imageContainer) {
        const imgSrc = imageContainer.querySelector('img').src;
        openModal(imgSrc);
    }
});
