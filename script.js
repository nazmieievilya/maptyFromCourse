'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    function (position) {
      const { latitude } = position.coords;
      const { longitude } = position.coords;
      const coords = [latitude, longitude];
      console.log(coords);
      const map = L.map('map').setView(coords, 13);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      map.on('click', function (a) {
        const { lat, lng } = a.latlng;
        const popup = L.popup({
          autoClose: false,
          closeOnClick: false,
          className: 'running-popup',
        }).setContent('Шо ти<br />я карта<br /> я карта</p>');
        console.log(popup);
        L.marker([lat, lng]).addTo(map).bindPopup(popup).openPopup();
      });
    },
    function () {
      alert('Could not get your position');
    }
  );
} else alert('Your browser is not able to handle geolocation');
