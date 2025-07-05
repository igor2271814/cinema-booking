// Состояние приложения
const state = {
  selectedCinema: null,
  selectedMovie: null,
  selectedSession: null,
  selectedSeats: [],
  bookings: JSON.parse(localStorage.getItem('bookings')) || [],
  cinemasData: [], // данные о кинотеатрах
  moviesData: { movies: [] } // фильмы
};

// DOM элементы
const elements = {
  cinemaList: document.getElementById('cinema-list'),
  moviesList: document.getElementById('movies-list'),
  modal: document.getElementById('modal'),
  seatsModal: document.getElementById('seats-modal'),
  modalTitle: document.getElementById('modal-title'),
  seatsMovieTitle: document.getElementById('seats-movie-title'),
  seatsSessionTime: document.getElementById('seats-session-time'),
  sessionsContainer: document.getElementById('sessions-container'),
  seatsGrid: document.getElementById('seats-grid'),
  confirmBooking: document.getElementById('confirm-booking')
};

// Загрузка данных о фильмах
async function loadMoviesData() {
    try {
        const response = await fetch('data.json');
        const allMovies = await response.json();

        // Получаем id текущего кинотеатра
        const cinemaId = state.selectedCinema?.id;

        if (!cinemaId || !allMovies[cinemaId]) {
            state.moviesData.movies = [];
            return;
        }

        // Фильмы только этого кинотеатра
        state.moviesData.movies = allMovies[cinemaId];
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

// Загрузка данных о кинотеатрах
async function loadCinemasData() {
  try {
      const response = await fetch('cinemas.json');
      state.cinemasData = await response.json();
      console.log('Кинотеатры загружены:', state.cinemasData);
  } catch (error) {
      console.error('Ошибка загрузки кинотеатров:', error);
  }
}

// Рендеринг кинотеатров
function renderCinemas() {
    const cinemaListElement = document.getElementById('cinema-list');
  
    if (!cinemaListElement) return;
  
    cinemaListElement.innerHTML = '';
  
    if (state.cinemasData.length === 0) {
        cinemaListElement.innerHTML = '<p class="no-movies">Кинотеатров не найдено</p>';
        return;
    }
  
    state.cinemasData.forEach(cinema => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <img src="${cinema.image}" alt="${cinema.name}">
            <h3>${cinema.name}</h3>
            <p style="font-size: 14px; color: #666;">${cinema.address}</p>
        `;
        
        // 👇 ВСТАВЬ СЮДА — при клике переходим на cinema-and-movies.html
        card.addEventListener('click', () => {
            localStorage.setItem('selectedCinema', JSON.stringify(cinema));
            window.location.href = 'cinema-and-movies.html'; // Переход на страницу с информацией и фильмами
        });
  
        cinemaListElement.appendChild(card);
    });
  }
  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Проверка сохранённой темы при загрузке
document.addEventListener('DOMContentLoaded', function () {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
});
// Рендеринг фильмов
function renderMovies(genre = 'all') {
    if (!elements.moviesList) {
        console.error('Элемент movies-list не найден!');
        return;
    }

    elements.moviesList.innerHTML = '';

    const moviesToShow = genre === 'all'
        ? state.moviesData.movies
        : state.moviesData.movies.filter(movie => movie.genre === genre);

    if (moviesToShow.length === 0) {
        elements.moviesList.innerHTML = '<p class="no-movies">Фильмов не найдено</p>';
        return;
    }

    moviesToShow.forEach(movie => {
        const movieElement = document.createElement('div');
        movieElement.className = 'movie-card';
        movieElement.innerHTML = `
            <img src="${movie.poster}" alt="${movie.title}" onerror="this.onerror=null;this.src='https://placehold.co/300x450?text=Постер+не+найден'">
            <h3>${movie.title}</h3>
            <span class="genre-badge">${movie.genre}</span>
        `;

        movieElement.addEventListener('click', function () {
            openModal(movie);
        });

        elements.moviesList.appendChild(movieElement);
    });
}

// Открытие модального окна с сеансами
function openModal(movie) {
  state.selectedMovie = movie;
  state.selectedSession = null;
  state.selectedSeats = [];

  elements.modalTitle.textContent = `${movie.title} (${movie.genre})`;
  elements.sessionsContainer.innerHTML = '';

  movie.sessions.forEach(session => {
      const btn = document.createElement('button');
      btn.className = 'session-btn';
      btn.textContent = session;
      btn.addEventListener('click', () => showSeatsSelection(movie, session));
      elements.sessionsContainer.appendChild(btn);
  });

  elements.modal.classList.remove('hidden');
  elements.modal.classList.add('active');
}

// Показ выбора мест
function showSeatsSelection(movie, session) {
  state.selectedSession = session;
  elements.seatsMovieTitle.textContent = movie.title;
  elements.seatsSessionTime.textContent = `Сеанс: ${session} | ${movie.genre}`;
  renderSeats();

  elements.modal.classList.remove('active');
  elements.modal.classList.add('hidden');

  elements.seatsModal.classList.remove('hidden');
  elements.seatsModal.classList.add('active');
}

// Рендер мест
function renderSeats() {
  elements.seatsGrid.innerHTML = '';

  for (let row = 0; row < 8; row++) {
      for (let seatNum = 0; seatNum < 8; seatNum++) {
          const seatId = `${row}-${seatNum}`;
          const seat = document.createElement('div');
          seat.className = 'seat';
          seat.dataset.id = seatId;

          const isOccupied = state.bookings.some(booking =>
              booking.movie === state.selectedMovie.title &&
              booking.session === state.selectedSession &&
              booking.seats.includes(seatId)
          );

          if (isOccupied) seat.classList.add('occupied');
          seat.addEventListener('click', function () {
              toggleSeatSelection(seat);
          });
          elements.seatsGrid.appendChild(seat);
      }
  }

  updateBookingButton();
}

// Выбор места
function toggleSeatSelection(seat) {
  if (seat.classList.contains('occupied')) return;

  seat.classList.toggle('selected');
  const seatId = seat.dataset.id;

  if (seat.classList.contains('selected')) {
      state.selectedSeats.push(seatId);
  } else {
      state.selectedSeats = state.selectedSeats.filter(id => id !== seatId);
  }

  updateBookingButton();
}

// Обновление кнопки бронирования
function updateBookingButton() {
  elements.confirmBooking.disabled = state.selectedSeats.length === 0;
  elements.confirmBooking.textContent = state.selectedSeats.length > 0
      ? `Забронировать ${state.selectedSeats.length} мест`
      : 'Выберите места';
}

// Бронирование мест
function bookSeats() {
  const booking = {
      movie: state.selectedMovie.title,
      session: state.selectedSession,
      seats: state.selectedSeats,
      date: new Date().toLocaleString(),
      genre: state.selectedMovie.genre
  };

  state.bookings.push(booking);
  localStorage.setItem('bookings', JSON.stringify(state.bookings));

  alert(`Бронь успешна!\nФильм: ${booking.movie}\nВремя: ${booking.session}\nМеста: Ряд ${booking.seats[0].split('-')[0]} (${booking.seats.length} мест)`);

  elements.seatsModal.classList.add('hidden');
  renderSeats();
  state.selectedSeats = [];
  updateBookingButton();
}

// Настройка модальных окон
function setupModals() {
  document.getElementById('close-modal').addEventListener('click', function () {
      elements.modal.classList.add('hidden');
  });

  document.getElementById('close-seats-modal').addEventListener('click', function () {
      elements.seatsModal.classList.add('hidden');
  });

  window.addEventListener('click', function (e) {
      if (e.target === elements.modal) elements.modal.classList.add('hidden');
      if (e.target === elements.seatsModal) elements.seatsModal.classList.add('hidden');
  });

  elements.confirmBooking.addEventListener('click', bookSeats);
}

// Инициализация
document.addEventListener('DOMContentLoaded', async function () {
    console.log('DOM загружен');

    // Для страницы кинотеатров
    if (window.location.pathname.includes('cinema.html')) {
        await loadCinemasData();
        renderCinemas();
    }

    // Для страницы фильмов
    if (window.location.pathname.includes('movies.html')) {
        const savedCinema = localStorage.getItem('selectedCinema');
        if (savedCinema) {
            state.selectedCinema = JSON.parse(savedCinema);
            await loadMoviesData();
            renderMovies();
        } else {
            alert('Выберите кинотеатр');
            window.location.href = 'cinema.html';
        }
    }

    // Для страницы информации о кинотеатре
    if (window.location.pathname.includes('cinema-details.html')) {
        renderCinemaDetails();
    }

    setupModals();
});
// Рендеринг детальной информации о кинотеатре
// Рендеринг детальной информации о кинотеатре и фильмов
function renderCinemaAndMovies() {
    const cinemaInfoElement = document.getElementById('cinema-info');
    const moviesListElement = document.getElementById('movies-list');

    if (!cinemaInfoElement || !moviesListElement) return;

    const savedCinema = localStorage.getItem('selectedCinema');
    if (!savedCinema) {
        cinemaInfoElement.innerHTML = '<p>Кинотеатр не выбран.</p>';
        moviesListElement.innerHTML = '<p>Фильмы не найдены.</p>';
        return;
    }

    const cinema = JSON.parse(savedCinema);

    // Отображаем информацию о кинотеатре
    cinemaInfoElement.innerHTML = `
        <div class="cinema-detail-card">
            <img src="${cinema.image}" alt="${cinema.name}">
            <div class="cinema-info-text">
                <h2>${cinema.name}</h2>
                <p><strong>Адрес:</strong> ${cinema.fullAddress}</p>
                <p><strong>Метро:</strong> ${cinema.metro}</p>
                <p><strong>Телефон:</strong> ${cinema.phone}</p>
            </div>
        </div>
    `;

    // Загружаем фильмы для этого кинотеатра
    loadMoviesData().then(() => {
        renderMovies(); // Отображаем фильмы
    });
}

// Инициализация на странице `cinema-and-movies.html`
document.addEventListener('DOMContentLoaded', async function () {
    console.log('DOM загружен');

    // Для страницы информации о кинотеатре и фильмов
    if (window.location.pathname.includes('cinema-and-movies.html')) {
        await loadCinemasData();
        renderCinemaAndMovies();
    }

    setupModals();
});