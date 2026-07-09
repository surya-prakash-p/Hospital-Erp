import { FlaskConical } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LabPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Lab Station</h2>
          <p className="text-muted-foreground mt-1">Manage and process lab requests</p>
        </div>
      </div>
      <Card>
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-purple-500" />
            Pending Lab Tests
          </CardTitle>
          <CardDescription>Tests requested by doctors.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-10">
            No pending lab requests.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
