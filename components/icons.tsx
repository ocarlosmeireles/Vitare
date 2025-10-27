import React from 'react';

// Using SVG icons as components
// Source: lucide.dev, MIT License

export const Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  />
);

export const LayoutDashboard: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></Icon>
);

export const Package: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path d="M16.5 9.4a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" /><path d="M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4.5" /><path d="m3.5 10.5 2.1 2.3c.4.4 1 .8 1.7.9l.4.1c.9.2 1.9-.2 2.6-1L12 11l2.7 1.8c.7.5 1.7.9 2.6.7l.4-.1c.7-.2 1.3-.5 1.7-.9l2.1-2.3" /><path d="m3.5 18 2.1-2.3c.4-.4 1-.8 1.7-.9l.4-.1c.9-.2 1.9.2 2.6 1L12 17l2.7-1.8c.7-.5 1.7-.9 2.6-.7l.4.1c.7.2 1.3.5 1.7.9l2.1 2.3" /><path d="M22 13.5V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4.5" /></Icon>
);

export const Calendar: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></Icon>
);

export const Lightbulb: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></Icon>
);

export const PartyPopper: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M5.8 11.3 2 22l10.7-3.79" /><path d="m13.4 12.3 4.1-4.1 2.5 2.5-4.1 4.1" /><path d="M11.3 5.8 22 2 18.21 12.7" /><path d="m12.3 13.4-4.1 4.1-2.5-2.5 4.1-4.1" /><path d="m14 7 3-3" /><path d="M9.41 14.12 10 14.71" /><path d="M14.71 10 14.12 9.41" /><path d="m18 11-1 1" /><path d="m18.5 3.5.5-.5" /><path d="m14.5 18.5.5.5" /><path d="M3.5 18.5.5 21.5" /></Icon>
);

export const PlusCircle: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="16" /><line x1="8" x2="16" y1="12" y2="12" /></Icon>
);

export const Wand2: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="m3 3 3 3" /><path d="M12.2 6.2 17.8 12" /><path d="m21 21-3-3" /><path d="M11 2a2 2 0 0 0-2 2v5" /><path d="M11 15v5a2 2 0 0 0 2 2" /><path d="M5.2 6.2a5 5 0 0 0-4 4 4.5 4.5 0 0 0 8 2" /><path d="M18.8 17.8a5 5 0 0 0 4-4 4.5 4.5 0 0 0-8-2" /></Icon>
);

export const CheckCircle: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></Icon>
);

export const PackageCheck: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M16 16h2a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v12" /><path d="M12 22v-6" /><path d="m15 19-3 3-3-3" /><path d="M22 12v.5" /><path d="M12 12H6" /><path d="M14 12h-2" /><path d="m7.5 4.5-1 1" /></Icon>
);

export const CalendarClock: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /><path d="M18 20a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path d="M16 18h2" /><path d="M18 16v2" /></Icon>
);

export const DollarSign: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></Icon>
);

export const Gift: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A2.5 2.5 0 0 1 10 5.5"/><path d="M16.5 8a2.5 2.5 0 0 0 0-5A2.5 2.5 0 0 0 14 5.5"/></Icon>
);

export const Palette: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.667 0-.424-.163-.83-.437-1.139-.277-.308-.68-.496-1.123-.496H12c-1.657 0-3-1.343-3-3s1.343-3 3-3h.648c.444 0 .846-.188 1.123-.496.274-.309.437-.715.437-1.139C14.21 4.28 13.47 2 12 2Z"/></Icon>
);

export const List: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></Icon>
);

export const Edit: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></Icon>
);

export const Trash2: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></Icon>
);

export const ChevronLeft: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="m15 18-6-6 6-6" /></Icon>
);

export const ChevronRight: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="m9 18 6-6-6-6" /></Icon>
);

export const Search: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Icon>
);

export const FileText: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></Icon>
);

export const X: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon>
);

export const ShoppingCart: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.16"/></Icon>
);

export const Users: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Icon>
);

export const Layers: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a2 2 0 0 0 0 3.84l8.53 3.84a2 2 0 0 0 1.66 0l8.53-3.84a2 2 0 0 0 0-3.84Z" /><path d="M2 10.12V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-7.88" /><path d="M10 14V6" /><path d="M20 10.12 12 14l-8-3.88" /></Icon>
);

export const Banknote: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01" /><path d="M18 12h.01" /></Icon>
);

export const Sparkles: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="m12 3-1.9 1.9-1.4-1.4-1.9 1.9-1.4-1.4-1.9 1.9-1.4-1.4-1.9 1.9-1.4-1.4-1.9 1.9-1.4-1.4-1.9 1.9L12 21l1.9-1.9 1.4 1.4 1.9-1.9 1.4 1.4 1.9-1.9 1.4 1.4 1.9-1.9 1.4 1.4 1.9-1.9 1.4 1.4 1.9-1.9Z" /></Icon>
);

export const Bot: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></Icon>
);

export const ArrowUp: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></Icon>
);

export const ArrowDown: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></Icon>
);

export const CreditCard: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></Icon>
);

export const Wrench: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></Icon>
);

export const ClipboardList: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></Icon>
);

export const ClipboardCheck: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="m9 14 2 2 4-4" /></Icon>
);

export const ArrowRightLeft: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></Icon>
);

export const Bell: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></Icon>
);

export const TriangleAlert: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></Icon>
);

export const QrCode: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" /></Icon>
);

export const Truck: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" /><path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" /><circle cx="7" cy="18" r="2" /><path d="M15 18H9" /><circle cx="17" cy="18" r="2" /></Icon>
);

export const Settings: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></Icon>
);

export const BarChart3: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></Icon>
);

export const Save: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></Icon>
);

// FIX: Added missing Link and Copy icons for use in RentalDetailModal.
export const Link: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></Icon>
);

export const Copy: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></Icon>
);
