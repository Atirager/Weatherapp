window.getWeather = async function(cityOverride = null) {
  const input = document.getElementById("cityInput");
  const city = cityOverride || input.value.trim();
  if (!city) return;

  document.getElementById("loading").style.display = "block";

  try {
    const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=05b81f8b80065742683e5d0cd6632534&units=metric`);
    const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=05b81f8b80065742683e5d0cd6632534&units=metric`);

    const weatherData = await weatherRes.json();
    const forecastData = await forecastRes.json();
    document.getElementById("loading").style.display = "none";

    renderWeather(weatherData);
    renderForecast(forecastData);
    renderHourlyChart(forecastData);
  } catch (err) {
    console.error("Fetch error:", err);
    alert("City not found or API issue.");
    document.getElementById("loading").style.display = "none";
  }
};

function renderWeather(data) {
  document.getElementById("weatherResult").innerHTML = `
    <h2>${data.name}, ${data.sys.country}</h2>
    <p>🌡️ Temperature: ${Math.round(data.main.temp)}°C</p>
    <p>🤗 Feels Like: ${Math.round(data.main.feels_like)}°</p>
    <p>💧 Humidity: ${data.main.humidity}%</p>
    <p>💨 Wind: ${data.wind.speed} m/s</p>
    <p>🌈 Condition: ${data.weather[0].main}</p>
  `;
}

function renderForecast(data) {
  const forecast = document.getElementById("forecast");
  forecast.innerHTML = "";
  for (let i = 0; i < data.list.length; i += 8) {
    const day = data.list[i];
    const date = new Date(day.dt * 1000).toDateString();
    const icon = day.weather[0].main.includes("Rain") ? "🌧️" :
                 day.weather[0].main.includes("Cloud") ? "☁️" : "☀️";
    forecast.innerHTML += `
      <div class="forecast-day">
        <p>${date}</p>
        <p>${icon} ${day.weather[0].main}</p>
        <p>🌡️ ${Math.round(day.main.temp_min)}° - ${Math.round(day.main.temp_max)}°</p>
      </div>`;
  }
}


function renderHourlyChart(data) {
  const chartCanvas = document.getElementById("hourlyChart");
  if (!chartCanvas) {
    console.warn("Chart canvas not found.");
    return;
  }

  const ctx = chartCanvas.getContext("2d");
  const now = Date.now();

  // 3 hours before now and 10 hours after now (in ms)
  const filtered = data.list.filter(d => {
    const timestamp = d.dt * 1000;
    return timestamp >= (now - 3 * 3600 * 1000) && timestamp <= (now + 10 * 3600 * 1000);
  });

  if (filtered.length === 0) {
    console.warn("No data available for hourly forecast.");
    return;
  }

  const labels = filtered.map(d => {
    const date = new Date(d.dt * 1000);
    return `${date.getHours().toString().padStart(2, "0")}:00`;
  });

  const temps = filtered.map(d => Math.round(d.main.temp));

  if (window.hourlyChart) window.hourlyChart.destroy();

  window.hourlyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Temp (°C)",
        data: temps,
        backgroundColor: "rgba(0,123,255,0.6)"
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  });
}

  const ctx = document.getElementById("hourlyChart").getContext("2d");
  const now = Date.now();
  const filtered = data.list.filter(d => {
    const timeDiff = d.dt * 1000 - now;
    return timeDiff > -3 * 3600 * 1000 && timeDiff < 10 * 3600 * 1000;
  });

  const labels = filtered.map(d => {
    const hour = new Date(d.dt * 1000).getHours();
    return hour.toString().padStart(2, '0') + ":00";
  });
  const temps = filtered.map(d => Math.round(d.main.temp));

  if (window.hourlyChart) window.hourlyChart.destroy();

  window.hourlyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Temp (°C)",
        data: temps,
        backgroundColor: "rgba(0,123,255,0.6)"
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  });
}

// Add Enter key event for city search
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("cityInput").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      getWeather();
    }
  });
});