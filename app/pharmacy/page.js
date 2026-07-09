import { Pill } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PharmacyPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Pharmacy</h2>
          <p className="text-muted-foreground mt-1">Dispense prescribed medications</p>
        </div>
      </div>
      <Card>
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Pill className="w-5 h-5 text-pink-500" />
            Prescriptions to Dispense
          </CardTitle>
          <CardDescription>Medications prescribed by doctors.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-10">
            No pending prescriptions.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
