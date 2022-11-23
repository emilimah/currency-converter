const calcSwitchers = document.querySelectorAll(".calc-switcher");

const inputFrom = document.querySelector(".calc-from"),
    inputTo = document.querySelector(".calc-to");
const rateFrom = document.querySelector(".rate-from"),
    rateTo = document.querySelector(".rate-to");

const inputs = [inputFrom, inputTo];

let selectedCurrencyFrom, selectedCurrencyTo;
let rateFromValue, rateToValue;

// получение актуальных данных по валютной паре
async function getCurrencyPair() {
    const from = selectedCurrencyFrom.textContent;
    const to = selectedCurrencyTo.textContent;
    let dataFrom, dataTo;

    if (from != to) {
        let response = Promise.all([
            fetch(`https://api.exchangerate.host/latest?base=${from}&symbols=${to}`).then(r => r.json()),
            fetch(`https://api.exchangerate.host/latest?base=${to}&symbols=${from}`).then(r => r.json())
        ]).catch(() => alert("Что-по пошло не так"));

        const currencyRates = await response;

        if (currencyRates) {
            dataFrom = currencyRates[0].rates[to];
            dataTo = currencyRates[1].rates[from]
        }
    }

    rateFromValue = (from != to && (dataFrom && dataTo)) ? Number(dataFrom.toFixed(4)) : 1;
    rateToValue = (from != to && (dataFrom && dataTo)) ? Number(dataTo.toFixed(4)) : 1;

    rateFrom.textContent = `1 ${from} = ${rateFromValue} ${to}`;
    rateTo.textContent = `1 ${to} = ${rateToValue} ${from}`;
}

// выбор валют по умолчанию, в левом поле расчета ставится единица
function setDefault() {
    selectedCurrencyFrom = calcSwitchers[0].children[0];
    selectedCurrencyTo = calcSwitchers[1].children[1];
    selectedCurrencyFrom.classList.add("active");
    selectedCurrencyTo.classList.add("active");
    inputFrom.value = 1;
    inputTo.value = 1;
}

setDefault();

// выбор валюты и расчет по валютной паре
function selectCurrency(currency, switcher) {
    if (switcher.classList.contains("switcher-from")) {
        selectedCurrencyFrom.classList.remove("active");
        selectedCurrencyFrom = currency;
        selectedCurrencyFrom.classList.add("active");
    }
    if (switcher.classList.contains("switcher-to")) {
        selectedCurrencyTo.classList.remove("active");
        selectedCurrencyTo = currency;
        selectedCurrencyTo.classList.add("active");
    }
    getCurrencyPair().then(() => calc(inputTo, inputFrom, rateFromValue, "currencySwitcher"));
}

// обработка клика по элементу calc-switcher
calcSwitchers.forEach(calcSwitcher => {
    calcSwitcher.addEventListener("click", event => {
        target = event.target;
        if (!target.classList.contains("currency")) return;

        selectCurrency(target, calcSwitcher);
    })
})

// валидация полей ввода: ввод только цифр и точки, запятая заменяется на точку
// максимальное количество вводимых символов - 10
// максимальное количество вводимых символов после точки - 6
function onlyDigits(input) {
    input.value = input.value.replace(/\,/, ".").replace(/[^.\d]/g, '').substring(0, 10);
    if (isNaN(input.value) || (input.value.split('.')[1] || '').length > 6) {
        input.value = input.value.substring(0, input.value.length - 1)
    }
    if (input.value.replace(/[^.]/g, "").length > 1) {
        input.value = "";
    }
}

// разбитие числа на разряды
function toDivide(value) {
    let nums = value.split(".");
    nums[0] = nums[0].replace(/(\d)(?=(\d{3})+([^\d]|$))/g, "$1 ");
    return nums.join(".")
}

// вычисление по данным в левом поле ввода и занесение результата в правое поле ввода
function calc(inpTo, inpFrom, rate, type = "input") {
    if (rate) {
        onlyDigits(inpFrom);
        inpTo.value = toDivide(String(Number((inpFrom.value * rate).toFixed(4))));

        if (type == "currencySwitcher") {
            inpFrom.value = toDivide(inpFrom.value);
        }
    }
}

// вызов функции получения данных по валютной паре а также дальнейшее присваивание обработчиков событий для полей ввода
getCurrencyPair().then(() => {
    calc(inputTo, inputFrom, rateFromValue);

    // расчет данных при вводе в поля ввода
    inputFrom.addEventListener("input", () => {
        calc(inputTo, inputFrom, rateFromValue);
    })

    inputTo.addEventListener("input", () => {
        calc(inputFrom, inputTo, rateToValue);
    })

    inputs.forEach(input => {
        // удаление точки в конце введенного числа, разбитие целой части числа на разряды
        input.addEventListener("blur", () => {
            if (input.value.substring(input.value.length - 1) == ".") {
                input.value = input.value.slice(0, -1);
            }
            input.value = toDivide(input.value);
        })

        // при фокусе на поле ввода удаляются пробелы, созданные разбиением числа на разряды
        input.addEventListener("focus", () => {
            input.value = input.value.replace(/\s/g, "");
        })
    })
})