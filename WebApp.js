// Переключение табов
function switchTab(tabName) {
	document.querySelectorAll('.tab-content').forEach(tab => {
		tab.style.display = 'none'
	})
	document.querySelectorAll('.tab').forEach(tab => {
		tab.classList.remove('active')
	})

	document.getElementById(tabName).style.display = 'block'
	event.currentTarget.classList.add('active')

	if (tabName === 'referral') {
		loadReferralData()
	}
}

// ОТКРЫТИЕ НУЖНОЙ ВКЛАДКИ ИЗ БОТА (НОВОЕ!)
const urlParams = new URLSearchParams(window.location.search);
const openTab = urlParams.get('tab');
if (openTab === 'shop') switchTab('shop');
if (openTab === 'referral') switchTab('referral');

// Выбор пакета сообщений
let selectedPackage = null
let selectedPaymentMethod = 'sbp'

function selectPackage(packageId) {
	document.querySelectorAll('.package-option').forEach(pkg => {
		pkg.classList.remove('selected')
	})
	event.currentTarget.classList.add('selected')
	selectedPackage = packageId
}

function selectStarsPackage(packageId) {
	document.querySelectorAll('.stars-packages .package-option').forEach(pkg => {
		pkg.classList.remove('selected')
	})
	event.currentTarget.classList.add('selected')
	selectedPackage = packageId
}

function selectPaymentMethod(method) {
	document.querySelectorAll('.payment-method').forEach(pm => {
		pm.classList.remove('selected')
	})
	event.currentTarget.classList.add('selected')
	selectedPaymentMethod = method

	// Показываем/скрываем соответствующие пакеты
	const regularPackages = document.getElementById('regularPackages')
	const starsPackages = document.getElementById('starsPackages')
	const emailSection = document.getElementById('emailSection')

	if (method === 'stars') {
		regularPackages.style.display = 'none'
		starsPackages.style.display = 'block'
		emailSection.classList.add('stars-hidden')
		// Сбрасываем выбранный пакет при смене метода оплаты
		selectedPackage = null
		document.querySelectorAll('.package-option').forEach(pkg => {
			pkg.classList.remove('selected')
		})
	} else {
		regularPackages.style.display = 'block'
		starsPackages.style.display = 'none'
		emailSection.classList.remove('stars-hidden')
		// Сбрасываем выбранный пакет при смене метода оплаты
		selectedPackage = null
		document.querySelectorAll('.package-option').forEach(pkg => {
			pkg.classList.remove('selected')
		})
	}
}

// Валидация email
function validateEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	return emailRegex.test(email)
}

function handleEmailInput() {
	const emailInput = document.getElementById('emailInput')
	const emailError = document.getElementById('emailError')
	const email = emailInput.value.trim()

	if (email === '') {
		emailInput.classList.remove('error')
		emailError.style.display = 'none'
		return true
	}

	if (validateEmail(email)) {
		emailInput.classList.remove('error')
		emailError.style.display = 'none'
		return true
	} else {
		emailInput.classList.add('error')
		emailError.style.display = 'block'
		return false
	}
}

// Функция для обновления баланса из бота
function updateBalanceFromBot() {
	if (window.Telegram && Telegram.WebApp) {
		Telegram.WebApp.sendData(
			JSON.stringify({
				action: 'get_balance',
			})
		)
	}
}

// Функция для обновления отображаемого баланса
function updateBalanceDisplay(newBalance) {
	const balanceElement = document.getElementById('balanceAmount')
	if (balanceElement) {
		balanceElement.textContent = newBalance
	}
}

