const goal = 50;

const form = document.getElementById("checkInForm");
const inputName = document.getElementById("attendeeName");
const selectTeam = document.getElementById("teamSelect");

const attendeeCountSpan = document.getElementById("attendeeCount");
const goalCountSpan = document.getElementById("goalCount");
const progressBar = document.getElementById("progressBar");

const waterCountSpan = document.getElementById("waterCount");
const zeroCountSpan  = document.getElementById("zeroCount");
const powerCountSpan = document.getElementById("powerCount");

const greeting = document.getElementById("greeting");

const attendeeListWrap = document.getElementById("attendeeListWrap");
const attendeeList = document.getElementById("attendeeList");

const cardWater = document.getElementById("card-water");
const cardZero  = document.getElementById("card-zero");
const cardPower = document.getElementById("card-power");

const resetBtn = document.getElementById("resetBtn");

if (goalCountSpan) goalCountSpan.textContent = goal;

const TEAM_LABELS = {
  water: "Team Water Wise",
  zero:  "Team Net Zero",
  power: "Team Renewables",
};

const STORAGE_KEY = "intelSummit:v1";
let state = {
  total: 0,
  teams: { water: 0, zero: 0, power: 0 },
  attendees: []
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (typeof data?.total === "number") state.total = data.total;
    if (data?.teams) state.teams = {...data.teams};
    if (Array.isArray(data?.attendees)) state.attendees = data.attendees;
  } catch {}
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function renderCounts() {
  attendeeCountSpan.textContent = state.total;
  waterCountSpan.textContent = state.teams.water;
  zeroCountSpan.textContent = state.teams.zero;
  powerCountSpan.textContent = state.teams.power;
}

function renderProgress() {
  const progressContainer = document.querySelector(".progress-container");
  const pctRaw = (state.total / goal) * 100;
  const pct = Math.min(100, Math.max(state.total > 0 ? 4 : 0, Math.round(pctRaw)));
  progressBar.style.width = pct + "%";
  if (progressContainer) {
    progressContainer.setAttribute("aria-valuenow", String(Math.min(state.total, goal)));
  }
}

function renderAttendees() {
  attendeeList.innerHTML = "";
  if (state.attendees.length === 0) {
    attendeeListWrap.style.display = "none";
    return;
  }
  attendeeListWrap.style.display = "block";
  state.attendees.forEach(({name, team}) => {
    const li = document.createElement("li");
    li.className = "attendee-item";
    const left = document.createElement("span");
    left.textContent = name;
    const right = document.createElement("span");
    right.className = `badge ${team}`;
    right.textContent = TEAM_LABELS[team];
    li.append(left, right);
    attendeeList.appendChild(li);
  });
}

function clearWinners() {
  [cardWater, cardZero, cardPower].forEach(c => c?.classList.remove("winner"));
}

function highlightWinnerIfAny() {
  if (state.total < goal) { clearWinners(); return; }
  const entries = Object.entries(state.teams);
  const max = Math.max(...entries.map(([,c])=>c));
  const leaders = entries.filter(([,c])=>c===max).map(([t])=>t);
  clearWinners();
  leaders.forEach(t => {
    if (t==="water") cardWater.classList.add("winner");
    if (t==="zero")  cardZero.classList.add("winner");
    if (t==="power") cardPower.classList.add("winner");
  });
  const label = leaders.map(t=>TEAM_LABELS[t]).join(" & ");
  showGreeting(`🎉 Goal reached! Current leader: ${label}`, true);
}

function showGreeting(msg, persist=false) {
  greeting.innerHTML = msg;
  greeting.hidden = false;
  if (!persist) {
    clearTimeout(window.__greetTimer);
    window.__greetTimer = setTimeout(()=>{ greeting.hidden = true; }, 4000);
  }
}

function renderAll() {
  renderCounts();
  renderProgress();
  renderAttendees();
  highlightWinnerIfAny();
}

function titleCase(s) {
  return s.trim().replace(/\s+/g," ")
    .split(" ").map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ");
}

function checkIn(nameRaw, team) {
  const name = titleCase(nameRaw);
  if (!name || !TEAM_LABELS[team]) return;
  state.total += 1;
  state.teams[team] += 1;
  state.attendees.push({ name, team });
  saveState();
  renderAll();
  showGreeting(`Welcome, <strong>${name}</strong>! Go <strong>${TEAM_LABELS[team]}</strong>!`);
  form.reset();
  inputName.focus();
}

function resetAll() {
  if (!confirm("Clear saved counts and attendee list?")) return;
  state = { total: 0, teams: { water: 0, zero: 0, power: 0 }, attendees: [] };
  saveState();
  clearWinners();
  renderAll();
  showGreeting("Progress cleared.");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = inputName.value.trim();
  const team = selectTeam.value;
  if (!name) { showGreeting("Please enter a name."); inputName.focus(); return; }
  if (!TEAM_LABELS[team]) { showGreeting("Please select a team."); selectTeam.focus(); return; }
  checkIn(name, team);
});

resetBtn?.addEventListener("click", resetAll);

loadState();
renderAll();