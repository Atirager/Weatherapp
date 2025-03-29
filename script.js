const apiKey = "05b81f8b80065742683e5d0cd6632534"; // Replace with your API key
let history = [];

async function getWeather(cityOverride = null) {
  const city = cityOverride || document.getElementById("cityInput").value;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("City not found");

    const data = await response.json();
    const weather = `
      <h2>${data.name}, ${data.sys.country}</h2>
      <p>Temperature: ${data.main.temp}°C</p>
      <p>Condition: ${data.weather[0].main}</p>
      <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="icon"/>
    `;
    document.getElementById("weatherResult").innerHTML = weather;

    // Add to history
    if (!history.includes(data.name)) {
      history.unshift(data.name);
      updateHistory();
    }
  } catch (error) {
    const errorHtml = `<p id="errorMessage">${error.message}</p>`;
    document.getElementById("weatherResult").innerHTML = errorHtml;
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

document.getElementById("toggleMode").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});