// Обработка оплаты
function processPayment() {
	if (!selectedPackage) {
		alert('Пожалуйста, выберите пакет сообщений')
		return
	}

	const packages = {
		1: { name: '100 сообщений', price: 300, amount: 100 },
		2: { name: '200 сообщений', price: 600, amount: 200 },
		3: { name: '300 сообщений', price: 900, amount: 300 },
		4: { name: '500 сообщений', price: 1500, amount: 500 },
		5: { name: '1000 сообщений', price: 3000, amount: 1000 },
	}

	const selected = packages[selectedPackage]

	// Для Stars не требуем email
	if (selectedPaymentMethod !== 'stars') {
		const email = document.getElementById('emailInput').value.trim()
		if (!email) {
			alert('Пожалуйста, введите email для отправки чека')
			return
		}

		if (!validateEmail(email)) {
			document.getElementById('emailInput').classList.add('error')
			document.getElementById('emailError').style.display = 'block'
			alert('Пожалуйста, введите корректный email адрес')
			return
		}
	}

	if (window.Telegram && Telegram.WebApp) {
		let message = `Пакет: ${selected.name}\nКоличество: ${selected.amount} сообщений\n`

		if (selectedPaymentMethod === 'stars') {
			message += `Стоимость: ⭐ ${selected.price}\nСпособ: Telegram Stars`
		} else {
			const email = document.getElementById('emailInput').value.trim()
			message += `Стоимость: ${
				selected.price
			} ₽\nСпособ: ${getPaymentMethodName(
				selectedPaymentMethod
			)}\nEmail: ${email}`
		}

		Telegram.WebApp.showPopup(
			{
				title: 'Подтверждение оплаты',
				message: message,
				buttons: [
					{ id: 'confirm', type: 'default', text: 'Оплатить' },
					{ type: 'cancel', text: 'Отмена' },
				],
			},
			function (buttonId) {
				if (buttonId === 'confirm') {
					// Отправляем данные о покупке в бот
					const data = {
						action: 'purchase_messages',
						package_id: selectedPackage,
						amount: selected.amount,
						payment_method: selectedPaymentMethod,
					}

					if (selectedPaymentMethod !== 'stars') {
						data.email = document.getElementById('emailInput').value.trim()
					}

					Telegram.WebApp.sendData(JSON.stringify(data))

					// Обновляем баланс локально
					const currentBalance = parseInt(
						document.getElementById('balanceAmount').textContent
					)
					const newBalance = currentBalance + selected.amount
					updateBalanceDisplay(newBalance)

					if (selectedPaymentMethod === 'stars') {
						Telegram.WebApp.showAlert(
							`Оплата успешно завершена! Получено ${selected.amount} сообщений.`
						)
					} else {
						const email = document.getElementById('emailInput').value.trim()
						Telegram.WebApp.showAlert(
							`Оплата успешно завершена! Получено ${selected.amount} сообщений. Чек отправлен на ${email}`
						)
					}

					// Запрашиваем актуальный баланс у бота для синхронизации
					setTimeout(updateBalanceFromBot, 1000)

					switchTab('profile')
				}
			}
		)
	} else {
		let message = `Пакет: ${selected.name}\nКоличество: ${selected.amount} сообщений\n`

		if (selectedPaymentMethod === 'stars') {
			message += `Стоимость: ⭐ ${selected.price}\nСпособ: Telegram Stars\n\nДля оплаты используйте Telegram.`
		} else {
			const email = document.getElementById('emailInput').value.trim()
			message += `Стоимость: ${
				selected.price
			} ₽\nСпособ: ${getPaymentMethodName(
				selectedPaymentMethod
			)}\nEmail: ${email}\n\nДля оплаты используйте Telegram.`
		}

		alert(message)
	}
}

function getPaymentMethodName(method) {
	const methods = {
		card: 'Банковская карта',
		sbp: 'СБП',
		stars: 'Telegram Stars',
		crypto: 'Криптовалюта',
	}
	return methods[method] || method
}

// Активация подписки
function subscribePremium() {
	if (window.Telegram && Telegram.WebApp) {
		Telegram.WebApp.showPopup(
			{
				title: 'Премиум подписка',
				message:
					'Активировать подписку "ОРАКУЛ ПРЕМИУМ" за 1 990 ₽ на 30 дней?',
				buttons: [
					{ id: 'confirm', type: 'default', text: 'Активировать' },
					{ type: 'cancel', text: 'Отмена' },
				],
			},
			function (buttonId) {
				if (buttonId === 'confirm') {
					// Отправляем данные о подписке в бот
					Telegram.WebApp.sendData(
						JSON.stringify({
							action: 'subscribe_premium',
							price: 1990,
							duration: 30,
						})
					)

					setTimeout(() => {
						Telegram.WebApp.showAlert('Подписка успешно активирована!')
						// Запрашиваем актуальный баланс у бота
						setTimeout(updateBalanceFromBot, 1000)
						switchTab('profile')
					}, 1000)
				}
			}
		)
	} else {
		alert('Для активации подписки используйте Telegram.')
	}
}

// Загрузка реферальных данных
function loadReferralData() {
	if (window.Telegram && Telegram.WebApp) {
		const user = Telegram.WebApp.initDataUnsafe.user
		if (user) {
			const referralLink = `https://t.me/orakul_ai_bot?start=ref_${user.id}`
			document.getElementById('referralLink').textContent = referralLink

			// Запрашиваем статистику рефералов у бота
			Telegram.WebApp.sendData(
				JSON.stringify({
					action: 'get_referral_stats',
				})
			)
		}
	} else {
		document.getElementById('referralLink').textContent =
			'https://t.me/orakul_ai_bot?start=ref_123456789'
	}
}

