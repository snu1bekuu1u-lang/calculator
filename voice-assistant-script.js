// Инициализация Speech Recognition API
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'ru-RU';
recognition.continuous = false;
recognition.interimResults = true;

let isListening = false;
let currentTranscript = '';

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

    // Поиск
    'найди': search,
    'поиск': search,
    'найди информацию': search,
};

// Функция переключения прослушивания
function toggleListening() {
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

// События распознавания речи
recognition.onstart = () => {
    isListening = true;
    micButton.classList.add('listening');
    statusElement.textContent = '🎤 Слушаю...';
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

    transcriptElement.innerHTML = `<p>${currentTranscript}</p>`;
};

recognition.onend = () => {
    isListening = false;
    micButton.classList.remove('listening');
    statusElement.textContent = '✅ Обработка команды...';
    
    if (currentTranscript) {
        processCommand(currentTranscript);
    } else {
        statusElement.textContent = '❌ Команда не распознана';
    }
};

recognition.onerror = (event) => {
    isListening = false;
    micButton.classList.remove('listening');
    statusElement.textContent = `❌ Ошибка: ${event.error}`;
    showResponse(`Ошибка распознавания: ${event.error}`);
};

// Обработка команды
function processCommand(transcript) {
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
        statusElement.textContent = '❌ Команда не найдена';
        showResponse(`Команда не распознана: "${transcript}". Попробуйте другую команду.`);
        speak(`Команда не распознана: ${transcript}`);
    }
}

// Функции команд
function getTime() {
    const now = new Date();
    const time = now.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    const message = `Текущее время: ${time}`;
    showResponse(message);
    speak(`Сейчас ${time}`);
    statusElement.textContent = '✅ Готово';
}

function getDate() {
    const now = new Date();
    const date = now.toLocaleDateString('ru-RU', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const message = `Текущая дата: ${date}`;
    showResponse(message);
    speak(`Сегодня ${date}`);
    statusElement.textContent = '✅ Готово';
}

function greet() {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour < 12) {
        greeting = 'Доброе утро! Как дела?';
    } else if (hour < 18) {
        greeting = 'Добрый день! Чем я могу помочь?';
    } else {
        greeting = 'Добрый вечер! Как ваши дела?';
    }
    
    showResponse(greeting);
    speak(greeting);
    statusElement.textContent = '✅ Готово';
}

function openSite(url, siteName) {
    const message = `Открываю ${siteName}...`;
    showResponse(message);
    speak(`Открываю ${siteName}`);
    statusElement.textContent = '✅ Готово';
    setTimeout(() => {
        window.open(url, '_blank');
    }, 500);
}

function openCalculator() {
    const message = 'Открываю калькулятор...';
    showResponse(message);
    speak('Открываю калькулятор');
    statusElement.textContent = '✅ Готово';
    setTimeout(() => {
        window.open('index.html', '_blank');
    }, 500);
}

function openNotepad() {
    const message = 'Открываю блокнот...';
    showResponse(message);
    speak('Открываю блокнот');
    statusElement.textContent = '✅ Готово';
    
    // Открываем простой блокнот
    const notepadWindow = window.open('', 'Блокнот', 'width=600,height=400');
    notepadWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Блокнот</title>
            <style>
                body { margin: 0; padding: 10px; font-family: Arial; }
                textarea { width: 100%; height: 100%; border: 1px solid #ccc; padding: 10px; font-size: 14px; }
            </style>
        </head>
        <body>
            <textarea placeholder="Напишите что-нибудь..."></textarea>
        </body>
        </html>
    `);
}

function search(transcript) {
    // Извлекаем поисковый запрос
    const query = transcript.replace(/найди|поиск|найди информацию|о /gi, '').trim();
    
    if (query.length > 0) {
        const message = `Ищу информацию о "${query}"...`;
        showResponse(message);
        speak(`Ищу информацию о ${query}`);
        statusElement.textContent = '✅ Готово';
        
        setTimeout(() => {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            window.open(searchUrl, '_blank');
        }, 500);
    } else {
        showResponse('Пожалуйста, укажите, что вы хотите найти');
        speak('Пожалуйста, укажите, что вы хотите найти');
        statusElement.textContent = '❌ Ошибка';
    }
}

// Синтез речи
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 1;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
}

// Отображение ответа
function showResponse(text) {
    responseElement.innerHTML = `<p>${text}</p>`;
    responseElement.classList.add('active');
}

// Очистка дисплея
function clearDisplay() {
    transcriptElement.innerHTML = '<p class="placeholder">Нажмите кнопку микрофона и произнесите команду...</p>';
    responseElement.innerHTML = '';
    responseElement.classList.remove('active');
    statusElement.textContent = 'Готов к работе';
    currentTranscript = '';
}

// Функция для выполнения команды кнопкой
function executeCommand(command) {
    transcriptElement.innerHTML = `<p>${command}</p>`;
    statusElement.textContent = '✅ Обработка команды...';
    setTimeout(() => {
        processCommand(command);
    }, 300);
}

// Инициализация
statusElement.textContent = 'Готов к работе';
speak('Голосовой помощник JARVIS готов к работе');
