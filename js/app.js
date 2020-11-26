/**
 * A basic restaurant class
 */
class Restaurant {
  constructor(
    name,
    address,
    lat,
    lng,
    averageRating = 0,
    totalRatings = 0,
    placeId,
    source,
    reviews = [],
    photos = []
  ) {
    this.name = name;
    this.address = address;
    this.lat = lat;
    this.lng = lng;
    this.averageRating = averageRating;
    this.totalRatings = totalRatings;
    this.placeId = placeId;
    this.source = source;
    this.reviews = reviews;
    this.photos = photos;
    this.location = new google.maps.LatLng(lat, lng);
  }
}

// A place to store restarant data for later reference
// You can also use localStorage.
const RESTAURANTS_DB = {
  restaurants: [],
};

// App methods
const APP = {
  /**
   * Get restaurants from all API sources
   * (local JSON, Google) and formats the data
   */
  getRestaurants(lat, lng, map) {
    this._handleAllRestaurantData(
      [this._getJSONData(), this._getGoogleAPIData(lat, lng, map)],
      map
    );
  },

  /**
   * Fetch restaurants from local JSON file
   * Returns a Promise object with data sourced from local JSON file
   */
  _getJSONData() {
    const LOCALDB_URL = "../data/restaurants.json";
    return fetch(LOCALDB_URL)
      .then((response) => {
        return response.ok
          ? response.json()
          : Promise.reject(response.statusText);
      })
      .catch((error) => {
        throw new Error(error);
      });
  },

  /**
   * Google API requests for nearby restaurants
   * Returns a Promise object with data sourced from google API
   */
  _getGoogleAPIData(lat, lng, map) {
    return new Promise((resolve, reject) => {
      const infoRequest = {
        location: new google.maps.LatLng(lat, lng),
        radius: 2500,
        keyword: "restaurant",
      };
      const searchService = new google.maps.places.PlacesService(map);
      searchService.nearbySearch(infoRequest, function (results, status) {
        if (status === "OK" || status === "ZERO_RESULTS") {
          resolve(results);
        } else {
          reject(new Error(status));
        }
      });
    }).catch(console.error);
  },

  /**
   * Handles Formating of recieved restaurant data
   * from JSON file and google API requests
   * it has 2 parameters
   * *restaurantDataPromiseArray* - An array containing all promise(s) from API requests
   * *map* your map object
   */

  _handleAllRestaurantData(restaurantDataPromiseArray, map) {
    return Promise.all(restaurantDataPromiseArray)
      .then((restaurants) => {
        const restaurantData = [];
        // save restaurant_ids/place_ids for restaurants in our JSON
        // we use that to compare with place_ids from google sourced restaurants
        // so we don't duplicate restaurants
        const JSONRestaurantIDs = [];

        const restaurantsFromJSON = restaurants[0]; // first item in our promise array
        const restaurantsFromGoogleAPI = restaurants[1]; // second item in our promise array

        //function to render the new restaurant added to list in the sidebar
        function renderNewRestaurantList(data) {
          const listItem = document.createElement("li");
          const restaurantList = document.querySelector("#restaurants-list");

          listItem.innerHTML = `<section class="restaurant-details">
                                <h3 class="restaurant-name">${data.restaurantName}</h3>
                                <p class="restaurant-rating">${data.averageRating} Stars</p>
                                <p class="restaurant-address">${data.address}</p>
                              </section>`;
          restaurantList.appendChild(listItem);
        }

        // Adding a restaurant by right clicking on a specific place on a map
        map.addListener("rightclick", (mapsMouseEvent) => {
          var restaurantName = document.getElementById("restaurantName");
          var address = document.getElementById("address");
          var restaurantRatings = document.getElementById("restaurantRatings");
          var restaurantButton = document.getElementById("restaurantButton");
          var span = document.getElementsByClassName("close");
          newRestaurantSection.style.display = "block";

          restaurantButton.addEventListener("click", function () {
            const newRestaurantMarker = new google.maps.Marker({
              position: mapsMouseEvent.latLng,
              map: map,
              title: restaurantName.value + "\n" + address.value,
              icon: "../img/marker.png",
            });
            let newRestaurantData = {
              restaurantName: restaurantName.value,
              address: address.value,
              averageRating:
                restaurantRatings.options[restaurantRatings.selectedIndex]
                  .value,
              totalRatings: "",
              source: "",
              reviews: "",
            };

            restaurantsFromJSON.push(newRestaurantData);
            console.log(restaurantsFromJSON);

            newRestaurantSection.style.display = "none";
            var averageButton = document.getElementById("btn-lg");

            //adding the new restaurant on the sidebar once filtering is done
            averageButton.addEventListener("click", (event) => {
              event.preventDefault();
              var result = ratingStars.options[ratingStars.selectedIndex].value;
              switch (result) {
                case "None":
                  if (newRestaurantData.averageRating === 0) {
                    renderNewRestaurantList(newRestaurantData);
                  }

                  break;
                case "oneRating":
                  if (newRestaurantData.averageRating >= 1.0) {
                    renderNewRestaurantList(newRestaurantData);
                  }
                  break;
                case "twoRating":
                  if (newRestaurantData.averageRating >= 2.0) {
                    renderNewRestaurantList(newRestaurantData);
                  }
                  break;
                case "threeRating":
                  if (newRestaurantData.averageRating >= 3.0) {
                    renderNewRestaurantList(newRestaurantData);
                  }
                  break;
                case "fourRating":
                  if (newRestaurantData.averageRating >= 4.0) {
                    renderNewRestaurantList(newRestaurantData);
                  }
                  break;
                case "fiveRating":
                  if (newRestaurantData.averageRating === 5.0) {
                    renderNewRestaurantList(newRestaurantData);
                  } else {
                    restaurantList.innerHTML = `<p> <strong> NOTHING TO DISPLAY </strong></p>`;
                  }
                  break;
              }
            });
          });

          span[1].onclick = function () {
            newRestaurantSection.style.display = "none";
          };
        });

        for (const restaurant of restaurantsFromJSON) {
          // A google API method to only show restaurants within the area
          // of the map, since the JSON file, may contain restaurants from
          // various locations outside the users map area.
          if (
            map.getBounds().contains({
              lat: restaurant.lat,
              lng: restaurant.lng,
            })
          ) {
            let jsonRestaurant = new Restaurant(
              restaurant.restaurantName,
              restaurant.address,
              restaurant.lat,
              restaurant.lng,
              restaurant.averageRating,
              restaurant.totalRatings,
              restaurant.restaurantId,
              restaurant.source,
              restaurant.reviews,
              restaurant.photos
            );

            restaurantData.push(jsonRestaurant);
            // save ids to compare with google sourced restaurants
            // to avoid duplicating restaurants
            JSONRestaurantIDs.push(restaurant.restaurantId);
          }
        }
        for (const restaurant of restaurantsFromGoogleAPI) {
          if (!JSONRestaurantIDs.includes(restaurant.place_id)) {
            let googleRestaurant = new Restaurant(
              restaurant.name,
              restaurant.vicinity,
              restaurant.geometry.location.lat(),
              restaurant.geometry.location.lng(),
              restaurant.rating,
              restaurant.user_ratings_total,
              restaurant.place_id,
              restaurant.scope
            );
            restaurantData.push(googleRestaurant);
          }
        }

        // Add reviews for google sourced restaurants
        this._addReviewsFromGoogleAPI(restaurantData, map);
        // Saved restaurant data
        // so you are not fetching it all the time
        this._storeRestaurantData(restaurantData);
        // Render/display restaurant data to the browser
        this.displayRestaurants(RESTAURANTS_DB.restaurants, map);
        // set up and display markers
      })
      .catch((error) => {
        console.error(error);
      });
  },

  /**
   * Get reviews from Google Maps API requests
   * Add the reviews to Google sourced restaurants
   */
  _addReviewsFromGoogleAPI(restaurantData, map) {
    const googleAPIRestaurantIds = [];
    for (const restaurant of restaurantData) {
      if (restaurant.source === "GOOGLE") {
        googleAPIRestaurantIds.push(restaurant.placeId);
      }
    }
    for (const id of googleAPIRestaurantIds) {
      this._getReviews(id, restaurantData, map);
    }
  },

  /**
   * Place details request to get reviews
   * for Google sourced restaurants
   */
  _getReviews(restaurantId, restaurantData, map) {
    const searchService = new google.maps.places.PlacesService(map);
    const request = {
      placeId: restaurantId,
      fields: ["reviews"],
    };
    searchService.getDetails(request, function (place, status) {
      if (status === "OK") {
        for (const restaurant of restaurantData) {
          if (restaurant.placeId === restaurantId) {
            const restaurantReviews = [];
            if (place.reviews !== undefined && place.reviews.length > 0) {
              for (const review of place.reviews) {
                let reviewInfo = {
                  name: review.author_name,
                  rating: review.rating,
                  comment: review.text,
                };
                restaurantReviews.push(reviewInfo);
              }
            }

            for (const review of restaurantReviews) {
              restaurant.reviews.push(review);
            }
          }
        }
      }
    });
  },

  /**
   * Store all restaurants
   * that we can reference later
   */
  _storeRestaurantData(restaurantData) {
    for (const restaurant of restaurantData) {
      RESTAURANTS_DB.restaurants.push(restaurant);
    }
  },

  /**
   * The restaurant list
   * is displayed on the side bar
   */
  renderTheList(data) {
    const listItem = document.createElement("li");
    const restaurantList = document.querySelector("#restaurants-list");
    listItem.dataset.placeId = data.placeId;
    listItem.innerHTML = `<section class="restaurant-details">
                                <h3 class="restaurant-name">${data.name}</h3> 
                                <p class="restaurant-rating">${data.averageRating} Stars</p> 
                                <p class="restaurant-address">${data.address}</p>
                              </section>`;
    restaurantList.appendChild(listItem);
  },

  displayRestaurants(restaurants, map) {
    const restaurantList = document.querySelector("#restaurants-list");
    var googlePlaceReviews = document.getElementById("google_reviews");
    var placeDetailsSection = document.getElementById("placeDetails-section");
    placeDetailsSection.style.display = "none";
    var span = document.getElementsByClassName("close");

    var reviewsSection = document.getElementById("reviews-section");
    reviewsSection.style.display = "none";
    var starRating = document.getElementById("starRating");
    var name = document.getElementById("name");
    var comment = document.getElementById("comment");
    var newReviews = document.getElementById("newReviews");
    var ratingsButton = document.getElementById("ratings-button");
    var newRatings = document.getElementById("newRatings");

    const ratingStars = document.getElementById("ratingStars");
    var averageButton = document.getElementById("btn-lg");

    // create markers
    for (const restaurant of restaurants) {
      const marker = new google.maps.Marker({
        position: restaurant.location,
        map: map,
        title: restaurant.name + "\n" + restaurant.address,
        placeId: restaurant.placeId,
        randomTxt: "lorem ipsum",
        // reviews stored in the marker object option
        reviews: restaurant.reviews,
        icon: "../img/marker.png",
      });

      // the filter button filters restaurants on the list based on the average rating of the stars
      averageButton.addEventListener("click", (event) => {
        event.preventDefault();
        var result = ratingStars.options[ratingStars.selectedIndex].value;
        switch (result) {
          case "None":
            if (restaurant.averageRating === 0) {
              this.renderTheList(restaurant);
            }

            break;
          case "oneRating":
            if (restaurant.averageRating >= 1.0) {
              this.renderTheList(restaurant);
            }
            break;
          case "twoRating":
            if (restaurant.averageRating >= 2.0) {
              this.renderTheList(restaurant);
            }
            break;
          case "threeRating":
            if (restaurant.averageRating >= 3.0) {
              this.renderTheList(restaurant);
            }
            break;
          case "fourRating":
            if (restaurant.averageRating >= 4.0) {
              this.renderTheList(restaurant);
            }
            break;
          case "fiveRating":
            if (restaurant.averageRating === 5.0) {
              this.renderTheList(restaurant);
            } else {
              restaurantList.innerHTML = `<p> <strong> NOTHING TO DISPLAY </strong></p>`;
            }
            break;
        }
      });

      document.body.addEventListener("change", (e) => {
        if (e.target.matches("select")) {
          restaurantList.innerHTML = "";
        }
      });

      // Display reviews when you click on marker
      google.maps.event.addListener(marker, "click", () => {
        let reviewData = "";
        placeDetailsSection.style.display = "block";

        if (marker.reviews.length > 0) {
          reviewsSection.style.display = "none";
          for (const reviewer of marker.reviews) {
            // Display Reviews
            reviewData += `<div><h1> Restaurant Reviews </h1> <div>
            <div>NAME: ${reviewer.name}</div>
                          <div>COMMENT:<em>${reviewer.comment}</em> </div>
                          <div>RATING: ${reviewer.rating} star(s)</div>`;
          }
        } else {
          reviewData = "NO REVIEWS";
        }

        googlePlaceReviews.innerHTML = reviewData;
        span[0].onclick = function () {
          placeDetailsSection.style.display = "none";
        };
        if (restaurant.source === "local") {
          reviewsSection.style.display = "block";
          googlePlaceReviews.innerHTML =
            "<img src='" +
            restaurant.photos[0].streetviewURL +
            "'/>" +
            reviewData;
          ratingsButton.addEventListener("click", function () {
            newReviews.innerHTML =
              "NAME: " +
              name.value +
              "<br>" +
              "COMMENT: " +
              comment.value +
              "<br>" +
              "RATING: " +
              starRating.value;
            newRatings.style.display = "none";
          });
        }
      });
    }

    // Optional display or reviews when a restaurant
    // on the restaurant list is clicked
    restaurantList.addEventListener("click", function (event) {
      if (event.target.closest("li")) {
        const restaurantPlaceId = event.target.closest("li").dataset.placeId;
        for (const restaurant of RESTAURANTS_DB.restaurants) {
          if (restaurantPlaceId === restaurant.placeId) {
            let reviewData = "";

            if (restaurant.reviews.length > 0) {
              for (const reviewer of restaurant.reviews) {
                // Display Reviews
                reviewData += `NAME: ${reviewer.name},\nCOMMENT: ${reviewer.comment},\nRATING: ${reviewer.rating} Stars\n\n`;
              }
            } else {
              reviewData = "NO REVIEWS";
            }

            alert(reviewData);
          }
        }
      }
    });
  },
};
