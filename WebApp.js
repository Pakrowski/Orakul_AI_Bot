// ==============================
//  Утилиты: найти элемент по onclick
// ==============================
function findElementByOnclick(selector, fnName, argStr) {
	// selector: css селектор, fnName: имя функции, argStr: строка аргумента (например 'profile' или '1')
	const nodes = document.querySelectorAll(selector)
	for (const n of nodes) {
		const oc = n.getAttribute('onclick')
		if (!oc) continue
		// проверим варианты: fnName('arg'), fnName("arg"), fnName(arg)
		if (argStr === undefined) {
			if (oc.includes(fnName + '(')) return n
		} else {
			const patterns = [
				`${fnName}('${argStr}')`,
				`${fnName}("${argStr}")`,
				`${fnName}(${argStr})`,
			]
			for (const p of patterns) {
				if (oc.includes(p)) return n
			}
		}
	}
	return null
}

// ==============================
//  Переключение табов (работает при вызове с el и без)
// ==============================
function switchTab(tabName, el) {
	// Скрываем все контенты
	document.querySelectorAll('.tab-content').forEach(tab => {
		tab.style.display = 'none'
	})
	// Снимаем active со всех табов
	document.querySelectorAll('.tab').forEach(tab => {
		tab.classList.remove('active')
	})

	// Показываем нужный контент
	const target = document.getElementById(tabName)
	if (target) target.style.display = 'block'

	// Если элемент не передали — попробуем найти по inline onclick
	if (!el) {
		el = findElementByOnclick(
			'.tab',
			'switchTab',
			`'${tabName}'`.replace(/'/g, '')
		) // try fallback
		// Попробуем искать с и без кавычек
		if (!el) el = findElementByOnclick('.tab', 'switchTab', tabName)
	}

	if (el && el.classList) {
		el.classList.add('active')
	} else {
		// если всё ещё не найден — выделим первый таб соответствующего id по index совпадению (fallback)
		const maybe = Array.from(document.querySelectorAll('.tab')).find(t => {
			const text = (t.textContent || '').trim().toLowerCase()
			return text.includes(tabName.toLowerCase())
		})
		if (maybe) maybe.classList.add('active')
	}

	if (tabName === 'referral') loadReferralData()
}

// ==============================
//  Helpers для radio-dot (твой CSS использует .radio-dot)
// ==============================
function setRadioDotSelected(containerEl, selected) {
	if (!containerEl) return
	const dot = containerEl.querySelector('.radio-dot')
	if (!dot) return
	if (selected) dot.classList.add('selected')
	else dot.classList.remove('selected')
}

// ==============================
//  Выбор пакета (регулярный) — работает с el или без
// ==============================
let selectedPackage = null
let selectedPaymentMethod = 'sbp'

function selectPackage(packageId, el) {
	// если el не передан — пытаемся найти .package-option с onclick содержащим selectPackage(packageId)
	if (!el) {
		el = findElementByOnclick(
			'#regularPackages .package-option',
			'selectPackage',
			String(packageId)
		)
		// последний шанс: найти по порядковому индексу (1..n)
		if (!el) {
			const all = document.querySelectorAll('#regularPackages .package-option')
			const idx = packageId - 1
			if (all && all[idx]) el = all[idx]
		}
	}

	document.querySelectorAll('#regularPackages .package-option').forEach(pkg => {
		pkg.classList.remove('selected')
		setRadioDotSelected(pkg, false)
	})

	if (el) {
		el.classList.add('selected')
		setRadioDotSelected(el, true)
		selectedPackage = packageId
	} else {
		// fallback: просто установим selectedPackage
		selectedPackage = packageId
	}
}

// ==============================
//  Выбор пакета Stars (работает с el или без)
// ==============================
function selectStarsPackage(packageId, el) {
	if (!el) {
		el = findElementByOnclick(
			'#starsPackages .package-option',
			'selectStarsPackage',
			String(packageId)
		)
		if (!el) {
			const all = document.querySelectorAll('#starsPackages .package-option')
			const idx = packageId - 1
			if (all && all[idx]) el = all[idx]
		}
	}

	document.querySelectorAll('#starsPackages .package-option').forEach(pkg => {
		pkg.classList.remove('selected')
		setRadioDotSelected(pkg, false)
	})

	if (el) {
		el.classList.add('selected')
		setRadioDotSelected(el, true)
		selectedPackage = packageId
	} else {
		selectedPackage = packageId
	}
}

// ==============================
//  Выбор метода оплаты (работает с el или без)
// ==============================
function selectPaymentMethod(method, el) {
	// Если el не передан — попытаемся найти .payment-method с onclick содержащим метод
	if (!el) {
		el = findElementByOnclick(
			'.payment-method',
			'selectPaymentMethod',
			String(method)
		)
		if (!el) {
			// пробуем искать по тексту внутри
			const all = document.querySelectorAll('.payment-method')
			for (const pm of all) {
				const txt = (pm.textContent || '').toLowerCase()
				if (txt.includes(method.toLowerCase())) {
					el = pm
					break
				}
			}
		}
	}

	document.querySelectorAll('.payment-method').forEach(pm => {
		pm.classList.remove('selected')
		setRadioDotSelected(pm, false)
	})

	if (el) {
		el.classList.add('selected')
		setRadioDotSelected(el, true)
	}

	// переключаем видимость пакетов
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

	selectedPaymentMethod = method
	// сброс выбранного пакета при смене метода
	selectedPackage = null
	document.querySelectorAll('.package-option').forEach(pkg => {
		pkg.classList.remove('selected')
		setRadioDotSelected(pkg, false)
	})
}

// ==============================
//  Email валидация
// ==============================
function validateEmail(email) {
	const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	return re.test(email)
}
function handleEmailInput() {
	const emailInput = document.getElementById('emailInput')
	const emailError = document.getElementById('emailError')
	if (!emailInput) return true
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

// ==============================
//  Баланс — отправка запроса боту
// ==============================
function updateBalanceFromBot() {
	if (window.Telegram && Telegram.WebApp) {
		Telegram.WebApp.sendData(JSON.stringify({ action: 'get_balance' }))
	}
}
function updateBalanceDisplay(newBalance) {
	const el = document.getElementById('balanceAmount')
	if (el) el.textContent = newBalance
}

// ==============================
//  Процесс оплаты
// ==============================
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
	if (!selected) {
		alert('Ошибка: неверный пакет')
		return
	}

	let email = ''
	if (selectedPaymentMethod !== 'stars') {
		const inp = document.getElementById('emailInput')
		if (!inp) {
			alert('Введите email для чека')
			return
		}
		email = inp.value.trim()
		if (!validateEmail(email)) {
			alert('Введите корректный email')
			return
		}
	}

	if (window.Telegram && Telegram.WebApp) {
		Telegram.WebApp.showPopup(
			{
				title: 'Подтверждение оплаты',
				message:
					`Пакет: ${selected.name}\n` +
					`Сообщений: ${selected.amount}\n` +
					(selectedPaymentMethod === 'stars'
						? `Стоимость: ⭐ ${selected.price}`
						: `Стоимость: ${selected.price} ₽\nEmail: ${email}`),
				buttons: [
					{ id: 'confirm', type: 'default', text: 'Оплатить' },
					{ type: 'cancel', text: 'Отмена' },
				],
			},
			function (buttonId) {
				if (buttonId === 'confirm') {
					const data = {
						action: 'purchase_messages',
						package_id: selectedPackage,
						amount: selected.amount,
						payment_method: selectedPaymentMethod,
					}
					if (selectedPaymentMethod !== 'stars') data.email = email

					Telegram.WebApp.sendData(JSON.stringify(data))
					// локальное обновление UX — подождём подтверждения от бота для окончательного sync
					const cur = parseInt(
						document.getElementById('balanceAmount').textContent || '0',
						10
					)
					updateBalanceDisplay(cur + selected.amount)
					switchTab('profile')
				}
			}
		)
	} else {
		// вне Telegram — просто показать данные
		alert(
			`Пакет: ${selected.name}\nСообщений: ${selected.amount}\nСтоимость: ${selected.price}\nДля оплаты откройте WebApp в Telegram`
		)
	}
}

// ==============================
//  Подписка
// ==============================
function subscribePremium() {
	if (window.Telegram && Telegram.WebApp) {
		Telegram.WebApp.showPopup(
			{
				title: 'Премиум',
				message:
					'Активировать подписку "ОРАКУЛ ПРЕМИУМ" за 1 990 ₽ на 30 дней?',
				buttons: [
					{ id: 'confirm', type: 'default', text: 'Активировать' },
					{ type: 'cancel', text: 'Отмена' },
				],
			},
			function (buttonId) {
				if (buttonId === 'confirm') {
					Telegram.WebApp.sendData(
						JSON.stringify({
							action: 'subscribe_premium',
							price: 1990,
							duration: 30,
						})
					)
					switchTab('profile')
				}
			}
		)
	} else {
		alert('Откройте WebApp в Telegram для активации подписки')
	}
}

// ==============================
//  Реферальная логика и копирование
// ==============================
function loadReferralData() {
	if (window.Telegram && Telegram.WebApp) {
		const user =
			Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user
		if (user) {
			document.getElementById(
				'referralLink'
			).textContent = `https://t.me/orakul_ai_bot?start=ref_${user.id}`
			Telegram.WebApp.sendData(JSON.stringify({ action: 'get_referral_stats' }))
		}
	} else {
		document.getElementById('referralLink').textContent =
			'https://t.me/orakul_ai_bot?start=ref_123456'
	}
}
function copyReferralLink() {
	const link = document.getElementById('referralLink').textContent
	navigator.clipboard
		.writeText(link)
		.then(() => {
			if (window.Telegram && Telegram.WebApp)
				Telegram.WebApp.showAlert('Ссылка скопирована!')
			else alert('Ссылка скопирована!')
		})
		.catch(() => alert('Ошибка копирования'))
}

// ==============================
//  Юридические документы
// ==============================
function openPrivacyPolicy() {
	if (window.Telegram && Telegram.WebApp)
		Telegram.WebApp.openLink('https://telegram.org/privacy-tpa')
	else window.open('https://telegram.org/privacy-tpa', '_blank')
}
function openTermsOfService() {
	document.getElementById('legal').style.display = 'none'
	document.getElementById('termsContent').style.display = 'block'
}
function closeLegalContent() {
	document.getElementById('termsContent').style.display = 'none'
	document.getElementById('legal').style.display = 'block'
}

// ==============================
//  Обработка данных от бота
// ==============================
function handleBotData(data) {
	try {
		const parsed = JSON.parse(data)
		if (!parsed || !parsed.action) return
		switch (parsed.action) {
			case 'update_balance':
				updateBalanceDisplay(parsed.balance)
				break
			case 'update_referral_stats':
				if (parsed.total_refs !== undefined)
					document.getElementById('referralsCount').textContent =
						parsed.total_refs
				if (parsed.earned_messages !== undefined)
					document.getElementById('referralsEarned').textContent =
						parsed.earned_messages
				break
			case 'purchase_success':
				if (parsed.new_balance !== undefined)
					updateBalanceDisplay(parsed.new_balance)
				if (window.Telegram && Telegram.WebApp)
					Telegram.WebApp.showAlert(`Оплачено: +${parsed.amount} сообщений`)
				break
		}
	} catch (e) {
		console.error('Ошибка парсинга данных от бота', e)
	}
}

// ==============================
//  Инициализация WebApp
// ==============================
if (window.Telegram && Telegram.WebApp) {
	Telegram.WebApp.ready()
	try {
		Telegram.WebApp.expand()
	} catch (e) {
		/* ignore */
	}

	Telegram.WebApp.onEvent('webAppDataReceived', ev => {
		if (ev && ev.data) handleBotData(ev.data)
	})

	// Если в URL передан баланс — отобразим
	const params = new URLSearchParams(window.location.search)
	const balance = params.get('balance')
	if (balance) updateBalanceDisplay(balance)
	else updateBalanceFromBot()
} else {
	// не в Telegram — демонстрационные данные
	document.addEventListener('DOMContentLoaded', () => {
		const bal = document.getElementById('balanceAmount')
		if (bal) bal.textContent = '5'
		const ref = document.getElementById('referralLink')
		if (ref) ref.textContent = 'https://t.me/orakul_ai_bot?start=ref_demo'
	})
}

// ==============================
//  DOMContentLoaded: добавим слушатели на элементы (чтобы при клике передавать this)
// ==============================
document.addEventListener('DOMContentLoaded', () => {
	// email
	const email = document.getElementById('emailInput')
	if (email) {
		email.addEventListener('input', handleEmailInput)
		email.addEventListener('blur', handleEmailInput)
	}

	// Привяжем клики к табам, если есть (передадим this)
	document.querySelectorAll('.tab').forEach(tab => {
		tab.addEventListener('click', function (e) {
			// Если inline onclick уже вызывает switchTab, то двойной вызов не страшен — наша функция устойчива к повтору
			const onclick = tab.getAttribute('onclick')
			// Попробуем получить имя таба из onclick или data-tab
			let name = tab.dataset.tab
			if (!name && onclick) {
				// ищем первый аргумент в кавычках
				const m = onclick.match(/switchTab\((['"])?([^)'" ]+)\1?\)/)
				if (m && m[2]) name = m[2]
			}
			if (!name) {
				// fallback: ищем id по порядку, либо data-target
				const possible = tab.querySelector('.tab-text')
				if (possible) name = (possible.textContent || '').trim().toLowerCase()
			}
			if (name) switchTab(name, tab)
			else {
				// последний fallback: просто добавим active класс
				document
					.querySelectorAll('.tab')
					.forEach(t => t.classList.remove('active'))
				tab.classList.add('active')
			}
		})
	})

	// Привязка клика к payment-methods (передадим this и аргумент)
	document.querySelectorAll('.payment-method').forEach(pm => {
		pm.addEventListener('click', function () {
			const onclick = pm.getAttribute('onclick')
			if (onclick) {
				const m = onclick.match(/selectPaymentMethod\((['"])?([^)'" ]+)\1?\)/)
				if (m && m[2]) selectPaymentMethod(m[2], pm)
				else selectPaymentMethod(selectedPaymentMethod, pm)
			} else {
				selectPaymentMethod(selectedPaymentMethod, pm)
			}
		})
	})

	// Привязка клика к package-option (обычные)
	document
		.querySelectorAll('#regularPackages .package-option')
		.forEach((pkg, idx) => {
			pkg.addEventListener('click', function () {
				// Попытаемся прочитать onclick аргумент
				const onclick = pkg.getAttribute('onclick')
				let arg = idx + 1
				if (onclick) {
					const m = onclick.match(/selectPackage\((['"])?([^)'" ]+)\1?\)/)
					if (m && m[2]) arg = parseInt(m[2], 10) || arg
				}
				selectPackage(arg, pkg)
			})
		})

	// Привязка клика к stars-пакетам
	document
		.querySelectorAll('#starsPackages .package-option')
		.forEach((pkg, idx) => {
			pkg.addEventListener('click', function () {
				const onclick = pkg.getAttribute('onclick')
				let arg = idx + 1
				if (onclick) {
					const m = onclick.match(/selectStarsPackage\((['"])?([^)'" ]+)\1?\)/)
					if (m && m[2]) arg = parseInt(m[2], 10) || arg
				}
				selectStarsPackage(arg, pkg)
			})
		})

	// Установим оплату по умолчанию — попытаемся найти элемент с onclick содержащим 'sbp'
	let defaultPaymentEl = findElementByOnclick(
		'.payment-method',
		'selectPaymentMethod',
		'sbp'
	)
	if (!defaultPaymentEl)
		defaultPaymentEl = document.querySelector('.payment-method')
	if (defaultPaymentEl) selectPaymentMethod('sbp', defaultPaymentEl)
})
