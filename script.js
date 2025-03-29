const apiKey = "05b81f8b80065742683e5d0cd6632534";
let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
let cache = JSON.parse(localStorage.getItem("weatherCache")) || {};
let unit = localStorage.getItem("unit") || "metric";
const input = document.getElementById("cityInput");
const suggestionsList = document.getElementById("suggestions");
const chartEl = document.getElementById("tempChart").getContext("2d");
let tempChart;

// Set unit dropdown
document.getElementById("unitSelect").value = unit;

// Dark mode toggle
document.getElementById("toggleMode").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  if (tempChart) tempChart.destroy();
  getWeather();
});

// Unit change
document.getElementById("unitSelect").addEventListener("change", (e) => {
  unit = e.target.value;
  localStorage.setItem("unit", unit);
  getWeather();
});

// Search history update
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

// Autocomplete
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

// Fetch weather
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
    const forecastData = await res2.json();
    const allData = { weatherData, forecastData, city };

    cache[`${city}_${unit}`] = allData;
    if (!history.includes(city)) {
      history.unshift(city);
      history = history.slice(0, 5);
    }
    updateHistory();
    renderWeather(allData);
  } catch (e) {
    alert("City not found");
    document.getElementById("loading").style.display = "none";
  }
}

// Render UI
function renderWeather({ weatherData, forecastData, city }) {
  document.getElementById("loading").style.display = "none";
  document.getElementById("weatherResult").innerHTML = `
    <h2>${weatherData.name}, ${weatherData.sys.country}</h2>
    <p>Temperature: ${weatherData.main.temp}°${unit === "metric" ? "C" : "F"}</p>
    <p>Feels Like: ${weatherData.main.feels_like}°</p>
    <p>Humidity: ${weatherData.main.humidity}%</p>
    <p>Wind: ${weatherData.wind.speed} ${unit === "metric" ? "m/s" : "mph"}</p>
    <p>Condition: ${weatherData.weather[0].main}</p>
  `;

  const forecast = document.getElementById("forecast");
  const labels = [];
  const minTemps = [];
  const maxTemps = [];
  forecast.innerHTML = "";

  for (let i = 0; i < forecastData.list.length; i += 8) {
    const day = forecastData.list[i];
    const date = new Date(day.dt * 1000).toDateString();
    const cond = day.weather[0].main;
    const min = day.main.temp_min;
    const max = day.main.temp_max;

    forecast.innerHTML += `
      <div class="forecast-day">
        <p>${date}</p>
        <p>${getEmoji(cond)} ${cond}</p>
        <p>🌡️ ${min}° - ${max}°</p>
      </div>`;

    labels.push(date);
    minTemps.push(min);
    maxTemps.push(max);
  }

  // Shorten date to weekday only
const getWeekday = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" });

const shortLabels = labels.map(getWeekday);

if (tempChart) tempChart.destroy();

tempChart = new Chart(chartEl, {
  type: "bar",
  data: {
    labels: shortLabels,
    datasets: [
      {
        label: `Min Temp (${unit === "metric" ? "°C" : "°F"})`,
        data: minTemps,
        backgroundColor: "rgba(135, 206, 250, 0.7)", // soft sky blue
      },
      {
        label: `Max Temp (${unit === "metric" ? "°C" : "°F"})`,
        data: maxTemps,
        backgroundColor: "rgba(255, 105, 97, 0.7)", // soft salmon pink
      },
    ],
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: document.body.classList.contains("dark-mode") ? "#eee" : "#222",
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: 🌡️ ${ctx.parsed.y}°`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: document.body.classList.contains("dark-mode") ? "#ccc" : "#222",
        },
        grid: {
          display: false,
        },
      },
      y: {
        ticks: {
          color: document.body.classList.contains("dark-mode") ? "#ccc" : "#222",
        },
        grid: {
          color: "rgba(200, 200, 200, 0.2)",
        },
      },
    },
  },
});
}

function getEmoji(cond) {
  const c = cond.toLowerCase();
  if (c.includes("clear")) return "☀️";
  if (c.includes("cloud")) return "☁️";
  if (c.includes("rain")) return "🌧️";
  if (c.includes("snow")) return "❄️";
  if (c.includes("storm")) return "⛈️";
  return "🌈";
}
