// Инициализация Speech Recognition API
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'ru-RU';
recognition.continuous = false;
recognition.interimResults = true;

let isListening = false;
let currentTranscript = '';
let isInitialized = false;
let isProcessing = false;
let listeningTimeout = null;

// Элементы DOM
const micButton = document.getElementById('micButton');
const statusElement = document.getElementById('status');
const transcriptElement = document.getElementById('transcript');
const responseElement = document.getElementById('response');

// Команды и их обработчики
const commands = {
    // Время и дата
    'какое время': getTime,
    'сколько времени': getTime,
    'время': getTime,
    'какая дата': getDate,
    'какой день': getDate,
    'дата': getDate,

    // Приветствия
    'привет': greet,
    'привет jarvis': greet,
    'здравствуй': greet,
    'привет помощник': greet,
    'эй jarvis': greet,

    // Сайты
    'открой гугл': () => openSite('https://www.google.com', 'Google'),
    'открой google': () => openSite('https://www.google.com', 'Google'),
    'гугл': () => openSite('https://www.google.com', 'Google'),

    'открой ютуб': () => openSite('https://www.youtube.com', 'YouTube'),
    'открой youtube': () => openSite('https://www.youtube.com', 'YouTube'),
    'ютуб': () => openSite('https://www.youtube.com', 'YouTube'),

    'открой гитхаб': () => openSite('https://www.github.com', 'GitHub'),
    'открой github': () => openSite('https://www.github.com', 'GitHub'),
    'гитхаб': () => openSite('https://www.github.com', 'GitHub'),

    'открой вконтакте': () => openSite('https://www.vk.com', 'ВКонтакте'),
    'открой вк': () => openSite('https://www.vk.com', 'ВКонтакте'),

    'открой твиттер': () => openSite('https://www.twitter.com', 'Twitter'),
    'открой х': () => openSite('https://www.twitter.com', 'Twitter'),

    'открой инстаграм': () => openSite('https://www.instagram.com', 'Instagram'),

    'открой фейсбук': () => openSite('https://www.facebook.com', 'Facebook'),

    'открой тикток': () => openSite('https://www.tiktok.com', 'TikTok'),

    'открой редит': () => openSite('https://www.reddit.com', 'Reddit'),

    'открой твич': () => openSite('https://www.twitch.tv', 'Twitch'),

    // Приложения
    'открой калькулятор': openCalculator,
    'калькулятор': openCalculator,

    'открой блокнот': openNotepad,
    'блокнот': openNotepad,
    
    'откроем браузер': () => openSite('', 'Браузер'),
    'откроем почту': () => openMail(),
    'откроем карты': () => openSite('https://maps.google.com', 'Карты'),
    'откроем настройки': openSettings,
    'откроем файлы': openFileManager,

    // Поиск
    'найди': search,
    'поиск': search,
    'найди информацию': search,
    
    // Управление
    'стоп': stopListening,
    'отключись': stopListening,
    'пока': () => {
        showResponse('До свидания!');
        speak('До свидания!');
        stopListening();
    },
};

// Инициализация при загрузке страницы
window.addEventListener('load', () => {
    setTimeout(() => {
        initializeAssistant();
    }, 500);
});

// Инициализация помощника
function initializeAssistant() {
    if (isInitialized) return;
    isInitialized = true;
    
    statusElement.textContent = 'Микрофон готов';
    statusElement.classList.remove('listening');
    
    // Приветствие
    const hour = new Date().getHours();
    let greeting = '';
    let greetingText = '';
    
    if (hour < 12) {
        greeting = 'Доброе утро! Я Джарвис. Слушаю вас.';
        greetingText = 'Доброе утро';
    } else if (hour < 18) {
        greeting = 'Добрый день! Я Джарвис. Что нужно?';
        greetingText = 'Добрый день';
    } else {
        greeting = 'Добрый вечер! Я Джарвис. Как дела?';
        greetingText = 'Добрый вечер';
    }
    
    showResponse(greetingText);
    speak(greeting);
    
    // Начинаем слушать через 3 секунды, но БЕЗ автоповтора
    setTimeout(() => {
        statusElement.textContent = '🎤 Нажмите кнопку или говорите';
        transcriptElement.innerHTML = '<p class="placeholder">Готов слушать...</p>';
    }, 3500);
}

