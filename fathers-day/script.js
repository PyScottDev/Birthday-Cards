// Offline fallback dad jokes in case the API is down or there is no network connection
const FALLBACK_JOKES = [
    "Why do dads take an extra pair of socks when they go golfing? In case they get a hole in one.",
    "What do you call a factory that makes okay products? A satisfactory.",
    "I'm reading a book on anti-gravity. I just can't put it down.",
    "Why did the scarecrow win an award? Because he was outstanding in his field.",
    "What did the ocean say to the beach? Nothing, it just waved.",
    "How do you make a tissue dance? You put a little boogie in it.",
    "Why don't skeletons fight each other? They don't have the guts.",
    "What do you call a fake noodle? An impasta.",
    "How does a penguin build its house? Igloos it together.",
    "I told my doctor that I broke my arm in two places. He told me to stop going to those places.",
    "What did the zero say to the eight? Nice belt!",
    "Why do melons have weddings? Because they cantaloupe.",
    "What do you call a sleeping bull? A bulldozer."
];

const TOTAL_IMAGES = 20;
let currentImageIndex = 0;

// Cache DOM elements
const dadPhoto = document.getElementById('dad-photo');
const jokeText = document.getElementById('joke-text');
const nextBtn = document.getElementById('next-btn');
const imageTrigger = document.getElementById('image-trigger');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeLightboxBtn = document.getElementById('close-lightbox');

/**
 * Gets the next image index in sequence:
 * dad-1.jpg → dad-2.jpg → ... → dad-8.jpg → dad-1.jpg
 */
function getNextImageIndex() {
    currentImageIndex += 1;

    if (currentImageIndex > TOTAL_IMAGES) {
        currentImageIndex = 1;
    }

    return currentImageIndex;
}

/**
 * Fetches a dad joke from the icanhazdadjoke API.
 * Uses HTTP GET with proper headers.
 * Returns a fallback joke on failure.
 */
async function fetchJoke() {
    try {
        const response = await fetch('https://icanhazdadjoke.com/', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP Error Status: ${response.status}`);
        }
        const data = await response.json();
        if (data && data.joke) {
            return data.joke;
        }
        throw new Error('Invalid API response format');
    } catch (error) {
        // Clear console.error logging for API failures only
        console.error('API fetch failed:', error);
        
        // Grab a random offline fallback joke
        const randomIndex = Math.floor(Math.random() * FALLBACK_JOKES.length);
        return FALLBACK_JOKES[randomIndex];
    }
}

/**
 * Loads new card content by preloading the next image and fetching a joke.
 * Transitions them smoothly together using opacity fades to prevent screen flashing.
 */
async function loadNewCardContent() {
    // Disable button to prevent multi-clicks
    nextBtn.disabled = true;
    const originalBtnText = nextBtn.textContent;
    nextBtn.textContent = 'Asking Dad...';
    
    let joke = '';
    const nextImgIndex = getNextImageIndex();
    const newImgSrc = `images/dad-${nextImgIndex}.jpg`;
    
    try {
        // Start joke fetch and image preload in parallel
        const jokePromise = fetchJoke();
        
        // Preload the image inside a Promise to avoid unstyled image rendering
        const imagePreloadPromise = new Promise((resolve) => {
            const img = new Image();
            img.src = newImgSrc;
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
        });
        
        // Await both promises concurrently
        const [fetchedJoke, imgLoaded] = await Promise.all([jokePromise, imagePreloadPromise]);
        joke = fetchedJoke;
    } catch (error) {
        console.error('Error in card update process:', error);
        // Fallback joke in case of unhandled errors
        const randomIndex = Math.floor(Math.random() * FALLBACK_JOKES.length);
        joke = FALLBACK_JOKES[randomIndex];
    } finally {
        // Fade out existing content
        jokeText.style.opacity = '0';
        dadPhoto.style.opacity = '0';
        
        // Wait for fade-out transition duration (250ms) to update sources
        setTimeout(() => {
            dadPhoto.src = newImgSrc;
            dadPhoto.alt = `Dad photo number ${nextImgIndex}`;
            jokeText.textContent = joke;
            
            // Fade content back in
            dadPhoto.style.opacity = '1';
            jokeText.style.opacity = '1';
            
            // Re-enable button after fade-in is fully finished
            setTimeout(() => {
                nextBtn.textContent = originalBtnText;
                nextBtn.disabled = false;
            }, 250);
        }, 250);
    }
}

/**
 * Opens the fullscreen image lightbox.
 * Syncs the source/alt text and triggers the HTML5 showModal.
 */
function openLightbox() {
    lightboxImg.src = dadPhoto.src;
    lightboxImg.alt = dadPhoto.alt;
    lightbox.showModal();
}

/**
 * Closes the lightbox and returns focus to the triggering element.
 */
function closeLightbox() {
    lightbox.close();
    // Return keyboard focus to the triggering image wrapper
    imageTrigger.focus();
}

// Lightbox Action Listeners
if (imageTrigger) {
    imageTrigger.addEventListener('click', openLightbox);
    imageTrigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openLightbox();
        }
    });
}

if (closeLightboxBtn) {
    closeLightboxBtn.addEventListener('click', closeLightbox);
}

// Close lightbox on backdrop clicks (clicking outside the portrait image container)
if (lightbox) {
    lightbox.addEventListener('click', (e) => {
        // If the click target is the dialog backdrop itself
        if (e.target === lightbox) {
            closeLightbox();
            return;
        }
        
        // Calculate click coordinates relative to the image container box
        const rect = lightboxImg.getBoundingClientRect();
        const isInsideImage = (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
        );
        
        // If they clicked the close button, it is handled separately.
        // If they clicked anywhere else outside the image boundaries, close the overlay.
        if (!isInsideImage && e.target !== closeLightboxBtn) {
            closeLightbox();
        }
    });
}

// Button click listener
if (nextBtn) {
    nextBtn.addEventListener('click', loadNewCardContent);
}

/**
 * Initialize application state on page load.
 */
async function init() {
    // Select initial image
    const initialIndex = getNextImageIndex();
    dadPhoto.src = `images/dad-${initialIndex}.jpg`;
    dadPhoto.alt = `Dad photo number ${initialIndex}`;
    
    // Fetch and display initial joke
    nextBtn.disabled = true;
    try {
        const initialJoke = await fetchJoke();
        jokeText.textContent = initialJoke;
    } catch (error) {
        console.error('Error fetching initial joke in init:', error);
        const randomIndex = Math.floor(Math.random() * FALLBACK_JOKES.length);
        jokeText.textContent = FALLBACK_JOKES[randomIndex];
    } finally {
        // Fade in
        dadPhoto.style.opacity = '1';
        jokeText.style.opacity = '1';
        nextBtn.disabled = false;
    }
}

// Run initializer
window.addEventListener('DOMContentLoaded', init);
