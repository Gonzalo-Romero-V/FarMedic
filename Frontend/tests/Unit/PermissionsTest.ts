
import { can, canAll, canAny } from "../../lib/permissions/can";
import { RoleOrGuest, Permission } from "../../lib/permissions/index";

function assertEquals(actual: any, expected: any, message: string) {
    if (actual === expected) {
        console.log(`✅ PASÓ: ${message}`);
    } else {
        console.error(`❌ FALLÓ: ${message} (Esperaba ${expected}, recibí ${actual})`);
        process.exit(1);
    }
}

console.log("--- Iniciando Pruebas de Permisos (RBAC) ---");

// Escenario 1: El administrador tiene todos sus permisos
assertEquals(can("administrador", "users.manage"), true, "El admin debería poder gestionar usuarios");
assertEquals(can("administrador", "stock.adjust"), true, "El admin debería poder ajustar stock");

// Escenario 2: El empleado tiene permisos limitados
assertEquals(can("empleado", "pos.sell"), true, "El empleado debería poder vender (POS)");
assertEquals(can("empleado", "users.manage"), false, "El empleado NO debería poder gestionar usuarios");

// Escenario 3: El cliente solo puede ver catálogo y crear pedidos
assertEquals(can("cliente", "catalog.read"), true, "El cliente debería poder leer el catálogo");
assertEquals(can("cliente", "orders.create"), true, "El cliente debería poder crear pedidos");
assertEquals(can("cliente", "stock.adjust"), false, "El cliente NO debería poder ajustar stock");

// Escenario 4: Invitado (sin login) solo ve el catálogo
assertEquals(can("invitado", "catalog.read"), true, "El invitado debería poder leer el catálogo");
assertEquals(can("invitado", "orders.create"), false, "El invitado NO debería poder crear pedidos");

// Escenario 5: Casos nulos o inválidos
assertEquals(can(null as any, "catalog.read"), false, "Un rol nulo no debería tener permisos");

// Escenario 6: canAny (Al menos uno)
assertEquals(canAny("empleado", ["users.manage", "pos.sell"]), true, "El empleado debería pasar si tiene al menos uno (pos.sell)");

console.log("--- Pruebas Finalizadas con Éxito ---");
