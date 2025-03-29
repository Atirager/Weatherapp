const apiKey = "05b81f8b80065742683e5d0cd6632534"; // OpenWeatherMap API key
let history = [];

const input = document.getElementById("cityInput");
const suggestionsList = document.getElementById("suggestions");

// ENTER key triggers search
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    getWeather();
    suggestionsList.style.display = "none";
  }
});

// 🔍 City autocomplete using GeoDB Cities API (RapidAPI)
input.addEventListener("input", async () => {
  const query = input.value.trim();
  if (query.length < 2) {
    suggestionsList.style.display = "none";
    return;
  }

  try {
    const res = await fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities?limit=5&namePrefix=${query}`, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": "9828ac0080msh955cea759b9097fp1fda40jsnd9b57c63454d", // ← Your RapidAPI key
        "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com"
      }
    });

    const data = await res.json();
    suggestionsList.innerHTML = "";

    const cities = data.data;

    if (cities.length === 0) {
      suggestionsList.style.display = "none";
      return;
    }

    cities.forEach((city) => {
      const li = document.createElement("li");
      li.textContent = `${city.city}, ${city.country}`;
      li.onclick = () => {
        input.value = li.textContent;
        suggestionsList.style.display = "none";
      };
      suggestionsList.appendChild(li);
    });

    suggestionsList.style.display = "block";
  } catch (err) {
    console.error("City autocomplete error:", err);
    suggestionsList.style.display = "none";
  }
});

// 🌗 Dark mode toggle
document.getElementById("toggleMode").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// 🌤️ Get current weather + forecast
async function getWeather(cityOverride = null) {
  const city = cityOverride || input.value;
  if (!city) return;

  document.getElementById("loading").style.display = "block";

  try {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

    const [weatherRes, forecastRes] = await Promise.all([
      fetch(weatherUrl),
      fetch(forecastUrl)
    ]);

    if (!weatherRes.ok || !forecastRes.ok) throw new Error("City not found");

    const weatherData = await weatherRes.json();
    const forecastData = await forecastRes.json();

    // Display current weather
    document.getElementById("weatherResult").innerHTML = `
      <h2>${weatherData.name}, ${weatherData.sys.country}</h2>
      <p>Temperature: ${weatherData.main.temp}°C</p>
      <p>Feels Like: ${weatherData.main.feels_like}°C</p>
      <p>Humidity: ${weatherData.main.humidity}%</p>
      <p>Wind Speed: ${weatherData.wind.speed} m/s</p>
      <p>Condition: ${weatherData.weather[0].main}</p>
      <img src="https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png" alt="icon"/>
    `;

    // Display 5-day forecast (every 8th 3-hour reading)
    const forecastEl = document.getElementById("forecast");
    forecastEl.innerHTML = "";

    for (let i = 0; i < forecastData.list.length; i += 8) {
      const day = forecastData.list[i];
      const date = new Date(day.dt * 1000).toDateString();

      forecastEl.innerHTML += `
        <div class="forecast-day">
          <p>${date}</p>
          <p>${day.weather[0].main}</p>
          <p>${day.main.temp}°C</p>
        </div>
      `;
    }

    // Add to search history
    if (!history.includes(city)) {
      history.unshift(city);
      updateHistory();
    }
  } catch (err) {
    document.getElementById("weatherResult").innerHTML = `<p id="errorMessage">${err.message}</p>`;
    document.getElementById("forecast").innerHTML = "";
  } finally {
    document.getElementById("loading").style.display = "none";
  }
}

// 🔁 Update search history
function updateHistory() {
  const ul = document.getElementById("searchHistory");
  ul.innerHTML = "";
  history.slice(0, 5).forEach((city) => {
    const li = document.createElement("li");
    li.textContent = city;
    li.onclick = () => getWeather(city);
    ul.appendChild(li);
  });
}
