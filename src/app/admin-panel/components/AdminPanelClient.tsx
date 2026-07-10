'use client';

import React, { useEffect, useState } from 'react';
import AddPersonModal, { AddPersonForm } from "./AddPersonModal";
import { getAreas } from "../../../lib/services/areas";

import { useRouter } from 'next/navigation';
import { Users, ClipboardList, History, MapPin, BarChart2, LogOut, Menu, X, CheckCircle, Plus, Edit2, Trash2, Shield, AlertTriangle, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import { mockVisitRecords } from "../../../lib/mockData";

import MarkVisitedModal from './MarkVisitedModal';
import AdminReports from './AdminReports';

import { getCommunityRecords, addCommunityRecord, updateCommunityRecord, markCommunityRecordVisited } from "../../../lib/services/community";

import {
  getPendingProfiles,
  getApprovedProfiles,
  approveProfile,
  rejectProfile
} from "../../../lib/services/profile";
import { CommunityRecord, Gender } from '@/lib/mockData';
import AddRecordModal from '@/app/admin-panel/components/AddRecordModal';



type NavSection = 'approvals' | 'records' | 'history' | 'members' | 'reports';

// Simulated admin gender — in real app comes from auth session
const ADMIN_GENDER: Gender = 'Male';
const ADMIN_ROLE: 'main' | 'male' | 'female' = 'main';

export default function AdminPanelClient() {
  const router = useRouter();
  useEffect(() => {
  const admin = localStorage.getItem("cv_admin");

  if (!admin) {
    router.replace("/");
  }
}, [router]);

const admin = typeof window !== "undefined" ? localStorage.getItem("cv_admin")
  : null;

if (!admin) return null;
  
  const [activeSection, setActiveSection] = useState<NavSection>('approvals');
  const [sidebarOpen, setSidebarOpen] = useState(false);
 const [communityRecords, setCommunityRecords] =
  useState<CommunityRecord[]>([]);
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([]);
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
 const [approvedMembers, setApprovedMembers] = useState<any[]>([]);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [editingPerson, setEditingPerson] = useState<any>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [markVisitedRecord, setMarkVisitedRecord] = useState<CommunityRecord | null>(null);
  const [genderFilter, setGenderFilter] = useState<Gender | 'All'>(ADMIN_ROLE === 'main' ? 'All' : ADMIN_GENDER);
  const [searchQuery, setSearchQuery] = useState('');

useEffect(() => {
  console.log("🚀 useEffect started");

  loadCommunityRecords();
  loadPendingMembers();
 loadApprovedMembers();
  loadAreas();
}, []);



async function loadCommunityRecords() {
   console.log("📥 loadCommunityRecords called");
  const records = await getCommunityRecords();

  console.log(records);

  if (records) {
    const formatted = records.map((r:any)=>({

    id: r.id,

    name: r.name,

    mobile: r.mobile,

    gender: r.gender,

    area: r.areas?.name ?? "",

    areaId: r.area_id,

    society: r.society,

    building: r.building,

    visitCount: r.visit_count,

    lastVisitedDate: r.last_visited_date,

    priority: "medium",

    notes: r.notes ?? ""

}));

    setCommunityRecords(formatted);
    console.log("Formatted:", formatted);
  }
}

async function loadAreas() {

  const data = await getAreas();

  setAreas(data);

}

async function savePerson(data: AddPersonForm) {

    try {

        if (editingPerson) {

            await updateCommunityRecord(
    editingPerson.id,
    {
        name: data.name,
        mobile: data.mobile,
        gender: data.gender,
        society: data.society,
        house_no: data.house_no,
        area_id: data.areaId,
        notes: data.notes
    }
);

            toast.success("Person Updated");

        } else {

            await addCommunityRecord({

                name: data.name,
                mobile: data.mobile,
                gender: data.gender,
                society: data.society,
                house_no: data.house_no,
                area_id: data.areaId,
                visit_count: 0,
                last_visited_date: null,
                notes: data.notes

            });

            toast.success("Person Added");

        }

        loadCommunityRecords();

        setEditingPerson(null);

        setShowAddRecord(false);

    }

    catch(err){

        console.error(err);

        toast.error("Unable to save");

    }

}

async function loadPendingMembers() {
  const data = await getPendingProfiles();

  console.log("Pending Profiles:", data);

  setPendingMembers(data);
}

async function loadApprovedMembers() {
  const data = await getApprovedProfiles();

  setApprovedMembers(data);
}


  const navItems: { id: NavSection; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'approvals', label: 'Approvals', icon: <CheckCircle size={18} />, badge: pendingMembers.length },
    { id: 'records', label: 'Community Records', icon: <ClipboardList size={18} /> },
    { id: 'history', label: 'Visit History', icon: <History size={18} /> },
    { id: 'members', label: 'Members', icon: <Users size={18} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart2 size={18} /> },
  ];

  const filteredRecords = communityRecords.filter((r) => {
    const genderMatch = genderFilter === 'All' ? true : r.gender === genderFilter;
    const searchMatch = searchQuery.trim() === '' ? true :
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.society.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.area.toLowerCase().includes(searchQuery.toLowerCase());
    return genderMatch && searchMatch;
  });

  

  const handleApprove = async (id: string) => {

  try {

    await approveProfile(id);

    toast.success("Member approved");

    await loadPendingMembers();

    await loadApprovedMembers();

  } catch (err) {

    console.error(err);

    toast.error("Unable to approve member");

  }

};
const handleReject = async (memberId: string) => {

  try {

    await rejectProfile(memberId);

    toast.success("Registration rejected");

    await loadPendingMembers();

  } catch (err) {

    console.error(err);

    toast.error("Unable to reject member");

  }

};

 const handleMarkVisited = async (record: CommunityRecord) => {

  try {

    await markCommunityRecordVisited(
      record.id,
      record.visitCount
    );

    toast.success(
      `${record.name} marked as visited`
    );

    loadCommunityRecords();

    setMarkVisitedRecord(null);

  } catch (err) {

    console.error(err);

    toast.error("Unable to record visit");

  }

};

  const handleAddRecord = (record: CommunityRecord) => {
    setCommunityRecords((prev) => [...prev, record]);
    setShowAddRecord(false);
    toast.success(`${record.name} added to community records`);
  };

  const handleEditRecord = (updated: CommunityRecord) => {
    setCommunityRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setEditingPerson(null);
    toast.success('Record updated successfully');
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      setCommunityRecords((prev) => prev.filter((r) => r.id !== id));
      setDeleteConfirmId(null);
      toast.success('Record deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Unable to delete record');
    }
  };

  const priorityBadge = (p: CommunityRecord['priority']) => {
    if (p === 'high') return <Badge variant="destructive">High Priority</Badge>;
    if (p === 'medium') return <Badge variant="warning">Medium</Badge>;
    return <Badge variant="muted">Low</Badge>;
  };

  console.log("communityRecords state:", communityRecords);
