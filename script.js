const apiKey = "05b81f8b80065742683e5d0cd6632534";
let history = [];

document.getElementById("cityInput").addEventListener("keydown", function (e) {
  if (e.key === "Enter") getWeather();
});

document.getElementById("toggleMode").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

async function getWeather(cityOverride = null) {
  const city = cityOverride || document.getElementById("cityInput").value;
  if (!city) return;

  const loadingEl = document.getElementById("loading");
  loadingEl.style.display = "block";

  try {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast/daily?q=${city}&cnt=10&appid=${apiKey}&units=metric`;

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
      <img src="https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png" alt="icon"/>
    `;

    const forecastEl = document.getElementById("forecast");
    forecastEl.innerHTML = "";
    forecastData.list.forEach(day => {
      const date = new Date(day.dt * 1000).toDateString();
      forecastEl.innerHTML += `
        <div class="forecast-day">
          <p>${date}</p>
          <p>${day.weather[0].main}</p>
          <p>${day.temp.day}°C</p>
        </div>
      `;
    });

    if (!history.includes(city)) {
      history.unshift(city);
      updateHistory();
    }
  } catch (error) {
    document.getElementById("weatherResult").innerHTML = `<p id="errorMessage">${error.message}</p>`;
    document.getElementById("forecast").innerHTML = "";
  } finally {
    loadingEl.style.display = "none";
  }
}

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
