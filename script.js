/**
 * "Me" Portfolio Scripts
 * Contains shared logic for DOM manipulation and animations.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Select ALL slider containers to fix looping on every section
    const sliderContainers = document.querySelectorAll(".slider__container");

    sliderContainers.forEach((container, index) => {
        const track = container.querySelector(".slider__track");
        if (track) {
            // Clone the slider track multiple times to create a seamless infinite scrolling effect
            // We use 4 clones to ensure even on ultrawide screens it never runs out of content
            const clones = [
                track.cloneNode(true),
                track.cloneNode(true),
                track.cloneNode(true),
                track.cloneNode(true)
            ];

            // Alternate the animation direction for every second section
            if (index % 2 === 0) {
                track.classList.add('slider__track--reverse');
                clones.forEach(clone => clone.classList.add('slider__track--reverse'));
            }

            // Append the cloned nodes to ensure continuous ticker animation
            clones.forEach(clone => container.appendChild(clone));
        }
    });

    // Cyber Hero Marquee
    const cyberMarquee = document.getElementById('cyber-marquee');

    if (cyberMarquee) {
        const clone1 = cyberMarquee.innerHTML;
        cyberMarquee.innerHTML += clone1 + clone1 + clone1;

        // Dynamically calculate the animation duration to maintain a constant scroll speed
        // regardless of how many elements are added or deleted in the future.
        const distance = cyberMarquee.scrollWidth / 2; // Distance translated is 50% of the total duplicated width
        const pixelsPerSecond = 75; // Increased speed (pixels per second)
        const duration = distance > 0 ? (distance / pixelsPerSecond) * 1000 : 25000;

        cyberMarquee.animate(
            [
                { transform: 'translateX(0)' },
                { transform: 'translateX(-50%)' }
            ],
            {
                duration: duration,
                iterations: Infinity,
                easing: 'linear'
            }
        );
    }

    // Mobile Project Scroll Observer
    const viewAllBtn = document.getElementById('mobile-view-all');
    const projectCards = document.querySelectorAll('.project-card');

    if (viewAllBtn && projectCards.length >= 4) {
        const fourthCard = projectCards[3]; // 0-indexed, so 3 is the 4th card

        const observer = new IntersectionObserver((entries) => {
            if (window.innerWidth <= 1000) {
                if (entries[0].isIntersecting) {
                    // Reached the 4th card
                    viewAllBtn.innerHTML = '<span>#</span>View all&lt;<span>~</span>&gt;';
                } else {
                    // Not at the end, prompt to swipe
                    viewAllBtn.innerHTML = '<span>#</span>View all<span>~</span>&gt;';
                }
            }
        }, {
            threshold: 0.5 // Trigger when 50% of the 4th card is visible
        });

        observer.observe(fourthCard);

        // Handle window resize to reset text if moving from mobile to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1000) {
                viewAllBtn.innerHTML = '<span>#</span>View all&lt;<span>~</span>&gt;';
            }
        });

        // Trigger initial check in case page loads on mobile size
        if (window.innerWidth <= 1000 && !fourthCard.getBoundingClientRect().width) {
            // Fallback if not intersecting on load
            viewAllBtn.innerHTML = '<span>#</span>View all<span>~</span>&gt;';
        }
    }

    // Education Map Hover Logic with Leaflet
    const eduCards = document.querySelectorAll('.education-module__card');
    const mapContainer = document.getElementById('edu-map');

    if (eduCards.length > 0 && mapContainer && typeof L !== 'undefined') {
        // Initialize Leaflet map on the first card's coordinates
        const initLat = parseFloat(eduCards[0].getAttribute('data-lat'));
        const initLng = parseFloat(eduCards[0].getAttribute('data-lng'));

        const map = L.map('edu-map', {
            zoomControl: false,
            scrollWheelZoom: false,
            attributionControl: false
        }).setView([initLat, initLng], 18);

        // Use Google Maps Satellite Imagery
        L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            attribution: '&copy; Google Maps'
        }).addTo(map);

        const googleIcon = L.icon({
            iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        });

        let currentMarker = L.marker([initLat, initLng], { icon: googleIcon }).addTo(map);
        // Make the initial marker clickable
        currentMarker.on('click', () => {
            window.open(`https://www.google.com/maps/search/?api=1&query=${initLat},${initLng}`, '_blank');
        });

        const updateMapLocation = (card) => {
            const lat = parseFloat(card.getAttribute('data-lat'));
            const lng = parseFloat(card.getAttribute('data-lng'));

            if (!isNaN(lat) && !isNaN(lng)) {
                // Smooth fly animation to new coordinates
                map.flyTo([lat, lng], 18, {
                    animate: true,
                    duration: 2.5 // Increased from 0.5 to allow map tiles to load without showing a black screen
                });

                if (currentMarker) {
                    map.removeLayer(currentMarker);
                }
                currentMarker = L.marker([lat, lng], { icon: googleIcon }).addTo(map);

                // Make the new marker clickable
                currentMarker.on('click', () => {
                    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
                });
            }
        };

        // Desktop Hover Logic & Mobile Tap/Click Logic
        eduCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                if (window.innerWidth > 1000) {
                    updateMapLocation(card);
                }
            });
            // Allow users to tap the card on mobile to snap the map back 
            // if they accidentally scrolled or panned the map away.
            card.addEventListener('click', () => {
                if (window.innerWidth <= 1000) {
                    updateMapLocation(card);
                }
            });
        });

        // Mobile Horizontal Scroll Sync Logic
        const observerOptions = {
            root: document.querySelector('.education__cards-container'),
            threshold: 0.6 // Trigger when card is 60% visible
        };

        const cardObserver = new IntersectionObserver((entries) => {
            if (window.innerWidth <= 1000) {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        updateMapLocation(entry.target);
                    }
                });
            }
        }, observerOptions);

        eduCards.forEach(card => cardObserver.observe(card));

        // Active card highlight: yellow border on the currently snapped card
        const highlightActiveCard = () => {
            if (window.innerWidth <= 1000) {
                const container = document.querySelector('.education__cards-container');
                if (!container) return;
                eduCards.forEach(card => card.classList.remove('active'));
                // Find which card is most centered in the scroll container
                let closest = null;
                let closestDist = Infinity;
                const containerCenter = container.scrollLeft + container.offsetWidth / 2;
                eduCards.forEach(card => {
                    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
                    const dist = Math.abs(cardCenter - containerCenter);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closest = card;
                    }
                });
                if (closest) closest.classList.add('active');
            }
        };

        const eduContainer = document.querySelector('.education__cards-container');
        if (eduContainer) {
            // Set first card active on load
            if (eduCards[0]) eduCards[0].classList.add('active');
            eduContainer.addEventListener('scroll', highlightActiveCard, { passive: true });
            window.addEventListener('resize', highlightActiveCard);
        }
    }

    // Navigation More Popup Toggle
    const moreBtn = document.getElementById('more-btn');
    const morePopup = document.getElementById('more-popup');

    if (moreBtn && morePopup) {
        let hideTimeout;

        const openPopup = () => {
            clearTimeout(hideTimeout);
            morePopup.classList.add('active');
        };

        const closePopup = () => {
            hideTimeout = setTimeout(() => {
                morePopup.classList.remove('active');
            }, 300); // 300ms delay to allow cursor to smoothly enter the popup
        };

        // Hover events
        moreBtn.addEventListener('mouseenter', openPopup);
        moreBtn.addEventListener('mouseleave', closePopup);
        morePopup.addEventListener('mouseenter', openPopup);
        morePopup.addEventListener('mouseleave', closePopup);

        // Click events
        moreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            morePopup.classList.toggle('active');
        });

        // Close popup when clicking outside
        document.addEventListener('click', (e) => {
            if (!moreBtn.contains(e.target) && !morePopup.contains(e.target)) {
                morePopup.classList.remove('active');
            }
        });

        // Close popup when a link inside it is clicked
        const moreLinks = morePopup.querySelectorAll('.more-link');
        moreLinks.forEach(link => {
            link.addEventListener('click', () => {
                morePopup.classList.remove('active');
            });
        });
    }
});

// 2026-05-03: feat: animate horizontal ticker with constant speed math

// 2026-05-06: feat: add custom map markers on hovered locations

// 2026-05-09: feat: build mobile snap intersection observer triggers

// 2026-05-12: style: define wrapping grid layout for project list grid

// 2026-05-15: feat: convert project page cards to standard homepage card style

// 2026-05-18: feat: map bootstrap badges on netflix clone card sidebar

// 2026-05-21: feat: configure tech logos loop for edcare tutorial card

// 2026-05-24: feat: add vayu setu card inside projects page

// 2026-05-27: docs: document javascript map logic inside README.md