console.log("filteredRecords:", filteredRecords);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:flex`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Admin Panel</p>
              <p className="text-xs text-muted-foreground">
                {ADMIN_ROLE === 'main' ? 'Main Admin' : `${ADMIN_GENDER} Admin`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-muted"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>


        </div>

<button
  onClick={async () => {
    const records = await getCommunityRecords();
    console.log(records);
  }}
>
  Test Database
</button>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={`nav-${item.id}`}
              onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                activeSection === item.id
                  ? 'bg-primary/10 text-primary' :'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span className="flex items-center gap-3">
                {item.icon}
                {item.label}
              </span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs font-bold px-1.5 py-0.5 rounded-full tabular-nums">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border">
          <button
         onClick={() => {
        localStorage.removeItem("cv_admin");
          router.push("/");
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut size={18} />
            Exit Admin Panel
          </button>
        </div>
      </aside>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-foreground">
              {navItems.find((n) => n.id === activeSection)?.label}
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              CommunityVisit Admin — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => router.push('/member-home')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors"
          >
            <Users size={14} />
            Member View
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 overflow-y-auto max-w-screen-2xl mx-auto w-full">

          {/* ── APPROVALS ── */}
          {activeSection === 'approvals' && (
            <div className="space-y-4 fade-in">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} className="text-warning" />
                <h2 className="text-sm font-semibold text-foreground">
                  Pending Registration Requests ({pendingMembers.length})
                </h2>
              </div>

              {pendingMembers.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-8 text-center">
                  <CheckCircle size={40} className="text-success mx-auto mb-3 opacity-60" />
                  <p className="font-semibold text-foreground">All caught up!</p>
                  <p className="text-sm text-muted-foreground mt-1">No pending registration requests at this time.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {pendingMembers
                    .filter((m) => ADMIN_ROLE === 'main' || m.gender === ADMIN_GENDER)
                    .map((member) => (
                      
  <div
    key={member.id}
    className="bg-card border border-border rounded-xl p-4"
  >
    <div className="space-y-2">

      <h3 className="font-semibold text-lg">
        {member.name}
      </h3>

      <p className="text-sm text-muted-foreground">
        📞 {member.mobile}
      </p>

      <p className="text-sm">
        Gender: {member.gender}
      </p>

      <p className="text-sm">
        Area: {member.areas?.name}
      </p>

      <p className="text-sm">
        Society: {member.society}
      </p>

      <p className="text-sm">
        House / Flat: {member.house_no}
      </p>

    </div>

    <div className="flex gap-2 mt-4">

      <button
        onClick={() => handleApprove(member.id)}
        className="flex-1 bg-green-600 text-white rounded-lg py-2"
      >
        Approve
      </button>

      <button
        onClick={() => handleReject(member.id)}
        className="flex-1 bg-red-600 text-white rounded-lg py-2"
      >
        Reject
      </button>

    </div>

  </div>

                    ))}
                </div>
              )}
            </div>
          )}

          {/* ── COMMUNITY RECORDS ── */}
          {activeSection === 'records' && (
            <div className="space-y-4 fade-in">
              {/* Filters + Add */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Search by name, society, area..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {ADMIN_ROLE === 'main' && (
                  <div className="flex rounded-xl overflow-hidden border border-border">
                    {(['All', 'Male', 'Female'] as const).map((g) => (
                      <button
                        key={`filter-${g}`}
                        onClick={() => setGenderFilter(g)}
                        className={`px-3 py-2 text-xs font-semibold transition-colors ${
                          genderFilter === g ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setShowAddRecord(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all"
                >
                  <Plus size={16} />
                  Add Record
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                Showing {filteredRecords.length} of {communityRecords.length} records
              </p>

              {/* Records Grid */}
              {filteredRecords.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-8 text-center">
                  <ClipboardList size={40} className="text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="font-semibold text-foreground">No community records found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add people who should be visited using the button above.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredRecords.map((record) => (
                    <div
                      key={`record-${record.id}`}
                      className="bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-all fade-in"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{record.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {record.mobile}
                          </p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Badge variant={record.gender === 'Male' ? 'primary' : 'accent'}>{record.gender}</Badge>
                        </div>
                      </div>

                      <div className="space-y-1 mb-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <MapPin size={11} />
                          {record.society} · {record.block} · {record.building}
                        </p>
                        <p className="text-xs text-muted-foreground">{record.area}</p>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Last Visited</p>
                          <p className="text-xs font-semibold text-foreground tabular-nums">
                            {record.lastVisitedDate
                              ? new Date(record.lastVisitedDate).toLocaleDateString('en-IN')
                              : 'Never visited'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Total Visits</p>
                          <p className="text-lg font-bold text-primary tabular-nums">{record.visitCount}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        {priorityBadge(record.priority)}
                        <div className="flex gap-1">
                          <button
                            onClick={() => setMarkVisitedRecord(record)}
                            className="p-1.5 bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors"
                            title="Mark as Visited"
                            aria-label={`Mark ${record.name} as visited`}
                          >
                            <CheckCircle size={15} />
                          </button>
                          <button
                            onClick={() => {

    setEditingPerson({

        id: record.id,

        name: record.name,

        mobile: record.mobile,

        gender: record.gender,

        society: record.society,

        building: record.building,

        areaId: record.areaId,

        notes: record.notes

    });

    setShowAddRecord(true);

}}
                            className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                            title="Edit record"
                            aria-label={`Edit ${record.name}`}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(record.id)}
                            className="p-1.5 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
                            title="Delete record"
                            aria-label={`Delete ${record.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {record.notes && (
                        <p className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1.5">
                          📝 {record.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── VISIT HISTORY ── */}
          {activeSection === 'history' && (
            <div className="space-y-3 fade-in">
              <p className="text-xs text-muted-foreground">
                Showing all {mockVisitRecords.length} recorded visits
              </p>
              {mockVisitRecords
                .filter((v) => ADMIN_ROLE === 'main' || v.gender === ADMIN_GENDER)
                .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
                .map((visit) => (
                  <div
                    key={`visit-${visit.id}`}
                    className="bg-card border border-border rounded-2xl p-4 hover:shadow-sm transition-shadow fade-in"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-foreground text-sm">{visit.communityRecordName}</p>
                          <Badge variant={visit.gender === 'Male' ? 'primary' : 'accent'}>{visit.gender}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                          <Calendar size={12} />
                          {new Date(visit.visitDate).toLocaleDateString('en-IN')} at {visit.visitTime}
                        </p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Recorded by: {visit.adminName}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {visit.groupMembers.map((m) => (
                            <span
                              key={`vm-${visit.id}-${m}`}
                              className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                        {visit.notes && (
                          <p className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1.5">
                            📝 {visit.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* ── MEMBERS ── */}
          {activeSection === 'members' && (
            <div className="space-y-3 fade-in">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">
                  {approvedMembers.filter((m) => ADMIN_ROLE === 'main' || m.gender === ADMIN_GENDER).length} approved members
                </p>
              </div>
              {approvedMembers
                .filter((m) => ADMIN_ROLE === 'main' || m.gender === ADMIN_GENDER)
                .map((member) => (
                  <div
                    key={`member-${member.id}`}
                    className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        member.gender === 'Male' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                      }`}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.mobile} · {member.society}</p>
                        <p className="text-xs text-muted-foreground">{member.area}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={member.gender === 'Male' ? 'primary' : 'accent'}>{member.gender}</Badge>
                      <Badge variant="success">Active</Badge>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* ── REPORTS ── */}
          {activeSection === 'reports' && (
            <AdminReports
              communityRecords={communityRecords}
              visitRecords={mockVisitRecords}
              adminGender={ADMIN_GENDER}
              adminRole={ADMIN_ROLE}
            />
          )}
        </main>
      </div>

      {/*
      {/* Modals 
      <AddRecordModal
        open={showAddRecord}
        onClose={() => setShowAddRecord(false)}
        onAdd={handleAddRecord}
        adminGender={ADMIN_GENDER}
        adminRole={ADMIN_ROLE}
      />*/}

      <AddPersonModal
    open={showAddRecord}
    onClose={() => {
        setShowAddRecord(false);
        setEditingPerson(null);
    }}
    onSave={savePerson}
    areas={areas}
    initialData={editingPerson}
/>

      

      {markVisitedRecord && (
        <MarkVisitedModal
          open
          record={markVisitedRecord}
          onClose={() => setMarkVisitedRecord(null)}
          onConfirm={() => handleMarkVisited(markVisitedRecord)}
        />
      )}

      {/* Delete Confirm Modal */}
      <Modal
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Community Record"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this record? This action cannot be undone and all visit history for this person will remain in the log.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => deleteConfirmId && handleDeleteRecord(deleteConfirmId)}
              className="flex-1 py-2.5 bg-destructive text-destructive-foreground rounded-xl text-sm font-semibold hover:bg-destructive/90 active:scale-95 transition-all"
            >
              Delete Record
            </button>
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="flex-1 py-2.5 bg-muted text-foreground rounded-xl text-sm font-semibold hover:bg-muted/70 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}