// Остановить слушание
function stopListening() {
    if (listeningTimeout) {
        clearTimeout(listeningTimeout);
    }
    recognition.stop();
    isListening = false;
    isProcessing = false;
    statusElement.textContent = '⏹️ Остановлен';
    statusElement.classList.remove('listening');
    micButton.classList.remove('listening');
}

// Функция для начала слушания
function startListening() {
    if (isProcessing) return;
    
    // Отменяем старый таймаут если есть
    if (listeningTimeout) {
        clearTimeout(listeningTimeout);
    }
    
    try {
        recognition.start();
        // Таймаут на случай, если микрофон зависнет (15 секунд)
        listeningTimeout = setTimeout(() => {
            if (isListening) {
                recognition.abort();
                isListening = false;
                statusElement.textContent = '⏱️ Время вышло';
                micButton.classList.remove('listening');
                statusElement.classList.remove('listening');
            }
        }, 15000);
    } catch (e) {
        console.log('Recognition start error:', e);
    }
}

// Функция переключения прослушивания
function toggleListening() {
    if (isListening) {
        recognition.stop();
    } else {
        startListening();
    }
}

// События распознавания речи
recognition.onstart = () => {
    isListening = true;
    micButton.classList.add('listening');
    statusElement.classList.add('listening');
    statusElement.textContent = '🎤 Слушаю вас...';
    transcriptElement.innerHTML = '<p class="placeholder">Говорите...</p>';
    responseElement.innerHTML = '';
    responseElement.classList.remove('active');
    currentTranscript = '';
};

recognition.onresult = (event) => {
    currentTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        currentTranscript += transcript;
    }

    if (currentTranscript.length > 0) {
        transcriptElement.innerHTML = `<p>${currentTranscript}</p>`;
    }
};

recognition.onend = () => {
    isListening = false;
    micButton.classList.remove('listening');
    statusElement.classList.remove('listening');
    
    if (listeningTimeout) {
        clearTimeout(listeningTimeout);
    }
    
    if (currentTranscript && currentTranscript.length > 0) {
        statusElement.textContent = '✅ Обработка...';
        processCommand(currentTranscript);
    } else {
        statusElement.textContent = '🎤 Нажмите кнопку или говорите';
    }
};

recognition.onerror = (event) => {
    isListening = false;
    micButton.classList.remove('listening');
    statusElement.classList.remove('listening');
    
    if (listeningTimeout) {
        clearTimeout(listeningTimeout);
    }
    
    console.log('Recognition error:', event.error);
    
    if (event.error === 'no-speech') {
        statusElement.textContent = '🎤 Не услышал...';
    } else if (event.error === 'audio-capture') {
        statusElement.textContent = '❌ Нет доступа к микрофону';
        showResponse('Разрешите доступ к микрофону в браузере');
    } else {
        statusElement.textContent = `❌ ${event.error}`;
    }
};

// Обработка команды
function processCommand(transcript) {
    isProcessing = true;
    let executed = false;

    // Проверяем точное совпадение
    if (commands[transcript]) {
        commands[transcript](transcript);
        executed = true;
    } else {
        // Проверяем частичное совпадение
        for (const [command, handler] of Object.entries(commands)) {
            if (transcript.includes(command)) {
                handler(transcript);
                executed = true;
                break;
            }
        }
    }

    if (!executed) {
        statusElement.textContent = '❌ Не понял';
        showResponse(`Команда: "${transcript}"`);
        speak(`Извините, я не понимаю эту команду`);
    }
    
    // Возвращаемся в режим ожидания через 2 секунды
    setTimeout(() => {
        statusElement.textContent = '🎤 Нажмите кнопку или говорите';
        isProcessing = false;
    }, 2000);
}

// Функции команд
function getTime() {
    const now = new Date();
    const time = now.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit'
    });
    const message = `Время: ${time}`;
    showResponse(message);
    speak(`Сейчас ${time}`);
}

