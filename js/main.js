// ====== Parallax mouse (hero) ======
(function(){
  const hero = document.getElementById('heroBg');
  const heroWrap = document.querySelector('.hero');
  if(!hero) return;

  function onMove(e){
    const rect = heroWrap.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const tx = x * 18;
    const ty = y * 10;
    hero.style.transform = `translate(${tx}px, ${ty}px) scale(1.04)`;
  }

  function onLeave(){
    hero.style.transform = `translate(0px,0px) scale(1.02)`;
  }

  heroWrap.addEventListener('mousemove', onMove);
  heroWrap.addEventListener('mouseleave', onLeave);
})();

// ====== Intersection observer for reveal ======
(function(){
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('show');
        obs.unobserve(e.target);
      }
    })
  },{threshold:0.16});

  document.querySelectorAll('.reveal').forEach(node=>obs.observe(node));
})();

// ====== Card tilt (simple) ======
(function(){
  const cards = document.querySelectorAll('.card');
  cards.forEach(card=>{
    card.addEventListener('mousemove', (ev)=>{
      const r = card.getBoundingClientRect();
      const x = (ev.clientX - r.left)/(r.width) - 0.5;
      const y = (ev.clientY - r.top)/(r.height) - 0.5;
      const rx = -y * 6;
      const ry = x * 6;
      card.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
      card.style.boxShadow = `0 24px 60px rgba(2,6,23,0.6)`;
    });
    card.addEventListener('mouseleave', ()=>{
      card.style.transform = '';
      card.style.boxShadow = '';
    })
  })
})();

// Smooth nav tint on scroll
(function(){
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', ()=>{
    if(window.scrollY > 40){
      nav.style.backdropFilter = 'blur(6px)';
      nav.style.background = 'linear-gradient(180deg, rgba(5,5,7,0.24), rgba(5,5,7,0.12))';
    } else {
      nav.style.background = 'transparent';
      nav.style.backdropFilter = 'none';
    }
  })
})();
