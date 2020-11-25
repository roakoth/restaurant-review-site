function handleLocationSuccess(position) {
  var newRestaurantSection = document.getElementById("newRestaurantSection");
  newRestaurantSection.style.display = "none";

  // Get location of user
  const mapCenter = {
    lat: -0.0658,
    lng: 34.806,
  };

  const map = new google.maps.Map(document.getElementById("google-map"), {
    center: mapCenter,
    zoom: 15,
  });

  const marker = new google.maps.Marker({
    position: mapCenter,
    map: map,
    title: "User Location",
  });

  APP.getRestaurants(mapCenter.lat, mapCenter.lng, map);
  //use geolocotaion to find out exactly where you are
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      const map = new google.maps.Map(document.getElementById("google-map"), {
        center: pos,
        zoom: 15,
      });

      const marker = new google.maps.Marker({
        position: pos,
        map: map,
        title: "User Location",
      });

      APP.getRestaurants(pos.lat, pos.lng, map);
    });
  } else {
    handleLocationError(error);
  }
}

function handleLocationError(error) {
  // log error
  console.warn(`ERROR(${error.code}): ${error.message}`);
  // Display error
  document.querySelector(
    ".map-loading-msg"
  ).textContent = `ERROR(${error.code}): ${error.message}`;
}
// optional parameters
const locationOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
};
