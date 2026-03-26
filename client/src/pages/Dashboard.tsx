import { useNavigate } from "react-router-dom";
import {
  FolderKanban,
  Users,
  CheckSquare,
  Loader2,
  Trash2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { useState, type FormEvent } from "react";
import {
  useProjects,
  useCreateProject,
  useArchiveProject,
} from "../queries/projects.query";
import { useTenantStats } from "../queries/tenant.query";
import { useAuth } from "../context/AuthContext";

const avatarColors = [
  "bg-indigo-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: projects, isLoading } = useProjects();
  const { data: stats } = useTenantStats();
  const createProject = useCreateProject();
  const archiveProject = useArchiveProject();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const canCreate = user?.role === "owner" || user?.role === "admin";

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    createProject.mutate(
      { name, description },
      {
        onSuccess: () => {
          toast.success("Project created");
          setOpen(false);
          setName("");
          setDescription("");
        },
      },
    );
  };
  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome {capitalize(user?.name?.split(" ")[0])}
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          <span className="font-medium text-indigo-600">
            {capitalize(user?.tenant?.name)}
          </span>{" "}
          workspace
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Total Projects",
              value: stats.projects,
              icon: FolderKanban,
              color: "text-indigo-600 bg-indigo-50",
            },
            {
              label: "Team Members",
              value: stats.members,
              icon: Users,
              color: "text-violet-600 bg-violet-50",
            },
            {
              label: "Total Tasks",
              value: stats.tasks,
              icon: CheckSquare,
              color: "text-emerald-600 bg-emerald-50",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm"
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}
              >
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">Projects</h2>
        {canCreate && (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition font-medium shadow-sm"
          >
            <Plus size={14} /> New Project
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-indigo-600" size={28} />
        </div>
      ) : !projects?.length ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-20 text-center">
          <FolderKanban size={24} className="mx-auto text-gray-300 mb-3" />
          <p className="font-medium text-gray-500">No projects yet</p>
          {canCreate && (
            <p className="text-sm text-gray-400 mt-1">
              Click "New Project" to get started
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const members = [p.owner, ...p.members.map((m) => m.user)];
            return (
              <div
                key={p._id}
                className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-indigo-100 transition-all group cursor-pointer relative"
                onClick={() => navigate(`/project/${p._id}`)}
              >
                {canCreate && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      archiveProject.mutate(p._id, {
                        onSuccess: () => toast.success("Project archived"),
                      });
                    }}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition">
                  <FolderKanban size={18} className="text-indigo-600" />
                </div>
                <h2 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition pr-6 truncate">
                  {p.name}
                </h2>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2 min-h-[40px]">
                  {p.description || "No description"}
                </p>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-50">
                  <div className="flex -space-x-1.5">
                    {members.slice(0, 4).map((m, i) => (
                      <div
                        key={m._id}
                        title={m.name}
                        className={`w-6 h-6 rounded-full ${avatarColors[i % avatarColors.length]} text-white text-[10px] flex items-center justify-center border-2 border-white font-semibold`}
                      >
                        {m.name[0].toUpperCase()}
                      </div>
                    ))}
                  </div>
                  <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                    <Users size={11} /> {members.length}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-full max-w-md shadow-2xl z-50">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <Dialog.Title className="text-base font-semibold text-gray-900">
                New Project
              </Dialog.Title>
              <Dialog.Close className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition">
                ✕
              </Dialog.Close>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Project name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  placeholder="e.g. Website Redesign"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What is this project about?"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={createProject.isPending}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-60"
                >
                  {createProject.isPending ? "Creating..." : "Create Project"}
                </button>
                <Dialog.Close className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition border border-gray-200">
                  Cancel
                </Dialog.Close>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
