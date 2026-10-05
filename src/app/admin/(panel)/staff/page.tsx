import type { Metadata } from "next";
import { requireStaff } from "@/lib/admin/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { removeStaff, updateStaffRole } from "../../actions";
import { Card, PageTitle, formatDateTime } from "../ui";
import { AddStaffForm } from "./add-staff-form";

export const metadata: Metadata = { title: "Працівники" };

export default async function StaffPage() {
  const me = await requireStaff();
  const supabase = await createSessionClient();
  const { data: staff } = await supabase.from("admin_users").select("user_id, email, name, role, created_at").order("created_at");
  const isAdmin = me.role === "admin";

  return (
    <>
      <PageTitle title="Працівники" subtitle="Хто має доступ до адмінки" />
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card className="overflow-x-auto p-0 sm:p-0">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Працівник</th>
                <th className="px-4 py-2.5 font-medium">Роль</th>
                <th className="px-4 py-2.5 font-medium">Додано</th>
                {isAdmin && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y">
              {(staff ?? []).map((s) => {
                const self = s.user_id === me.userId;
                return (
                  <tr key={s.user_id}>
                    <td className="px-4 py-2.5">
                      <div className="font-medium">
                        {s.name || s.email} {self && <span className="text-xs text-muted-foreground">(ви)</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">{s.email}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      {isAdmin && !self ? (
                        <form action={updateStaffRole} className="flex items-center gap-2">
                          <input type="hidden" name="user_id" value={s.user_id} />
                          <select name="role" defaultValue={s.role} className="h-8 rounded-lg border bg-background px-2 text-sm">
                            <option value="manager">Менеджер</option>
                            <option value="admin">Адміністратор</option>
                          </select>
                          <button type="submit" className="text-xs font-medium text-primary hover:underline">
                            Змінити
                          </button>
                        </form>
                      ) : s.role === "admin" ? (
                        "Адміністратор"
                      ) : (
                        "Менеджер"
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{formatDateTime(s.created_at)}</td>
                    {isAdmin && (
                      <td className="px-4 py-2.5 text-right">
                        {!self && (
                          <form action={removeStaff}>
                            <input type="hidden" name="user_id" value={s.user_id} />
                            <button type="submit" className="text-xs font-medium text-rose-700 hover:underline">
                              Закрити доступ
                            </button>
                          </form>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <Card>
          <h2 className="mb-1 font-semibold">Додати працівника</h2>
          {isAdmin ? (
            <AddStaffForm />
          ) : (
            <p className="text-sm text-muted-foreground">Додавати працівників може лише адміністратор.</p>
          )}
          <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
            <b>Менеджер</b> працює із замовленнями, заявками, товарами й контентом. <b>Адміністратор</b> додатково
            керує працівниками.
          </p>
        </Card>
      </div>
    </>
  );
}
