import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Building2, Hash, Copy, Check } from 'lucide-react';
import { useTenant, useUpdateTenant } from '../queries/tenant.query';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const { data: tenant } = useTenant();
  const updateTenant = useUpdateTenant();
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);

  const isOwner = user?.role === 'owner';
  const joinLink = `${window.location.origin}/join?slug=${tenant?.slug ?? ''}`;

  const copyLink = () => {
    navigator.clipboard.writeText(joinLink);
    setCopied(true);
    toast.success('Invite link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateTenant.mutate({ name }, {
      onSuccess: () => toast.success('Workspace updated'),
    });
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Workspace Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your organization settings</p>
      </div>

      <div className="space-y-5">
        {/* Org info card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-200">
              {tenant?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{tenant?.name}</p>
              <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-0.5">
                <Hash size={12} />
                <span>{tenant?.slug}</span>
              </div>
            </div>
            <span className="ml-auto text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-2.5 py-1 rounded-full font-medium capitalize">
              {tenant?.plan}
            </span>
          </div>

          {isOwner ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Organization name</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required
                    placeholder={tenant?.name}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Slug</label>
                <div className="relative">
                  <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={tenant?.slug ?? ''} disabled
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-100 text-gray-400 cursor-not-allowed" />
                </div>
                <p className="text-xs text-gray-400">Slug cannot be changed after creation</p>
              </div>
              <button type="submit" disabled={updateTenant.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-60">
                {updateTenant.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
              Only the workspace owner can change settings.
            </p>
          )}
        </div>

        {/* Invite link card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Invite Members</h2>
            <p className="text-xs text-gray-400 mt-0.5">Share this link with anyone you want to invite to your workspace</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 truncate">
              {joinLink}
            </div>
            <button onClick={copyLink}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition flex-shrink-0 ${copied ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
              {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Link</>}
            </button>
          </div>
          <p className="text-xs text-gray-400">
            They will join as <span className="font-medium text-gray-600">member</span>. You can promote them to admin from the Members page.
          </p>
        </div>
      </div>
    </div>
  );
}
