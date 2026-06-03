let display = document.getElementById('display');
let currentInput = '';
let previousInput = '';
let operator = null;
let shouldResetDisplay = false;

function appendNumber(number) {
    if (shouldResetDisplay) {
        currentInput = number;
        shouldResetDisplay = false;
    } else {
        // Prevent multiple decimal points
        if (number === '.' && currentInput.includes('.')) {
            return;
        }
        currentInput += number;
    }
    updateDisplay();
}

function appendOperator(op) {
    if (currentInput === '') {
        return;
    }

    if (previousInput !== '' && operator !== null && !shouldResetDisplay) {
        calculate();
    }

    previousInput = currentInput;
    operator = op;
    currentInput = '';
    shouldResetDisplay = true;
}

function calculate() {
    if (operator === null || currentInput === '' || previousInput === '') {
        return;
    }

    let result;
    const prev = parseFloat(previousInput);
    const current = parseFloat(currentInput);

    switch (operator) {
        case '+':
            result = prev + current;
            break;
        case '-':
            result = prev - current;
            break;
        case '*':
            result = prev * current;
            break;
        case '/':
            if (current === 0) {
                alert('Cannot divide by zero!');
                clearDisplay();
                return;
            }
            result = prev / current;
            break;
        default:
            return;
    }

    currentInput = result.toString();
    operator = null;
    previousInput = '';
    shouldResetDisplay = true;
    updateDisplay();
}

function clearDisplay() {
    currentInput = '';
    previousInput = '';
    operator = null;
    shouldResetDisplay = false;
    updateDisplay();
}

function deleteLast() {
    currentInput = currentInput.slice(0, -1);
    updateDisplay();
}

function toggleSign() {
    if (currentInput === '') {
        return;
    }
    currentInput = currentInput.startsWith('-') ? currentInput.slice(1) : '-' + currentInput;
    updateDisplay();
}

function updateDisplay() {
    display.value = currentInput || '0';
}

// Initialize display
updateDisplay();

// Keyboard support
document.addEventListener('keydown', function(event) {
    const key = event.key;

    if (key >= '0' && key <= '9') {
        appendNumber(key);
    } else if (key === '.') {
        appendNumber('.');
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
        appendOperator(key);
    } else if (key === 'Enter' || key === '=') {
        event.preventDefault();
        calculate();
    } else if (key === 'Backspace') {
        event.preventDefault();
        deleteLast();
    } else if (key === 'Escape') {
        event.preventDefault();
        clearDisplay();
    }
});