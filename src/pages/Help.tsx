import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Help() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold">Help & Support</h1>
        <p className="text-muted-foreground mt-2">
          Find answers to your questions and get support.
        </p>
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Under Construction</CardTitle>
              <CardDescription>
                This help page is currently under development.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Help documentation and support channels will be available here soon.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}