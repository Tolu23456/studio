
'use client';

import React, { useRef, useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { type Transaction } from '@/lib/types';
import { Download, Image as ImageIcon } from 'lucide-react';
import { generateReceipt } from '@/ai/flows/generate-receipt-flow';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface TransactionReceiptProps {
  transaction: Transaction | null;
}

export function TransactionReceipt({ transaction }: TransactionReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [receiptText, setReceiptText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (transaction) {
      setIsLoading(true);
      generateReceipt(transaction)
        .then(output => {
          setReceiptText(output.receiptText);
        })
        .catch(error => {
          console.error("Failed to generate receipt:", error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not generate AI receipt. Please try again.'
          });
          setReceiptText("Error: Could not generate receipt.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [transaction, toast]);


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

  return (
    <div>
        <div ref={receiptRef} className="bg-white p-6 sm:p-8 rounded-lg text-black shadow-md font-mono">
            {isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 15 }).map((_, i) => (
                        <Skeleton key={i} className="h-4 bg-gray-200" style={{ width: `${Math.random() * 50 + 50}%`}} />
                    ))}
                </div>
            ) : (
                <pre className="whitespace-pre-wrap break-words">{receiptText}</pre>
            )}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={handleDownloadImage} variant="outline" disabled={isLoading}>
                <ImageIcon className="mr-2 h-4 w-4" />
                Download as Image
            </Button>
            <Button onClick={handleDownloadPdf} disabled={isLoading}>
                <Download className="mr-2 h-4 w-4" />
                Download as PDF
            </Button>
        </div>
    </div>
  );
}
