"use client";

import { useState } from "react";
import { Search, UserPlus, Activity, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function ReceptionPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-serif">Reception Desk</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage patient walk-ins and registry</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="bg-slate-50 border-b py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-500" />
                Find Existing Patient Records
              </CardTitle>
              <CardDescription className="text-xs">Search by mobile number or name to auto-load reports.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              <div className="flex gap-3">
                <Input 
                  placeholder="Search by Mobile (e.g. 9876543210) or Name..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 h-9 text-sm"
                />
                <Button className="h-9 text-sm">Check Record</Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 italic">
                💡 Tip: Try typing "9876543210" or "Surya Prakash" to demo auto-loading reports!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-slate-50 border-b py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-500" />
                New Patient Registration
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-xs">Patient Name *</Label>
                  <Input id="name" placeholder="Enter full name" className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="mobile" className="text-xs">Mobile Number *</Label>
                  <Input id="mobile" placeholder="Enter 10-digit number" className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="age" className="text-xs">Age</Label>
                  <Input id="age" placeholder="Age in years" type="number" className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="gender" className="text-xs">Gender</Label>
                  <Select>
                    <SelectTrigger id="gender" className="h-9 text-sm">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs">Email Address</Label>
                <Input id="email" type="email" placeholder="patient@example.com" className="h-9 text-sm" />
              </div>
              <div className="pt-2 flex justify-end">
                <Button className="w-full md:w-auto h-9 text-sm">Register Patient</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="bg-slate-50 border-b py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" />
                Active Patient Board
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-3 border-b bg-indigo-50/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900">Surya Prakash</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">9876543210 | Dr. Rajesh</p>
                  </div>
                  <div className="bg-indigo-100 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Consultation
                  </div>
                </div>
              </div>
              {/* Empty state or other patients could go here */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-slate-50 border-b py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" />
                Patient Registry Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-2xl font-bold text-slate-900">2</p>
                  <p className="text-[10px] font-medium text-slate-500 mt-0.5 uppercase tracking-wider">Registered</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-2xl font-bold text-slate-900">0</p>
                  <p className="text-[10px] font-medium text-slate-500 mt-0.5 uppercase tracking-wider">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
