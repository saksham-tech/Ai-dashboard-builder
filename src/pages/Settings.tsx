import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and application settings here.
        </p>
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Under Construction</CardTitle>
              <CardDescription>
                This settings page is currently under development.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>More options will be available here soon!</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}