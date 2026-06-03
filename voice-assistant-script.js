// Инициализация Speech Recognition API
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'ru-RU';
recognition.continuous = false;
recognition.interimResults = true;

let isListening = false;
let currentTranscript = '';
let isInitialized = false;
let isProcessing = false;

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

    // Поиск
    'найди': search,
    'поиск': search,
    'найди информацию': search,
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
    
    statusElement.textContent = 'Голосовой помощник готов';
    statusElement.classList.remove('listening');
    
    // Приветствие
    const hour = new Date().getHours();
    let greeting = '';
    let greetingText = '';
    
    if (hour < 12) {
        greeting = 'Доброе утро! Я Джарвис. Готов вам помочь.';
        greetingText = 'Доброе утро';
    } else if (hour < 18) {
        greeting = 'Добрый день! Я Джарвис. Чем я могу помочь?';
        greetingText = 'Добрый день';
    } else {
        greeting = 'Добрый вечер! Я Джарвис. Как ваши дела?';
        greetingText = 'Добрый вечер';
    }
    
    showResponse(greetingText);
    speak(greeting);
    
    // Начинаем слушать через 3 секунды
    setTimeout(() => {
        startListening();
    }, 3500);
}

// Функция для начала слушания
function startListening() {
    if (isProcessing) return;
    
    try {
        recognition.start();
    } catch (e) {
        console.log('Recognition already started');
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

    if (currentTranscript.length > 0) {
        transcriptElement.innerHTML = `<p>${currentTranscript}</p>`;
    }
};

recognition.onend = () => {
    isListening = false;
    micButton.classList.remove('listening');
    statusElement.classList.remove('listening');
    
    if (currentTranscript && currentTranscript.length > 0) {
        statusElement.textContent = '✅ Обработка команды...';
        processCommand(currentTranscript);
    } else {
        statusElement.textContent = 'Готов к работе';
        // Автоматически слушаем дальше через 1.5 секунды
        setTimeout(() => {
            if (!isProcessing) {
                startListening();
            }
        }, 1500);
    }
};

recognition.onerror = (event) => {
    isListening = false;
    micButton.classList.remove('listening');
    statusElement.classList.remove('listening');
    
    console.log('Recognition error:', event.error);
    
    if (event.error === 'no-speech') {
        statusElement.textContent = 'Ничего не услышал...';
        // Продолжаем слушать
        setTimeout(() => {
            if (!isProcessing) {
                startListening();
            }
        }, 1500);
    } else {
        statusElement.textContent = `❌ Ошибка: ${event.error}`;
        showResponse(`Ошибка: ${event.error}`);
        speak(`Ошибка распознавания`);
        
        setTimeout(() => {
            statusElement.textContent = 'Готов к работе';
            if (!isProcessing) {
                startListening();
            }
        }, 2000);
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
        statusElement.textContent = '❌ Команда не найдена';
        showResponse(`Не распознал: "${transcript}"`);
        speak(`Извините, я не понял эту команду`);
    }
    
    // Продолжаем слушать через 2.5 секунды
    setTimeout(() => {
        statusElement.textContent = 'Готов к работе';
        isProcessing = false;
        startListening();
    }, 2500);
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
    setTimeout(() => {
        window.open(url, '_blank');
    }, 500);
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
        showResponse('Укажите, что искать');
        speak('Пожалуйста, уточните поисковый запрос');
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
    
    transcriptElement.innerHTML = '<p class="placeholder">Слушаю вас...</p>';
    responseElement.innerHTML = '';
    responseElement.classList.remove('active');
    statusElement.textContent = 'Готов к работе';
    statusElement.classList.remove('listening');
    currentTranscript = '';
    
    setTimeout(() => {
        startListening();
    }, 500);
}

// Функция для выполнения команды кнопкой
function executeCommand(command) {
    transcriptElement.innerHTML = `<p>${command}</p>`;
    statusElement.textContent = '✅ Обработка команды...';
    isProcessing = true;
    
    setTimeout(() => {
        processCommand(command);
    }, 300);
}
