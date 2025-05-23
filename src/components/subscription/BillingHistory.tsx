
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/utils";

interface InvoiceItem {
  id: string;
  created: number;
  amount_paid: number;
  currency: string;
  status: string;
  description: string;
}

export const BillingHistory = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase.functions.invoke('get-invoices');

        if (error) {
          throw error;
        }

        if (data && Array.isArray(data)) {
          setInvoices(data);
        }
      } catch (err) {
        console.error("Error fetching invoices:", err);
        setError("Failed to load billing history. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [user]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (isLoading) {
    return (
      <Card className="bg-figuro-darker/50 border-white/10 mt-8">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Billing History</h3>
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-figuro-accent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-figuro-darker/50 border-white/10 mt-8">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Billing History</h3>
          <p className="text-red-400 text-center py-4">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card className="bg-figuro-darker/50 border-white/10 mt-8">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Billing History</h3>
          <p className="text-white/70 text-center py-4">
            No billing history available. Invoices will appear here when you subscribe to a paid plan.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-figuro-darker/50 border-white/10 mt-8">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Billing History</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-white">Date</TableHead>
                <TableHead className="text-white">Description</TableHead>
                <TableHead className="text-white">Amount</TableHead>
                <TableHead className="text-white">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} className="border-white/10">
                  <TableCell className="text-white/80">
                    {formatDate(new Date(invoice.created * 1000).toISOString())}
                  </TableCell>
                  <TableCell className="text-white/80">{invoice.description || "Subscription Payment"}</TableCell>
                  <TableCell className="text-white/80">
                    {formatCurrency(invoice.amount_paid, invoice.currency)}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      invoice.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                      invoice.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {invoice.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
