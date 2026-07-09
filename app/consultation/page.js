import { Stethoscope } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function ConsultationPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Consultation</h2>
          <p className="text-muted-foreground mt-1">Doctor's diagnosis and prescription</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 border-b bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors border-l-4 border-l-indigo-500">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-900">Surya Prakash</h4>
                    <p className="text-sm text-muted-foreground mt-1">9876543210</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-indigo-500" />
                Diagnosis & Vitals
              </CardTitle>
              <CardDescription>Enter consultation details for the selected patient.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Symptoms</Label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" 
                  placeholder="Patient's symptoms..." 
                />
              </div>
              <div className="space-y-2">
                <Label>Diagnosis</Label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" 
                  placeholder="Doctor's diagnosis..." 
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline">Request Lab Test</Button>
                <Button>Save & Send to Pharmacy</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
