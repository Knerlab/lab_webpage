const inputScroll = document.getElementById('inputScroll');
const resultList = document.getElementById('resultList');
const addRowBtn = document.getElementById('addRowBtn');
const drawBtn = document.getElementById('drawBtn');
const saveBtn = document.getElementById('saveBtn');
const recordBtn = document.getElementById('recordBtn');
const hintText = document.getElementById('hintText');
const semesterSelect = document.getElementById('semesterSelect');
const yearSelect = document.getElementById('yearSelect');
const recordsTableBody = document.getElementById('recordsTableBody');

let rows = Array.from({ length: 5 }, () => '');
let shuffling = false;
let shuffleTimer = null;
let shuffledOrder = [];
const recordedResults = [];
const SHUFFLE_INTERVAL_MS = 80;
const MAX_VISIBLE_RECORDS = 5;

function formatIndex(i) {
    return String(i + 1).padStart(2, '0');
}

function renderRows(focusIndex = null) {
    inputScroll.innerHTML = '';
    rows.forEach((value, i) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'name-row';

        const indexDiv = document.createElement('div');
        indexDiv.className = 'row-index';
        indexDiv.textContent = formatIndex(i);

        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 40;
        input.value = value;
        input.placeholder = 'Type name';
        input.addEventListener('input', (event) => {
            rows[i] = event.target.value;
        });
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                focusNextRow(i);
            }
        });

        rowDiv.appendChild(indexDiv);
        rowDiv.appendChild(input);
        inputScroll.appendChild(rowDiv);
    });

    if (focusIndex !== null) {
        const inputs = inputScroll.querySelectorAll('input');
        const target = inputs[focusIndex];
        if (target) {
            target.focus();
            target.setSelectionRange(target.value.length, target.value.length);
            target.scrollIntoView({ block: 'nearest' });
        }
    }
}

function focusNextRow(currentIndex) {
    if (currentIndex === rows.length - 1) {
        rows.push('');
        renderRows(currentIndex + 1);
        return;
    }
    const inputs = inputScroll.querySelectorAll('input');
    const next = inputs[currentIndex + 1];
    if (next) {
        next.focus();
        next.select();
    }
}

function getUniqueNames() {
    const seen = new Set();
    const out = [];
    rows.forEach((raw) => {
        const name = raw.trim();
        if (!name || seen.has(name)) {
            return;
        }
        seen.add(name);
        out.push(name);
    });
    return out;
}

function randomShuffle(array) {
    const cloned = array.slice();
    for (let i = cloned.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = cloned[i];
        cloned[i] = cloned[j];
        cloned[j] = temp;
    }
    return cloned;
}

function renderResult(order) {
    resultList.innerHTML = '';
    if (!order.length) {
        resultList.innerHTML = '<p class="result-empty">No result yet.</p>';
        return;
    }

    order.forEach((name, idx) => {
        const item = document.createElement('p');
        item.className = 'result-item';
        item.textContent = `${String(idx + 1).padStart(2, '0')}. ${name}`;
        resultList.appendChild(item);
    });
}

function updateButtons() {
    drawBtn.textContent = shuffling ? 'Stop' : 'Draw';
    drawBtn.classList.toggle('btn-add', !shuffling);
    drawBtn.classList.toggle('btn-draw', shuffling);
    saveBtn.disabled = shuffling || shuffledOrder.length === 0;
    recordBtn.disabled = shuffling || shuffledOrder.length === 0;
}

function startShuffle() {
    const names = getUniqueNames();
    if (!names.length) {
        hintText.textContent = 'Please enter at least one name before drawing.';
        return;
    }

    hintText.textContent = '';
    shuffling = true;
    shuffledOrder = randomShuffle(names);
    renderResult(shuffledOrder);
    updateButtons();

    shuffleTimer = window.setInterval(() => {
        const latestNames = getUniqueNames();
        if (!latestNames.length) {
            stopShuffle();
            return;
        }
        shuffledOrder = randomShuffle(latestNames);
        renderResult(shuffledOrder);
    }, SHUFFLE_INTERVAL_MS);
}

function stopShuffle() {
    shuffling = false;
    if (shuffleTimer !== null) {
        window.clearInterval(shuffleTimer);
        shuffleTimer = null;
    }
    updateButtons();
}

