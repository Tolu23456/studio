
'use client';

import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { type Transaction } from '@/lib/types';
import { format } from 'date-fns';
import { Download, Image as ImageIcon } from 'lucide-react';

interface TransactionReceiptProps {
  transaction: Transaction | null;
}

const getStatusBadgeClass = (status: Transaction['status']) => {
    switch (status) {
        case "completed":
            return "bg-green-100 text-green-800";
        case "pending":
            return "bg-yellow-100 text-yellow-800";
        case "failed":
            return "bg-red-100 text-red-800";
    }
}

export function TransactionReceipt({ transaction }: TransactionReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!transaction) return null;
  
  const handleDownloadImage = () => {
    if (!receiptRef.current) return;
    html2canvas(receiptRef.current, { scale: 2 }).then((canvas) => {
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `receipt-${transaction.id}.png`;
      link.click();
    });
  };

  const handleDownloadPdf = () => {
    if (!receiptRef.current) return;
    html2canvas(receiptRef.current, { scale: 2 }).then((canvas) => {
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
  
  const formattedAmount = `${transaction.amount > 0 ? '+' : ''}${transaction.amount.toLocaleString()} Cubes`;

  return (
    <div>
        <div ref={receiptRef} className="bg-white p-6 sm:p-8 rounded-lg text-black shadow-md">
            <div className="flex justify-between items-center border-b-2 border-gray-200 pb-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 font-headline">Transaction Receipt</h2>
                <div className="text-right">
                    <p className="font-bold text-primary text-xl">Adsener</p>
                    <p className="text-xs text-gray-500">Your Time, Rewarded</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-8 text-sm">
                <div>
                    <p className="text-gray-500 font-semibold mb-1">Transaction ID</p>
                    <p className="font-mono text-xs text-gray-800 break-all">{transaction.id}</p>
                </div>
                <div className="sm:text-right">
                    <p className="text-gray-500 font-semibold mb-1">Date & Time</p>
                    <p className="text-gray-800">{format(transaction.date, 'Pp')}</p>
                </div>
                 <div>
                    <p className="text-gray-500 font-semibold mb-1">Transaction Type</p>
                    <p className="text-gray-800 capitalize">{transaction.type}</p>
                </div>
                <div className="sm:text-right">
                    <p className="text-gray-500 font-semibold mb-1">Status</p>
                    <p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(transaction.status)}`}>
                            {transaction.status}
                        </span>
                    </p>
                </div>
                 <div className="col-span-1 sm:col-span-2">
                    <p className="text-gray-500 font-semibold mb-1">Description</p>
                    <p className="text-gray-800">{transaction.description}</p>
                </div>
            </div>

            <div className="border-t-2 border-dashed border-gray-300 pt-6 mt-6">
                <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-gray-600">Amount</span>
                     <span className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>{formattedAmount}</span>
                </div>
            </div>

             <div className="text-center text-xs text-gray-400 mt-10">
                Thank you for using Adsener!
            </div>
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
