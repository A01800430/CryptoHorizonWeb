let lastScroll = 0;
const nav = document.querySelector('.menu-container');
const scrollUpBtn = document.getElementById('scrollUpBtn');

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;

  // Oculta la navbar al bajar, muestra al subir
  if (currentScroll > lastScroll && currentScroll > 100) {
    nav.classList.add('hide');
  } else {
    nav.classList.remove('hide');
  }
  lastScroll = currentScroll;

  // Muestra el botón de subir
  if (currentScroll > 300) {
    scrollUpBtn.classList.add('show');
  } else {
    scrollUpBtn.classList.remove('show');
  }
});

scrollUpBtn?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
