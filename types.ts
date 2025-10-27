
export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  imageUrl: string;
  status: 'available' | 'rented' | 'maintenance';
  lowStockThreshold?: number;
  maintenanceNotes?: string;
  purchaseCost?: number;
}

export interface Address {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface Client {
  id: string;
  type: 'pf' | 'pj'; // Pessoa Física ou Pessoa Jurídica
  name: string; // Nome (PF) ou Nome Fantasia (PJ)
  
  // PF fields
  cpf?: string;
  birthDate?: string;

  // PJ fields
  cnpj?: string;
  legalName?: string; // Razão Social
  contactName?: string; 

  // Common fields
  phone: string;
  email: string;
  address: Address;
  howFound?: string; // Como nos conheceu
  notes?: string;
}

export type PaymentMethod = 'pix' | 'card' | 'cash' | 'bank_transfer' | 'other' | 'payment_link';

export interface Payment {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  method: PaymentMethod;
}

export interface Rental {
  id: string;
  client: {
    id: string;
    name: string;
  };
  eventDate: string;
  pickupDate: string;
  returnDate: string;
  totalValue: number;
  discount: number;
  notes: string;
  paymentStatus: 'pending' | 'partial' | 'paid';
  paymentHistory: Payment[];
  status: 'booked' | 'picked-up' | 'returned' | 'overdue' | 'quote-requested';
  items: Pick<InventoryItem, 'id' | 'name' | 'quantity' | 'price'>[];
  kits?: Pick<Kit, 'id' | 'name' | 'price' | 'items'>[];
  pickupChecklist: Record<string, boolean>; // { [itemId]: checked }
  returnChecklist: Record<string, boolean>; // { [itemId]: checked }
  // Módulo 6: Serviços Adicionais
  deliveryService?: boolean;
  deliveryFee?: number;
  setupService?: boolean;
  setupFee?: number;
  deliveryAddress?: string;
}


export interface Kit {
  id: string;
  name: string;
  price: number;
  itemIds: string[];
  items: Pick<InventoryItem, 'id' | 'name'>[];
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  date: string; // YYYY-MM-DD
  amount: number;
  paymentMethod?: PaymentMethod;
}

export interface Revenue {
  id: string;
  description: string;
  category: string;
  date: string; // YYYY-MM-DD
  amount: number;
  paymentMethod?: PaymentMethod;
}

export type Page = 'dashboard' | 'inventory' | 'rentals' | 'calendar' | 'theme-generator' | 'clients' | 'kits' | 'financial' | 'ai-assistant' | 'maintenance' | 'logistics' | 'reports' | 'settings';

export interface PartyThemeSuggestion {
  themeName: string;
  colorPalette: string;
  decorationIdeas: string[];
  rentalItems: string[];
}

export type Transaction = 
  | { type: 'revenue'; date: string; description: string; amount: number; referenceId: string; method?: string; }
  | { type: 'expense'; date: string; description: string; amount: number; referenceId: string; method?: string; };
  
export interface Notification {
  id: string;
  type: 'overdue_return' | 'payment_due' | 'low_stock';
  message: string;
  referenceId: string; // ID of the rental or inventory item
}

export interface CompanySettings {
    id: string;
    companyName: string;
    cnpj: string;
    address: string;
    logoUrl: string;
    pixKey?: string;
}