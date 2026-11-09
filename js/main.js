const CLICKABLE_IMAGES = document.querySelectorAll(".left-img");

const bodyElement = document.getElementById("main-body");

const MIN_LOADING_TIME = 1000;
const loadingStartTime = Date.now();

/**
 * Collect all image URLs used in the HTML.
 * Includes normal images, replacement images, and favicon.
 */
function getAllImageUrls() {
    const urls = new Set();

    // Collect all images from HTML
    document.querySelectorAll("img").forEach((img) => {
        if (img.src) {
            urls.add(img.src);
        }

        // Collect replacement images
        if (img.dataset.hoverSrc) {
            urls.add(new URL(img.dataset.hoverSrc, document.baseURI).href);
        }
    });

    // Collect favicon
    document.querySelectorAll('link[rel~="icon"]').forEach((icon) => {
        if (icon.href) {
            urls.add(icon.href);
        }
    });

    return [...urls];
}

/**
 * Preload a single image.
 * Resolve even if an image fails to load.
 */
function preloadImage(url) {
    return new Promise((resolve) => {
        const image = new Image();

        image.onload = () => resolve({ url, loaded: true });
        image.onerror = () => resolve({ url, loaded: false });

        image.src = url;

        // Handle images already available in cache
        if (image.complete) {
            resolve({
                url,
                loaded: image.naturalWidth > 0
            });
        }
    });
}

/**
 * Preload all collected images.
 */
async function loadAllImages() {
    const imageUrls = getAllImageUrls();    
    const results = await Promise.all(
        imageUrls.map((url) => preloadImage(url))
    );

    const failedImages = results.filter((result) => !result.loaded);

    if (failedImages.length) {
        console.warn("Failed to load images:", failedImages);
    }

    return results;
}

/**
 * Hide loader after all images are loaded.
 */
async function initializePage() {
    await loadAllImages();
    // Keep loader visible for at least 1 second
    const elapsedTime = Date.now() - loadingStartTime;
    const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);

    setTimeout(() => {
        bodyElement.classList.add("loaded");
    }, remainingTime);
}

initializePage();

CLICKABLE_IMAGES.forEach((img) => {
    const newSrc = img.dataset.hoverSrc;
    if (!newSrc) return;
    // Preload replacement image
    const preload = new Image();
    preload.src = newSrc;
    img.addEventListener("click", () => {
        // Run animation only once
        if (img.dataset.clicked === "true") return;
        img.dataset.clicked = "true";
        img.classList.add("clicked");
        img.classList.add("zoom-out");
        setTimeout(() => {
            img.src = newSrc;

            img.classList.remove("zoom-out");
            img.classList.add("zoom-in");

            setTimeout(() => {
                img.classList.remove("zoom-in");
            }, 350);

        }, 350);
    });
});

