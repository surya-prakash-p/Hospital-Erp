"use client";

import { useState } from "react";
import { Users, Plus, CheckCircle, AlertCircle, Info, RefreshCw, Mail, Phone, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const INITIAL_STAFF = [
  { id: "STF-201", name: "Nurse Sarah", role: "Nurse", department: "ICU Ward", email: "sarah@thangamhospital.org", phone: "9876543230" },
  { id: "STF-202", name: "Pharmacist Karthik", role: "Pharmacist", department: "Pharmacy Block A", email: "karthik@thangamhospital.org", phone: "9876543231" },
  { id: "STF-203", name: "Technician Rajan", role: "Lab Technician", department: "Diagnostics Lab", email: "rajan@thangamhospital.org", phone: "9876543232" },
];

export default function StaffPage() {
  const [staffList, setStaffList] = useState(INITIAL_STAFF);
  const [toasts, setToasts] = useState([]);

  // Form states
  const [name, setName] = useState("");
  const [role, setRole] = useState("Nurse");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !department.trim()) {
      showToast("Name, Mobile number, and Department are required", "error");
      return;
    }

    const newStaff = {
      id: `STF-${Math.floor(200 + Math.random() * 100)}`,
      name: name.trim(),
      role,
      department: department.trim(),
      email: email.trim() || `${name.trim().toLowerCase().replace(" ", "")}@thangamhospital.org`,
      phone: phone.trim()
    };

    setStaffList(prev => [...prev, newStaff]);
    showToast(`${name} successfully registered as ${role}!`, "success");

    setName("");
    setDepartment("");
    setEmail("");
    setPhone("");
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg shadow-lg border text-xs font-semibold animate-in slide-in-from-top-2 duration-200
              ${t.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : ""}
              ${t.type === "error" ? "bg-rose-50 text-rose-800 border-rose-200" : ""}
              ${t.type === "info" ? "bg-indigo-50 text-indigo-800 border-indigo-200" : ""}`}
          >
            {t.type === "success" && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
            {t.type === "error" && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
            {t.type === "info" && <Info className="w-4 h-4 text-indigo-500 shrink-0" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Staff & Employee Registry</h2>
        <p className="text-muted-foreground mt-1">Manage credentials, department allocations, and roles for nurses, pharmacists, and admins</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff Form */}
        <Card className="lg:col-span-1 border-t-4 border-t-indigo-600 shadow-md">
          <CardHeader className="bg-slate-50 border-b py-3">
            <CardTitle className="text-sm font-serif">Register Staff Member</CardTitle>
            <CardDescription className="text-xs">Add nurses, receptionists, pharmacists, or technicians.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="staff-name" className="text-xs font-semibold">Employee Name *</Label>
                <Input
                  id="staff-name"
                  placeholder="e.g. Nurse Sarah"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="staff-role" className="text-xs font-semibold">Role *</Label>
                  <select
                    id="staff-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none"
                  >
                    <option value="Nurse">Nurse</option>
                    <option value="Pharmacist">Pharmacist</option>
                    <option value="Lab Technician">Lab Technician</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Admin Staff">Admin Staff</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="staff-dept" className="text-xs font-semibold">Department *</Label>
                  <Input
                    id="staff-dept"
                    placeholder="e.g. ICU Ward"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="staff-phone" className="text-xs font-semibold">Mobile Number *</Label>
                  <Input
                    id="staff-phone"
                    placeholder="10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="staff-email" className="text-xs font-semibold">Email Address</Label>
                  <Input
                    id="staff-email"
                    placeholder="sarah@thangamhospital.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 h-9 text-xs font-semibold mt-2">
                <Users className="w-3.5 h-3.5" /> Save Employee Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Staff registry listing */}
        <Card className="lg:col-span-2 shadow-xs border-slate-200">
          <CardHeader className="bg-slate-50 border-b py-3">
            <CardTitle className="text-base font-serif">Staff Organization Directory</CardTitle>
            <CardDescription className="text-xs">Clinical staff, technicians, and nursing listings.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y text-xs">
              <div className="grid grid-cols-5 px-6 py-2.5 font-bold text-slate-500 bg-slate-50/60 uppercase tracking-wider">
                <div>Employee ID / Name</div>
                <div>Designated Role</div>
                <div>Department</div>
                <div>Contact</div>
                <div className="text-right">Permissions</div>
              </div>
              {staffList.map((emp) => (
                <div key={emp.id} className="grid grid-cols-5 px-6 py-4 items-center hover:bg-slate-50/20 transition-colors">
                  <div className="font-semibold text-slate-800">
                    {emp.name}
                    <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{emp.id}</span>
                  </div>
                  <div className="text-slate-600 font-bold">{emp.role}</div>
                  <div className="text-slate-600 font-medium">{emp.department}</div>
                  <div className="text-slate-500 font-medium">
                    <span className="block">{emp.phone}</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{emp.email}</span>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[9px]">
                      <Shield className="w-2.5 h-2.5" /> Standard
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
