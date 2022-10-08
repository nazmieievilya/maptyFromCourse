'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const formEdit = document.querySelector('.Editform');

const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

const inputTypeEdit = document.querySelector('.form__input--typeEdit');
const inputDistanceEdit = document.querySelector('.form__input--distanceEdit');
const inputDurationEdit = document.querySelector('.form__input--durationEdit');
const inputCadenceEdit = document.querySelector('.form__input--cadenceEdit');
const inputElevationEdit = document.querySelector(
  '.form__input--elevationEdit'
);
const modal = document.querySelector('.modal');
const overlay = document.querySelector('.overlay');
const closeModal = document.querySelector('.btn--close-modal');
class Workout {
  workoutToEdit;
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type.replace(
      this.type[0],
      this.type[0].toUpperCase()
    )} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);

    this.cadence = cadence;
    this.calcPace(distance, duration);
    this._setDescription();
  }
  calcPace(distance, duration) {
    this.pace = duration / distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.calcSpeed(distance, duration);
    this._setDescription();
  }
  calcSpeed(distance, duration) {
    this.speed = distance / (duration / 60);
    return this.speed;
  }
}
class App {
  #map;
  #mapEvent;
  workouts = [];
  mapZoomLevel = 13;
  constructor() {
    this._getPosition();

    form.addEventListener('submit', this._newWorkout.bind(this));
    formEdit.addEventListener('submit', this._editWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    inputTypeEdit.addEventListener('change', this._toggleElevationFieldEdit);
    closeModal.addEventListener('click', this._toggleForm);
    this._getLocalStorage();
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
    } else alert('Your browser is not able to handle geolocation');
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.mapZoomLevel);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
    this.workouts.forEach(w => {
      this._renderWorkoutMarker(w);
    });
    document
      .querySelector('.workouts')
      .addEventListener('click', this._moveToPopup.bind(this));
  }

  _newWorkout(e) {
    e.preventDefault();
    // Validating data
    const isValid = (...inputs) => inputs.every(inp => inp > 0);
    // Inputs
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const cadence = +inputCadence.value;
    const elevation = +inputElevation.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    // creating obj
    if (type === 'running') {
      if (!isValid(distance, duration, cadence)) {
        return alert('Inputs is not valid');
      }
      workout = new Running(distance, duration, [lat, lng], cadence);
    }

    if (type === 'cycling') {
      if (!isValid(distance, duration, elevation)) {
        return alert('Inputs is not valid');
      }
      workout = new Cycling(distance, duration, [lat, lng], elevation);
    }
    this.workouts.push(workout);
    console.log(this.workouts);
    this._renderWorkoutMarker(workout);
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    // Render workout list
    this._renderWorkout(workout);
    this._hideForm();
    // setting the local storage
    this._setLocalStorage();
  }
  _rerenderWorkouts() {
    document.querySelectorAll('.workout').forEach(w => w.remove());
    this.workouts.forEach(w => this._renderWorkout(w));
  }
  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <div class="edit">
            <h2>Edit📝</h2>
          </div>
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🦶🏼' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          `;
    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>`;
    }
    if (workout.type === 'cycling') {
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }
  _renderWorkoutMarker(workout) {
    const [lat, lng] = workout.coords;
    const popup = L.popup({
      autoClose: false,
      closeOnClick: false,
      className: `${workout.type}-popup`,
    }).setContent(
      ` ${workout.type === 'running' ? '🦶🏼' : '🚴‍♀️'} ${workout.description} `
    );

    L.marker([lat, lng]).addTo(this.#map).bindPopup(popup).openPopup();
  }
  _showForm(mapE) {
    form.classList.remove('hidden');
    inputDistance.focus();
    this.#mapEvent = mapE;
  }
  _hideForm() {
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _toggleElevationField(e) {
    e.preventDefault();
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _toggleElevationFieldEdit(e) {
    e.preventDefault();

    inputCadenceEdit
      .closest('.form__row')
      .classList.toggle('form__row--hidden');
    inputElevationEdit
      .closest('.form__row')
      .classList.toggle('form__row--hidden');
  }
  _moveToPopup(e) {
    const workoutElement = e.target.closest('.workout');
    const editWorkout = e.target.closest('.edit');
    if (editWorkout) {
      this.workoutToEdit = this.workouts.find(
        w => w.id === workoutElement.dataset.id
      );
      this._addEditFormValues(e);
      return this._toggleForm();
    }
    if (!workoutElement) return;
    const workout = this.workouts.find(w => w.id === workoutElement.dataset.id);

    this.#map.setView(workout.coords, this.mapZoomLevel, {
      animate: true,
      pan: {
        duration: 0.7,
      },
    });
  }
  _addEditFormValues() {
    inputTypeEdit.value = this.workoutToEdit.type;
    inputDistanceEdit.value = this.workoutToEdit.distance;
    inputDurationEdit.value = this.workoutToEdit.duration;
    inputCadenceEdit.closest('.form__row').classList.add('form__row--hidden');
    inputElevationEdit.closest('.form__row').classList.add('form__row--hidden');
    this._rerenderWorkouts();
    if (this.workoutToEdit.type === 'cycling') {
      inputElevationEdit.value = this.workoutToEdit.elevationGain;
      return inputElevationEdit
        .closest('.form__row')
        .classList.remove('form__row--hidden');
    }
    if (this.workoutToEdit.type === 'running') {
      inputCadenceEdit.value = this.workoutToEdit.cadence;
      return inputCadenceEdit
        .closest('.form__row')
        .classList.remove('form__row--hidden');
    }
  }
  _toggleForm() {
    overlay.classList.toggle('hidden');
    modal.classList.toggle('hidden');
  }
  _editWorkout(e) {
    e.preventDefault();
    // checking for validity
    const isValid = (...inputs) => inputs.every(inp => inp > 0);
    const distance = +inputDistanceEdit.value;
    const duration = +inputDurationEdit.value;
    const cadence = +inputCadenceEdit.value;
    const elevGain = +inputElevationEdit.value;
    const [lat, lng] = this.workoutToEdit.coords;
    // Creating new obj
    let workout;
    console.log(this.workoutToEdit.type);
    // creating obj
    if (inputTypeEdit.value === 'running') {
      if (!isValid(distance, duration, cadence)) {
        return alert('Inputs is not valid');
      }
      workout = new Running(distance, duration, [lat, lng], cadence);
    }
    if (inputTypeEdit.value === 'cycling') {
      if (!isValid(distance, duration, elevGain)) {
        return alert('Inputs is not valid');
      }
      workout = new Cycling(distance, duration, [lat, lng], elevGain);
    }

    console.log(workout);
    // replacing old obj
    const index = this.workouts.indexOf(this.workoutToEdit);
    this.workouts[index] = workout;
    this._rerenderWorkouts();
    this._toggleForm();
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.workouts));
  }
  _getLocalStorage() {
    const workoutsLS = JSON.parse(localStorage.getItem('workouts'));
    if (!workoutsLS) return;
    this.workouts = workoutsLS;
    this.workouts.forEach(w => {
      this._renderWorkout(w);
    });
    // this.workouts.__proto__ = Object.create(Workout.prototype);
    return workoutsLS;
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}
const app = new App();

// ADD ABILITY TO EDIT WORKOUT
// Add note icon to workout element
// Handling click event and opening form
