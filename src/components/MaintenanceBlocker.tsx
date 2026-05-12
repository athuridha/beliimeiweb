"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function MaintenanceBlocker({ 
  isMaintenance, 
  children 
}: { 
  isMaintenance: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const isMaintenanceRoute = pathname === "/maintenance";
    const isAdminRoute = pathname?.startsWith("/admin");

    if (isMaintenance && !isAdminRoute && !isMaintenanceRoute) {
      router.replace("/maintenance");
    } else if (!isMaintenance && isMaintenanceRoute) {
      router.replace("/");
    }
  }, [isMaintenance, pathname, router, mounted]);

  const isMaintenanceRoute = pathname === "/maintenance";
  const isAdminRoute = pathname?.startsWith("/admin");

  // Prevent flashing content while redirecting to maintenance page
  if (isMaintenance && !isAdminRoute && !isMaintenanceRoute) {
    return null;
  }

  // Prevent flashing maintenance page if not in maintenance
  if (!isMaintenance && isMaintenanceRoute) {
    return null;
  }

  // If we are on the maintenance page, we might want to hide the WhatsApp widget that's inside children.
  // We can achieve this by passing children as is, but we also wrapped WhatsAppWidget inside MaintenanceBlocker.
  // Actually, we can just hide children entirely if we are on /maintenance? No, children INCLUDES the maintenance page itself!
  
  return <>{children}</>;
}
