// Конфигурация
const REWARD_AMOUNT = 2

// Элементы DOM
let calendarDaysElement
let claimButton
let balanceAmountElement
let currentStreakElement
let totalClaimedElement
let currentStreakStatElement
let monthlyTotalElement

// Данные пользователя
let userData = {
	balance: 0,
	rewards: {},
	currentStreak: 0,
	lastClaimDate: null,
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
	claimButton = document.getElementById('claimButton')
	balanceAmountElement = document.getElementById('balanceAmount')
	currentStreakElement = document.getElementById('currentStreak')
	totalClaimedElement = document.getElementById('totalClaimed')
	currentStreakStatElement = document.getElementById('currentStreakStat')
	monthlyTotalElement = document.getElementById('monthlyTotal')
}

function loadUserData() {
	const urlParams = new URLSearchParams(window.location.search)
	const balance = urlParams.get('balance') || '0'
	const user_id = urlParams.get('user_id') || '0'

	userData.balance = parseInt(balance)
	userData.user_id = user_id

	const savedRewards = localStorage.getItem('dailyRewards')
	if (savedRewards) {
		userData.rewards = JSON.parse(savedRewards)
	}

	const savedStreak = localStorage.getItem('currentStreak')
	if (savedStreak) {
		userData.currentStreak = parseInt(savedStreak)
	}

	const savedLastClaim = localStorage.getItem('lastClaimDate')
	if (savedLastClaim) {
		userData.lastClaimDate = savedLastClaim
	}
}

function setupTelegramIntegration() {
	if (window.Telegram && Telegram.WebApp) {
		// Telegram Web App готов к работе
		Telegram.WebApp.ready()
		Telegram.WebApp.expand()

		// Обработчик входящих данных от бота
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

		// Запрашиваем актуальные данные у бота при загрузке
		requestUserData()
	}
}

function requestUserData() {
	if (window.Telegram && Telegram.WebApp) {
		Telegram.WebApp.sendData(
			JSON.stringify({
				action: 'get_user_data',
			})
		)
	}
}

function handleBotData(data) {
	switch (data.action) {
		case 'update_balance':
			userData.balance = data.balance
			updateUI()
			break
		case 'user_data':
			if (data.balance !== undefined) {
				userData.balance = data.balance
				updateUI()
			}
			break
		default:
			console.log('Unknown action from bot:', data.action)
	}
}

// Остальные функции остаются без изменений (initializeCalendar, handleDayClick, claimDailyReward, etc.)
// ... [все остальные функции из предыдущего rewards.js] ...

function claimDailyReward() {
	const now = new Date()
	const todayKey = getTodayKey()

	if (userData.rewards[todayKey]) {
		showMessage('Сегодняшняя награда уже получена!', 'info')
		return
	}

	userData.rewards[todayKey] = true
	userData.balance += REWARD_AMOUNT
	updateStreak()
	saveUserData()
	updateUI()
	showRewardAnimation()
	sendDataToBot()

	// Перерисовываем календарь чтобы обновить состояние
	initializeCalendar()
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
		// Для тестирования вне Telegram
		console.log('Daily reward claimed:', {
			amount: REWARD_AMOUNT,
			date: getTodayKey(),
			user_id: userData.user_id,
		})
	}
}

// ... [остальные вспомогательные функции] ...
