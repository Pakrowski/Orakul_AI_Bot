// ---------- Глобальные переменные ----------
let selectedPackage = null
let selectedPaymentMethod = 'sbp'

// ---------- Вкладки ----------
function switchTab(tabName) {
	document
		.querySelectorAll('.tab-content')
		.forEach(tab => (tab.style.display = 'none'))
	document
		.querySelectorAll('.tab')
		.forEach(tab => tab.classList.remove('active'))

	const target = document.getElementById(tabName)
	if (target) target.style.display = 'block'

	if (event && event.currentTarget) {
		event.currentTarget.classList.add('active')
	}

	if (tabName === 'referral') loadReferralData()
}

// ---------- Выбор пакета ----------
function selectPackage(packageId) {
	document
		.querySelectorAll('.package-option')
		.forEach(pkg => pkg.classList.remove('selected'))
	if (event && event.currentTarget) {
		event.currentTarget.classList.add('selected')
	}
	selectedPackage = packageId
}

function selectStarsPackage(packageId) {
	document
		.querySelectorAll('.stars-packages .package-option')
		.forEach(pkg => pkg.classList.remove('selected'))
	if (event && event.currentTarget) {
		event.currentTarget.classList.add('selected')
	}
	selectedPackage = packageId
}

// ---------- Метод оплаты ----------
function selectPaymentMethod(method) {
	document
		.querySelectorAll('.payment-method')
		.forEach(pm => pm.classList.remove('selected'))
	if (event && event.currentTarget) {
		event.currentTarget.classList.add('selected')
	}

	selectedPaymentMethod = method

	const regularPackages = document.getElementById('regularPackages')
	const starsPackages = document.getElementById('starsPackages')
	const emailSection = document.getElementById('emailSection')

	if (method === 'stars') {
		if (regularPackages) regularPackages.style.display = 'none'
		if (starsPackages) starsPackages.style.display = 'block'
		if (emailSection) emailSection.classList.add('stars-hidden')
	} else {
		if (regularPackages) regularPackages.style.display = 'block'
		if (starsPackages) starsPackages.style.display = 'none'
		if (emailSection) emailSection.classList.remove('stars-hidden')
	}

	selectedPackage = null
	document
		.querySelectorAll('.package-option')
		.forEach(pkg => pkg.classList.remove('selected'))
}

// ---------- Email ----------
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
		if (emailError) emailError.style.display = 'none'
		return true
	}

	if (validateEmail(email)) {
		emailInput.classList.remove('error')
		if (emailError) emailError.style.display = 'none'
		return true
	} else {
		emailInput.classList.add('error')
		if (emailError) emailError.style.display = 'block'
		return false
	}
}

// ---------- Баланс ----------
function updateBalanceFromBot() {
	if (window.Telegram && Telegram.WebApp) {
		Telegram.WebApp.sendData(JSON.stringify({ action: 'get_balance' }))
	}
}

function updateBalanceDisplay(newBalance) {
	const balanceElement = document.getElementById('balanceAmount')
	if (balanceElement) balanceElement.textContent = newBalance
}

// ---------- Оплата ----------
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

	let email = ''
	if (selectedPaymentMethod !== 'stars') {
		email = document.getElementById('emailInput').value.trim()
		if (!email) {
			alert('Пожалуйста, введите email')
			return
		}
		if (!validateEmail(email)) {
			alert('Введите корректный email')
			return
		}
	}

	if (window.Telegram && Telegram.WebApp) {
		let message = `Пакет: ${selected.name}\nКоличество: ${selected.amount} сообщений\n`
		if (selectedPaymentMethod === 'stars') {
			message += `Стоимость: ⭐ ${selected.price}\nСпособ: Telegram Stars`
		} else {
			message += `Стоимость: ${selected.price} ₽\nСпособ: ${selectedPaymentMethod}\nEmail: ${email}`
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
			buttonId => {
				if (buttonId === 'confirm') {
					const data = {
						action: 'purchase_messages',
						package_id: selectedPackage,
						amount: selected.amount,
						payment_method: selectedPaymentMethod,
					}
					if (selectedPaymentMethod !== 'stars') data.email = email
					Telegram.WebApp.sendData(JSON.stringify(data))

					const currentBalance = parseInt(
						document.getElementById('balanceAmount').textContent
					)
					updateBalanceDisplay(currentBalance + selected.amount)

					setTimeout(updateBalanceFromBot, 1000)

					switchTab('profile')
				}
			}
		)
	} else {
		alert('Откройте WebApp в Telegram для оплаты')
	}
}

// ---------- Подписка Premium ----------
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
			buttonId => {
				if (buttonId === 'confirm') {
					Telegram.WebApp.sendData(
						JSON.stringify({
							action: 'subscribe_premium',
							price: 1990,
							duration: 30,
						})
					)
					setTimeout(updateBalanceFromBot, 1000)
					switchTab('profile')
				}
			}
		)
	} else alert('Откройте WebApp в Telegram для активации подписки')
}

// ---------- Реферальная система ----------
function loadReferralData() {
	if (window.Telegram && Telegram.WebApp) {
		const user = Telegram.WebApp.initDataUnsafe.user
		if (user) {
			const referralLink = `https://t.me/orakul_ai_bot?start=ref_${user.id}`
			document.getElementById('referralLink').textContent = referralLink

			Telegram.WebApp.sendData(JSON.stringify({ action: 'get_referral_stats' }))
		}
	} else
		document.getElementById('referralLink').textContent =
			'https://t.me/orakul_ai_bot?start=ref_123456789'
}

function copyReferralLink() {
	const link = document.getElementById('referralLink').textContent
	navigator.clipboard.writeText(link).then(() => {
		alert('Ссылка скопирована!')
	})
}

// ---------- Юридические кнопки ----------
function openPrivacyPolicy() {
	window.open('https://telegram.org/privacy-tpa', '_blank')
}
function openTermsOfService() {
	document.getElementById('legal').style.display = 'none'
	document.getElementById('termsContent').style.display = 'block'
}
function closeLegalContent() {
	document.getElementById('termsContent').style.display = 'none'
	document.getElementById('legal').style.display = 'block'
}

// ---------- Обработка данных от бота ----------
function handleBotData(data) {
	try {
		const parsedData = JSON.parse(data)
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
				break
		}
	} catch (e) {
		console.error('Error parsing bot data', e)
	}
}

// ---------- Инициализация ----------
if (window.Telegram && Telegram.WebApp) {
	Telegram.WebApp.ready()
	Telegram.WebApp.expand()

	Telegram.WebApp.onEvent('webAppDataReceived', event => {
		if (event.data) handleBotData(event.data)
	})

	setTimeout(updateBalanceFromBot, 1000)
	setInterval(updateBalanceFromBot, 30000)
} else {
	document.addEventListener('DOMContentLoaded', () => {
		document.getElementById('balanceAmount').textContent = '5'
		document.getElementById('referralLink').textContent =
			'https://t.me/orakul_ai_bot?start=ref_123456789'
	})
}

// ---------- Валидация email ----------
document.addEventListener('DOMContentLoaded', function () {
	const emailInput = document.getElementById('emailInput')
	if (emailInput) {
		emailInput.addEventListener('input', handleEmailInput)
		emailInput.addEventListener('blur', handleEmailInput)
	}
})
