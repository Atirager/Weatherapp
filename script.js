const apiKey = "05b81f8b80065742683e5d0cd6632534";
let history = JSON.parse(localStorage.getItem("searchHistory")) || [];

const input = document.getElementById("cityInput");
const suggestionsList = document.getElementById("suggestions");
const weatherIcon = document.getElementById("weatherIcon");

updateHistory(); // Load saved history

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    getWeather();
    suggestionsList.style.display = "none";
  }
});

// City autocomplete
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
        "X-RapidAPI-Key": "9828ac0080msh955cea759b9097fp1fda40jsnd9b57c63454d",
        "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com"
      }
    });

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
  } catch (err) {
    console.error("Autocomplete error:", err);
  }
});

document.getElementById("toggleMode").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

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

    document.getElementById("weatherResult").innerHTML = `
      <h2>${weatherData.name}, ${weatherData.sys.country}</h2>
      <p>Temperature: ${weatherData.main.temp}°C</p>
      <p>Feels Like: ${weatherData.main.feels_like}°C</p>
      <p>Humidity: ${weatherData.main.humidity}%</p>
      <p>Wind Speed: ${weatherData.wind.speed} m/s</p>
      <p>Condition: ${weatherData.weather[0].main}</p>
    `;

    setWeatherBackground(weatherData.weather[0].main);
    setAnimatedIcon(weatherData.weather[0].main);

    const forecastEl = document.getElementById("forecast");
    forecastEl.innerHTML = "";

    for (let i = 0; i < forecastData.list.length; i += 8) {
      const day = forecastData.list[i];
      const date = new Date(day.dt * 1000).toDateString();
      const condition = day.weather[0].main;
      const icon = getWeatherEmoji(condition);

      forecastEl.innerHTML += `
        <div class="forecast-day">
          <p>${date}</p>
          <p>${icon} ${condition}</p>
          <p>${day.main.temp}°C</p>
        </div>
      `;
    }

    if (!history.includes(city)) {
      history.unshift(city);
      history = history.slice(0, 5);
      updateHistory();
    }
  } catch (err) {
    document.getElementById("weatherResult").innerHTML = `<p id="errorMessage">${err.message}</p>`;
    document.getElementById("forecast").innerHTML = "";
    weatherIcon.style.display = "none";
  } finally {
    document.getElementById("loading").style.display = "none";
  }
}

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
}

function setWeatherBackground(condition) {
  const body = document.body;
  switch (condition.toLowerCase()) {
    case "clear":
      body.style.background = "linear-gradient(to top, #fceabb, #f3b343)";
      break;
    case "clouds":
      body.style.background = "linear-gradient(to right, #bdc3c7, #2c3e50)";
      break;
    case "rain":
    case "drizzle":
      body.style.background = "linear-gradient(to right, #4e54c8, #8f94fb)";
      break;
    case "thunderstorm":
      body.style.background = "linear-gradient(to right, #0f2027, #203a43, #2c5364)";
      break;
    case "snow":
      body.style.background = "linear-gradient(to right, #d7d2cc, #304352)";
      break;
    case "mist":
    case "fog":
    case "haze":
      body.style.background = "linear-gradient(to right, #3e5151, #decba4)";
      break;
    default:
      body.style.background = "linear-gradient(to right, #667eea, #764ba2)";
  }
}

function setAnimatedIcon(condition) {
  const iconMap = {
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

  const iconURL = iconMap[condition.toLowerCase()] || iconMap["clear"];
  weatherIcon.setAttribute("src", iconURL);
  weatherIcon.style.display = "block";
}

function getWeatherEmoji(condition) {
  switch (condition.toLowerCase()) {
    case "clear": return "☀️";
    case "clouds": return "☁️";
    case "rain": return "🌧️";
    case "drizzle": return "🌦️";
    case "thunderstorm": return "⛈️";
    case "snow": return "❄️";
    case "mist":
    case "fog":
    case "haze": return "🌫️";
    default: return "🌈";
  }
}
