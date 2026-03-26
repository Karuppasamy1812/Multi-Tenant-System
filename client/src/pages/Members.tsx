import { Loader2, Shield, Crown, User, Trash2 } from "lucide-react";
import { toast } from "sonner";
import * as Select from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import {
  useMembers,
  useUpdateMemberRole,
  useRemoveMember,
} from "../queries/tenant.query";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../lib/types";

const roleIcon = { owner: Crown, admin: Shield, member: User };
const roleColor = {
  owner: "text-amber-600 bg-amber-50",
  admin: "text-indigo-600 bg-indigo-50",
  member: "text-gray-600 bg-gray-100",
};
const avatarColors = [
  "bg-indigo-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
];

export default function Members() {
  const { user } = useAuth();
  const { data: members, isLoading } = useMembers();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  const canManage = user?.role === "owner" || user?.role === "admin";

  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your workspace members and their roles
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-indigo-600" size={28} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {members?.map((m, i) => {
            const Icon = roleIcon[m.role];
            const isMe = m._id === user?._id;
            const isOwner = m.role === "owner";
            return (
              <div
                key={m._id}
                className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${avatarColors[i % avatarColors.length]} text-white flex items-center justify-center font-bold text-sm flex-shrink-0`}
                >
                  {m?.name ? m.name.charAt(0).toUpperCase() : ""}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {capitalize(m.name)}{' '}
                    {isMe && (
                      <span className="text-xs text-gray-400 font-normal">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{m.email}</p>
                </div>
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleColor[m.role]}`}
                >
                  <Icon size={11} />
                  <span className="capitalize">{m.role}</span>
                </div>
                {canManage && !isMe && !isOwner && (
                  <div className="flex items-center gap-2">
                    <Select.Root
                      defaultValue={m.role}
                      onValueChange={(role) =>
                        updateRole.mutate(
                          { userId: m._id, role },
                          {
                            onSuccess: () => toast.success("Role updated"),
                          },
                        )
                      }
                    >
                      <Select.Trigger className="flex items-center gap-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white outline-none hover:border-indigo-400 transition">
                        <Select.Value />
                        <Select.Icon>
                          <ChevronDown size={11} className="text-gray-400" />
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                          <Select.Viewport className="p-1">
                            {(["admin", "member"] as Role[]).map((r) => (
                              <Select.Item
                                key={r}
                                value={r}
                                className="px-3 py-2 text-xs rounded-lg cursor-pointer hover:bg-gray-50 outline-none data-[highlighted]:bg-gray-50 capitalize"
                              >
                                <Select.ItemText>{r}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                    <button
                      onClick={() =>
                        removeMember.mutate(m._id, {
                          onSuccess: () => toast.success("Member removed"),
                        })
                      }
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
