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

	// Здесь будет интеграция с платежной системой
	alert(
		`Выбран пакет: ${selected.name}\nСумма: ${selected.price} ₽\n\nПеренаправление на страницу оплаты...`
	)

	// Временная заглушка
	setTimeout(() => {
		alert('Оплата успешно завершена! Сообщения добавлены на ваш баланс.')
		document.getElementById('balanceAmount').textContent =
			parseInt(document.getElementById('balanceAmount').textContent) +
			selectedPackage * 5 // Простая логика начисления
		switchTab('profile')
	}, 2000)
}

// Активация подписки
function subscribePremium() {
	if (
		confirm('Активировать подписку "Оракул ПРЕМИУМ" за 1 990 ₽ на 30 дней?')
	) {
		// Здесь будет интеграция с платежной системой
		alert('Подписка успешно активирована!')
		switchTab('profile')
	}
}

// Сохранение настроек
function saveSettings() {
	const horoscopeEnabled = document.getElementById('horoscopeToggle').checked
	const adviceEnabled = document.getElementById('adviceToggle').checked
	const time = document.getElementById('timeSelect').value

	// Здесь будет отправка на сервер
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
		// Можно обновить интерфейс с данными пользователя
		console.log('User:', user)
	}
}
