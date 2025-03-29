const apiKey = "05b81f8b80065742683e5d0cd6632534";
let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
let cache = JSON.parse(localStorage.getItem("weatherCache")) || {};
let unit = localStorage.getItem("unit") || "metric";
const input = document.getElementById("cityInput");
const suggestionsList = document.getElementById("suggestions");
const weatherIcon = document.getElementById("weatherIcon");
const chartEl = document.getElementById("tempChart").getContext("2d");
let tempChart;

document.getElementById("unitSelect").value = unit;

// Dark mode
document.getElementById("toggleMode").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  if (tempChart) tempChart.destroy();
  getWeather(); // Redraw chart with new colors
});

// Unit toggle
document.getElementById("unitSelect").addEventListener("change", (e) => {
  unit = e.target.value;
  localStorage.setItem("unit", unit);
  getWeather();
});

function updateHistory() {
  const ul = document.getElementById("searchHistory");
  ul.innerHTML = "";
  history.forEach((city) => {
    const li = document.createElement("li");
    li.textContent = city;
    li.onclick = () => getWeather(city);
    ul.appendChild(li);
  });
  localStorage.setItem("searchHistory", JSON.stringify(history));
  localStorage.setItem("weatherCache", JSON.stringify(cache));
}

input.addEventListener("input", async () => {
  const query = input.value.trim();
  if (query.length < 2) return (suggestionsList.style.display = "none");

  const res = await fetch(
    `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?limit=5&namePrefix=${query}`,
    {
      headers: {
        "X-RapidAPI-Key": "9828ac0080msh955cea759b9097fp1fda40jsnd9b57c63454d",
        "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
      },
    }
  );

  const data = await res.json();
  suggestionsList.innerHTML = "";
  data.data.forEach((city) => {
    const li = document.createElement("li");
    li.textContent = `${city.city}, ${city.country}`;
    li.onclick = () => {
      input.value = li.textContent;
      suggestionsList.style.display = "none";
    };
    suggestionsList.appendChild(li);
  });
  suggestionsList.style.display = "block";
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    getWeather();
    suggestionsList.style.display = "none";
  }
});

async function getWeather(cityOverride = null) {
  const city = cityOverride || input.value.trim();
  if (!city) return;
  document.getElementById("loading").style.display = "block";

  if (cache[`${city}_${unit}`]) {
    renderWeather(cache[`${city}_${unit}`]);
    return;
  }

  try {
    const res1 = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${unit}`
    );
    const res2 = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${unit}`
    );
    if (!res1.ok || !res2.ok) throw new Error("City not found");

    const weatherData = await res1.json();