// Копирование реферальной ссылки
function copyReferralLink() {
	const link = document.getElementById('referralLink').textContent
	if (link !== 'Загрузка...' && link !== 'Доступно только в Telegram') {
		navigator.clipboard
			.writeText(link)
			.then(() => {
				if (window.Telegram && Telegram.WebApp) {
					Telegram.WebApp.showPopup({
						title: 'Успешно',
						message: 'Ссылка скопирована в буфер обмена!',
						buttons: [{ type: 'default', text: 'OK' }],
					})
				} else {
					alert('Ссылка скопирована в буфер обмена!')
				}
			})
			.catch(() => {
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

	if (window.Telegram && Telegram.WebApp) {
		Telegram.WebApp.showAlert('Настройки рассылок сохранены!')
	} else {
		alert('Настройки рассылок сохранены!')
	}
}

// Юридическая информация
function openPrivacyPolicy() {
	if (window.Telegram && Telegram.WebApp) {
		Telegram.WebApp.openLink('https://telegram.org/privacy-tpa')
	} else {
		window.open('https://telegram.org/privacy-tpa', '_blank')
	}
}

function openTermsOfService() {
	document.getElementById('legal').style.display = 'none'
	document.getElementById('termsContent').style.display = 'block'
}

function closeLegalContent() {
	document.getElementById('termsContent').style.display = 'none'
	document.getElementById('legal').style.display = 'block'
}

// Обработка данных от бота
function handleBotData(data) {
	try {
		const parsedData = JSON.parse(data)
		console.log('Received data from bot:', parsedData)

		switch (parsedData.action) {
			case 'update_balance':
				updateBalanceDisplay(parsedData.balance)
				break
			case 'update_referral_stats':
				document.getElementById('referralsCount').textContent =
					parsedData.total_refs
				document.getElementById('referralsEarned').textContent =
					parsedData.earned_messages
				break
			case 'purchase_success':
				updateBalanceDisplay(parsedData.new_balance)
				if (window.Telegram && Telegram.WebApp) {
					Telegram.WebApp.showAlert(
						`Успешно! Баланс пополнен на ${parsedData.amount} сообщений.`
					)
				}
				break
			default:
				console.log('Unknown action:', parsedData.action)
		}
	} catch (e) {
		console.error('Error parsing data from bot:', e)
	}
}

// Функция для периодической синхронизации баланса
function startBalanceSync() {
	// Синхронизируем баланс каждые 30 секунд
	setInterval(updateBalanceFromBot, 30000)
}

// Инициализация Telegram Web App
if (window.Telegram && Telegram.WebApp) {
	Telegram.WebApp.ready()
	Telegram.WebApp.expand()

	// Обработчик входящих данных от бота
	Telegram.WebApp.onEvent('webAppDataReceived', event => {
		console.log('WebApp data received:', event)
		if (event.data) {
			handleBotData(event.data)
		}
	})

	const user = Telegram.WebApp.initDataUnsafe.user
	if (user) {
		console.log('User data:', user)
		loadReferralData()

		// Получаем баланс из URL параметров и обновляем его
		const urlParams = new URLSearchParams(window.location.search)
		const balance = urlParams.get('balance')
		if (balance) {
			updateBalanceDisplay(balance)
		}

		// Запрашиваем актуальный баланс у бота при загрузке
		setTimeout(updateBalanceFromBot, 1000)

		// Запускаем периодическую синхронизацию
		startBalanceSync()
	}
} else {
	console.log('Telegram Web App not detected')
	document.getElementById('referralLink').textContent =
		'https://t.me/orakul_ai_bot?start=ref_123456789'

	// Устанавливаем тумблеры в выключенное состояние по умолчанию
	document.getElementById('horoscopeToggle').checked = false
	document.getElementById('adviceToggle').checked = false

	// Показываем тестовый баланс
	const urlParams = new URLSearchParams(window.location.search)
	const balance = urlParams.get('balance') || '5'
	updateBalanceDisplay(balance)
}

// Добавляем обработчик для валидации email в реальном времени
document.addEventListener('DOMContentLoaded', function () {
	const emailInput = document.getElementById('emailInput')
	if (emailInput) {
		emailInput.addEventListener('input', handleEmailInput)
		emailInput.addEventListener('blur', handleEmailInput)
	}

	// Устанавливаем способ оплаты по умолчанию как выбранный
	selectPaymentMethod('sbp')

	// Добавляем кнопку для принудительной синхронизации баланса (для отладки)
	if (!window.Telegram || !Telegram.WebApp) {
		const syncButton = document.createElement('button')
		syncButton.textContent = '🔄 Синхронизировать баланс'
		syncButton.className = 'btn btn-primary'
		syncButton.style.marginTop = '10px'
		syncButton.onclick = function () {
			const currentBalance = parseInt(
				document.getElementById('balanceAmount').textContent
			)
			const newBalance = currentBalance + 1
			updateBalanceDisplay(newBalance)
			alert('Баланс синхронизирован (тестовый режим)')
		}
		document.querySelector('.balance-card').appendChild(syncButton)
	}
})
