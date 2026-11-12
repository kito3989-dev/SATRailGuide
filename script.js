const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".main-nav");

menuButton?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".main-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  });
});

document.getElementById("year").textContent = new Date().getFullYear();

// Filtrage de démonstration des cartes affichées sur la page d'accueil.
const searchInput = document.getElementById("trail-search");
const difficultyFilter = document.getElementById("difficulty-filter");
const trailCards = [...document.querySelectorAll(".trail-card")];

function filterTrails() {
  const search = searchInput.value.trim().toLocaleLowerCase("fr");
  const difficulty = difficultyFilter.value;

  trailCards.forEach((card) => {
    const title = card.querySelector("h3").textContent.toLocaleLowerCase("fr");
    const cardDifficulty = card.querySelector(".difficulty").textContent.trim();
    const matchesSearch = title.includes(search);
    const matchesDifficulty = !difficulty || cardDifficulty === difficulty;
    card.hidden = !(matchesSearch && matchesDifficulty);
  });
}

searchInput.addEventListener("input", filterTrails);
difficultyFilter.addEventListener("change", filterTrails);
