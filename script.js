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
  const { data, error } = await supabaseClient
    .from("events")
    .select("*")
    .in("status", ["Publié", "Complet", "Annulé"])
    .order("event_date", { ascending: true });

  if (error) {
    console.error("Erreur événements :", error.message);
    return;
  }

  const { data: registrations, error: registrationError } =
    await supabaseClient
      .from("event_registrations")
      .select("event_id");

  if (registrationError) {
    console.error("Erreur inscriptions :", registrationError);
    return;
  }

  const registrationCounts = {};

  (registrations || []).forEach(registration => {
    registrationCounts[registration.event_id] =
      (registrationCounts[registration.event_id] || 0) + 1;
  });
  
  const container = document.querySelector("#events-grid");

  if (!container) return;

  if (!data || data.length === 0) {
    container.innerHTML = `
      <p>Aucun événement prévu pour le moment. Revenez bientôt !</p>
    `;
    return;
  }

  container.innerHTML = data.map(item => `
    <article class="event-card">

      ${item.image_url ? `
        <img
          src="${escapeHTML(item.image_url)}"
          alt="${escapeHTML(item.title)}"
          class="event-image"
        >
      ` : ""}

      <div class="event-info">

        <span class="event-category">
          ${escapeHTML(item.category || "Événement")}
        </span>

        <h3>${escapeHTML(item.title)}</h3>

        <p>${escapeHTML(item.description || "")}</p>

        <p>
        <div class="event-date-box">
  ${
    item.event_date
      ? `
        <span class="event-date-day">
          ${new Date(item.event_date).toLocaleDateString("fr-CA", {
            day: "numeric"
          })}
        </span>
        <div class="event-date-details">
          <strong>
            ${new Date(item.event_date).toLocaleDateString("fr-CA", {
              month: "long",
              year: "numeric"
            })}
          </strong>
          <span>
          ${new Date(item.event_date).toLocaleTimeString("fr-CA", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
}).replace(" h ", " ")}
          </span>
        </div>
      `
      : "<strong>Date à déterminer</strong>"
  }
</div>

        <p>
          <strong>Lieu :</strong>
          ${escapeHTML(item.location || "À déterminer")}
        </p>

        <p>
          <strong>Durée :</strong>
          ${item.duration_minutes
            ? item.duration_minutes + " minutes"
            : "À déterminer"}
        </p>

        <p>
          <strong>Participants maximum :</strong>
          ${item.max_participants || "Non limité"}
        </p>

        ${item.participation_conditions ? `
          <p>
            <strong>Conditions :</strong>
            ${escapeHTML(item.participation_conditions)}
          </p>
        ` : ""}

      <span class="event-status ${
  item.status === "Complet"
    ? "full"
    : item.status === "Annulé"
      ? "cancelled"
      : item.status === "Brouillon"
        ? "draft"
        : "available"
}">
          ${escapeHTML(item.status)}
        </span>

${item.status === "Publié" ? `
  <form class="event-registration-form" data-event-id="${item.id}">
    <h4>Participer à cet événement</h4>

    <label>
      Nom et prénom
      <input
        type="text"
        name="participant_name"
        required
        maxlength="100"
        placeholder="Votre nom"
      >
    </label>

   <label>
  Numéro de téléphone
  <input
    type="tel"
    name="participant_phone"
    required
    maxlength="20"
    placeholder="Votre numéro de téléphone"
  >
</label>

    <button type="submit" class="button button-register">
      S'inscrire →
    </button>

    <p class="registration-message" aria-live="polite"></p>
  </form>
` : ""}

      </div>
    </article>
  `).join("");
}

// ==========================================
// INSCRIPTIONS AUX ÉVÉNEMENTS
// ==========================================

document.addEventListener("submit", async (event) => {
  const form = event.target.closest(".event-registration-form");

  if (!form) return;

  event.preventDefault();

  const button = form.querySelector('button[type="submit"]');
  const message = form.querySelector(".registration-message");

  const participantName = form.elements.participant_name.value.trim();
 const participantPhone = form.elements.participant_phone.value.trim();
  const eventId = Number(form.dataset.eventId);

  button.disabled = true;
  button.textContent = "Inscription en cours...";
  message.textContent = "";

  const { error } = await supabaseClient
    .from("event_registrations")
   .insert({
  event_id: eventId,
  participant_name: participantName,
  participant_phone: participantPhone
});

  if (error) {
    console.error("Erreur inscription :", error);

    if (error.code === "23505") {
      message.textContent = "Vous êtes déjà inscrit à cet événement.";
    } else {
      message.textContent = "Une erreur est survenue. Veuillez réessayer.";
    }

    button.disabled = false;
    button.textContent = "S'inscrire →";
    return;
  }

  message.textContent = "Votre inscription a bien été enregistrée !";
  button.textContent = "Inscription confirmée";
  form.reset();
});

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