function getDate() {
    const now = new Date();
    const date = now.toLocaleDateString('ru-RU', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const message = `Дата: ${date}`;
    showResponse(message);
    speak(`Сегодня ${date}`);
}

function greet() {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour < 12) {
        greeting = 'Доброе утро!';
    } else if (hour < 18) {
        greeting = 'Добрый день!';
    } else {
        greeting = 'Добрый вечер!';
    }
    
    showResponse(greeting);
    speak(greeting);
}

function openSite(url, siteName) {
    const message = `Открываю ${siteName}...`;
    showResponse(message);
    speak(`Открываю ${siteName}`);
    if (url) {
        setTimeout(() => {
            window.open(url, '_blank');
        }, 500);
    }
}

function openCalculator() {
    const message = 'Открываю калькулятор...';
    showResponse(message);
    speak('Открываю калькулятор');
    setTimeout(() => {
        window.open('index.html', '_blank');
    }, 500);
}

function openNotepad() {
    const message = 'Открываю блокнот...';
    showResponse(message);
    speak('Открываю блокнот');
    
    const notepadWindow = window.open('', 'Блокнот', 'width=600,height=400');
    notepadWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Блокнот</title>
            <style>
                body { margin: 0; padding: 10px; font-family: Arial; background: #f0f0f0; }
                textarea { width: 100%; height: calc(100vh - 30px); border: 1px solid #ccc; padding: 10px; font-size: 14px; border-radius: 5px; }
            </style>
        </head>
        <body>
            <textarea placeholder="Напишите что-нибудь..." autofocus></textarea>
        </body>
        </html>
    `);
}

function openMail() {
    const message = 'Открываю почту...';
    showResponse(message);
    speak('Открываю почту');
    setTimeout(() => {
        window.open('https://mail.google.com', '_blank');
    }, 500);
}

function openSettings() {
    const message = 'Открываю настройки...';
    showResponse(message);
    speak('Открываю системные настройки');
    setTimeout(() => {
        // Пытаемся открыть системные настройки
        if (navigator.platform.includes('Win')) {
            // Windows
            alert('Откройте параметры вручную: Win + I');
        } else if (navigator.platform.includes('Mac')) {
            // macOS
            alert('Откройте System Preferences вручную: Cmd + Space, затем System Preferences');
        }
    }, 500);
}

function openFileManager() {
    const message = 'Открываю файлы...';
    showResponse(message);
    speak('Открываю менеджер файлов');
    setTimeout(() => {
        alert('Откройте файлы вручную: Win + E (Windows) или Cmd + Space + Finder (Mac)');
    }, 500);
}

function search(transcript) {
    const query = transcript.replace(/найди|поиск|найди информацию|о /gi, '').trim();
    
    if (query.length > 0) {
        const message = `Ищу: "${query}"...`;
        showResponse(message);
        speak(`Ищу информацию`);
        
        setTimeout(() => {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            window.open(searchUrl, '_blank');
        }, 500);
    } else {
        showResponse('Что искать?');
        speak('Уточните поисковый запрос');
    }
}

// Синтез речи
function speak(text) {
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    speechSynthesis.speak(utterance);
}

// Отображение ответа
function showResponse(text) {
    responseElement.innerHTML = `<p>${text}</p>`;
    responseElement.classList.add('active');
}

// Очистка дисплея
function clearDisplay() {
    speechSynthesis.cancel();
    recognition.stop();
    isListening = false;
    isProcessing = false;
    
    if (listeningTimeout) {
        clearTimeout(listeningTimeout);
    }
    
    transcriptElement.innerHTML = '<p class="placeholder">Готов слушать...</p>';
    responseElement.innerHTML = '';
    responseElement.classList.remove('active');
    statusElement.textContent = '🎤 Нажмите кнопку или говорите';
    statusElement.classList.remove('listening');
    currentTranscript = '';
}

// Функция для выполнения команды кнопкой
function executeCommand(command) {
    transcriptElement.innerHTML = `<p>${command}</p>`;
    statusElement.textContent = '✅ Обработка...';
    isProcessing = true;
    
    setTimeout(() => {
        processCommand(command);
    }, 300);
}
