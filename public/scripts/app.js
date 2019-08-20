/*
 * @license
 * Your First PWA Codelab (https://g.co/codelabs/pwa)
 * Copyright 2019 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License
 */
'use strict';

const weatherApp = {
  selectedLocations: {},
  createdEvents: {},
  // addDialogContainer: document.getElementById('addDialogContainer'),
  addDialogContainer1: document.getElementById('addDialogContainer1'),
};

var imageCapture;
const loginStatus = {
  loggedIn: false,
  provider: {}
}

function isLoggedIn() {
  return loginStatus.loggedIn;
}

function login() {
  // alert("Login called");
  loginStatus.loggedIn = true;
  toggleLoginForm();
  loadData();
  toggleAddButton();
}

function toggleAddButton() {
  document.getElementById('butAddEvent').removeAttribute('hidden');
}
function toggleLoginForm() {
  document.getElementById("loginformid").classList.toggle('visible');
}

/**
 * Toggles the visibility of the add location dialog box.
 */
function toggleAddDialog() {
  weatherApp.addDialogContainer.classList.toggle('visible');
}

function toggleAddEventDialog(eventid) {
  const event = weatherApp.createdEvents[eventid];
  if (event) {
    document.getElementById('eventid').children[1].textContent = event.id;
    document.getElementById('eventnameid').value = event.name;
    document.getElementById('output').src = event.image;
    const categorySelect = document.getElementById('selectCategory');
    var opt;
    for (var i = 0, len = categorySelect.options.length; i < len; i++) {
      opt = categorySelect.options[i];
      if (opt.textContent === event.category) {
        categorySelect.selectedIndex = i;
        break;
      }
    }
    let contextValue = event.context;
    if (contextValue)
      contextValue = '';
    document.getElementById('contextDataId').value = contextValue;
    if (event.location)
      document.querySelector('.geolocation .value').textContent = event.location.longitude + ',' + event.location.latitude;
  }
  weatherApp.addDialogContainer1.classList.toggle('visible');
}

function invokeAddEventDialog() {
  const id = Object.keys(weatherApp.createdEvents).length + 1;
  toggleAddEventDialog(id);
  document.getElementById('eventid').children[1].textContent = id;
}

/**
 * Event handler for butDialogAdd, adds the selected location to the list.
 */
function addLocation() {
  // Hide the dialog
  toggleAddDialog();
  // Get the selected city
  const select = document.getElementById('selectCityToAdd');
  const selected = select.options[select.selectedIndex];
  const geo = selected.value;
  const label = selected.textContent;
  const location = { label: label, geo: geo };
  // Create a new card & get the weather data from the server
  const card = getForecastCard(location);
  getForecastFromNetwork(geo).then((forecast) => {
    renderForecast(card, forecast);
  });
  // Save the updated list of selected cities.
  weatherApp.selectedLocations[geo] = location;
  saveLocationList(weatherApp.selectedLocations);
}

function addEvent() {
  const id = document.getElementById('eventid').children[1].textContent;
  toggleAddEventDialog(id);

  // Get the selected city

  const eventName = document.getElementById('eventnameid').value;
  const image = document.getElementById('output').src;
  const categorySelect = document.getElementById('selectCategory');
  const categorySelected = categorySelect.options[categorySelect.selectedIndex];
  const context = document.getElementById('contextDataId').value;
  const geolocationString = document.querySelector('.geolocation .value').textContent;
  const values = geolocationString.split(',');
  const location = { longitude: values[0], latitude: values[1] };
  const event = {
    id: id, name: eventName, image: image, category: categorySelected.textContent,
    context: context, timezone: 'America/New_York', time: 0, location: location
  };
  // Create a new card & get the weather data from the server
  const card = getEventCard(event);
  // no api calls as all the data is available here only.
  renderEvent(card, { event: event });
  // Save the updated list of selected cities.
  weatherApp.createdEvents[id] = event;
  saveCreatedEventsList(weatherApp.createdEvents);
}

/**
 * Event handler for .remove-city, removes a location from the list.
 *
 * @param {Event} evt
 */
function removeLocation(evt) {
  const parent = evt.srcElement.parentElement;
  parent.remove();
  if (weatherApp.selectedLocations[parent.id]) {
    delete weatherApp.selectedLocations[parent.id];
    saveLocationList(weatherApp.selectedLocations);
  }
}

/**
 * Event handler for .remove-city, removes a location from the list.
 *
 * @param {Event} evt
 */
function removeEvent(evt) {
  const parent = evt.srcElement.parentElement;
  parent.remove();
  if (weatherApp.createdEvents[parent.id]) {
    delete weatherApp.createdEvents[parent.id];
    saveCreatedEventsList(weatherApp.createdEvents);
  }
}