function escapeCsvField(text) {
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

function buildTimestamp() {
    const now = new Date();
    const pad = (num) => String(num).padStart(2, '0');
    return [
        now.getFullYear(),
        pad(now.getMonth() + 1),
        pad(now.getDate()),
        '_',
        pad(now.getHours()),
        pad(now.getMinutes()),
        pad(now.getSeconds())
    ].join('');
}

function saveCsv() {
    if (!shuffledOrder.length || shuffling) {
        return;
    }

    const lines = ['index,name'];
    shuffledOrder.forEach((name, i) => {
        lines.push(`${i + 1},${escapeCsvField(name)}`);
    });
    const csvText = `${lines.join('\n')}\n`;
    const fileName = `presentation_order_${buildTimestamp()}.csv`;

    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    hintText.textContent = `CSV downloaded: ${fileName}`;
}

function formatRecordedAt(date) {
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function initYearOptions() {
    const currentYear = new Date().getFullYear();
    const endYear = 2030;
    const upperYear = currentYear > endYear ? currentYear : endYear;

    for (let year = currentYear; year <= upperYear; year += 1) {
        const option = document.createElement('option');
        option.value = String(year);
        option.textContent = String(year);
        yearSelect.appendChild(option);
    }

    yearSelect.value = String(currentYear);
}

function renderRecordedResults() {
    recordsTableBody.innerHTML = '';

    if (!recordedResults.length) {
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'records-empty-row';
        const cell = document.createElement('td');
        cell.colSpan = 5;
        cell.textContent = 'No recorded result yet.';
        emptyRow.appendChild(cell);
        recordsTableBody.appendChild(emptyRow);
        return;
    }

    const visibleEntries = recordedResults.slice(-MAX_VISIBLE_RECORDS).reverse();

    visibleEntries.forEach((entry, index) => {
        const row = document.createElement('tr');

        const noCell = document.createElement('td');
        noCell.textContent = String(index + 1);

        const semesterCell = document.createElement('td');
        semesterCell.textContent = entry.semester;

        const yearCell = document.createElement('td');
        yearCell.textContent = entry.year;

        const timeCell = document.createElement('td');
        timeCell.textContent = entry.recordedAt;

        const orderCell = document.createElement('td');
        orderCell.className = 'order-cell';
        orderCell.textContent = entry.order.join(' -> ');

        row.appendChild(noCell);
        row.appendChild(semesterCell);
        row.appendChild(yearCell);
        row.appendChild(timeCell);
        row.appendChild(orderCell);
        recordsTableBody.appendChild(row);
    });
}

async function loadRecordedResultsFromCsv() {
    try {
        const response = await fetch('/api/journalclub/records');
        if (!response.ok) {
            throw new Error('Failed to load saved records.');
        }

        const data = await response.json();
        const incoming = Array.isArray(data.records) ? data.records : [];

        recordedResults.length = 0;
        incoming.forEach((entry) => {
            if (!entry || !Array.isArray(entry.order) || !entry.order.length) {
                return;
            }
            recordedResults.push({
                semester: (entry.semester || '').toLowerCase(),
                year: String(entry.year || ''),
                recordedAt: entry.recordedAt || '',
                order: entry.order.map((name) => String(name).trim()).filter(Boolean)
            });
        });

        renderRecordedResults();
    } catch (error) {
        hintText.textContent = `Load failed: ${error.message}`;
    }
}

async function persistRecord(entry) {
    const response = await fetch('/api/journalclub/record', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            semester: entry.semester,
            year: entry.year,
            order: entry.order
        })
    });

    if (!response.ok) {
        let message = 'Failed to save result.';
        try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
                message = errorData.error;
            }
        } catch (e) {
            // Ignore JSON parse error and keep fallback message.
        }
        throw new Error(message);
    }

    return response.json();
}

async function recordResult() {
    if (shuffling) {
        hintText.textContent = 'Stop drawing before recording the result.';
        return;
    }

    if (!shuffledOrder.length) {
        hintText.textContent = 'No draw result to record.';
        return;
    }

    const entry = {
        semester: semesterSelect.value,
        year: yearSelect.value,
        recordedAt: formatRecordedAt(new Date()),
        order: [...shuffledOrder]
    };

    recordBtn.disabled = true;
    try {
        const savedResult = await persistRecord(entry);
        recordedResults.push({
            ...entry,
            recordedAt: savedResult.saved_at || entry.recordedAt
        });
        renderRecordedResults();

        if (recordedResults.length > MAX_VISIBLE_RECORDS) {
            hintText.textContent = `Result recorded and saved to ${savedResult.file}. Showing latest ${MAX_VISIBLE_RECORDS} only.`;
        } else {
            hintText.textContent = `Result recorded and saved to ${savedResult.file}.`;
        }
    } catch (error) {
        hintText.textContent = `Record failed: ${error.message}`;
    } finally {
        updateButtons();
    }
}

addRowBtn.addEventListener('click', () => {
    rows.push('');
    renderRows(rows.length - 1);
});

drawBtn.addEventListener('click', () => {
    if (shuffling) {
        stopShuffle();
    } else {
        startShuffle();
    }
});

saveBtn.addEventListener('click', saveCsv);
recordBtn.addEventListener('click', recordResult);

initYearOptions();
renderRows();
renderResult([]);
renderRecordedResults();
updateButtons();
loadRecordedResultsFromCsv();

