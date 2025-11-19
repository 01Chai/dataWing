// js/main.js - GSAP-powered premium carousel (replacement)
// Requires GSAP v3 included in index.html

const cars = [
  { name: "Lamborghini Aventador", desc: "V12 power meets timeless design. The Aventador defines pure performance.", img: "https://images.unsplash.com/photo-1619946794135-5bc917a2772f?q=80&w=1600" },
  { name: "Lamborghini Huracán",   desc: "Compact, fierce, and precision engineered for heart-pounding control.", img: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?q=80&w=1600" },
  { name: "Lamborghini Urus",      desc: "The world’s first Super SUV — merging luxury, space, and speed.", img: "https://images.unsplash.com/photo-1610395219791-7c03d32a7ece?q=80&w=1600" },
  { name: "Lamborghini Gallardo",  desc: "A timeless classic that redefined the modern supercar era.", img: "https://images.unsplash.com/photo-1618477462327-6f909fcdf130?q=80&w=1600" },
  { name: "Lamborghini Revuelto",  desc: "A futuristic hybrid V12 redefining luxury performance.", img: "https://images.unsplash.com/photo-1705502823166-6fe39a3cff53?q=80&w=1600" }
];

const track = document.getElementById('track');
const bg = document.getElementById('bg');
const titleEl = document.getElementById('carTitle');
const descEl = document.getElementById('carDesc');
const rentBtn = document.getElementById('rentBtn');
const galleryViewport = document.querySelector('.gallery-viewport');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

const CARD_WIDTH = 160;
const GAP = 20;
const STEP = CARD_WIDTH + GAP;

let isDragging = false;
let startX = 0;
let deltaX = 0;
let autoplayTimer = null;
const AUTOPLAY_MS = 4800;
let isAnimating = false;

// GSAP eases
const EASE_MAIN = 'power3.inOut';
const EASE_SHIFT = 'expo.out';
const EASE_TEXT = 'power2.out';

// Helper: make a card element (DOM)
function makeCardEl(car) {
  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML = `<img src="${car.img}" alt="${car.name}" /><div class="label">${car.name}</div>`;
  return el;
}

// Build initial DOM (append DOM nodes in the order of cars array)
function buildInitialTrack() {
  track.innerHTML = '';
  cars.forEach(car => track.appendChild(makeCardEl(car)));
  // ensure at least 3 exist visually (you said always 3)
  updateVisuals();
  resetTrackPosition();
  updateTextToFirst();
  // set initial background image
  bg.style.backgroundImage = `url(${cars[0].img})`;
}

// Keep first card flush at left (GSAP set)
function resetTrackPosition() {
  gsap.set(track, { x: 0 });
}

// Assign small classes to first three for depth
function updateVisuals() {
  const children = Array.from(track.children);
  children.forEach(c => c.classList.remove('active','left','right'));
  if (children[0]) children[0].classList.add('left');
  if (children[1]) children[1].classList.add('active');
  if (children[2]) children[2].classList.add('right');
}

// Fade background using GSAP
function fadeToBackground(url) {
  gsap.killTweensOf(bg);
  return gsap.timeline()
    .to(bg, { opacity: 0, duration: 0.26, ease: EASE_TEXT })
    .add(() => { bg.style.backgroundImage = `url(${url})`; })
    .to(bg, { opacity: 1, duration: 0.6, ease: EASE_MAIN }, '>');
}

// Create overlay positioned over a card DOM element
function createOverlayFromCard(cardEl) {
  const img = cardEl.querySelector('img')?.src || '';
  const rect = cardEl.getBoundingClientRect();
  const overlay = document.createElement('div');
  overlay.className = 'becoming-overlay';
  overlay.style.backgroundImage = `url(${img})`;
  overlay.style.left = `${rect.left}px`;
  overlay.style.top = `${rect.top}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
  overlay.style.borderRadius = window.getComputedStyle(cardEl).borderRadius || '14px';
  document.body.appendChild(overlay);
  overlay.getBoundingClientRect(); // force layout
  return overlay;
}

// Expand overlay with GSAP; returns timeline
function expandOverlayGSAP(overlay) {
  const tl = gsap.timeline();
  document.documentElement.classList.add('body-dimming');
  tl.to(overlay, {
    left: 0, top: 0,
    width: window.innerWidth,
    height: window.innerHeight,
    borderRadius: 0,
    duration: 0.78,
    ease: EASE_MAIN
  }, 0);
  tl.add(() => document.documentElement.classList.remove('body-dimming'));
  return tl;
}

// Move first DOM child to end (keeps image loaded, avoids rebuild)
function moveFirstDomToEnd() {
  const first = track.children[0];
  if (first) track.appendChild(first);
}

// Move last DOM child to front
function moveLastDomToFront() {
  const children = Array.from(track.children);
  const last = children[children.length - 1];
  const first = children[0];
  if (last && first) track.insertBefore(last, first);
}

// NEXT action
function goNext(interactive = true) {
  if (isAnimating) return;
  isAnimating = true;
  stopAutoplay();

  const children = Array.from(track.children);
  if (children.length === 0) { isAnimating = false; return; }

  // leaving card is the leftmost visible
  const leavingCardEl = children[0];
  const overlay = createOverlayFromCard(leavingCardEl);

  // TL: slide track left while overlay expands; when complete -> rotate arrays & DOM
  const tl = gsap.timeline({
    onComplete: () => {
      // rotate cars array: first -> end
      const moved = cars.shift();
      cars.push(moved);

      // move DOM first child to end to keep images intact
      moveFirstDomToEnd();

      // reset track position instantly (no visible jump)
      resetTrackPosition();
      // refresh visuals and text/bg
      updateVisuals();
      updateTextToFirst();

      // remove overlay
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      isAnimating = false;
      if (interactive) startAutoplay();
    }
  });

  // slide track left by STEP
  tl.to(track, { x: -STEP, duration: 0.62, ease: EASE_SHIFT }, 0);

  // expand overlay concurrently
  tl.add(expandOverlayGSAP(overlay), 0);

  // update background slightly before overlay ends for smooth crossfade
  tl.add(() => {
    const src = leavingCardEl.querySelector('img')?.src;
    if (src) fadeToBackground(src);
  }, 0.48);
}

// PREV action
function goPrev(interactive = true) {
  if (isAnimating) return;
  isAnimating = true;
  stopAutoplay();

  // rotate cars array: last -> front so data matches DOM we will create/shift
  const last = cars.pop();
  cars.unshift(last);

  // move last DOM node to front so the visual order matches the data change
  moveLastDomToFront();

  // set track offset so visible window is shifted left by STEP (we'll animate to 0)
  gsap.set(track, { x: -STEP });

  const children = Array.from(track.children);
  const leavingCardEl = children[0]; // this is the card we will expand (we moved last -> front)
  const overlay = createOverlayFromCard(leavingCardEl);

  const tl = gsap.timeline({
    onComplete: () => {
      // after animation, rotate data so queue direction stays consistent: move first -> end
      const moved = cars.shift();
      cars.push(moved);

      // move DOM front to end to match final desired order
      moveFirstDomToEnd();

      // reset track position
      resetTrackPosition();

      updateVisuals();
      updateTextToFirst();

      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      isAnimating = false;
      if (interactive) startAutoplay();
    }
  });

  // animate track right to 0
  tl.to(track, { x: 0, duration: 0.62, ease: EASE_SHIFT }, 0);

  // overlay expand
  tl.add(expandOverlayGSAP(overlay), 0);

  // update background during animation
  tl.add(() => {
    const src = leavingCardEl.querySelector('img')?.src;
    if (src) fadeToBackground(src);
  }, 0.48);
}

// update text to first car in cars[]
function updateTextToFirst() {
  if (!cars[0]) return;
  gsap.killTweensOf([titleEl, descEl, rentBtn]);
  titleEl.style.opacity = 0;
  descEl.style.opacity = 0;
  rentBtn.style.opacity = 0;

  titleEl.textContent = cars[0].name;
  descEl.textContent = cars[0].desc;

  gsap.fromTo(titleEl, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: EASE_TEXT });
  gsap.fromTo(descEl, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.12, ease: EASE_TEXT });
  gsap.fromTo(rentBtn, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.22, ease: EASE_TEXT });
}

/* Pointer drag support */
function onPointerDown(e) {
  if (isAnimating) return;
  isDragging = true;
  startX = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX);
  deltaX = 0;
  gsap.killTweensOf(track);
  pauseAutoplay();
}
function onPointerMove(e) {
  if (!isDragging) return;
  const clientX = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX);
  deltaX = clientX - startX;
  // limit drag to [-STEP .. STEP]
  const x = Math.max(-STEP, Math.min(STEP, deltaX));
  gsap.set(track, { x });
}
function onPointerUp(e) {
  if (!isDragging) return;
  isDragging = false;
  if (deltaX < -60) goNext();
  else if (deltaX > 60) goPrev();
  else {
    // snap back
    gsap.to(track, { x: 0, duration: 0.36, ease: EASE_SHIFT });
    resetAutoplay();
  }
  deltaX = 0;
}

/* Autoplay */
function startAutoplay() {
  stopAutoplay();
  autoplayTimer = setInterval(() => goNext(false), AUTOPLAY_MS);
}
function stopAutoplay() { if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; } }
function pauseAutoplay() { stopAutoplay(); }
function resetAutoplay() { stopAutoplay(); startAutoplay(); }

/* INIT */
function init() {
  buildInitialTrack();

  // pointer listeners
  track.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp);

  // buttons (ensure prevBtn/nextBtn exist in HTML)
  if (prevBtn) prevBtn.addEventListener('click', () => goPrev());
  if (nextBtn) nextBtn.addEventListener('click', () => goNext());

  // keyboard
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
  });

  // hover pause
  if (galleryViewport) {
    galleryViewport.addEventListener('mouseenter', pauseAutoplay);
    galleryViewport.addEventListener('mouseleave', resetAutoplay);
  }

  // start autoplay
  startAutoplay();

  // on resize ensure overlay dimensions / track resets
  window.addEventListener('resize', () => {
    resetTrackPosition();
  });
}

init();
