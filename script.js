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

  data.forEach(item => {
    item.registrationCount = registrationCounts[item.id] || 0;

    if (
      item.max_participants &&
      item.registrationCount >= item.max_participants
    ) {
      item.status = "Complet";
    }
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
  <strong>Participants :</strong>
  ${item.registrationCount || 0}
  ${item.max_participants
    ? "/ " + item.max_participants
    : "(Sans limite)"}
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

  const { data, error } = await supabaseClient
    .rpc("register_for_event", {
      p_event_id: eventId,
      p_participant_name: participantName,
      p_participant_phone: participantPhone
    });

  if (error || !data?.success) {
    console.error("Erreur inscription :", error);

    if (error?.code === "23505") {
      message.textContent = "Vous êtes déjà inscrit à cet événement.";
    } else {
      message.textContent =
        data?.message || "Une erreur est survenue. Veuillez réessayer.";
    }

    button.disabled = false;
    button.textContent = "S'inscrire →";
    return;
  }

  message.textContent = "Votre inscription a bien été enregistrée !";
  button.textContent = "Inscription confirmée";
  form.reset();

  await loadEvents();
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

// ESPACE MEMBRE SATRAILGUIDE

function generateMemberEmail(firstName, lastName) {
  const normalize = text =>
    text.trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  return `${normalize(firstName)}.${normalize(lastName)}@satrailguide.invalid`;
}

// CRÉATION DE COMPTE
document.getElementById("member-signup-form")
  ?.addEventListener("submit", async event => {
    event.preventDefault();

    const form = event.target;
    const message = document.getElementById("member-signup-message");
    const firstName = form.elements.first_name.value.trim();
    const lastName = form.elements.last_name.value.trim();
    const password = form.elements.password.value;

    message.textContent = "Création du compte en cours...";

    const { data, error } = await supabaseClient.auth.signUp({
      email: generateMemberEmail(firstName, lastName),
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName
        }
      }
    });

    if (error) {
      message.textContent = error.message;
      return;
    }

    message.textContent = "Votre compte a été créé avec succès !";
    form.reset();
  });

// CONNEXION
document.getElementById("member-login-form")
  ?.addEventListener("submit", async event => {
    event.preventDefault();

    const form = event.target;
    const message = document.getElementById("member-login-message");

    const firstName = form.elements.first_name.value.trim();
    const lastName = form.elements.last_name.value.trim();
    const password = form.elements.password.value;

    message.textContent = "Connexion en cours...";

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: generateMemberEmail(firstName, lastName),
      password
    });

    if (error) {
      message.textContent = "Prénom, nom ou mot de passe incorrect.";
      return;
    }

 message.textContent = "";
document.getElementById("member-dashboard").style.display = "block";
document.getElementById("member-display-name").textContent =
  `${data.user.user_metadata.first_name} ${data.user.user_metadata.last_name}`;
    await loadMemberRegistrations();
  });

// DÉCONNEXION MEMBRE
document.getElementById("member-logout")
  ?.addEventListener("click", async () => {

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      console.error("Erreur de déconnexion :", error);
      return;
    }

    document.getElementById("member-dashboard").style.display = "none";
    document.getElementById("member-login-form").reset();

    document.getElementById("member-login-message").textContent =
      "Vous êtes déconnecté.";
  });

// RESTAURATION DE LA SESSION MEMBRE
async function restoreMemberSession() {
  const { data, error } = await supabaseClient.auth.getUser();

  if (error || !data.user) return;

  const firstName = data.user.user_metadata.first_name || "";
  const lastName = data.user.user_metadata.last_name || "";

  document.getElementById("member-dashboard").style.display = "block";

  document.getElementById("member-display-name").textContent =
    `${firstName} ${lastName}`;
  await loadMemberRegistrations();
}

restoreMemberSession();

// AFFICHER LES INSCRIPTIONS DU MEMBRE
async function loadMemberRegistrations() {
  const container = document.getElementById("member-registrations");

  const { data: userData } = await supabaseClient.auth.getUser();

  if (!userData.user) return;

  const fullName =
    `${userData.user.user_metadata.first_name} ${userData.user.user_metadata.last_name}`;

  const { data, error } = await supabaseClient
    .from("event_registrations")
    .select("id, event_id, created_at, events(title, event_date)")
  .ilike("participant_name", fullName);

  if (error) {
    console.error("Erreur inscriptions membre :", error);
    container.textContent = "Impossible de charger vos inscriptions.";
    return;
  }

  if (!data || data.length === 0) {
    container.textContent = "Vous n'êtes inscrit à aucun événement.";
    return;
  }

  container.innerHTML = data.map(item => `
    <div class="item">
      <strong>${escapeHTML(item.events?.title || "Événement")}</strong>
      <p>
        ${item.events?.event_date
          ? new Date(item.events.event_date).toLocaleDateString("fr-CA")
          : "Date à déterminer"}
      </p>
    </div>
  `).join("");
}
