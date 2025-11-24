// Конфигурация
const REWARD_AMOUNT = 1

// Элементы DOM
let calendarDaysElement
let balanceAmountElement
let totalClaimedElement
let monthlyTotalElement

// Данные пользователя
let userData = {
	balance: 0,
	rewards: {},
	user_id: 0,
}

// Инициализация
document.addEventListener('DOMContentLoaded', function () {
	initializeElements()
	loadUserData()
	initializeCalendar()
	updateUI()
	setupTelegramIntegration()
})

function initializeElements() {
	calendarDaysElement = document.getElementById('calendarDays')
	balanceAmountElement = document.getElementById('balanceAmount')
	totalClaimedElement = document.getElementById('totalClaimed')
	monthlyTotalElement = document.getElementById('monthlyTotal')
}

function loadUserData() {
	const urlParams = new URLSearchParams(window.location.search)
	const balance = urlParams.get('balance') || '0'
	const user_id = urlParams.get('user_id') || '0'

	userData.balance = parseInt(balance)
	userData.user_id = user_id

	// Загружаем из localStorage
	const savedRewards = localStorage.getItem('dailyRewards')
	if (savedRewards) {
		userData.rewards = JSON.parse(savedRewards)
	}
}

function setupTelegramIntegration() {
	if (window.Telegram && Telegram.WebApp) {
		Telegram.WebApp.ready()
		Telegram.WebApp.expand()

		// Обработчик данных от бота
		Telegram.WebApp.onEvent('webAppDataReceived', event => {
			if (event.data) {
				try {
					const data = JSON.parse(event.data)
					handleBotData(data)
				} catch (e) {
					console.error('Error parsing data from bot:', e)
				}
			}
		})
	}
}

function handleBotData(data) {
	switch (data.action) {
		case 'update_balance':
			userData.balance = data.balance
			updateUI()
			break
	}
}

function initializeCalendar() {
	const now = new Date()
	const currentMonth = now.getMonth()
	const currentYear = now.getFullYear()
	const today = now.getDate()

	// Получаем первый день месяца и количество дней
	const firstDay = new Date(currentYear, currentMonth, 1).getDay()
	const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

	// Создаем календарь
	let calendarHTML = ''

	// Корректируем первый день недели (Пн = 0, Вс = 6)
	const startOffset = firstDay === 0 ? 6 : firstDay - 1

	// Пустые ячейки для первого дня недели
	for (let i = 0; i < startOffset; i++) {
		calendarHTML += '<div class="calendar-day empty"></div>'
	}

	// Дни месяца
	for (let day = 1; day <= daysInMonth; day++) {
		const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(
			2,
			'0'
		)}-${String(day).padStart(2, '0')}`
		const isToday = day === today
		const isPast = day < today
		const isFuture = day > today
		const isClaimed = userData.rewards[dateKey] === true
		const isMissed = isPast && !isClaimed && !isToday

		let dayClass = 'calendar-day'
		if (isToday) dayClass += ' today'
		if (isClaimed) dayClass += ' claimed'
		if (isPast && !isToday && !isClaimed && !isMissed) dayClass += ' past'
		if (isFuture) dayClass += ' future'
		if (isMissed) dayClass += ' missed'

		calendarHTML += `
            <div class="${dayClass}" onclick="handleDayClick(${day}, ${isToday}, ${isClaimed})">
                <div class="day-number">${day}</div>
                <div class="day-reward">+${REWARD_AMOUNT}</div>
            </div>
        `
	}

	calendarDaysElement.innerHTML = calendarHTML
}

function handleDayClick(day, isToday, isClaimed) {
	if (!isToday || isClaimed) return
	claimDailyReward()
}

function claimDailyReward() {
	const now = new Date()
	const todayKey = getTodayKey()

	if (userData.rewards[todayKey]) {
		showMessage('Сегодняшняя награда уже получена!', 'info')
		return
	}

	userData.rewards[todayKey] = true
	userData.balance += REWARD_AMOUNT
	saveUserData()
	updateUI()
	showRewardAnimation()
	sendDataToBot()

	// Обновляем календарь чтобы сегодняшняя клетка стала серой
	initializeCalendar()
}

function updateUI() {
	balanceAmountElement.textContent = userData.balance

	const totalClaimed = Object.keys(userData.rewards).length * REWARD_AMOUNT
	totalClaimedElement.textContent = totalClaimed

	const currentMonth = new Date().getMonth()
	const currentYear = new Date().getFullYear()
	const monthlyClaims = Object.keys(userData.rewards).filter(date => {
		const dateObj = new Date(date)
		return (
			dateObj.getMonth() === currentMonth &&
			dateObj.getFullYear() === currentYear
		)
	}).length

	monthlyTotalElement.textContent = monthlyClaims * REWARD_AMOUNT
}

function showRewardAnimation() {
	showMessage(`🎉 Получено ${REWARD_AMOUNT} сообщение!`, 'success')
}

function showMessage(text, type) {
	if (window.Telegram && Telegram.WebApp) {
		Telegram.WebApp.showPopup({
			title: type === 'success' ? 'Успешно!' : 'Информация',
			message: text,
			buttons: [{ type: 'default', text: 'OK' }],
		})
	} else {
		alert(text)
	}
}

function saveUserData() {
	localStorage.setItem('dailyRewards', JSON.stringify(userData.rewards))
}

function sendDataToBot() {
	if (window.Telegram && Telegram.WebApp) {
		Telegram.WebApp.sendData(
			JSON.stringify({
				action: 'daily_reward_claimed',
				amount: REWARD_AMOUNT,
				new_balance: userData.balance,
				date: getTodayKey(),
				user_id: userData.user_id,
			})
		)
	} else {
		console.log('Daily reward claimed:', {
			amount: REWARD_AMOUNT,
			date: getTodayKey(),
			user_id: userData.user_id,
		})
	}
}

function getTodayKey() {
	return formatDateKey(new Date())
}

function formatDateKey(date) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

// Функция для обновления баланса из бота
function updateBalanceFromBot(newBalance) {
	userData.balance = newBalance
	updateUI()
}
