// GLOBAL VARIABLE: Tracks total sales
let dailyRevenue = 0;

// Data structure to hold the state of all tables
// We will overwrite this if data exists in LocalStorage
let tables = {
    1: { orders: [], status: 'free' },
    2: { orders: [], status: 'free' },
    3: { orders: [], status: 'free' },
    4: { orders: [], status: 'free' },
    'togo': { orders: [], status: 'active' }
};

let currentTableId = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Try to load saved data from the browser
    loadData();

    // 2. Disable buttons initially
    toggleButtons(false);
});

// --- CORE FUNCTIONS ---

function selectTable(id) {
    currentTableId = id;
    
    // UI Update: Selected Visuals
    document.querySelectorAll('.table-card').forEach(el => el.classList.remove('selected'));
    document.getElementById(`table-${id}`).classList.add('selected');

    // Update Header
    const title = id === 'togo' ? "To Go Counter" : `Table ${id}`;
    document.getElementById('selected-table-title').innerText = title;

    toggleButtons(true);
    renderOrderList();
    updateTableVisuals(id);
}

function addItem(name, price) {
    if (!currentTableId) return alert("Select a table first!");
    
    // Logic: If table was paid, resetting triggers occupied
    if (tables[currentTableId].status === 'paid' || tables[currentTableId].status === 'free') {
        tables[currentTableId].status = 'occupied';
    }

    tables[currentTableId].orders.push({ name, price });
    
    saveData(); // <--- SAVE
    renderOrderList();
    updateTableVisuals(currentTableId);
}

function removeItem(index) {
    if (!currentTableId) return;

    // Remove 1 item at the specific index
    tables[currentTableId].orders.splice(index, 1);

    // If table was marked 'paid' but we modified the order, reset to 'occupied'
    if (tables[currentTableId].status === 'paid') {
        tables[currentTableId].status = 'occupied';
    }

    // If table is empty after deleting, set to free (except ToGo)
    if (tables[currentTableId].orders.length === 0 && currentTableId !== 'togo') {
        tables[currentTableId].status = 'free';
    }

    saveData(); // <--- SAVE
    renderOrderList();
    updateTableVisuals(currentTableId);
}

function markAsPaid() {
    if (!currentTableId) return;
    const tableData = tables[currentTableId];

    if (tableData.orders.length === 0) return alert("No orders to pay!");

    if (tableData.status !== 'paid') {
        const tableTotal = tableData.orders.reduce((sum, item) => sum + item.price, 0);
        
        dailyRevenue += tableTotal;
        document.getElementById('daily-revenue').innerText = `$${dailyRevenue.toFixed(2)}`;

        tableData.status = 'paid';
        
        saveData(); // <--- SAVE
        renderOrderList();
        updateTableVisuals(currentTableId);
    } else {
        alert("Already paid!");
    }
}

function closeTable() {
    if (!currentTableId) return;

    if (confirm("Close and clear this table?")) {
        tables[currentTableId].orders = [];
        tables[currentTableId].status = 'free';
        
        if(currentTableId === 'togo') tables[currentTableId].status = 'active';

        saveData(); // <--- SAVE
        renderOrderList();
        updateTableVisuals(currentTableId);
    }
}

// --- NEW FUNCTION: RESET DAY ---
function startNewDay() {
    if (confirm("Are you sure you want to start a new day? This will reset the Daily Revenue to $0.00.")) {
        dailyRevenue = 0;
        document.getElementById('daily-revenue').innerText = "$0.00";
        saveData();
    }
}

// --- VISUAL RENDERING ---

function renderOrderList() {
    const list = document.getElementById('order-list');
    const totalEl = document.getElementById('bill-total');
    const badge = document.getElementById('payment-status-badge');
    
    list.innerHTML = '';
    let total = 0;
    const orders = tables[currentTableId].orders;

    if (orders.length === 0) {
        list.innerHTML = '<li class="empty-state">No items added yet...</li>';
    } else {
        orders.forEach((item, index) => {
            total += item.price;
            const li = document.createElement('li');
            // Include removeItem button
            li.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-price">$${item.price.toFixed(2)}</span>
                </div>
                <button class="remove-btn" onclick="removeItem(${index})" title="Remove Item">×</button>
            `;
            list.appendChild(li);
        });
    }

    totalEl.innerText = `$${total.toFixed(2)}`;

    // Badge Logic
    badge.className = 'badge'; 
    if (orders.length === 0) {
        badge.classList.add('hidden');
    } else if (tables[currentTableId].status === 'paid') {
        badge.innerText = 'PAID';
        badge.classList.add('paid');
    } else {
        badge.innerText = 'UNPAID';
        badge.classList.add('unpaid');
    }
}

function updateTableVisuals(id) {
    const tableCard = document.getElementById(`table-${id}`);
    const statusText = tableCard.querySelector('.status');
    const totalText = tableCard.querySelector('.total');
    const tableData = tables[id];

    const total = tableData.orders.reduce((sum, item) => sum + item.price, 0);
    totalText.innerText = `$${total.toFixed(2)}`;

    // Reset classes
    tableCard.classList.remove('occupied', 'paid');

    if (id === 'togo') {
        statusText.innerText = 'Counter Open';
    } else {
        if (tableData.status === 'free') {
            statusText.innerText = 'Free';
        } else if (tableData.status === 'occupied') {
            tableCard.classList.add('occupied');
            statusText.innerText = 'Occupied';
        } else if (tableData.status === 'paid') {
            tableCard.classList.add('paid');
            statusText.innerText = 'Paid';
        }
    }
}

function toggleButtons(enable) {
    const buttons = document.querySelectorAll('.menu-grid button, .action-buttons button');
    buttons.forEach(btn => btn.disabled = !enable);
}

// --- LOCAL STORAGE (DATA PERSISTENCE) ---

function saveData() {
    localStorage.setItem('pos_tables', JSON.stringify(tables));
    localStorage.setItem('pos_revenue', dailyRevenue.toString());
}

function loadData() {
    const savedTables = localStorage.getItem('pos_tables');
    const savedRevenue = localStorage.getItem('pos_revenue');

    if (savedTables) {
        tables = JSON.parse(savedTables);
        // Refresh visuals for all tables
        Object.keys(tables).forEach(id => {
            updateTableVisuals(id);
        });
    }

    if (savedRevenue) {
        dailyRevenue = parseFloat(savedRevenue);
        document.getElementById('daily-revenue').innerText = `$${dailyRevenue.toFixed(2)}`;
    }
}