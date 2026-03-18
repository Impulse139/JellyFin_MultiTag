/*
* Media Bar Integration for Quality Tags
* Adds quality badges to Media Bar slides using existing quality overlay system
[DISCLAIMER] Developed with help of Claude AI
*/

(function() {
    'use strict';
    
    console.log("Media Bar Quality Integration: Initializing...");
    
    // Configuration
    const CONFIG = {
        mediaBarContainer: '#slides-container',
        slideSelector: '.slide',
        infoContainerSelector: '.info-container',
        genreSelector: '.genre',
        retryInterval: 500,
        maxRetries: 10,
        debounceDelay: 200
    };

    // State tracking
    let processedSlides = new WeakSet();
    let debounceTimer = null;
    let isProcessing = false;
    
    // Wait for the quality overlay system to be available
    function waitForQualitySystem(callback) {
        // If already ready, fire immediately
        if (typeof window._jellyfinDetectAudioLabel === 'function') {
            callback();
            return;
        }
        const checkInterval = setInterval(() => {
            if (typeof window._jellyfinDetectAudioLabel === 'function') {
                clearInterval(checkInterval);
                clearTimeout(hardTimeout);
                callback();
            }
        }, CONFIG.retryInterval);
        
        // Hard timeout fallback — try anyway after max wait
        const hardTimeout = setTimeout(() => {
            clearInterval(checkInterval);
            callback();
        }, CONFIG.retryInterval * CONFIG.maxRetries);
    }

    // Extract item ID from Media Bar slide
    function extractItemIdFromSlide(slide) {
        const itemId = slide.getAttribute('data-item-id');
        if (itemId && /^[a-f0-9]{32}$/i.test(itemId)) {
            return itemId;
        }
        return null;
    }

    // Create quality badge element (matching existing system style)
    function createQualityBadge(text, bgColor = '#444', textColor = '#fff') {
        const badge = document.createElement('div');
        badge.textContent = text;
        badge.className = 'media-bar-quality-badge';
        badge.style.cssText = `
            background-color: ${bgColor} !important;
            color: ${textColor} !important;
            padding: 2px 6px !important;
            font-size: 11px !important;
            font-weight: bold !important;
            border-radius: 4px !important;
            display: inline-block !important;
            margin-right: 4px !important;
            margin-bottom: 2px !important;
            text-shadow: 0px 0px 2px rgba(0, 0, 0, 0.8) !important;
            text-transform: uppercase !important;
            white-space: nowrap !important;
            line-height: 1.2 !important;
            min-width: 20px !important;
            text-align: center !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
        `;
        return badge;
    }

    // Get quality badge colors — uses shared color map from main quality script for audio
    function getQualityBadgeColor(label, audioType) {
        // If audioType is provided, pull directly from the main script's color map
        if (audioType && window._jellyfinAudioColorMap && window._jellyfinAudioColorMap[audioType]) {
            return window._jellyfinAudioColorMap[audioType];
        }
        const colorMap = {
            // Resolution colors
            '8K': '#6600cc',    // Deep Purple
            '4K': '#0066cc',    // Blue
            '2K': '#00cccc',    // Cyan
            '1080p': '#009933', // Forest Green
            '720p': '#ffa500',  // Orange
            'SD': '#666666',    // Gray
            
            // HDR colors
            'HDR': '#cc0000',   // Red
            
            // DV colors are handled by startsWith check
            
            // Audio colors — matched to main quality script
            'DTS:X':       '#00bcd4', // Cyan 500 — Represents immersive audio, similar to Atmos; bright and modern
            'Dolby Atmos': '#00acc1', // Cyan 600 — Matches "ATMOS" above; used for 3D immersive sound formats
            'Dolby':       '#0097a7', // Cyan 700 — Slightly darker cyan; general Dolby branding (e.g., legacy Dolby Digital)
            'DD+ Atmos':   '#00838f', // Cyan 800 — Hybrid format (Dolby Digital Plus with Atmos); deep cyan for advanced encoding
            'DTS-HD MA':   '#00796b', // Teal 800 — High-resolution DTS format; deeper green-cyan for premium audio
            'PCM':         '#00796b',
            'LPCM':        '#00796b',
            'FLAC':        '#00796b',
            'DTS-HD HRA':  '#00695c', // Teal 900 — High-Resolution Audio variant; very dark teal, signifies lossless quality
            'DTS-HD':      '#004d40', // Green 900 — Core DTS-HD; rich green for high-definition audio
            'DD+':         '#33691e', // Dark Green — Dolby Digital Plus
            'xHE-AAC':     '#33691e',
            'HE-AACv2':    '#33691e',
            'AAC-ELD':     '#33691e',
            'DTS ES':      '#7cb342', // Light Green — Extended Surround DTS
            'DD EX':       '#e65100', // Deep Orange — Dolby Digital EX (6.1/7.1)
            'DTS':         '#ef6c00', // Orange — Standard DTS
            'DD':          '#f57c00', // Light Orange — Classic Dolby Digital (5.1)
            'OPUS':        '#f57c00',
            'AAC':         '#f57c00',
            'AAC-LC':      '#f57c00',
            'HE-AAC':      '#f57c00',
            'AAC-LD':      '#f57c00',
            'Stereo':      '#546e7a', // Blue Gray 500 — Standard stereo; neutral blue-gray for basic two-channel audio
            'Mono':        '#455a64', // Blue Gray 600 — Mono audio; slightly darker than stereo, for legacy or voice content  
            
            // Status colors
            'Ongoing': '#2e7d32', // Green
            'Ended': '#c62828'    // Red
        };
        
        if (label.startsWith('DV')) {
            return '#8000cc'; // Purple for Dolby Vision
        }
        
        // Match audio labels that may have a channel suffix (e.g. "DTS-HD MA 7.1")
        for (const key of Object.keys(colorMap)) {
            if (label === key || label.startsWith(key + ' ')) return colorMap[key];
        }
        return '#444';
    }

    // Create quality badges container
    function createQualityContainer() {
        const container = document.createElement('div');
        container.className = 'media-bar-quality-container';
        container.style.cssText = `
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 4px !important;
            margin: 0 !important;
            align-items: center !important;
            justify-content: flex-start !important;
            width: max-content !important;
            max-width: 90vw !important;
        `;
        return container;
    }

    // Local cache for media bar quality data
    const mediaBarCache = {};

    // Direct localStorage reader — works before main quality script bootstraps
    const LS_KEY = 'jellyfin_quality_cache_v1';
    function readFromLocalStorage(itemId) {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (!raw) return null;
            const store = JSON.parse(raw);
            const entry = store[itemId];
            if (!entry || !entry.data) return null;
            const cached = entry.data;
            const qualityData = {
                resolution: null, hdr: null, dolbyVision: null,
                audio: null, audioType: null, status: null
            };
            if (Array.isArray(cached.qualityParts)) {
                cached.qualityParts.forEach(part => {
                    if (['8K','4K','2K','1080p','720p','SD'].includes(part)) qualityData.resolution = part;
                    else if (part === 'HDR') qualityData.hdr = 'HDR';
                    else if (part.startsWith('DV')) qualityData.dolbyVision = part;
                });
            }
            if (cached.audio) {
                qualityData.audio = cached.audio.text;
                qualityData.audioType = cached.audio.type;
            }
            if (cached.seriesEnded === true) qualityData.status = 'Ended';
            else if (cached.seriesContinuing === true) qualityData.status = 'Ongoing';
            return qualityData;
        } catch { return null; }
    }

    // Fetch quality data for an item (reusing existing system logic)
    async function fetchQualityData(itemId) {
        // Check local cache first
        if (mediaBarCache[itemId]) return mediaBarCache[itemId];

        
        // Check localStorage directly (works even before main script bootstraps)
        const lsCached = readFromLocalStorage(itemId);
        if (lsCached) {
            mediaBarCache[itemId] = lsCached;
            return lsCached;
        }

        // Check if the main quality script already has this item cached
        if (window._jellyfinOverlayCache && window._jellyfinOverlayCache[itemId]) {
            const cached = window._jellyfinOverlayCache[itemId];
            const qualityData = {
                resolution: null,
                hdr: null,
                dolbyVision: null,
                audio: null,
                audioType: null,
                status: null
            };

            // Map from main cache format to media bar format
            if (Array.isArray(cached.qualityParts)) {
                cached.qualityParts.forEach(part => {
                    if (['8K','4K','2K','1080p','720p','SD'].includes(part)) {
                        qualityData.resolution = part;
                    } else if (part === 'HDR') {
                        qualityData.hdr = 'HDR';
                    } else if (part.startsWith('DV')) {
                        qualityData.dolbyVision = part;
                    }
                });
            }
            if (cached.audio) {
                qualityData.audio = cached.audio.text;
                qualityData.audioType = cached.audio.type;
            }
            if (cached.seriesEnded === true) qualityData.status = 'Ended';
            else if (cached.seriesContinuing === true) qualityData.status = 'Ongoing';

            mediaBarCache[itemId] = qualityData;
            return qualityData;
        }

        try {
            if (!window.ApiClient) {
                console.warn('ApiClient not available');
                return null;
            }

            const userId = window.ApiClient.getCurrentUserId();
            if (!userId) {
                console.warn('User ID not available');
                return null;
            }

            const item = await window.ApiClient.getItem(userId, itemId);
            if (!item) return null;

            const qualityData = {
                resolution: null,
                hdr: null,
                dolbyVision: null,
                audio: null,
                status: null
            };

            let mediaSource = null;

            // Handle different item types
            if (item.Type === 'Series' || item.Type === 'Season') {
                // For series/seasons, get first episode
                try {
                    const episodeResp = await window.ApiClient.ajax({
                        type: 'GET',
                        url: window.ApiClient.getUrl('/Items', {
                            ParentId: itemId,
                            IncludeItemTypes: 'Episode',
                            Recursive: true,
                            SortBy: 'ParentIndexNumber,IndexNumber',
                            SortOrder: 'Ascending',
                            ParentIndexNumber: 1,
                            Limit: 1,
                            userId: userId
                        }),
                        dataType: 'json'
                    });
                    
                    if (episodeResp.Items && episodeResp.Items.length > 0) {
                        const episode = await window.ApiClient.getItem(userId, episodeResp.Items[0].Id);
                        mediaSource = episode.MediaSources?.[0];
                    }
                } catch (e) {
                    console.warn('Could not fetch episode data:', e);
                }
            } else {
                mediaSource = item.MediaSources?.[0];
            }

            // Extract quality info if we have media source
            if (mediaSource && mediaSource.MediaStreams) {
                const videoStream = mediaSource.MediaStreams.find(s => s.Type === 'Video');
                const audioStreams = mediaSource.MediaStreams.filter(s => s.Type === 'Audio') || [];

                if (videoStream && videoStream.Height) {
                    // Resolution
                    const height = videoStream.Height;
                    if (height > 2160) qualityData.resolution = '8K';
                    else if (height <= 2160 && height > 1440) qualityData.resolution = '4K';
                    else if (height <= 1440 && height > 1080) qualityData.resolution = '2K';
                    else if (height <= 1080 && height > 720) qualityData.resolution = '1080p';
                    else if (height <= 720 && height > 480) qualityData.resolution = '720p';
                    else qualityData.resolution = 'SD';

                    // HDR/DV detection
                    const range = (videoStream.VideoRange || videoStream.VideoRangeType || '').toLowerCase();
                    const hdrFormat = (videoStream.HDRFormat || '').toLowerCase();
                    
                    const hasHDR = /hdr|hlg|pq/.test(range) || /hdr|hlg|pq/.test(hdrFormat);
                    const hasDV = /(dolby.?vision|dovi)/.test(range) || /(dolby.?vision|dovi)/.test(hdrFormat) ||
                                  videoStream.DvProfile != null || videoStream.DVProfile != null || videoStream.dvProfile != null;

                    if (hasDV) {
                        // Try to get DV profile
                        const profile = videoStream.DvProfile ?? videoStream.DVProfile ?? videoStream.dvProfile;
                        const blId = videoStream.DvBlSignalCompatibilityId ?? videoStream.DVBlSignalCompatibilityId ?? videoStream.dvBlSignalCompatibilityId;
                        
                        if (profile != null) {
                            let p = Number(profile);
                            if (!Number.isFinite(p)) {
                                const m = String(profile).match(/(\d+)/);
                                p = m ? Number(m[1]) : NaN;
                            }
                            if (Number.isFinite(p)) {
                                if (p === 8 && blId != null && String(blId).trim() !== '') {
                                    qualityData.dolbyVision = `DV P8.${blId}`;
                                } else {
                                    qualityData.dolbyVision = `DV P${p}`;
                                }
                            } else {
                                qualityData.dolbyVision = 'DV';
                            }
                        } else {
                            qualityData.dolbyVision = 'DV';
                        }
                    } if (hasHDR) {
                        qualityData.hdr = 'HDR';
                    }
                }

                // Audio detection
                if (audioStreams.length > 0) {
                    const audioResult = window._jellyfinDetectAudioLabel
                        ? window._jellyfinDetectAudioLabel(audioStreams)
                        : null;
                    if (audioResult && audioResult.text) {
                        qualityData.audio = audioResult.text;
                        qualityData.audioType = audioResult.type;
                    }
                }
            }

            // Series status (Ongoing/Ended) - only for Series type
            if (item.Type === 'Series') {
                // This would require TMDb integration like in the main quality script
                // For now, we'll skip this to keep it simple
            }

            mediaBarCache[itemId] = qualityData;
            return qualityData;

        } catch (error) {
            console.error('Error fetching quality data:', error);
            return null;
        }
    }

    // Process a single slide to add quality badges
    async function processSlide(slide) {
        if (processedSlides.has(slide)) {
            return;
        }

        // Also guard against duplicate DOM injection (e.g. after navigation reset)
        if (slide.querySelector('.media-bar-quality-container')) {
            processedSlides.add(slide); // Re-register so it won't be processed again
            return;
        }

        // Mark immediately (before async work) to block race condition
        processedSlides.add(slide);

        const itemId = extractItemIdFromSlide(slide);
        if (!itemId) {
            return;
        }

        try {
            const qualityData = await fetchQualityData(itemId);
            if (!qualityData) {
                return;
            }

            // Find the info container (where rating info is)
            const infoContainer = slide.querySelector(CONFIG.infoContainerSelector);
            if (!infoContainer) {
                return;
            }

            // Create quality container
            const qualityContainer = createQualityContainer();

            // Add quality badges
            const badges = [];
            
            if (qualityData.resolution) {
                badges.push(createQualityBadge(
                    qualityData.resolution, 
                    getQualityBadgeColor(qualityData.resolution)
                ));
            }

            if (qualityData.hdr) {
                badges.push(createQualityBadge(
                    qualityData.hdr, 
                    getQualityBadgeColor(qualityData.hdr)
                ));
            }

            if (qualityData.dolbyVision) {
                badges.push(createQualityBadge(
                    qualityData.dolbyVision, 
                    getQualityBadgeColor(qualityData.dolbyVision)
                ));
            }

            if (qualityData.audio) {
                badges.push(createQualityBadge(
                    qualityData.audio, 
                    getQualityBadgeColor(qualityData.audio, qualityData.audioType)
                ));
            }

            if (qualityData.status) {
                badges.push(createQualityBadge(
                    qualityData.status, 
                    getQualityBadgeColor(qualityData.status)
                ));
            }

            // Add badges to container
            badges.forEach(badge => qualityContainer.appendChild(badge));

            if (badges.length > 0) {
                // Insert as sibling directly before the ratings info line
                if (infoContainer && infoContainer.parentNode) {
                    infoContainer.parentNode.insertBefore(qualityContainer, infoContainer);
                } else {
                    console.warn('Could not find info-container for quality badges');
                    return;
                }

                qualityContainer.style.position = 'absolute';
                qualityContainer.style.zIndex = '5';

                // Measure actual rendered positions so bottom stays anchored to the
                // ratings line at any zoom level — recalculates on browser resize/zoom too
                const updatePosition = () => {
                    const slideRect = slide.getBoundingClientRect();
                    const infoRect  = infoContainer.getBoundingClientRect();
                    if (slideRect.height === 0 || infoRect.height === 0) return;

                    const isPortrait = window.matchMedia('(orientation: portrait) and (max-width: 768px)').matches;

                    if (isPortrait) {
                        // Portrait: anchor above the play button row
                        const buttonContainer = slide.querySelector('.button-container');
                        const anchorRect = buttonContainer.getBoundingClientRect();
                        const fromBottom = (slideRect.bottom - anchorRect.top) + 6;
                        qualityContainer.style.bottom    = fromBottom + 'px';
                        qualityContainer.style.left      = '50%';
                        qualityContainer.style.transform = 'translateX(-50%)';
                    } else {
                        // Landscape/desktop: anchor above the ratings line
                        const fromBottom = (slideRect.bottom - infoRect.top) + 1;
                        qualityContainer.style.bottom    = fromBottom + 'px';
                        qualityContainer.style.left      = '4vw';
                        qualityContainer.style.transform = 'none';
                    }
                };

                requestAnimationFrame(updatePosition);
                window.addEventListener('resize', updatePosition);
            }
            
            console.log(`Media Bar Quality: Added badges to slide ${itemId}`);

        } catch (error) {
            console.error('Error processing slide:', error);
        }
    }

    // Debounced processing function
    function debouncedProcessSlides() {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        
        debounceTimer = setTimeout(async () => {
            if (isProcessing) return;
            isProcessing = true;

            try {
                const mediaBarContainer = document.querySelector(CONFIG.mediaBarContainer);
                if (!mediaBarContainer) {
                    return;
                }

                const slides = mediaBarContainer.querySelectorAll(CONFIG.slideSelector);
                
                for (const slide of slides) {
                    await processSlide(slide);
                }
            } catch (error) {
                console.error('Error processing slides:', error);
            } finally {
                isProcessing = false;
            }
        }, CONFIG.debounceDelay);
    }

    // Set up mutation observer for Media Bar changes
    function setupMediaBarObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldProcess = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if Media Bar container was added
                            if (node.matches && node.matches(CONFIG.mediaBarContainer)) {
                                shouldProcess = true;
                            }
                            // Check if slides were added
                            else if (node.matches && node.matches(CONFIG.slideSelector)) {
                                shouldProcess = true;
                            }
                            // Check if slides were added to existing container
                            else if (node.querySelector && node.querySelector(CONFIG.slideSelector)) {
                                shouldProcess = true;
                            }
                        }
                    });
                }
            });

            if (shouldProcess) {
                console.log('Media Bar Quality: Detected Media Bar changes, processing...');
                debouncedProcessSlides();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('Media Bar Quality: Observer set up');
        return observer;
    }

    // Periodic check for new slides (backup)
    function setupPeriodicCheck() {
        setInterval(() => {
            const mediaBarContainer = document.querySelector(CONFIG.mediaBarContainer);
            if (mediaBarContainer) {
                const unprocessedSlides = Array.from(mediaBarContainer.querySelectorAll(CONFIG.slideSelector))
                    .filter(slide => !processedSlides.has(slide));
                
                if (unprocessedSlides.length > 0) {
                    console.log(`Media Bar Quality: Found ${unprocessedSlides.length} unprocessed slides`);
                    debouncedProcessSlides();
                }
            }
        }, 3000);
    }

    // Initialize the integration
    function initialize() {
        console.log('Media Bar Quality Integration: Starting initialization...');

        // Set up observers immediately — don't wait for quality system
        setupMediaBarObserver();
        setupPeriodicCheck();

        // Process slides immediately — localStorage hits render without needing quality system
        debouncedProcessSlides();

        // Also wait for quality system in background for API fallback capability
        waitForQualitySystem(() => {
            console.log('Media Bar Quality Integration: Quality system ready, re-scanning for any misses...');
            debouncedProcessSlides();
        });
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    // Handle navigation changes
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            // Remove all injected badge containers from DOM before resetting
            document.querySelectorAll('.media-bar-quality-container').forEach(el => el.remove());
            processedSlides = new WeakSet();
            setTimeout(debouncedProcessSlides, 200);
        }
    }).observe(document, { subtree: true, childList: true });

})();
