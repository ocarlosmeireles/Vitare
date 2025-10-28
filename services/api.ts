
import { InventoryItem, Rental, Client, Kit, Expense, CompanySettings, Revenue } from '../types';
import { db } from './firebase';
import { collection, getDocs, Timestamp, addDoc, doc, updateDoc, deleteDoc, getDoc, query, where, setDoc } from 'firebase/firestore';

// --- Local Storage Fallback ---

const getFromLocalStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

const setToLocalStorage = <T>(key: string, value: T) => {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error setting localStorage key “${key}”:`, error);
    }
};

// Helper to convert Firestore Timestamp to ISO Date string (YYYY-MM-DD)
const timestampToIsoDate = (timestamp: any): string => {
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toISOString().split('T')[0];
    }
    // Handle cases where the date might already be a string
    if (typeof timestamp === 'string' && timestamp.includes('T')) {
        return timestamp.split('T')[0];
    }
    return timestamp || '';
};

// --- Data Conversion Functions (to create plain JS objects) ---

const convertDocToInventoryItem = (doc: any): InventoryItem => {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.name || '',
        category: data.category || '',
        quantity: data.quantity || 0,
        price: data.price || 0,
        imageUrl: data.imageUrl || '',
        status: data.status || 'available',
        lowStockThreshold: data.lowStockThreshold,
        maintenanceNotes: data.maintenanceNotes,
        purchaseCost: data.purchaseCost,
    };
};

const convertDocToRental = (doc: any): Rental => {
    const data = doc.data();
    return {
        id: doc.id,
        client: data.client || { id: '', name: '' },
        eventDate: timestampToIsoDate(data.eventDate),
        pickupDate: timestampToIsoDate(data.pickupDate),
        returnDate: timestampToIsoDate(data.returnDate),
        totalValue: data.totalValue || 0,
        discount: data.discount || 0,
        notes: data.notes || '',
        paymentStatus: data.paymentStatus || 'pending',
        paymentHistory: data.paymentHistory?.map((p: any) => ({
            id: p.id,
            date: timestampToIsoDate(p.date),
            amount: p.amount,
            method: p.method,
        })) || [],
        status: data.status || 'booked',
        items: data.items || [],
        kits: data.kits || [],
        pickupChecklist: data.pickupChecklist || {},
        returnChecklist: data.returnChecklist || {},
        deliveryService: data.deliveryService || false,
        deliveryFee: data.deliveryFee,
        setupService: data.setupService || false,
        setupFee: data.setupFee,
        deliveryAddress: data.deliveryAddress,
    };
};

const convertDocToClient = (doc: any): Client => {
    const data = doc.data();
    return {
        id: doc.id,
        type: data.type || 'pf',
        name: data.name || '',
        cpf: data.cpf,
        birthDate: data.birthDate,
        cnpj: data.cnpj,
        legalName: data.legalName,
        contactName: data.contactName,
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' },
        howFound: data.howFound,
        notes: data.notes,
    };
};

// Inventory Management
export const getInventory = async (): Promise<InventoryItem[]> => {
    if (!db) return getFromLocalStorage<InventoryItem[]>('inventory', []);
    const snapshot = await getDocs(collection(db, 'inventory'));
    return snapshot.docs.map(convertDocToInventoryItem);
};
export const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    if (!db) {
        const items = getFromLocalStorage<InventoryItem[]>('inventory', []);
        const newItem = { ...item, id: `local_${Date.now()}` };
        setToLocalStorage('inventory', [...items, newItem]);
        return Promise.resolve();
    }
    return addDoc(collection(db, 'inventory'), item);
};
export const updateInventoryItem = (id: string, data: Partial<InventoryItem>) => {
    if (!db) {
        const items = getFromLocalStorage<InventoryItem[]>('inventory', []);
        const updatedItems = items.map(item => item.id === id ? { ...item, ...data } : item);
        setToLocalStorage('inventory', updatedItems);
        return Promise.resolve();
    }
    return updateDoc(doc(db, 'inventory', id), data);
};
export const deleteInventoryItem = (id: string) => {
    if (!db) {
        const items = getFromLocalStorage<InventoryItem[]>('inventory', []);
        setToLocalStorage('inventory', items.filter(item => item.id !== id));
        return Promise.resolve();
    }
    return deleteDoc(doc(db, 'inventory', id));
};

// Client Management
export const getClients = async (): Promise<Client[]> => {
    if (!db) return getFromLocalStorage<Client[]>('clients', []);
    const snapshot = await getDocs(collection(db, 'clients'));
    return snapshot.docs.map(convertDocToClient);
};
export const addClient = async (client: Omit<Client, 'id'>): Promise<Client> => {
    if (!db) {
        const clients = getFromLocalStorage<Client[]>('clients', []);
        const newClient = { ...client, id: `local_${Date.now()}` };
        setToLocalStorage('clients', [...clients, newClient]);
        return Promise.resolve(newClient);
    }
    const docRef = await addDoc(collection(db, 'clients'), client);
    return { ...client, id: docRef.id };
};
export const updateClient = (id: string, data: Partial<Client>) => {
    if (!db) {
        const clients = getFromLocalStorage<Client[]>('clients', []);
        const updatedClients = clients.map(client => client.id === id ? { ...client, ...data } : client);
        setToLocalStorage('clients', updatedClients);
        return Promise.resolve();
    }
    return updateDoc(doc(db, 'clients', id), data);
};

export const findOrCreateClient = async (clientData: { name: string; phone: string; email: string }): Promise<Client> => {
    if (!db) {
        const clients = getFromLocalStorage<Client[]>('clients', []);
        const existingClient = clients.find(c => c.phone === clientData.phone);
        if (existingClient) {
            return existingClient;
        }
        const newClientData: Omit<Client, 'id'> = {
            ...clientData,
            type: 'pf',
            address: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' }
        };
        return addClient(newClientData);
    }
    const q = query(collection(db, "clients"), where("phone", "==", clientData.phone));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return convertDocToClient(doc);
    } else {
        const newClient: Omit<Client, 'id'> = {
            ...clientData,
            type: 'pf',
            address: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' }
        };
        return addClient(newClient);
    }
};

// Kit Management
export const getKits = async (): Promise<Kit[]> => {
    if (!db) return getFromLocalStorage<Kit[]>('kits', []);
    const snapshot = await getDocs(collection(db, 'kits'));
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name || '',
            price: data.price || 0,
            itemIds: data.itemIds || [],
            items: data.items || [],
        };
    });
};
export const addKit = (kit: Omit<Kit, 'id'>) => {
    if (!db) {
        const kits = getFromLocalStorage<Kit[]>('kits', []);
        const newKit = { ...kit, id: `local_${Date.now()}` };
        setToLocalStorage('kits', [...kits, newKit]);
        return Promise.resolve();
    }
    return addDoc(collection(db, 'kits'), kit);
};
export const updateKit = (id: string, data: Partial<Kit>) => {
    if (!db) {
        const kits = getFromLocalStorage<Kit[]>('kits', []);
        const updatedKits = kits.map(k => k.id === id ? { ...k, ...data } : k);
        setToLocalStorage('kits', updatedKits);
        return Promise.resolve();
    }
    return updateDoc(doc(db, 'kits', id), data);
};
export const deleteKit = (id: string) => {
    if (!db) {
        const kits = getFromLocalStorage<Kit[]>('kits', []);
        setToLocalStorage('kits', kits.filter(k => k.id !== id));
        return Promise.resolve();
    }
    return deleteDoc(doc(db, 'kits', id));
};

// Rental Management
export const getRentals = async (): Promise<Rental[]> => {
    if (!db) return getFromLocalStorage<Rental[]>('rentals', []);
    const snapshot = await getDocs(collection(db, 'rentals'));
    return snapshot.docs.map(convertDocToRental);
};

export const getRentalById = async (id: string): Promise<Rental | null> => {
    if (!db) {
        const rentals = getFromLocalStorage<Rental[]>('rentals', []);
        return rentals.find(r => r.id === id) || null;
    }
    const docRef = doc(db, 'rentals', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return convertDocToRental(docSnap);
    }
    return null;
};

export const addRental = (rental: Omit<Rental, 'id'>) => {
    if (!db) {
        const rentals = getFromLocalStorage<Rental[]>('rentals', []);
        const newRental: Rental = {
            paymentStatus: 'pending',
            paymentHistory: [],
            pickupChecklist: {},
            returnChecklist: {},
            ...rental,
            id: `local_${Date.now()}`,
        };
        setToLocalStorage('rentals', [...rentals, newRental]);
        return Promise.resolve();
    }

    const rentalForFirestore: { [key: string]: any } = {
        ...rental,
        eventDate: Timestamp.fromDate(new Date(rental.eventDate)),
        pickupDate: Timestamp.fromDate(new Date(rental.pickupDate)),
        returnDate: Timestamp.fromDate(new Date(rental.returnDate)),
    };
    if (rental.paymentHistory) {
        rentalForFirestore.paymentHistory = rental.paymentHistory.map(p => ({
            ...p,
            date: Timestamp.fromDate(new Date(p.date))
        }));
    }
    return addDoc(collection(db, 'rentals'), rentalForFirestore);
};

export const updateRental = (id: string, data: Partial<Rental>) => {
    if (!db) {
        const rentals = getFromLocalStorage<Rental[]>('rentals', []);
        const updatedRentals = rentals.map(r => r.id === id ? { ...r, ...data } : r);
        setToLocalStorage('rentals', updatedRentals);
        return Promise.resolve();
    }

    const dataForFirestore: { [key: string]: any } = { ...data };

    if (data.eventDate) dataForFirestore.eventDate = Timestamp.fromDate(new Date(data.eventDate));
    if (data.pickupDate) dataForFirestore.pickupDate = Timestamp.fromDate(new Date(data.pickupDate));
    if (data.returnDate) dataForFirestore.returnDate = Timestamp.fromDate(new Date(data.returnDate));
    if (data.paymentHistory) {
        dataForFirestore.paymentHistory = data.paymentHistory.map(p => ({
            ...p,
            date: Timestamp.fromDate(new Date(p.date))
        }));
    }

    return updateDoc(doc(db, 'rentals', id), dataForFirestore);
};

// Expense Management
export const getExpenses = async (): Promise<Expense[]> => {
    if (!db) return getFromLocalStorage<Expense[]>('expenses', []);
    const snapshot = await getDocs(collection(db, 'expenses'));
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            description: data.description || '',
            category: data.category || '',
            date: timestampToIsoDate(data.date),
            amount: data.amount || 0,
            paymentMethod: data.paymentMethod,
        };
    });
};

export const addExpense = (expense: Omit<Expense, 'id'>) => {
    if (!db) {
        const expenses = getFromLocalStorage<Expense[]>('expenses', []);
        const newExpense = { ...expense, id: `local_${Date.now()}` };
        setToLocalStorage('expenses', [...expenses, newExpense]);
        return Promise.resolve();
    }
    const expenseForFirestore = {
        ...expense,
        date: Timestamp.fromDate(new Date(expense.date))
    };
    return addDoc(collection(db, 'expenses'), expenseForFirestore);
};

// Revenue Management (for non-rental income)
export const getRevenues = async (): Promise<Revenue[]> => {
    if (!db) return getFromLocalStorage<Revenue[]>('revenues', []);
    const snapshot = await getDocs(collection(db, 'revenues'));
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            description: data.description || '',
            category: data.category || '',
            date: timestampToIsoDate(data.date),
            amount: data.amount || 0,
            paymentMethod: data.paymentMethod,
        };
    });
};

export const addRevenue = (revenue: Omit<Revenue, 'id'>) => {
    if (!db) {
        const revenues = getFromLocalStorage<Revenue[]>('revenues', []);
        const newRevenue = { ...revenue, id: `local_${Date.now()}` };
        setToLocalStorage('revenues', [...revenues, newRevenue]);
        return Promise.resolve();
    }
    const revenueForFirestore = {
        ...revenue,
        date: Timestamp.fromDate(new Date(revenue.date))
    };
    return addDoc(collection(db, 'revenues'), revenueForFirestore);
};


// Dashboard Stats
export const getDashboardStats = async () => {
    const [inventory, rentals, expenses] = await Promise.all([getInventory(), getRentals(), getExpenses()]);
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
  
    const rentedItems = inventory.filter(i => i.status === 'rented').length;
    const upcomingEvents = rentals.filter(r => new Date(r.eventDate) >= today && r.status === 'booked').length;
    
    const monthlyRevenue = rentals.flatMap(r => r.paymentHistory)
        .filter(p => {
            const pDate = new Date(p.date);
            return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + p.amount, 0);

    const monthlyExpenses = expenses.filter(e => {
            const eDate = new Date(e.date);
            return eDate.getMonth() === currentMonth && eDate.getFullYear() === currentYear;
        })
        .reduce((sum, e) => sum + e.amount, 0);

    const monthlyRentalCounts = Array(6).fill(0);
    rentals.forEach(r => {
        const rentalDate = new Date(r.eventDate);
        const monthDiff = (today.getFullYear() - rentalDate.getFullYear()) * 12 + (today.getMonth() - rentalDate.getMonth());
        if(monthDiff >= 0 && monthDiff < 6) {
            monthlyRentalCounts[5 - monthDiff]++;
        }
    });

    const itemCounts = new Map<string, number>();
    rentals.forEach(r => r.items.forEach(i => itemCounts.set(i.name, (itemCounts.get(i.name) || 0) + 1)));
    const popularItems = [...itemCounts.entries()].sort((a,b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({name, count}));

    return {
      totalItems: inventory.length,
      rentedItems,
      upcomingEvents,
      monthlyRevenue,
      monthlyExpenses,
      monthlyNetProfit: monthlyRevenue - monthlyExpenses,
      monthlyRentalCounts,
      popularItems
    };
};

// Módulo 7: Settings & Reports
export const getCompanySettings = async (): Promise<CompanySettings | null> => {
    if (!db) return getFromLocalStorage<CompanySettings | null>('settings', null);
    const docRef = doc(db, 'settings', 'company');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            id: 'company',
            companyName: data.companyName || '',
            cnpj: data.cnpj || '',
            address: data.address || '',
            logoUrl: data.logoUrl || '',
            pixKey: data.pixKey,
        };
    }
    return null;
};
export const updateCompanySettings = (settings: Omit<CompanySettings, 'id'>) => {
    if (!db) {
        const settingsWithId: CompanySettings = { ...settings, id: 'company' };
        setToLocalStorage('settings', settingsWithId);
        return Promise.resolve();
    }
    return setDoc(doc(db, 'settings', 'company'), settings);
};

export const getReportsData = async () => {
    const [inventory, rentals, clients, expenses] = await Promise.all([
        getInventory(),
        getRentals(),
        getClients(),
        getExpenses()
    ]);

    // Item Profitability
    const itemReports = inventory.map(item => {
        const relevantRentals = rentals.filter(r => r.items.some(i => i.id === item.id));
        const totalRevenue = relevantRentals.reduce((sum, r) => {
            const rentalItem = r.items.find(i => i.id === item.id);
            return sum + (rentalItem ? rentalItem.price * rentalItem.quantity : 0);
        }, 0);
        
        const maintenanceCosts = expenses.filter(e => e.category === 'Manutenção' && e.description.includes(item.name))
            .reduce((sum, e) => sum + e.amount, 0);

        const profit = totalRevenue - maintenanceCosts;
        const roi = item.purchaseCost && item.purchaseCost > 0 ? (profit / item.purchaseCost) * 100 : 0;

        return {
            id: item.id,
            name: item.name,
            purchaseCost: item.purchaseCost || 0,
            totalRevenue,
            maintenanceCosts,
            profit,
            roi,
            rentalCount: relevantRentals.length,
        };
    }).sort((a, b) => b.profit - a.profit);

    // Client LTV
    const clientReports = clients.map(client => {
        const clientRentals = rentals.filter(r => r.client.id === client.id);
        const totalSpent = clientRentals.reduce((sum, r) => sum + (r.totalValue - r.discount), 0);
        return {
            id: client.id,
            name: client.name,
            rentalCount: clientRentals.length,
            totalSpent,
        };
    }).sort((a, b) => b.totalSpent - a.totalSpent);

    return { itemReports, clientReports };
};
