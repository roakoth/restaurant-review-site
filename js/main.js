function initMap() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleLocationError,
      locationOptions
    );
  } else {
    handleLocationError(error);
  }
}
