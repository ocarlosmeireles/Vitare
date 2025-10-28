
import { InventoryItem, Rental, Client, Kit, Expense, CompanySettings, Revenue } from '../types';
import { db } from './firebase';
import { collection, getDocs, Timestamp, addDoc, doc, updateDoc, deleteDoc, getDoc, query, where, setDoc } from 'firebase/firestore';

// Helper to convert Firestore Timestamp to ISO Date string (YYYY-MM-DD)
const timestampToIsoDate = (timestamp: any): string => {
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toISOString().split('T')[0];
    }
    // Handle cases where the date might already be a string
    if (typeof timestamp === 'string' && timestamp.includes('T')) {
        return timestamp.split('T')[0];
    }
    return timestamp;
};

const convertDocToInventoryItem = (doc: any): InventoryItem => ({
    ...doc.data(),
    id: doc.id,
    purchaseCost: doc.data().purchaseCost || 0,
});

const convertDocToRental = (doc: any): Rental => ({
    ...doc.data(),
    id: doc.id,
    eventDate: timestampToIsoDate(doc.data().eventDate),
    pickupDate: timestampToIsoDate(doc.data().pickupDate),
    returnDate: timestampToIsoDate(doc.data().returnDate),
    paymentHistory: doc.data().paymentHistory?.map((p: any) => ({ ...p, date: timestampToIsoDate(p.date) })) || [],
    pickupChecklist: doc.data().pickupChecklist || {},
    returnChecklist: doc.data().returnChecklist || {},
});

const convertDocToClient = (doc: any): Client => ({
    ...doc.data(),
    id: doc.id,
    type: doc.data().type || 'pf', // Default to 'pf' for old clients
    address: doc.data().address || { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' }, // Default address
});


// Inventory Management
export const getInventory = async (): Promise<InventoryItem[]> => {
    if (!db) return [];
    const snapshot = await getDocs(collection(db, 'inventory'));
    return snapshot.docs.map(convertDocToInventoryItem);
};
export const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => db && addDoc(collection(db, 'inventory'), item);
export const updateInventoryItem = (id: string, data: Partial<InventoryItem>) => db && updateDoc(doc(db, 'inventory', id), data);
export const deleteInventoryItem = (id: string) => db && deleteDoc(doc(db, 'inventory', id));

// Client Management
export const getClients = async (): Promise<Client[]> => {
    if (!db) return [];
    const snapshot = await getDocs(collection(db, 'clients'));
    return snapshot.docs.map(convertDocToClient);
};
export const addClient = async (client: Omit<Client, 'id'>): Promise<Client> => {
    if (!db) throw new Error("Database not initialized");
    const docRef = await addDoc(collection(db, 'clients'), client);
    return { ...client, id: docRef.id };
};
export const updateClient = (id: string, data: Partial<Client>) => db && updateDoc(doc(db, 'clients', id), data);

export const findOrCreateClient = async (clientData: { name: string; phone: string; email: string }): Promise<Client> => {
    if (!db) throw new Error("Database not initialized");
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
    if (!db) return [];
    const snapshot = await getDocs(collection(db, 'kits'));
    return snapshot.docs.map(doc => ({ ...doc.data() as Omit<Kit, 'id'>, id: doc.id }));
};
export const addKit = (kit: Omit<Kit, 'id'>) => db && addDoc(collection(db, 'kits'), kit);
export const updateKit = (id: string, data: Partial<Kit>) => db && updateDoc(doc(db, 'kits', id), data);
export const deleteKit = (id: string) => db && deleteDoc(doc(db, 'kits', id));

// Rental Management
export const getRentals = async (): Promise<Rental[]> => {
    if (!db) return [];
    const snapshot = await getDocs(collection(db, 'rentals'));
    return snapshot.docs.map(convertDocToRental);
};
export const addRental = (rental: Omit<Rental, 'id'>) => {
    if (!db) throw new Error("Database not initialized");
    return addDoc(collection(db, 'rentals'), rental);
};
export const updateRental = (id: string, data: Partial<Rental>) => db && updateDoc(doc(db, 'rentals', id), data);

// Expense Management
export const getExpenses = async (): Promise<Expense[]> => {
    if (!db) return [];
    const snapshot = await getDocs(collection(db, 'expenses'));
    return snapshot.docs.map(doc => ({
        ...doc.data() as Omit<Expense, 'id'>,
        id: doc.id,
        date: timestampToIsoDate(doc.data().date),
    }));
};
export const addExpense = (expense: Omit<Expense, 'id'>) => db && addDoc(collection(db, 'expenses'), expense);

// Revenue Management (for non-rental income)
export const getRevenues = async (): Promise<Revenue[]> => {
    if (!db) return [];
    const snapshot = await getDocs(collection(db, 'revenues'));
    return snapshot.docs.map(doc => ({
        ...doc.data() as Omit<Revenue, 'id'>,
        id: doc.id,
        date: timestampToIsoDate(doc.data().date),
    }));
};
export const addRevenue = (revenue: Omit<Revenue, 'id'>) => db && addDoc(collection(db, 'revenues'), revenue);


// Dashboard Stats
export const getDashboardStats = async () => {
    const [inventory, rentals, expenses] = await Promise.all([getInventory(), getRentals(), getExpenses()]);
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
  
    // ... (rest of dashboard logic)
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
    if (!db) return null;
    const docRef = doc(db, 'settings', 'company');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { ...docSnap.data() as Omit<CompanySettings, 'id'>, id: 'company' };
    }
    return null;
};
export const updateCompanySettings = (settings: Omit<CompanySettings, 'id'>) => {
    if (!db) throw new Error("Database not initialized");
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