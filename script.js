// Состояние приложения
const state = {
    selectedMovie: null,
    selectedSession: null,
    selectedSeats: [],
    bookings: JSON.parse(localStorage.getItem('bookings')) || [],
    moviesData: { movies: [] }
  };
  
  // DOM элементы
  const elements = {
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
  
  // Основные функции
  async function loadMoviesData() {
    try {
      const response = await fetch('data.json');
      state.moviesData = await response.json();
      console.log('Данные загружены:', state.moviesData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      state.moviesData = {
        movies: [
          {
            id: 1,
            title: "Довод",
            poster: "image/dovod.jpg",
            sessions: ["12:00", "15:30", "19:00"],
            genre: "боевик"
          }
        ]
      };
    }
  }
  
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
      
      movieElement.addEventListener('click', function() {
        console.log('Клик по фильму:', movie.title);
        openModal(movie);
      });
      
      elements.moviesList.appendChild(movieElement);
    });
  }
  
  function openModal(movie) {
    console.log('Открытие модалки для:', movie.title);
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
  
    // Заменяем класс hidden на active
    elements.modal.classList.remove('hidden');
    elements.modal.classList.add('active');
  }
  
  function showSeatsSelection(movie, session) {
    state.selectedSession = session;
    elements.seatsMovieTitle.textContent = movie.title;
    elements.seatsSessionTime.textContent = `Сеанс: ${session} | ${movie.genre}`;
    renderSeats();
    
    // Для первой модалки
    elements.modal.classList.remove('active');
    elements.modal.classList.add('hidden');
    
    // Для второй модалки
    elements.seatsModal.classList.remove('hidden');
    elements.seatsModal.classList.add('active');
  }
  
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
        seat.addEventListener('click', function() {
          toggleSeatSelection(seat);
        });
        elements.seatsGrid.appendChild(seat);
      }
    }
    
    updateBookingButton();
  }
  
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
  
  function updateBookingButton() {
    elements.confirmBooking.disabled = state.selectedSeats.length === 0;
    elements.confirmBooking.textContent = state.selectedSeats.length > 0 
      ? `Забронировать ${state.selectedSeats.length} мест` 
      : 'Выберите места';
  }
  
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
  
  function setupModals() {
    document.getElementById('close-modal').addEventListener('click', function() {
      elements.modal.classList.add('hidden');
    });
  
    document.getElementById('close-seats-modal').addEventListener('click', function() {
      elements.seatsModal.classList.add('hidden');
    });
  
    window.addEventListener('click', function(e) {
      if (e.target === elements.modal) elements.modal.classList.add('hidden');
      if (e.target === elements.seatsModal) elements.seatsModal.classList.add('hidden');
    });
  
    elements.confirmBooking.addEventListener('click', bookSeats);
  }
  
  // Инициализация
  document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM загружен');
    await loadMoviesData();
    renderMovies();
    setupModals();
  });