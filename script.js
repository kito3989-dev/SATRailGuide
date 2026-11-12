// ==========================================
// CONFIGURATION SUPABASE
// ==========================================

const SUPABASE_URL = "https://wzslryhfcnzndloifktr.supabase.co";
const SUPABASE_KEY = "sb_publishable_D45QMOrA08ZhofJDwxeOYw_Hk15lYxM";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ==========================================
// MENU DE NAVIGATION
// ==========================================

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

// ==========================================
// ANNÉE AUTOMATIQUE
// ==========================================

document.getElementById("year").textContent = new Date().getFullYear();

// ==========================================
// RANDONNÉES
// ==========================================

const searchInput = document.getElementById("trail-search");
const difficultyFilter = document.getElementById("difficulty-filter");
const trailGrid = document.getElementById("trail-grid");

let trails = [];

async function loadTrails() {
  const { data, error } = await supabaseClient
    .from("trails")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur lors du chargement des randonnées :", error);
    return;
  }

  trails = data || [];
  displayTrails();
}

function displayTrails() {
  const search = searchInput.value.trim().toLocaleLowerCase("fr");
  const difficulty = difficultyFilter.value;

  const filteredTrails = trails.filter((trail) => {
    const matchesSearch =
      trail.name.toLocaleLowerCase("fr").includes(search) ||
      (trail.location || "").toLocaleLowerCase("fr").includes(search);

    const matchesDifficulty =
      !difficulty || trail.difficulty === difficulty;

    return matchesSearch && matchesDifficulty;
  });

  if (filteredTrails.length === 0) {
    trailGrid.innerHTML = `
      <p class="demo-note">
        Aucune randonnée publiée pour le moment.
        Revenez bientôt !
      </p>
    `;
    return;
  }

  trailGrid.innerHTML = filteredTrails.map((trail) => {
    const hours = Math.floor((trail.duration_minutes || 0) / 60);
    const minutes = (trail.duration_minutes || 0) % 60;

    const duration = hours > 0
      ? `${hours} h ${minutes > 0 ? minutes + " min" : ""}`
      : `${minutes} min`;

    const difficultyClass = {
      "Facile": "easy",
      "Modérée": "medium",
      "Difficile": "hard",
      "Expert": "hard"
    }[trail.difficulty] || "";

    const image = trail.image_url
      ? `<img src="${escapeHTML(trail.image_url)}" alt="${escapeHTML(trail.name)}" style="width:100%;height:100%;object-fit:cover;">`
      : "";

    return `
      <article class="trail-card">
        <div class="trail-image">
          ${image}
          <span class="difficulty ${difficultyClass}">
            ${escapeHTML(trail.difficulty || "Non précisée")}
          </span>
        </div>
        <div class="trail-info">
          <p class="trail-location">
            ${escapeHTML(trail.location || "San Andreas")}
          </p>
          <h3>${escapeHTML(trail.name)}</h3>
          <p>${escapeHTML(trail.description || "")}</p>
          <div class="trail-meta">
            <span>↔ ${trail.distance_km ?? "—"} km</span>
            <span>◷ ${duration}</span>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

// ==========================================
// ÉVÉNEMENTS
// ==========================================

async function loadEvents() {
  const eventContainer = document.querySelector(".event-placeholder");

  const { data, error } = await supabaseClient
    .from("events")
    .select("*")
    .eq("published", true)
    .order("event_date", { ascending: true });

  if (error) {
    console.error("Erreur lors du chargement des événements :", error);
    return;
  }

  if (!data || data.length === 0) {
    eventContainer.innerHTML = `
      <div class="event-date">
        <span>BIENTÔT</span>
        <strong>+</strong>
      </div>
      <div>
        <h3>De nouvelles sorties se préparent</h3>
        <p>
          Les prochaines randonnées collectives et activités guidées
          seront annoncées ici.
        </p>
      </div>
    `;
    return;
  }

  eventContainer.innerHTML = data.map((event) => {
    const date = event.event_date
      ? new Date(event.event_date).toLocaleDateString("fr-CA", {
          day: "2-digit",
          month: "short"
        })
      : "À venir";

    return `
      <div class="event-date">
        <span>${escapeHTML(date)}</span>
        <strong>+</strong>
      </div>
      <div>
        <h3>${escapeHTML(event.title)}</h3>
        <p>${escapeHTML(event.description || "")}</p>
        <p>${escapeHTML(event.location || "")}</p>
      </div>
    `;
  }).join("");
}

// ==========================================
// PROTECTION DU TEXTE AFFICHÉ
// ==========================================

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

// ==========================================
// RECHERCHE ET FILTRES
// ==========================================

searchInput.addEventListener("input", displayTrails);
difficultyFilter.addEventListener("change", displayTrails);

// ==========================================
// INITIALISATION
// ==========================================

loadTrails();
loadEvents();
