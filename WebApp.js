// Переключение табов
function switchTab(tabName) {
	// Скрыть все табы
	document.querySelectorAll('.tab-content').forEach(tab => {
		tab.classList.remove('active')
	})
	document.querySelectorAll('.tab').forEach(tab => {
		tab.classList.remove('active')
	})

	// Показать выбранный таб
	document.getElementById(tabName).classList.add('active')
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

	// Интеграция с Telegram Payments
	if (window.Telegram && Telegram.WebApp) {
		const initData = Telegram.WebApp.initData

		// Здесь будет вызов Telegram Payments
		alert(
			`Выбран пакет: ${selected.name}\nСумма: ${selected.price} ₽\n\nПлатежная система настраивается...`
		)
	} else {
		alert(
			`Выбран пакет: ${selected.name}\nСумма: ${selected.price} ₽\n\nДля оплаты используйте Telegram.`
		)
	}

	// Временная заглушка для демо
	setTimeout(() => {
		alert('Оплата успешно завершена! Сообщения добавлены на ваш баланс.')
		document.getElementById('balanceAmount').textContent =
			parseInt(document.getElementById('balanceAmount').textContent) +
			selectedPackage * 5
		switchTab('profile')
	}, 2000)
}

// Активация подписки
function subscribePremium() {
	if (
		confirm('Активировать подписку "Оракул ПРЕМИУМ" за 1 990 ₽ на 30 дней?')
	) {
		// Интеграция с Telegram Payments
		if (window.Telegram && Telegram.WebApp) {
			alert('Подписка активируется через Telegram Payments...')
		} else {
			alert('Для активации подписки используйте Telegram.')
		}

		// Временная заглушка
		setTimeout(() => {
			alert('Подписка успешно активирована!')
			switchTab('profile')
		}, 2000)
	}
}

// Сохранение настроек
function saveSettings() {
	const horoscopeEnabled = document.getElementById('horoscopeToggle').checked
	const adviceEnabled = document.getElementById('adviceToggle').checked
	const time = document.getElementById('timeSelect').value

	// Отправка данных в Telegram бот
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

// Закрытие Web App
function closeWebApp() {
	if (window.Telegram && Telegram.WebApp) {
		Telegram.WebApp.close()
	} else {
		alert('Закройте окно вручную')
	}
}

// Инициализация Telegram Web App
if (window.Telegram && Telegram.WebApp) {
	Telegram.WebApp.ready()
	Telegram.WebApp.expand()

	// Получение данных пользователя
	const user = Telegram.WebApp.initDataUnsafe.user
	if (user) {
		console.log('User data:', user)
		// Можно обновить интерфейс с данными пользователя
	}

	// Обработка данных от бота
	Telegram.WebApp.onEvent('webAppData', function (data) {
		console.log('Data from bot:', data)
	})
} else {
	console.log('Telegram Web App not detected - running in browser mode')
}