/**
 * Event handler for .remove-city, removes a location from the list.
 *
 * @param {Event} evt
 */
function editEvent(evt) {
  const parent = evt.srcElement.parentElement;
  if (weatherApp.createdEvents[parent.id]) {
    toggleAddEventDialog(parent.id);
  }
}


/**
 * Renders the forecast data into the card element.
 *
 * @param {Element} card The card element to update.
 * @param {Object} data Weather forecast data to update the element with.
 */
function renderForecast(card, data) {
  if (!data) {
    // There's no data, skip the update.
    return;
  }

  // Find out when the element was last updated.
  const cardLastUpdatedElem = card.querySelector('.card-last-updated');
  const cardLastUpdated = cardLastUpdatedElem.textContent;
  const lastUpdated = parseInt(cardLastUpdated);

  // If the data on the element is newer, skip the update.
  if (lastUpdated >= data.currently.time) {
    return;
  }
  cardLastUpdatedElem.textContent = data.currently.time;

  // Render the forecast data into the card.
  card.querySelector('.description').textContent = data.currently.summary;
  const forecastFrom = luxon.DateTime
    .fromSeconds(data.currently.time)
    .setZone(data.timezone)
    .toFormat('DDDD t');
  card.querySelector('.date').textContent = forecastFrom;
  card.querySelector('.current .icon')
    .className = `icon ${data.currently.icon}`;
  card.querySelector('.current .temperature .value')
    .textContent = Math.round(data.currently.temperature);
  card.querySelector('.current .humidity .value')
    .textContent = Math.round(data.currently.humidity * 100);
  card.querySelector('.current .wind .value')
    .textContent = Math.round(data.currently.windSpeed);
  card.querySelector('.current .wind .direction')
    .textContent = Math.round(data.currently.windBearing);
  const sunrise = luxon.DateTime
    .fromSeconds(data.daily.data[0].sunriseTime)
    .setZone(data.timezone)
    .toFormat('t');
  card.querySelector('.current .sunrise .value').textContent = sunrise;
  const sunset = luxon.DateTime
    .fromSeconds(data.daily.data[0].sunsetTime)
    .setZone(data.timezone)
    .toFormat('t');
  card.querySelector('.current .sunset .value').textContent = sunset;

  // Render the next 7 days.
  const futureTiles = card.querySelectorAll('.future .oneday');
  futureTiles.forEach((tile, index) => {
    const forecast = data.daily.data[index + 1];
    const forecastFor = luxon.DateTime
      .fromSeconds(forecast.time)
      .setZone(data.timezone)
      .toFormat('ccc');
    tile.querySelector('.date').textContent = forecastFor;
    tile.querySelector('.icon').className = `icon ${forecast.icon}`;
    tile.querySelector('.temp-high .value')
      .textContent = Math.round(forecast.temperatureHigh);
    tile.querySelector('.temp-low .value')
      .textContent = Math.round(forecast.temperatureLow);
  });

  // If the loading spinner is still visible, remove it.
  const spinner = card.querySelector('.card-spinner');
  if (spinner) {
    card.removeChild(spinner);
  }
}

/**
 * Get's the latest forecast data from the network.
 *
 * @param {string} coords Location object to.
 * @return {Object} The weather forecast, if the request fails, return null.
 */
function getForecastFromNetwork(coords) {
  return fetch(`/forecast/${coords}`)
    .then((response) => {
      return response.json();
    })
    .catch(() => {
      return null;
    });
}

/**
 * Renders the forecast data into the card element.
 *
 * @param {Element} card The card element to update.
 * @param {Object} data Weather forecast data to update the element with.
 */
function renderEvent(card, data) {
  if (!data) {
    // There's no data, skip the update.
    return;
  }

  // Find out when the element was last updated.
  const cardLastUpdatedElem = card.querySelector('.card-last-updated');
  const cardLastUpdated = cardLastUpdatedElem.textContent;
  const lastUpdated = parseInt(cardLastUpdated);

  // If the data on the element is newer, skip the update.
  if (lastUpdated >= data.event.time) {
    return;
  }
  cardLastUpdatedElem.textContent = data.event.time;

  // Render the forecast data into the card.
  card.querySelector('.location').textContent = data.event.name;
  card.querySelector('.category .value').textContent = data.event.category;
  card.querySelector('.context .value').textContent = data.event.context;
  const createDate = luxon.DateTime
    .fromSeconds(data.event.time)
    .setZone(data.event.timezone)
    .toFormat('DDDD t');
  card.querySelector('.date').textContent = createDate;
  card.querySelector('.current .image')
    .innerHTML = '<img src=' + data.event.image + ' style="width:100%">';
  card.querySelector('.latitude .value')
    .textContent = data.event.location.latitude;
  card.querySelector('.longitude .value')
    .textContent = data.event.location.longitude;

  // If the loading spinner is still visible, remove it.
  const spinner = card.querySelector('.card-spinner');
  if (spinner) {
    card.removeChild(spinner);
  }
}

