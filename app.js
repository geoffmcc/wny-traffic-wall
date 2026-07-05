const grid = document.querySelector("#camera-grid");
const template = document.querySelector("#camera-card-template");
const searchInput = document.querySelector("#search");
const filters = document.querySelector("#filters");
const count = document.querySelector("#count");
const feedStatus = document.querySelector("#feed-status");
const summaryNote = document.querySelector("#summary-note");

const NITTEC_FEED_URL = "https://www.nittec.org/content/json/nittec.js";
const SOURCE_URL = "https://www.nittec.org/cameras/";
const ROUTE_ORDER = [
  "All",
  "Favorites",
  "I-190",
  "I-290 (YOUNGMANN MEMORIAL HIGHWAY)",
  "I-90 (NEW YORK STATE THRUWAY)",
  "Route 33 (KENSINGTON EXPRESSWAY)",
  "Route 198 (SCAJAQUADA EXPRESSWAY)",
  "Route 5",
  "INTERNATIONAL BRIDGES",
  "I-990",
  "Route 400 (AURORA EXPRESSWAY)",
  "Route 219 (SOUTHERN EXPRESSWAY)",
];

const FAVORITE_MATCHES = [
  "I-290",
  "I-190",
  "Route 33",
  "Route 198",
  "INTERNATIONAL BRIDGES",
  "Grand Island",
  "Peace Bridge",
  "Rainbow Bridge",
  "Niagara Falls",
  "Tonawanda",
];

let cameras = [];
let activeRoute = "Favorites";
const thumbnailTimers = new Set();

function renderFilters() {
  const routes = ROUTE_ORDER.filter((route) => route === "All" || route === "Favorites" || cameras.some((camera) => camera.route === route));

  filters.replaceChildren(
    ...routes.map((route) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `filter${route === activeRoute ? " active" : ""}`;
      button.textContent = getRouteLabel(route);
      button.addEventListener("click", () => {
        activeRoute = route;
        renderFilters();
        renderCameras();
      });
      return button;
    })
  );
}

function cameraMatches(camera, query) {
  const haystack = [camera.name, camera.route, camera.agency, camera.directions]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function routeMatches(camera) {
  if (activeRoute === "All") {
    return true;
  }

  if (activeRoute === "Favorites") {
    return FAVORITE_MATCHES.some((term) => camera.name.includes(term) || camera.route.includes(term));
  }

  return camera.route === activeRoute;
}

function renderCameras() {
  clearThumbnailTimers();
  const query = searchInput.value.trim().toLowerCase();
  const visible = cameras.filter((camera) => {
    return routeMatches(camera) && cameraMatches(camera, query);
  });

  grid.replaceChildren(
    ...visible.map((camera) => {
      const node = template.content.cloneNode(true);
      const thumb = node.querySelector(".camera-thumb");

      thumb.src = camera.thumbnailUrl;
      thumb.alt = `${camera.name} traffic camera thumbnail`;
      scheduleThumbnailRefresh(thumb, camera.thumbnailUrl);

      node.querySelector(".badge").textContent = getRouteLabel(camera.route);
      node.querySelector(".source").textContent = camera.agency;
      node.querySelector("h2").textContent = camera.name;
      node.querySelector(".meta").textContent = getCameraMeta(camera);
      node.querySelector(".refresh-state").textContent = getRefreshText(camera);

      return node;
    })
  );

  count.textContent = visible.length.toString();
  summaryNote.textContent = `${cameras.length} active U.S. NITTEC cameras loaded. Thumbnails refresh every 30 seconds.`;
}

function getRefreshText(camera) {
  return camera.videoUrl ? "Official thumbnail refreshes every 30s | source has live stream" : "Official thumbnail refreshes every 30s";
}

function getCameraMeta(camera) {
  const parts = [camera.directions, `NITTEC ID ${camera.id}`].filter(Boolean);
  return parts.join(" | ");
}

function getRouteLabel(route) {
  return route
    .replace(" (NEW YORK STATE THRUWAY)", "")
    .replace(" (YOUNGMANN MEMORIAL HIGHWAY)", "")
    .replace(" (KENSINGTON EXPRESSWAY)", "")
    .replace(" (SCAJAQUADA EXPRESSWAY)", "")
    .replace(" (AURORA EXPRESSWAY)", "")
    .replace(" (SOUTHERN EXPRESSWAY)", "")
    .replace("INTERNATIONAL BRIDGES", "Bridges");
}

function withCacheBuster(url) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}_=${Date.now()}`;
}

function scheduleThumbnailRefresh(image, url) {
  const refresh = () => {
    image.src = withCacheBuster(url);
  };
  const timer = window.setInterval(refresh, 30000);
  thumbnailTimers.add(timer);
}

function clearThumbnailTimers() {
  for (const timer of thumbnailTimers) {
    window.clearInterval(timer);
  }
  thumbnailTimers.clear();
}

function normalizeCamera(raw) {
  return {
    id: raw.i,
    agency: raw.a || "NITTEC",
    name: raw.n || raw.d || "Unnamed camera",
    route: raw.l || "Other",
    thumbnailUrl: raw.im,
    videoUrl: raw.vu,
    directions: [raw.dir1, raw.dir2].filter(Boolean).join(" / "),
    latitude: raw.la,
    longitude: raw.lo,
  };
}

function flattenCameras(data) {
  return data.cctv
    .flatMap((group) => Object.values(group))
    .filter((camera) => camera.country === "USA" && camera.s === "ON" && camera.im && camera.vu)
    .map(normalizeCamera)
    .sort((a, b) => ROUTE_ORDER.indexOf(a.route) - ROUTE_ORDER.indexOf(b.route) || a.name.localeCompare(b.name));
}

async function loadCameras() {
  try {
    const response = await fetch(NITTEC_FEED_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`NITTEC feed returned ${response.status}`);
    }

    cameras = flattenCameras(await response.json());
    feedStatus.textContent = `${cameras.length} live feeds loaded`;
    feedStatus.classList.add("ready");
    renderFilters();
    renderCameras();
  } catch (error) {
    feedStatus.textContent = "Could not load NITTEC feed";
    feedStatus.classList.add("error");
    grid.innerHTML = `<p class="empty-state">${error.message}. Try serving this folder with a local static server if your browser blocks local file requests.</p>`;
  }
}

searchInput.addEventListener("input", renderCameras);

renderFilters();
loadCameras();
