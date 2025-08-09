(() => {
  const root = document.getElementById('nav-root');
  if (!root) return;

  root.innerHTML = `
    <nav class="topnav">
      <div class="nav-brand"><a href="../index.html">Free Calculators</a></div>
      <button class="nav-toggle" aria-label="Menu">☰</button>
      <div class="nav-links">
        <a href="../index.html">Home</a>
        <a href="./index.html">Explore</a>
        <a href="../about.html">About</a>
        <a href="../contact.html">Contact</a>
      </div>
    </nav>
  `;

  const toggle = root.querySelector('.nav-toggle');
  const links = root.querySelector('.nav-links');
  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
  });
})();