/**
 * Get's the latest forecast data from the network.
 *
 * @param {string} coords Location object to.
 * @return {Object} The weather forecast, if the request fails, return null.
 */
function getEventFromNetwork(id) {
  return fetch(`/event/${id}`)
    .then((response) => {
      return response.json();
    })
    .catch(() => {
      console.error('error getting event ', id);
      return null;
    });
}

/**
 * Get's the cached forecast data from the caches object.
 *
 * @param {string} coords Location object to.
 * @return {Object} The weather forecast, if the request fails, return null.
 */
function getForecastFromCache(coords) {
  // CODELAB: Add code to get weather forecast from the caches object.
  if (!('caches' in window)) {
    return null;
  }
  const url = `${window.location.origin}/forecast/${coords}`;
  return caches.match(url)
    .then((response) => {
      if (response) {
        return response.json();
      }
      return null;
    })
    .catch((err) => {
      console.error('Error getting data from cache', err);
      return null;
    });
}

/**
 * Get's the cached forecast data from the caches object.
 *
 * @param {string} coords Location object to.
 * @return {Object} The weather forecast, if the request fails, return null.
 */
function getEventFromCache(event) {
  // CODELAB: Add code to get weather forecast from the caches object.
  if (!('caches' in window)) {
    return null;
  }
  const url = `${window.location.origin}/event/${event}`;
  return caches.match(url)
    .then((response) => {
      if (response) {
        return response.json();
      }
      return null;
    })
    .catch((err) => {
      console.error('Error getting event data from cache', err);
      return null;
    });
}

/**
 * Get's the HTML element for the weather forecast, or clones the template
 * and adds it to the DOM if we're adding a new item.
 *
 * @param {Object} location Location object
 * @return {Element} The element for the weather forecast.
 */
function getForecastCard(location) {
  const id = location.geo;
  const card = document.getElementById(id);
  if (card) {
    return card;
  }
  const newCard = document.getElementById('weather-template').cloneNode(true);
  newCard.querySelector('.location').textContent = location.label;
  newCard.setAttribute('id', id);
  newCard.querySelector('.remove-city')
    .addEventListener('click', removeLocation);
  document.querySelector('main').appendChild(newCard);
  newCard.removeAttribute('hidden');
  return newCard;
}

/**
 * Get's the HTML element for the weather forecast, or clones the template
 * and adds it to the DOM if we're adding a new item.
 *
 * @param {Object} location Location object
 * @return {Element} The element for the weather forecast.
 */
function getEventCard(event) {
  const id = event.id;
  const card = document.getElementById(id);
  if (card) {
    return card;
  }
  const newCard = document.getElementById('event-template').cloneNode(true);
  // newCard.querySelector('.geolocation').textContent = eventid;
  newCard.setAttribute('id', id);
  newCard.querySelector('.remove-city')
    .addEventListener('click', removeEvent);
  newCard.querySelector('.edit-city')
    .addEventListener('click', editEvent);
  document.querySelector('main').appendChild(newCard);
  newCard.removeAttribute('hidden');
  return newCard;
}


/**
 * Gets the latest weather forecast data and updates each card with the
 * new data.
 */
function updateData() {
  Object.keys(weatherApp.selectedLocations).forEach((key) => {
    const location = weatherApp.selectedLocations[key];
    const card = getForecastCard(location);
    // CODELAB: Add code to call getForecastFromCache.
    getForecastFromCache(location.geo)
      .then((forecast) => {
        renderForecast(card, forecast);
      });
    // Get the forecast data from the network.
    getForecastFromNetwork(location.geo)
      .then((forecast) => {
        renderForecast(card, forecast);
      });
  });
}


/**
 * Gets the latest weather forecast data and updates each card with the
 * new data.
 */
function updateEventData() {
  Object.keys(weatherApp.createdEvents).forEach((key) => {
    const event = weatherApp.createdEvents[key];
    const card = getEventCard(event);
    // CODELAB: Add code to call getForecastFromCache.
    getEventFromCache(key)
      .then((event) => {
        renderEvent(card, event);
      });
    // Get the forecast data from the network.
    getEventFromNetwork(key)
      .then((event) => {
        renderEvent(card, event);
      });
  });
}

/**
 * Saves the list of locations.
 *
 * @param {Object} locations The list of locations to save.
 */
function saveLocationList(locations) {
  const data = JSON.stringify(locations);
  localStorage.setItem('locationList', data);
}

function saveCreatedEventsList(events) {
  const data = JSON.stringify(events);
  localStorage.setItem('eventsList', data);
}

