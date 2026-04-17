import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const rbacSource = read("src/lib/rbac.ts");
const sidebarSource = read("src/components/layout/Sidebar.tsx");

// Regression guard: admin menu wajib ada dan permission-driven.
assert(sidebarSource.includes('name: "Kanban"') && sidebarSource.includes('requiredPermission: "tasks:read"'), "Sidebar: menu Kanban harus permission-driven (tasks:read)");
assert(sidebarSource.includes('name: "Keuangan"') && sidebarSource.includes('requiredPermission: "transactions:read"'), "Sidebar: menu Keuangan harus permission-driven (transactions:read)");
assert(sidebarSource.includes('name: "AI Scanner"') && sidebarSource.includes('requiredPermission: "tasks:read"'), "Sidebar: menu AI Scanner harus permission-driven (tasks:read)");
assert(sidebarSource.includes('name: "Audit Log"') && sidebarSource.includes('requiredPermission: "audit:read"'), "Sidebar: menu Audit Log harus permission-driven (audit:read)");
assert(sidebarSource.includes('hasPermission(userRole, item.requiredPermission)'), "Sidebar: filtering menu harus berbasis hasPermission()");

// Route policy map wajib ada untuk route kritikal.
assert(rbacSource.includes('{ path: "/admin/audit", permission: "audit:read" }'), "Route policy: /admin/audit -> audit:read harus terdaftar");
assert(rbacSource.includes('{ path: "/kanban", permission: "tasks:read" }'), "Route policy: /kanban -> tasks:read harus terdaftar");
assert(rbacSource.includes('{ path: "/keuangan", permission: "transactions:read" }'), "Route policy: /keuangan -> transactions:read harus terdaftar");
assert(rbacSource.includes('{ path: "/scanner", permission: "tasks:read" }'), "Route policy: /scanner -> tasks:read harus terdaftar");

// Manager/User tidak boleh dapat audit access.
const managerBlock = rbacSource.match(/manager:\s*\[(.*?)\],\s*user:/s)?.[1] ?? "";
const userBlock = rbacSource.match(/user:\s*\[(.*?)\],\s*\};/s)?.[1] ?? "";
assert(!managerBlock.includes('"audit:read"'), "Permission: manager tidak boleh punya audit:read");
assert(!userBlock.includes('"audit:read"'), "Permission: user tidak boleh punya audit:read");
assert(rbacSource.includes('"audit:read"'), "Permission: admin harus punya audit:read");

if (failures.length > 0) {
  console.error("RBAC quality gate FAILED:");
  failures.forEach((f, i) => console.error(`${i + 1}. ${f}`));
  process.exit(1);
}

console.log("RBAC quality gate PASSED");
