import { Header } from "@/components/layout/header";
import { ThreeColumnLayout } from "@/components/emails/three-column-layout";
import { NoPermissionDialog } from "@/components/no-permission-dialog";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { checkPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";

export const runtime = "edge";

export default async function MoePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const canManage = await checkPermission(PERMISSIONS.MANAGE_EMAIL);
  const canViewTemp = await checkPermission(PERMISSIONS.VIEW_TEMP_EMAIL);
  const allowed = canManage || canViewTemp;

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 h-screen">
      <div className="container mx-auto h-full px-4 lg:px-8 max-w-[1600px]">
        <Header />
        <main className="h-full">
          <ThreeColumnLayout />
          {!allowed && <NoPermissionDialog />}
        </main>
      </div>
    </div>
  );
}
