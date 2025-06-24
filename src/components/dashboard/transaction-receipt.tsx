
'use client';

import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { type Transaction } from '@/lib/types';
import { Download, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';

interface TransactionReceiptProps {
  transaction: Transaction | null;
}

export function TransactionReceipt({ transaction }: TransactionReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!transaction) return null;
  
  const handleDownloadImage = () => {
    if (!receiptRef.current) return;
    html2canvas(receiptRef.current, { scale: 2, backgroundColor: '#ffffff' }).then((canvas) => {
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `receipt-${transaction.id}.png`;
      link.click();
    });
  };

  const handleDownloadPdf = () => {
    if (!receiptRef.current) return;
    html2canvas(receiptRef.current, { scale: 2, backgroundColor: '#ffffff' }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`receipt-${transaction.id}.pdf`);
    });
  };

  const formattedDate = format(transaction.date, 'Pp');
  const formattedAmount = `${transaction.amount > 0 ? '+' : ''}${transaction.amount.toLocaleString()} Cubes`;

  const receiptText = `----------------------------------------
       Adsener Transaction Receipt
----------------------------------------

Transaction ID: ${transaction.id}
Date & Time:    ${formattedDate}

Details:
  Description: ${transaction.description}
  Type:        ${transaction.type}
  Status:      ${transaction.status}

Amount:      ${formattedAmount}

----------------------------------------
     Thank you for using Adsener!
----------------------------------------`;


  return (
    <div>
        <div ref={receiptRef} className="bg-white p-6 sm:p-8 rounded-lg text-black shadow-md font-mono">
            <pre className="whitespace-pre-wrap break-words">{receiptText}</pre>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={handleDownloadImage} variant="outline">
                <ImageIcon className="mr-2 h-4 w-4" />
                Download as Image
            </Button>
            <Button onClick={handleDownloadPdf}>
                <Download className="mr-2 h-4 w-4" />
                Download as PDF
            </Button>
        </div>
    </div>
  );
}
