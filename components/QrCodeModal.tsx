
import React, { useEffect, useRef } from 'react';

declare const QRCode: any;

interface Props {
    data: { type: 'item' | 'kit'; id: string };
    name: string;
    onClose: () => void;
}

const QrCodeModal: React.FC<Props> = ({ data, name, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            QRCode.toCanvas(canvasRef.current, JSON.stringify(data), { width: 200 }, (error: any) => {
                if (error) console.error(error);
            });
        }
    }, [data]);

    const handlePrint = () => {
        const printContent = document.getElementById('printable-qr-code-area');
        if (printContent) {
            const originalContents = document.body.innerHTML;
            document.body.innerHTML = printContent.innerHTML;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload(); // Recarrega a página para restaurar os scripts e o estado
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
                <div id="printable-qr-code-area">
                    <style>
                        {`@media print {
                            body * { visibility: hidden; }
                            #printable-qr-code-area, #printable-qr-code-area * { visibility: visible; }
                            #printable-qr-code-area { position: absolute; left: 0; top: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                        }`}
                    </style>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">{name}</h2>
                    <p className="text-sm text-slate-500 mb-4">ID: {data.id}</p>
                    <div className="flex justify-center">
                        <canvas ref={canvasRef} />
                    </div>
                </div>

                <div className="flex justify-center gap-4 mt-6">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300">Fechar</button>
                    <button onClick={handlePrint} className="py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700">Imprimir Etiqueta</button>
                </div>
            </div>
        </div>
    );
};

export default QrCodeModal;
