import { isUsingMockData } from "@/lib/servicenow/client";

export function MockDataBanner() {
  if (!isUsingMockData()) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-center text-xs font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
      Demo mode — showing sample data, not your real CMDB. Set SERVICENOW_URL /
      SERVICENOW_USERNAME / SERVICENOW_PASSWORD to review live ServiceNow data.
    </div>
  );
}
