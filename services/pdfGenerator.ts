
import { Rental, Kit, InventoryItem, CompanySettings } from '../types';

declare const jspdf: any;

export const generateRentalContract = (rental: Rental, settings: CompanySettings | null) => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();

    // Título do Documento
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATO DE LOCAÇÃO DE BENS MÓVEIS', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    // Informações do Cliente (LOCATÁRIO)
    doc.setFont('helvetica', 'bold');
    doc.text('LOCATÁRIO:', 20, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${rental.client.name}`, 20, 48);

    // Informações da Empresa (LOCADOR)
    doc.setFont('helvetica', 'bold');
    doc.text('LOCADOR:', 20, 64);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${settings?.companyName || 'Sua Empresa de Pegue e Monte'}`, 20, 72);
    doc.text(`CNPJ: ${settings?.cnpj || 'XX.XXX.XXX/0001-XX'}`, 20, 80);
    doc.text(`Endereço: ${settings?.address || 'Seu Endereço Completo'}`, 20, 88);

    // Detalhes do Aluguel
    doc.setFont('helvetica', 'bold');
    doc.text('DETALHES DA LOCAÇÃO:', 20, 104);
    doc.setFont('helvetica', 'normal');
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
    let currentY = 112;
    doc.text(`Data do Evento: ${formatDate(rental.eventDate)}`, 20, currentY);
    currentY += 8;
    doc.text(`Período de Locação: de ${formatDate(rental.pickupDate)} até ${formatDate(rental.returnDate)}`, 20, currentY);
    
    if(rental.deliveryService && rental.deliveryAddress) {
        currentY += 8;
        doc.text(`Endereço de Entrega: ${rental.deliveryAddress}`, 20, currentY, { maxWidth: 170 });
    }
    
    // Tabela de Itens
    const tableColumn = ["Item", "Qtd.", "Valor"];
    const tableRows: any[] = [];
    
    // Map to track quantities of items included in kits
    const kitItemQuantities = new Map<string, number>();

    if (rental.kits && rental.kits.length > 0) {
        tableRows.push([{ content: 'KITS TEMÁTICOS', colSpan: 3, styles: { fontStyle: 'bold', fillColor: '#f1f5f9' } }]);
        rental.kits.forEach(kit => {
            kit.items.forEach(item => {
                kitItemQuantities.set(item.id, (kitItemQuantities.get(item.id) || 0) + 1);
            });
            tableRows.push([
                `${kit.name}\n${kit.items.map(i => `- ${i.name}`).join('\n')}`,
                '1', 
                kit.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            ]);
        });
    }
    
    // Determine individual items by subtracting kit items from the total rental items
    const individualItems: Pick<InventoryItem, 'id' | 'name' | 'quantity' | 'price'>[] = [];
    rental.items.forEach(item => {
        const quantityInKits = kitItemQuantities.get(item.id) || 0;
        const individualQuantity = item.quantity - quantityInKits;

        if (individualQuantity > 0) {
            individualItems.push({ ...item, quantity: individualQuantity });
        }
    });


    if (individualItems.length > 0) {
        tableRows.push([{ content: 'ITENS INDIVIDUAIS', colSpan: 3, styles: { fontStyle: 'bold', fillColor: '#f1f5f9' } }]);
        individualItems.forEach(item => {
            const itemData = [
                item.name,
                item.quantity,
                (item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            ];
            tableRows.push(itemData);
        });
    }
    
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: currentY + 10,
        theme: 'striped',
        headStyles: { fillColor: [75, 85, 99] }, // slate-600
    });
    
    let finalY = (doc as any).lastAutoTable.finalY || 180;
    
    // Total
    const finalValue = rental.totalValue - rental.discount;
    const itemSubtotal = rental.totalValue - (rental.deliveryFee || 0) - (rental.setupFee || 0);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal (Itens):', 130, finalY + 10);
    doc.text(itemSubtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 200, finalY + 10, { align: 'right' });

    if (rental.deliveryFee && rental.deliveryFee > 0) {
        finalY += 7;
        doc.text('Taxa de Entrega:', 130, finalY + 10);
        doc.text(rental.deliveryFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 200, finalY + 10, { align: 'right' });
    }

    if (rental.setupFee && rental.setupFee > 0) {
        finalY += 7;
        doc.text('Taxa de Montagem:', 130, finalY + 10);
        doc.text(rental.setupFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 200, finalY + 10, { align: 'right' });
    }

    if (rental.discount > 0) {
        finalY += 7;
        doc.text('Desconto:', 130, finalY + 10);
        doc.text(`- ${rental.discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 200, finalY + 10, { align: 'right' });
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    finalY += 7;
    doc.text('VALOR FINAL:', 130, finalY + 10);
    doc.text(finalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 200, finalY + 10, { align: 'right' });


    // Cláusulas
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CLÁUSULAS IMPORTANTES:', 20, finalY + 25);
    doc.setFont('helvetica', 'normal');
    
    const defaultClauses = [
        '1. O LOCATÁRIO se responsabiliza pela integridade dos itens durante o período da locação.',
        '2. Qualquer dano, perda ou avaria dos itens será de responsabilidade do LOCATÁRIO, que deverá arcar com os custos de reparo ou reposição.',
        '3. A devolução dos itens deve ocorrer na data e hora estipuladas. Atrasos podem acarretar multas.',
        '4. A montagem e desmontagem dos itens é de responsabilidade do LOCATÁRIO, a menos que o serviço tenha sido contratado à parte.',
    ];
    
    const clauses = settings?.contractTerms ? settings.contractTerms.split('\n') : defaultClauses;

    doc.text(clauses, 20, finalY + 32, { maxWidth: 170 });

    // Assinaturas
    const signatureY = Math.max(finalY + 70, 250);
    doc.text('_________________________', 30, signatureY + 10);
    doc.text(settings?.companyName || 'LOCADOR', 50, signatureY + 15);

    doc.text('_________________________', 120, signatureY + 10);
    doc.text('LOCATÁRIO', 140, signatureY + 15);


    doc.save(`contrato_${rental.client.name.replace(/\s/g, '_')}.pdf`);
};