document.addEventListener('DOMContentLoaded', () => {
    let grid = null; // Будет установлен при переходе на каталог
    const sortButtons = document.querySelectorAll('.sort-btn');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('search-input');
    const favButtons = document.querySelectorAll('.btn-fav');
    const favoritesBadge = document.getElementById('favorites-badge');
    const favoritesCountEl = document.getElementById('favorites-count');
    const navLinks = document.querySelectorAll('nav a, footer .footer-nav a');
    const pages = document.querySelectorAll('.page');

    // ✅ Инициализируем cards сразу — даже если grid ещё не виден
    const cards = Array.from(document.querySelectorAll('.product-card'));

    // Состояние
    let currentSort = localStorage.getItem('sotohit-sort') || 'default';
    let currentFilter = localStorage.getItem('sotohit-filter') || 'all';
    let favorites = JSON.parse(localStorage.getItem('sotohit-favorites') || '[]');
    let currentPage = localStorage.getItem('sotohit-page') || 'home';

    // Переключение страниц
    function showPage(pageId) {
        pages.forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById(pageId);
        if (targetPage) targetPage.classList.add('active');
        currentPage = pageId;

        // Активируем ссылку
        navLinks.forEach(link => link.classList.remove('active'));
        document.querySelectorAll(`a[href="#${pageId}"]`).forEach(link => link.classList.add('active'));

        // Если каталог — инициализируем grid и применяем фильтры
        if (pageId === 'catalog') {
            grid = document.getElementById('products-grid'); // Устанавливаем grid
            applyFiltersAndSort();
        }

        localStorage.setItem('sotohit-page', pageId);
    }

    // Обновление счётчика избранного
    function updateFavoritesCount() {
        const count = favorites.length;
        if (favoritesCountEl) favoritesCountEl.textContent = count;
        if (favoritesBadge) {
            favoritesBadge.setAttribute('aria-label', `В избранном: ${count} товаров`);
            favoritesBadge.style.backgroundColor = count > 0 ? '#E74C3C' : '#95A5A6';
        }
    }

    // Переключение избранного
    function toggleFavorite(id) {
        const idx = favorites.indexOf(id);
        if (idx === -1) {
            favorites.push(id);
        } else {
            favorites.splice(idx, 1);
        }
        localStorage.setItem('sotohit-favorites', JSON.stringify(favorites));
        updateFavoritesCount();
        updateUI();
    }

    // Применяем фильтрацию, сортировку и выделение избранного
    function applyFiltersAndSort() {
        if (!grid) return; // ⚠️ Защита: если grid не установлен — выходим

        let visibleCards = [...cards];

        // 🔍 Поиск
        if (searchInput?.value.trim()) {
            const query = searchInput.value.trim().toLowerCase();
            visibleCards = visibleCards.filter(card => {
                const title = card.querySelector('.product-title')?.textContent.toLowerCase() || '';
                return title.includes(query);
            });
        }

        // 🎛️ Фильтр
        if (currentFilter !== 'all') {
            visibleCards = visibleCards.filter(card => 
                card.dataset.category === currentFilter
            );
        }

        // ▲▼ Сортировка
        if (currentSort === 'price-asc') {
            visibleCards.sort((a, b) => 
                parseFloat(a.dataset.price) - parseFloat(b.dataset.price)
            );
        } else if (currentSort === 'price-desc') {
            visibleCards.sort((a, b) => 
                parseFloat(b.dataset.price) - parseFloat(a.dataset.price)
            );
        }

        // Анимация исчезновения
        cards.forEach(card => card.classList.add('fade-out'));

        setTimeout(() => {
            grid.innerHTML = '';
            visibleCards.forEach(card => {
                // Обновляем состояние кнопки ❤️
                const btn = card.querySelector('.btn-fav');
                const id = card.dataset.id;
                if (btn && favorites.includes(id)) {
                    btn.textContent = '💖';
                    btn.classList.add('active');
                } else if (btn) {
                    btn.textContent = '❤️';
                    btn.classList.remove('active');
                }
                grid.appendChild(card);
            });
        }, 200);
    }

    // Обновляем UI (без пересборки DOM)
    function updateUI() {
        // Обновляем кнопки
        filterButtons.forEach(btn => 
            btn.classList.toggle('active', btn.dataset.category === currentFilter)
        );
        sortButtons.forEach(btn => 
            btn.classList.toggle('active', btn.dataset.sort === currentSort)
        );

        // Обновляем избранное на всех кнопках
        document.querySelectorAll('.btn-fav').forEach(btn => {
            const id = btn.dataset.id;
            if (favorites.includes(id)) {
                btn.textContent = '💖';
                btn.classList.add('active');
            } else {
                btn.textContent = '❤️';
                btn.classList.remove('active');
            }
        });
    }

    // Сохранение и применение
    function updateAndSave(sortType = null, filterType = null) {
        if (sortType !== null) currentSort = sortType;
        if (filterType !== null) currentFilter = filterType;

        localStorage.setItem('sotohit-sort', currentSort);
        localStorage.setItem('sotohit-filter', currentFilter);
        if (searchInput) {
            localStorage.setItem('sotohit-search', searchInput.value);
        }

        if (currentPage === 'catalog' && grid) {
            applyFiltersAndSort();
        }
    }

    // 🖱️ Обработчики
    sortButtons.forEach(button => {
        button.addEventListener('click', () => {
            updateAndSave(button.dataset.sort, null);
        });
    });

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            updateAndSave(null, button.dataset.category);
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            updateAndSave();
        });
    }

    favButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = button.dataset.id;
            toggleFavorite(id);
        });
    });

    // 🔄 Обработчики навигации
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href').substring(1);
            if (target) showPage(target);
        });
    });

    // 💡 Обработчик для кнопки "Перейти к каталогу"
    const goToCatalogBtn = document.getElementById('go-to-catalog-btn');
    if (goToCatalogBtn) {
        goToCatalogBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('catalog');
        });
    }

    // Клавиши (Enter/Space для карточек)
    cards.forEach(card => {
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const favBtn = card.querySelector('.btn-fav');
                favBtn?.click();
            }
        });
    });

    // 🚀 Инициализация
    updateFavoritesCount();
    updateUI();
    showPage(currentPage);

    if (searchInput && localStorage.getItem('sotohit-search')) {
        searchInput.value = localStorage.getItem('sotohit-search');
    }

    // Если страница каталога — применяем фильтры
    if (currentPage === 'catalog') {
        setTimeout(() => {
            grid = document.getElementById('products-grid');
            applyFiltersAndSort();
        }, 100);
    }
});
