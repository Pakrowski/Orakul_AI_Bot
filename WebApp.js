// Переключение табов
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active')
    })
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active')
    })

    document.getElementById(tabName).classList.add('active')
    event.target.classList.add('active')

    // Загружаем реферальные данные при переходе на вкладку
    if (tabName === 'referral') {
        loadReferralData()
    }
}

// Переключение юридических вкладок
function switchLegalTab(tabName) {
    document.querySelectorAll('.legal-content').forEach(tab => {
        tab.classList.remove('active')
    })
    document.querySelectorAll('.legal-tab').forEach(tab => {
        tab.classList.remove('active')
    })

    document.getElementById(tabName + 'Content').classList.add('active')
    event.target.classList.add('active')
}

// Выбор пакета сообщений
let selectedPackage = null
function selectPackage(packageId) {
    document.querySelectorAll('.package').forEach(pkg => {
        pkg.classList.remove('selected')
    })
    event.currentTarget.classList.add('selected')
    selectedPackage = packageId
}

// Обработка оплаты
function processPayment() {
    if (!selectedPackage) {
        alert('Пожалуйста, выберите пакет сообщений')
        return
    }

    const packages = {
        1: { name: '5 сообщений', price: 299 },
        2: { name: '15 сообщений', price: 799 },
        3: { name: '50 сообщений', price: 1999 },
    }

    const selected = packages[selectedPackage]

    if (window.Telegram && Telegram.WebApp) {
        alert(
            `Выбран пакет: ${selected.name}\nСумма: ${selected.price} ₽\n\nПеренаправление на оплату...`
        )
    } else {
        alert(
            `Выбран пакет: ${selected.name}\nСумма: ${selected.price} ₽\n\nДля оплаты используйте Telegram.`
        )
    }

    // Заглушка для демо
    setTimeout(() => {
        alert('Оплата успешно завершена!')
        const currentBalance = parseInt(
            document.getElementById('balanceAmount').textContent
        )
        const newBalance =
            currentBalance +
            (selectedPackage === 1 ? 5 : selectedPackage === 2 ? 15 : 50)
        document.getElementById('balanceAmount').textContent = newBalance
        switchTab('profile')
    }, 2000)
}

// Активация подписки
function subscribePremium() {
    if (
        confirm('Активировать подписку "ОРАКУЛ ПРЕМИУМ" за 1 990 ₽ на 30 дней?')
    ) {
        if (window.Telegram && Telegram.WebApp) {
            alert('Подписка активируется через Telegram Payments...')
        } else {
            alert('Для активации подписки используйте Telegram.')
        }

        setTimeout(() => {
            alert('Подписка успешно активирована!')
            switchTab('profile')
        }, 2000)
    }
}

// Загрузка реферальных данных
function loadReferralData() {
    if (window.Telegram && Telegram.WebApp) {
        const user = Telegram.WebApp.initDataUnsafe.user
        if (user) {
            // Получаем параметры из URL
            const urlParams = new URLSearchParams(window.location.search);
            const userId = urlParams.get('user_id');
            
            // Генерируем реферальную ссылку с username бота
            const botUsername = getBotUsername();
            const referralLink = `https://t.me/${botUsername}?start=ref_${userId || user.id}`
            document.getElementById('referralLink').textContent = referralLink

            // Здесь будет запрос к API для получения статистики
            // Временные данные для демо
            document.getElementById('referralsCount').textContent = '0'
            document.getElementById('referralsEarned').textContent = '0'
        }
    } else {
        // Для браузера - используем параметры из URL
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('user_id');
        
        if (userId) {
            const botUsername = 'your_bot_username'; // Замените на реальный username бота
            const referralLink = `https://t.me/${botUsername}?start=ref_${userId}`
            document.getElementById('referralLink').textContent = referralLink
        } else {
            document.getElementById('referralLink').textContent = 'Доступно только в Telegram'
        }
    }
}

// Получение username бота
function getBotUsername() {
    // Пытаемся получить из initData
    if (window.Telegram && Telegram.WebApp.initDataUnsafe.user) {
        return Telegram.WebApp.initDataUnsafe.user.username || 'your_bot_username';
    }
    
    // Или из параметров URL
    const urlParams = new URLSearchParams(window.location.search);
    const botUsername = urlParams.get('bot_username');
    
    return botUsername || 'your_bot_username'; // Замените на реальный username
}

// Копирование реферальной ссылки
function copyReferralLink() {
    const link = document.getElementById('referralLink').textContent
    if (link !== 'Загрузка...' && link !== 'Доступно только в Telegram') {
        navigator.clipboard
            .writeText(link)
            .then(() => {
                alert('Ссылка скопирована в буфер обмена!')
            })
            .catch(() => {
                // Fallback для старых браузеров
                const textArea = document.createElement('textarea')
                textArea.value = link
                document.body.appendChild(textArea)
                textArea.select()
                document.execCommand('copy')
                document.body.removeChild(textArea)
                alert('Ссылка скопирована в буфер обмена!')
            })
    }
}

// Сохранение настроек
function saveSettings() {
    const horoscopeEnabled = document.getElementById('horoscopeToggle').checked
    const adviceEnabled = document.getElementById('adviceToggle').checked
    const time = document.getElementById('timeSelect').value

    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.sendData(
            JSON.stringify({
                action: 'save_settings',
                horoscope: horoscopeEnabled,
                advice: adviceEnabled,
                time: time,
            })
        )
    }

    alert(
        'Настройки сохранены!\n\nГороскоп: ' +
            (horoscopeEnabled ? 'включен' : 'выключен') +
            '\nСовет дня: ' +
            (adviceEnabled ? 'включен' : 'выключен') +
            '\nВремя: ' +
            time
    )
}

// Инициализация при загрузке страницы
function initWebApp() {
    // Получаем параметры из URL
    const urlParams = new URLSearchParams(window.location.search);
    const balance = urlParams.get('balance');
    const userId = urlParams.get('user_id');
    
    // Устанавливаем баланс из параметров
    if (balance) {
        document.getElementById('balanceAmount').textContent = balance;
    }
    
    // Инициализация Telegram Web App
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.ready()
        Telegram.WebApp.expand()

        const user = Telegram.WebApp.initDataUnsafe.user
        if (user) {
            console.log('User data:', user)
        }
    } else {
        console.log('Telegram Web App not detected')
    }
    
    // Загружаем начальные данные
    loadReferralData();
}

// Запускаем инициализацию при загрузке страницы
document.addEventListener('DOMContentLoaded', initWebApp);
