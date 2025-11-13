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
					// Имитация успешной оплаты
					setTimeout(() => {
						const currentBalance = parseInt(
							document.getElementById('balanceAmount').textContent
						)
						const newBalance = currentBalance + selected.amount
						document.getElementById('balanceAmount').textContent = newBalance

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
						switchTab('profile')
					}, 1000)
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
					setTimeout(() => {
						Telegram.WebApp.showAlert('Подписка успешно активирована!')
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

			// Здесь будет запрос к API для получения статистики
			document.getElementById('referralsCount').textContent = '0'
			document.getElementById('referralsEarned').textContent = '0'
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

// Инициализация Telegram Web App
if (window.Telegram && Telegram.WebApp) {
	Telegram.WebApp.ready()
	Telegram.WebApp.expand()

	const user = Telegram.WebApp.initDataUnsafe.user
	if (user) {
		console.log('User data:', user)
		loadReferralData()

		const urlParams = new URLSearchParams(window.location.search)
		const balance = urlParams.get('balance')
		if (balance) {
			document.getElementById('balanceAmount').textContent = balance
		}
	}
} else {
	console.log('Telegram Web App not detected')
	document.getElementById('referralLink').textContent =
		'https://t.me/orakul_ai_bot?start=ref_123456789'

	// Устанавливаем тумблеры в выключенное состояние по умолчанию
	document.getElementById('horoscopeToggle').checked = false
	document.getElementById('adviceToggle').checked = false
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
})