/**
 * Loads the list of saved location.
 *
 * @return {Array}
 */
function loadLocationList() {
  let locations = localStorage.getItem('locationList');
  if (locations) {
    try {
      locations = JSON.parse(locations);
    } catch (ex) {
      locations = {};
    }
  }
  if (!locations || Object.keys(locations).length === 0) {
    const key = '40.7720232,-73.9732319';
    locations = {};
    locations[key] = { label: 'New York City', geo: '40.7720232,-73.9732319' };
  }
  return locations;
}

/**
 * Loads the list of saved location.
 *
 * @return {Array}
 */
function loadEventsList() {
  let events = localStorage.getItem('eventsList');
  if (events) {
    try {
      events = JSON.parse(events);
    } catch (ex) {
      events = {};
    }
  }
  if (!events || Object.keys(events).length === 0) {
    const key = '1';
    events = {};
    events[key] = { id: key, name: 'Dummy Event' };
  }
  return events;
}

function doSomethingWithFiles(fileList, output) {
  let file = null;

  for (let i = 0; i < fileList.length; i++) {
    if (fileList[i].type.match(/^image\//)) {
      file = fileList[i];
      break;
    }
  }

  if (file !== null) {
    output.src = URL.createObjectURL(file);
    localStorage.setItem('imageURL', output.src);
  }
}

function drawCanvas(canvas, img) {
  canvas.width = getComputedStyle(canvas).width.split('px')[0];
  canvas.height = getComputedStyle(canvas).height.split('px')[0];
  let ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
  let x = (canvas.width - img.width * ratio) / 2;
  let y = (canvas.height - img.height * ratio) / 2;
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height,
    x, y, img.width * ratio, img.height * ratio);
}

function doVideoProcessing() {

  const player = document.getElementById('player');
  const canvas = document.getElementById('canvas');
  // const context = canvas.getContext('2d');
  const img = document.getElementById('output');
  const captureButton = document.getElementById('capture');

  const constraints = {
    video: true,
  };

  captureButton.addEventListener('click', () => {
    // Draw the video frame to the canvas.
    // context.drawImage(player, 0, 0, canvas.width, canvas.height);
    drawCanvas(canvas, player);
    // Other browsers will fall back to image/png
    img.src = canvas.toDataURL('image/webp');
    // Stop all video streams.
    player.srcObject.getVideoTracks().forEach(track => track.stop());
  });

  // Attach the video stream to the video element and autoplay.
  navigator.mediaDevices.getUserMedia(constraints)
    .then((stream) => {
      player.srcObject = stream;
    });
}

function gotMedia(mediaStream) {
  const mediaStreamTrack = mediaStream.getVideoTracks()[0];
  imageCapture = new ImageCapture(mediaStreamTrack);
  // console.log(imageCapture);
}

function takePhoto() {
  const img = document.querySelector('output');
  imageCapture.takePhoto()
    .then(blob => {
      img.src = URL.createObjectURL(blob);
      img.onload = () => { URL.revokeObjectURL(this.src); }
    })
    .catch(error => console.error('takePhoto() error:', error));
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else {
    console.log("Geolocation is not supported by this browser.");
  }
}

function showPosition(position) {
  document.querySelector('.geolocation .value').textContent = position.coords.longitude + ',' + position.coords.latitude;
}

function loadData() {
  if (loginStatus.loggedIn) {
    weatherApp.selectedLocations = loadLocationList();
    weatherApp.createdEvents = loadEventsList();
    updateData();
    updateEventData();
  }
}

/**
 * Initialize the app, gets the list of locations from local storage, then
 * renders the initial data.
 */
function init() {
  // Get the location list, and update the UI.
  loadData();


  // Set up the event handlers for all of the buttons.
  document.getElementById('butRefresh').addEventListener('click', updateData);
  // document.getElementById('butAdd').addEventListener('click', toggleAddDialog);
  document.getElementById('butAddEvent').addEventListener('click', invokeAddEventDialog);
  document.getElementById('butDialogCancel')
    .addEventListener('click', toggleAddDialog);
  document.getElementById('butEventDialogCancel')
    .addEventListener('click', toggleAddEventDialog);

  document.getElementById('butDialogAdd')
    .addEventListener('click', addLocation);

  document.getElementById('butEventDialogAdd')
    .addEventListener('click', addEvent);

  document.getElementById('butGetLocation').addEventListener('click', getLocation);

  const output = document.getElementById('output');
  const fileInput = document.getElementById('file-input');
  fileInput.addEventListener('change', (e) => doSomethingWithFiles(e.target.files, output));

  const supported = 'mediaDevices' in navigator;

  document.getElementById('loginformid').addEventListener('submit', (e) => {
    e.preventDefault();
    login();
  });



  // doVideoProcessing();
}



init();
