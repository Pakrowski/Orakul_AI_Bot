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

function selectPaymentMethod(method) {
    document.querySelectorAll('.payment-method').forEach(pm => {
        pm.classList.remove('selected')
    })
    event.currentTarget.classList.add('selected')
    selectedPaymentMethod = method
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
    }

    const selected = packages[selectedPackage]

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
        // Отправляем данные о покупке в бот
        const data = {
            action: 'purchase_messages',
            package_id: selectedPackage,
            amount: selected.amount,
            payment_method: selectedPaymentMethod
        }

        if (selectedPaymentMethod !== 'stars') {
            data.email = document.getElementById('emailInput').value.trim()
        }

        Telegram.WebApp.sendData(JSON.stringify(data))
        
    } else {
        let message = `Пакет: ${selected.name}\nКоличество: ${selected.amount} сообщений\n`

        if (selectedPaymentMethod === 'stars') {
            message += `Стоимость: ⭐ ${selected.price}\nСпособ: Telegram Stars\n\nДля оплаты используйте Telegram.`
        } else {
            const email = document.getElementById('emailInput').value.trim()
            message += `Стоимость: ${selected.price} ₽\nСпособ: ${getPaymentMethodName(selectedPaymentMethod)}\nEmail: ${email}\n\nДля оплаты используйте Telegram.`
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

// Загрузка реферальных данных
function loadReferralData() {
    if (window.Telegram && Telegram.WebApp) {
        const user = Telegram.WebApp.initDataUnsafe.user
        if (user) {
            const referralLink = `https://t.me/orakul_ai_bot?start=ref_${user.id}`
            document.getElementById('referralLink').textContent = referralLink
        }
    } else {
        document.getElementById('referralLink').textContent = 'https://t.me/orakul_ai_bot?start=ref_123456789'
    }
}

// Копирование реферальной ссылки
function copyReferralLink() {
    const link = document.getElementById('referralLink').textContent
    if (link !== 'Загрузка...' && link !== 'Доступно только в Telegram') {
        navigator.clipboard.writeText(link).then(() => {
            if (window.Telegram && Telegram.WebApp) {
                Telegram.WebApp.showPopup({
                    title: 'Успешно',
                    message: 'Ссылка скопирована в буфер обмена!',
                    buttons: [{ type: 'default', text: 'OK' }],
                })
            } else {
                alert('Ссылка скопирована в буфер обмена!')
            }
        }).catch(() => {
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

// Обработка данных от бота
function handleBotData(data) {
    try {
        const parsedData = JSON.parse(data)
        console.log('Received data from bot:', parsedData)
        
        switch (parsedData.action) {
            case 'update_balance':
                document.getElementById('balanceAmount').textContent = parsedData.balance
                console.log('Balance updated to:', parsedData.balance)
                break
            case 'purchase_success':
                document.getElementById('balanceAmount').textContent = parsedData.new_balance
                if (window.Telegram && Telegram.WebApp) {
                    Telegram.WebApp.showAlert(`Успешно! Баланс пополнен на ${parsedData.amount} сообщений.`)
                }
                break
        }
    } catch (e) {
        console.error('Error parsing data from bot:', e)
    }
}

// Инициализация Telegram Web App
if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready()
    Telegram.WebApp.expand()

    // Обработчик входящих данных от бота
    Telegram.WebApp.onEvent('messageText', (event) => {
        if (event.message_text) {
            handleBotData(event.message_text)
        }
    })

    const user = Telegram.WebApp.initDataUnsafe.user
    if (user) {
        console.log('User data:', user)
        loadReferralData()

        // Сразу запрашиваем актуальный баланс у бота
        Telegram.WebApp.sendData(JSON.stringify({
            action: 'get_balance'
        }))
    }
} else {
    console.log('Telegram Web App not detected')
    document.getElementById('referralLink').textContent = 'https://t.me/orakul_ai_bot?start=ref_123456789'
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
