const apiKey = "05b81f8b80065742683e5d0cd6632534";
let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
let cache = JSON.parse(localStorage.getItem("weatherCache")) || {};
let unit = localStorage.getItem("unit") || "metric";
const input = document.getElementById("cityInput");
const suggestionsList = document.getElementById("suggestions");
const weatherIcon = document.getElementById("weatherIcon");
const chartEl = document.getElementById("tempChart").getContext("2d");
let tempChart;

// Set unit dropdown
document.getElementById("unitSelect").value = unit;

// Toggle dark mode
document.getElementById("toggleMode").addEventListener("click", () =>
  document.body.classList.toggle("dark-mode")
);

// Unit switch
document.getElementById("unitSelect").addEventListener("change", (e) => {
  unit = e.target.value;
  localStorage.setItem("unit", unit);
  getWeather();
});

// Show search history
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

// Suggestions via RapidAPI
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

// Enter key
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    getWeather();
    suggestionsList.style.display = "none";
  }
});

// Get Weather
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

  // Icon
  const condition = weatherData.weather[0].main.toLowerCase();
  setAnimatedIcon(condition);

  // Forecast
  const forecast = document.getElementById("forecast");
  const labels = [];
  const temps = [];
  forecast.innerHTML = "";

  for (let i = 0; i < forecastData.list.length; i += 8) {
    const day = forecastData.list[i];
    const date = new Date(day.dt * 1000).toDateString();
    const cond = day.weather[0].main;
    const temp = day.main.temp;
    forecast.innerHTML += `
      <div class="forecast-day">
        <p>${date}</p>
        <p>${getEmoji(cond)} ${cond}</p>
        <p>${temp}°</p>
      </div>`;
    labels.push(date);
    temps.push(temp);
  }

  if (tempChart) tempChart.destroy();
  tempChart = new Chart(chartEl, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Temp",
          data: temps,
          fill: false,
          borderColor: "#007bff",
          tension: 0.3,
        },
      ],
    },
  });
}

function setAnimatedIcon(condition) {
  const map = {
    clear: "https://assets4.lottiefiles.com/packages/lf20_jzcldbm3.json",
    clouds: "https://assets2.lottiefiles.com/packages/lf20_qp1q7mct.json",
    rain: "https://assets2.lottiefiles.com/packages/lf20_jmBauI.json",
    drizzle: "https://assets2.lottiefiles.com/packages/lf20_jmBauI.json",
    thunderstorm: "https://assets2.lottiefiles.com/private_files/lf30_tll0j4bb.json",
    snow: "https://assets2.lottiefiles.com/packages/lf20_wq03oz.json",
    mist: "https://assets2.lottiefiles.com/packages/lf20_kOfPKE.json",
    fog: "https://assets2.lottiefiles.com/packages/lf20_kOfPKE.json",
    haze: "https://assets2.lottiefiles.com/packages/lf20_kOfPKE.json",
  };
  weatherIcon.setAttribute("src", map[condition] || map.clear);
  weatherIcon.style.display = "block";
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
