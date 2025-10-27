
import React, { useEffect } from 'react';
import { X } from './icons';

declare const Html5Qrcode: any;
declare const Html5QrcodeScanner: any;

interface Props {
    validIds: Set<string>;
    onScanSuccess: (id: string, type: 'item' | 'kit') => void;
    onScanError: (message: string) => void;
    onClose: () => void;
}

const QrScanner: React.FC<Props> = ({ validIds, onScanSuccess, onScanError, onClose }) => {
    useEffect(() => {
        let html5QrCode: any;
        
        const qrCodeSuccessCallback = (decodedText: string, decodedResult: any) => {
            try {
                const parsed = JSON.parse(decodedText);
                if (parsed.id && (parsed.type === 'item' || parsed.type === 'kit')) {
                    if (validIds.has(parsed.id)) {
                        onScanSuccess(parsed.id, parsed.type);
                    } else {
                        onScanError(`Item/Kit "${parsed.id}" não pertence a este aluguel.`);
                    }
                } else {
                    onScanError("QR Code inválido. Não contém as informações necessárias.");
                }
            } catch (e) {
                onScanError("Formato de QR Code não reconhecido.");
            }
        };

        Html5Qrcode.getCameras().then((devices: any[]) => {
            if (devices && devices.length) {
                const cameraId = devices[0].id;
                html5QrCode = new Html5Qrcode("reader");
                html5QrCode.start(
                    cameraId, 
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 } 
                    },
                    qrCodeSuccessCallback,
                    (errorMessage: string) => { /* ignore errors */ }
                ).catch((err: any) => {
                    console.log(`Unable to start scanning, error: ${err}`);
                });
            }
        }).catch((err: any) => {
            console.log(`Error getting cameras: ${err}`);
        });

        return () => {
            if (html5QrCode) {
                html5QrCode.stop().then(() => {
                    console.log("QR Code scanning stopped.");
                }).catch((err: any) => {
                    console.log(`Failed to stop QR Code scanning: ${err}`);
                });
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
            <div id="reader" className="w-full max-w-md h-auto rounded-lg overflow-hidden"></div>
            <p className="text-white mt-4 text-center">Aponte a câmera para o QR Code</p>
            <button onClick={onClose} className="mt-4 bg-white text-slate-800 font-semibold py-2 px-4 rounded-lg shadow-lg hover:bg-slate-200 flex items-center">
                <X className="w-5 h-5 mr-2" />
                Fechar Scanner
            </button>
        </div>
    );
};

export default QrScanner;
