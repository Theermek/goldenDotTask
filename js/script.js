const url = date => `https://www.cbr-xml-daily.ru/archive/${date}/daily_json.js`;

class Currency {
    constructor(charCode, nominal, name, latestValue, previousValue, date) {
        this.name = name;
        this.charCode = charCode;
        this.previousValues = {}; // значение валюты за прошлые периоды. ключ - дата, значение - курс вылюты
        this.date = date;

        this.value = (latestValue/nominal).toFixed(2);
        this.stonks = (((latestValue - previousValue)/latestValue)*100).toFixed(2);
        this.stonksDirection = ((latestValue > previousValue) ? '▲':'▼');
    }
}

const getDateQuery = (daysShift) => {
    const date = new Date();

    function zeroMonth() {
        let month = date.getMonth();
        if (month >= 0 && month < 10) {
            return `0${month + 1}`;
        } else {
            return;
        }
    }
    return `${date.getFullYear()}/${zeroMonth()}/${date.getDate() - daysShift}`;
};
let currencies = {}; // массив с валютами

function fetchCurrencies (daysShift) {
    axios.get(url(getDateQuery(daysShift)))
        .then(response => {
            if (response.status === 200) {
                for (const key in response.data.Valute) {
                    let rawData = response.data.Valute[key];
                    currencies[key] = new Currency(rawData.CharCode, rawData.Nominal, rawData.Name, rawData.Value, rawData.Previous, response.data.Date);
                }

                for (let i = daysShift + 1; i <= 10; i ++) {
                    axios.get(url(getDateQuery(i)))
                    .then(response => {
                        for (const key in response.data.Valute) {
                            currencies[key].previousValues[response.data.Date] = response.data.Valute[key].Value;
                        }
                    });
                }

                // render(currencies)
            } else {
                fetchCurrencies(daysShift + 1);
            }
        }).catch(function () {fetchCurrencies(daysShift + 1)});
}


function render(currencies) {
    for (let key in currencies) {
        let currency = currencies[key];

        let currencyRow = document.createElement('tr');

        // создаем основную строку с информацией
        currencyRow.innerHTML = `
        <td class="tooltip" data-text="${currency.name}">${currency.charCode}</td>
        <td class="date">${currency.date.slice(0, 10)}</td>
        <td class="value">${currency.value}</td>
        <td class="coefficient">${currency.stonks}% ${currency.stonksDirection}</td>
        `;

        // создаем кнопку
        let infoBtn = document.createElement('button');
        infoBtn.innerHTML = "more";
        currencyRow.append(infoBtn);

        let parent = document.querySelector('.data');
        parent.append(currencyRow);

        for (let key in currency.previousValues) {
            // создаем строки с дополнительной информацией по прошлому
            let previousRow = document.createElement('tr');
            previousRow.hidden = true;
            previousRow.innerHTML = `
            <td class="value">Курс за</td>
            <td class="date">${key}</td>
            <td class="value">${currency.previousValues[key]}</td>
            `;
            parent.append(previousRow);
            infoBtn.addEventListener('click', function () {
                previousRow.hidden = !previousRow.hidden;
            });
        }

    }
}

fetchCurrencies(0);
// ждём 1 секунду, чтобы все запросы успели выполнится, перед тем, как рендерить, иначе может работать не стабильно
setTimeout(function () {render(currencies)}, 1000);

