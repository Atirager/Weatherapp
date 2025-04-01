
window.getWeather = function(cityOverride = null) {
  console.log("getWeather called with:", cityOverride || document.getElementById("cityInput").value);
  // Your actual getWeather logic would go here.
  alert("Fetching weather for: " + (cityOverride || document.getElementById("cityInput").value));
};
