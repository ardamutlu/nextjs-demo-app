import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Home() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
        <CardDescription>Manage Dashboard information</CardDescription>
      </CardHeader>
      <CardContent>Charts</CardContent>
    </Card>
  );
}
