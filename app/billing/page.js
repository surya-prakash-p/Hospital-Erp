import { Receipt } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BillingPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Billing & Pay</h2>
          <p className="text-muted-foreground mt-1">Manage patient invoices and payments</p>
        </div>
      </div>
      <Card>
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-500" />
            Pending Bills
          </CardTitle>
          <CardDescription>Invoices for consultation, lab, and pharmacy.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-10">
            No pending bills.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
