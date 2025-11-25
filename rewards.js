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
	// Загружаем из localStorage
	const savedRewards = localStorage.getItem('dailyRewards')
	if (savedRewards) {
		userData.rewards = JSON.parse(savedRewards)
	}

	console.log('👤 User data loaded:', userData)
}

function setupTelegramIntegration() {
	if (window.Telegram && Telegram.WebApp) {
		Telegram.WebApp.ready()
		Telegram.WebApp.expand()

		console.log('✅ Telegram Web App initialized')

		// ПОЛУЧАЕМ ДАННЫЕ ОТ БОТА ПРИ ЗАПУСКЕ
		const initDataUnsafe = Telegram.WebApp.initDataUnsafe
		console.log('📦 Init data from bot:', initDataUnsafe)

		// Получаем user_id из данных бота
		if (initDataUnsafe && initDataUnsafe.user) {
			userData.user_id = initDataUnsafe.user.id.toString()
			console.log('👤 User ID from bot:', userData.user_id)
		}

		// Получаем start_param если есть (например баланс)
		if (Telegram.WebApp.startParam) {
			const startParams = new URLSearchParams(Telegram.WebApp.startParam)
			const balance = startParams.get('balance')
			if (balance) {
				userData.balance = parseInt(balance)
				console.log('💰 Balance from start param:', userData.balance)
			}
		}

		// Обработчик данных от бота
		Telegram.WebApp.onEvent('webAppDataReceived', event => {
			console.log('📨 Received data from bot:', event)
			if (event.data) {
				try {
					const data = JSON.parse(event.data)
					handleBotData(data)
				} catch (e) {
					console.error('Error parsing data from bot:', e)
				}
			}
		})

		// Дополнительный обработчик сообщений
		window.addEventListener('message', function (event) {
			console.log('📨 Message event from bot:', event.data)
			if (event.data && typeof event.data === 'object' && event.data.action) {
				handleBotData(event.data)
			}
		})
	} else {
		console.log('❌ Telegram Web App not detected - running in browser mode')
		// Для тестирования в браузере
		const urlParams = new URLSearchParams(window.location.search)
		userData.user_id = urlParams.get('user_id') || 'test_user_123'
		userData.balance = parseInt(urlParams.get('balance')) || 0
	}
}

function handleBotData(data) {
	console.log('🤖 Handling bot data:', data)
	switch (data.action) {
		case 'update_balance':
			userData.balance = data.balance
			updateUI()
			showMessage(`Баланс обновлен: ${data.balance} сообщений`, 'success')
			break
		case 'reward_confirmed':
			userData.balance = data.new_balance
			updateUI()
			showMessage(
				`Награда подтверждена! Баланс: ${data.new_balance}`,
				'success'
			)
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
	console.log('📅 Calendar initialized')
}

function handleDayClick(day, isToday, isClaimed) {
	console.log(
		`🎯 Day clicked: ${day}, isToday: ${isToday}, isClaimed: ${isClaimed}`
	)
	if (!isToday || isClaimed) return
	claimDailyReward()
}

function claimDailyReward() {
	const now = new Date()
	const todayKey = getTodayKey()

	console.log('🎯 Claiming reward for:', todayKey)
	console.log('📊 Current rewards:', userData.rewards)
	console.log('👤 User ID:', userData.user_id)
	console.log('💫 Current balance:', userData.balance)

	if (userData.rewards[todayKey]) {
		console.log('❌ Reward already claimed today')
		showMessage('Сегодняшняя награда уже получена!', 'info')
		return
	}

	userData.rewards[todayKey] = true
	userData.balance += REWARD_AMOUNT
	saveUserData()
	updateUI()
	showRewardAnimation()

	console.log('🔄 Calling sendDataToBot...')
	sendDataToBot()

	// Обновляем календарь чтобы сегодняшняя клетка стала серой
	setTimeout(() => {
		initializeCalendar()
	}, 1000)
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

	console.log(
		'📊 UI updated - Balance:',
		userData.balance,
		'Total claimed:',
		totalClaimed
	)
}

function showRewardAnimation() {
	showMessage(`🎉 Получено ${REWARD_AMOUNT} сообщение!`, 'success')
}

function showMessage(text, type) {
	console.log('💬 Showing message:', text)
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
	console.log('💾 User data saved to localStorage')
}

function sendDataToBot() {
	const data = {
		action: 'daily_reward_claimed',
		amount: REWARD_AMOUNT,
		new_balance: userData.balance, // Исправлено: new_balance вместо new balance
		date: getTodayKey(),
		user_id: userData.user_id,
	}

	console.log('📤 Sending data to bot:', data)

	if (window.Telegram && Telegram.WebApp) {
		try {
			// ПРАВИЛЬНЫЙ формат отправки
			Telegram.WebApp.sendData(JSON.stringify(data))
			console.log('✅ Data sent to bot via sendData')

			// ЗАКРЫВАЕМ WEB APP
			setTimeout(() => {
				if (Telegram.WebApp && Telegram.WebApp.close) {
					Telegram.WebApp.close()
					console.log('🔴 Web App closed')
				}
			}, 2000)
		} catch (e) {
			console.error('❌ Send error:', e)
			// Показываем сообщение об ошибке
			showMessage('Ошибка отправки данных. Попробуйте еще раз.', 'info')
		}
	} else {
		// Для тестирования в браузере
		console.log('🌐 Browser mode - would send:', data)
		alert(`🎉 Награда получена! +1 сообщение\n${JSON.stringify(data, null, 2)}`)
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
	console.log('🔄 Updating balance from bot:', newBalance)
	userData.balance = newBalance
	updateUI()
}

// Глобальные функции для отладки
window.debugRewards = function () {
	console.log('🐛 Debug info:', userData)
	console.log('📅 Today key:', getTodayKey())
	console.log('💾 LocalStorage:', localStorage.getItem('dailyRewards'))
}

window.clearRewardsData = function () {
	localStorage.removeItem('dailyRewards')
	userData.rewards = {}
	userData.balance = 0
	updateUI()
	initializeCalendar()
	console.log('🧹 Rewards data cleared')
}

// Функция для принудительного сброса сегодняшней награды
window.resetTodayReward = function () {
	const todayKey = getTodayKey()
	console.log('🔄 Resetting reward for today:', todayKey)

	if (userData.rewards[todayKey]) {
		delete userData.rewards[todayKey]
		userData.balance = Math.max(0, userData.balance - 1)
		saveUserData()
		updateUI()
		initializeCalendar()
		console.log('✅ Today reward reset')
		alert('✅ Награда за сегодня сброшена! Можете забрать снова.')
	} else {
		console.log('ℹ️ No reward claimed today')
		alert('ℹ️ Награда за сегодня еще не была получена.')
	}
}

// Функция для тестирования отправки данных
window.testSendData = function () {
	console.log('🧪 Testing data send...')

	// Имитируем получение награды
	const todayKey = getTodayKey()
	userData.rewards[todayKey] = true
	userData.balance += 1

	console.log('📤 Test data:', {
		action: 'daily_reward_claimed',
		amount: 1,
		new_balance: userData.balance,
		date: todayKey,
		user_id: userData.user_id,
	})

	// Отправляем тестовые данные
	sendDataToBot()

	// Возвращаем состояние
	delete userData.rewards[todayKey]
	userData.balance = Math.max(0, userData.balance - 1)
	updateUI()
}
