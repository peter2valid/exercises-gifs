'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, ChevronRight, Trash2, PlusCircle, X, Loader2, Dumbbell, Check, Share2, Copy, Send } from 'lucide-react';

interface TemplateExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  ord: number;
}

interface Program {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  template_exercises: { id: string; exercise_id: string; exercise_name: string }[];
}

interface Exercise {
  id: string;
  name: string;
  body_part: string;
}

interface ProgramAssignment {
  template_id: string;
  assigned_to: string;
  assigned_by: string | null;
}

interface UserDirectoryEntry {
  id: string;
  email: string | null;
  name: string | null;
}

interface Props {
  gymId: string;
  initialPrograms: Program[];
  assignments: ProgramAssignment[];
  userDirectory: UserDirectoryEntry[];
  exercises: Exercise[];
}

function ThumbnailStrip({ exercises, tall = false }: { exercises: { exercise_id: string; exercise_name: string }[]; tall?: boolean }) {
  const preview = exercises.slice(0, 3);

  if (preview.length === 0) {
    return (
      <div className={`flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] ${tall ? 'h-32' : 'h-24'}`}>
        <Dumbbell size={18} className="text-white/15" />
      </div>
    );
  }

  return (
    <div className={`grid gap-2 ${preview.length === 1 ? 'grid-cols-1' : preview.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
      {preview.map((exercise, index) => (
        <div key={exercise.exercise_id} className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] ${tall ? 'h-28' : 'h-20'}`}>
          <Image
            src={`/exercise-posters/${exercise.exercise_id}.jpg`}
            alt={exercise.exercise_name}
            fill
            className="object-cover"
            unoptimized
            priority={index === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        </div>
      ))}
    </div>
  );
}

export function ProgramsClient({ gymId, initialPrograms, assignments, userDirectory, exercises }: Props) {
  const [programs, setPrograms] = useState(initialPrograms);
  const [selected, setSelected] = useState<Program | null>(null);
  const [programExercises, setProgramExercises] = useState<TemplateExercise[]>([]);
  const [loadingProg, setLoadingProg] = useState(false);

  // Create program
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Add exercise
  const [showExPicker, setShowExPicker] = useState(false);
  const [exSearch, setExSearch] = useState('');
  const [addingSets, setAddingSets] = useState(3);
  const [addingReps, setAddingReps] = useState(10);
  const [addingRest, setAddingRest] = useState(90);
  const [addingEx, setAddingEx] = useState<Exercise | null>(null);
  const [addingExercise, setAddingExercise] = useState(false);

  const [copied, setCopied] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);

  // Assign
  const [showAssign, setShowAssign] = useState(false);
  const [assignEmail, setAssignEmail] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const userMap = Object.fromEntries(userDirectory.map((user) => [user.id, user]));
  const assignmentsByTemplate = assignments.reduce<Record<string, ProgramAssignment[]>>((acc, assignment) => {
    acc[assignment.template_id] = acc[assignment.template_id] ?? [];
    acc[assignment.template_id].push(assignment);
    return acc;
  }, {});

  const openProgram = async (prog: Program) => {
    setSelected(prog);
    setLoadingProg(true);
    try {
      const res = await fetch(`/api/admin/programs/${prog.id}`);
      const data = await res.json();
      const exs = (data.program?.template_exercises ?? []) as TemplateExercise[];
      setProgramExercises(exs.sort((a, b) => a.ord - b.ord));
    } finally {
      setLoadingProg(false);
    }
  };

  const createProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/admin/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gymId, name: newName.trim(), description: newDesc.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPrograms(prev => [{ ...data.program, template_exercises: [] }, ...prev]);
      setNewName(''); setNewDesc(''); setShowCreate(false);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Error');
    } finally {
      setCreating(false);
    }
  };

  const deleteProgram = (prog: Program) => setDeleteTarget(prog);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/admin/programs/${deleteTarget.id}`, { method: 'DELETE' });
    setPrograms(prev => prev.filter(p => p.id !== deleteTarget.id));
    if (selected?.id === deleteTarget.id) setSelected(null);
    setDeleteTarget(null);
  };

  const addExercise = async () => {
    if (!addingEx || !selected || addingExercise) return;
    setAddingExercise(true);
    try {
      const res = await fetch(`/api/admin/programs/${selected.id}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId: addingEx.id,
          exerciseName: addingEx.name,
          sets: addingSets,
          reps: addingReps,
          restSeconds: addingRest,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setProgramExercises(prev => [...prev, data.exercise]);
        setAddingEx(null);
        setShowExPicker(false);
      }
    } finally {
      setAddingExercise(false);
    }
  };

  const removeExercise = async (ex: TemplateExercise) => {
    await fetch(`/api/admin/programs/${selected!.id}/exercises`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exerciseRowId: ex.id }),
    });
    setProgramExercises(prev => prev.filter(e => e.id !== ex.id));
  };

  const filteredEx = exercises.filter(e =>
    e.name.toLowerCase().includes(exSearch.toLowerCase()) ||
    e.body_part.toLowerCase().includes(exSearch.toLowerCase())
  );

  const shareUrl = selected ? (typeof window !== 'undefined' ? `${window.location.origin}/p/${selected.id}` : '') : '';

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareWhatsApp = () => {
    if (!selected) return;
    const assignees = (assignmentsByTemplate[selected.id] ?? []).map((assignment) => userMap[assignment.assigned_to]?.email ?? 'a member');
    const accessLine = assignees.length ? `Shared with ${assignees.join(', ')}` : 'Not assigned to any member yet';
    const text = encodeURIComponent(`Workout program: ${selected.name}\n${accessLine}\n\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const selectedAssignments = selected ? (assignmentsByTemplate[selected.id] ?? []) : [];
  const selectedAssignees = selectedAssignments
    .map((assignment) => userMap[assignment.assigned_to])
    .filter((user): user is UserDirectoryEntry => Boolean(user));
  const selectedPreviewExercises = selected?.template_exercises ?? [];

  // ─── List view ────────────────────────────────────────────────────────────
  if (!selected) {
    return (
      <>
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div
            className="relative w-full max-w-sm bg-[#111] border border-[#262626] rounded-2xl shadow-2xl p-6 space-y-4"
            style={{ maxHeight: 'calc(100vh - (var(--bottom-nav-height,76px) + env(safe-area-inset-bottom) + 48px))', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <p className="text-sm font-semibold text-[#e8e8e8]">Delete &ldquo;{deleteTarget.name}&rdquo;?</p>
            <p className="text-[13px] text-[#555]">This action cannot be undone. All exercises in this program will also be removed.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 h-9 rounded-lg border border-[#262626] text-sm text-[#909090] hover:text-[#e8e8e8] transition-colors">
                Cancel
              </button>
              <button onClick={confirmDelete} className="flex-1 h-9 rounded-lg bg-[#ef4444]/20 border border-[#ef4444]/30 text-[#ef4444] text-sm font-bold hover:bg-[#ef4444]/30 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-[#e8e8e8]">Programs</h2>
            <p className="text-[13px] text-[#555] mt-0.5">Workout templates you can assign to members</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#3b82f6] text-white text-sm font-medium"
          >
            <Plus size={15} /> New program
          </button>
        </div>

        {showCreate && (
          <div className="a-card">
            <form onSubmit={createProgram} className="space-y-3">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Program name (e.g. Push Day A)"
                required
                autoFocus
                className="w-full h-9 rounded-lg border border-[#262626] bg-[#141414] px-3 text-sm text-[#e8e8e8] outline-none focus:border-[#3b82f6]"
              />
              <input
                type="text"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full h-9 rounded-lg border border-[#262626] bg-[#141414] px-3 text-sm text-[#e8e8e8] outline-none focus:border-[#3b82f6]"
              />
              {createError && <p className="text-[13px] text-[#ef4444]">{createError}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={creating} className="h-9 px-4 rounded-lg bg-[#3b82f6] text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1.5">
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {creating ? 'Creating…' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="h-9 px-3 rounded-lg border border-[#262626] text-sm text-[#909090]">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {programs.length === 0 && !showCreate ? (
          <div className="a-card text-center py-12">
            <Dumbbell size={28} className="text-[#333] mx-auto mb-3" />
            <p className="text-sm text-[#555]">No programs yet</p>
            <p className="text-xs text-[#444] mt-1">Create your first workout template above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {programs.map(prog => (
              <div
                key={prog.id}
                className="a-card grid gap-3 cursor-pointer hover:border-[#3b82f6]/40 transition-colors group"
                onClick={() => openProgram(prog)}
              >
                <ThumbnailStrip exercises={prog.template_exercises} />
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#e8e8e8] truncate">{prog.name}</p>
                    <p className="text-[12px] text-[#555] mt-0.5">
                      {prog.template_exercises.length} exercise{prog.template_exercises.length !== 1 ? 's' : ''} ·{' '}
                      {new Date(prog.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-[11px] text-[#444] mt-1 truncate">
                      {selected ? '' : 'Tap to open, share, and assign'}
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                    Share
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/35">
                    <span>{(assignmentsByTemplate[prog.id] ?? []).length} shared</span>
                    <span>•</span>
                    <span>{prog.created_by ? (userMap[prog.created_by]?.email ?? 'Creator hidden') : 'Creator unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ChevronRight size={16} className="text-[#333] group-hover:text-[#555] transition-colors" />
                    <button
                      onClick={e => { e.stopPropagation(); deleteProgram(prog); }}
                      className="text-[#333] hover:text-[#ef4444] transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </>
    );
  }

  // ─── Editor view ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setSelected(null); setProgramExercises([]); }}
          className="h-8 px-3 rounded-lg border border-[#262626] text-[13px] text-[#909090] hover:text-[#e8e8e8] transition-colors"
        >
          ← Programs
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-[18px] font-bold text-[#e8e8e8] truncate">{selected.name}</h2>
          {selected.description && <p className="text-[13px] text-[#555]">{selected.description}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyLink}
            className={`p-2 rounded-lg border transition-colors ${copied ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-[#262626] text-[#909090] hover:text-white'}`}
            title={copied ? 'Copied!' : 'Copy link'}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <button
            onClick={shareWhatsApp}
            className="p-2 rounded-lg bg-[#25d366]/10 border border-[#25d366]/20 text-[#25d366] hover:bg-[#25d366]/20 transition-colors"
            title="Share via WhatsApp"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      <div className="a-card grid gap-4">
        <ThumbnailStrip exercises={selectedPreviewExercises} tall />
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">Exercises</p>
            <p className="mt-1 text-lg font-bold text-white">{selectedPreviewExercises.length}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">Shared</p>
            <p className="mt-1 text-lg font-bold text-white">{selectedAssignees.length}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">Visibility</p>
            <p className="mt-1 text-xs font-semibold text-emerald-400">Link + members</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(selectedAssignees.length > 0 ? selectedAssignees : [{ id: 'none', email: 'No members yet', name: null }]).map((user) => (
            <span key={user.id} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/65">
              {user.email ?? user.name ?? 'No members yet'}
            </span>
          ))}
        </div>
      </div>

      {/* Exercise list */}
      {loadingProg ? (
        <div className="a-card flex items-center justify-center py-10">
          <Loader2 size={20} className="animate-spin text-[#555]" />
        </div>
      ) : (
        <div className="space-y-2">
          {programExercises.length === 0 && (
            <div className="a-card text-center py-8">
              <p className="text-sm text-[#555]">No exercises added yet</p>
            </div>
          )}
          {programExercises.map((ex, i) => (
            <div key={ex.id} className="a-card flex items-center gap-3">
              <span className="text-[12px] text-[#555] w-5 text-right shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#e8e8e8] font-medium truncate">{ex.exercise_name}</p>
                <p className="text-[12px] text-[#555]">
                  {ex.sets} sets · {ex.reps} reps · {ex.rest_seconds}s rest
                </p>
              </div>
              <button
                onClick={() => removeExercise(ex)}
                className="shrink-0 text-[#333] hover:text-[#ef4444] transition-colors p-1"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add exercise button */}
      {!showExPicker && (
        <button
          onClick={() => setShowExPicker(true)}
          className="flex items-center gap-2 text-sm text-[#3b82f6] hover:text-[#60a5fa] transition-colors font-medium"
        >
          <PlusCircle size={16} /> Add exercise
        </button>
      )}

      {/* Exercise picker */}
      {showExPicker && (
        <div className="a-card space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#e8e8e8]">Add exercise</p>
            <button onClick={() => { setShowExPicker(false); setAddingEx(null); setExSearch(''); }} className="text-[#555] hover:text-[#e8e8e8]">
              <X size={15} />
            </button>
          </div>
          <input
            type="text"
            value={exSearch}
            onChange={e => setExSearch(e.target.value)}
            placeholder="Search exercises…"
            autoFocus
            className="w-full h-9 rounded-lg border border-[#262626] bg-[#141414] px-3 text-sm text-[#e8e8e8] outline-none focus:border-[#3b82f6]"
          />
          <div className="max-h-64 overflow-y-auto space-y-1 -mx-1 px-1">
            {filteredEx.slice(0, 40).map(ex => (
              <button
                key={ex.id}
                onClick={() => setAddingEx(ex)}
                className={`w-full text-left px-2 py-2 rounded-xl text-sm transition-all flex items-center gap-3 ${
                  addingEx?.id === ex.id
                    ? 'bg-[#3b82f6]/20 text-[#60a5fa] border border-[#3b82f6]/40'
                    : 'text-[#909090] hover:text-[#e8e8e8] hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#1a1a1a] shrink-0 border border-white/5">
                  <Image 
                    src={`/exercise-posters/${ex.id}.jpg`} 
                    alt="" 
                    fill 
                    className="object-cover"
                    unoptimized 
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-bold truncate leading-tight">{ex.name}</p>
                  <p className="text-[11px] text-[#555] mt-0.5 uppercase tracking-wider">{ex.body_part}</p>
                </div>
              </button>
            ))}
          </div>

          {addingEx && (
            <div className="border-t border-[#262626] pt-3 space-y-3">
              <p className="text-[12px] text-[#909090] font-medium">{addingEx.name}</p>
              <div className="flex gap-3">
                <label className="flex flex-col gap-1 flex-1">
                  <span className="text-[10px] uppercase tracking-widest text-[#555]">Sets</span>
                  <input type="number" min={1} max={20} value={addingSets} onChange={e => setAddingSets(+e.target.value)}
                    className="h-9 rounded-lg border border-[#262626] bg-[#141414] px-3 text-sm text-[#e8e8e8] outline-none focus:border-[#3b82f6] w-full" />
                </label>
                <label className="flex flex-col gap-1 flex-1">
                  <span className="text-[10px] uppercase tracking-widest text-[#555]">Reps</span>
                  <input type="number" min={1} max={100} value={addingReps} onChange={e => setAddingReps(+e.target.value)}
                    className="h-9 rounded-lg border border-[#262626] bg-[#141414] px-3 text-sm text-[#e8e8e8] outline-none focus:border-[#3b82f6] w-full" />
                </label>
                <label className="flex flex-col gap-1 flex-1">
                  <span className="text-[10px] uppercase tracking-widest text-[#555]">Rest (s)</span>
                  <input type="number" min={0} max={600} step={15} value={addingRest} onChange={e => setAddingRest(+e.target.value)}
                    className="h-9 rounded-lg border border-[#262626] bg-[#141414] px-3 text-sm text-[#e8e8e8] outline-none focus:border-[#3b82f6] w-full" />
                </label>
              </div>
              <button
                onClick={addExercise}
                disabled={addingExercise}
                className="h-9 px-4 rounded-lg bg-[#3b82f6] text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"
              >
                {addingExercise ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Add to program
              </button>
            </div>
          )}
        </div>
      )}

      {/* Assign to member */}
      <div className="border-t border-[#1c1c1c] pt-4">
        <button
          onClick={() => setShowAssign(!showAssign)}
          className="text-sm text-[#555] hover:text-[#909090] transition-colors"
        >
          {showAssign ? '▲ Hide' : '▼ Assign to a member'}
        </button>
        {showAssign && (
          <AssignPanel
            templateId={selected.id}
            gymId={gymId}
            assignEmail={assignEmail}
            setAssignEmail={setAssignEmail}
            assigning={assigning}
            setAssigning={setAssigning}
            result={assignResult}
            setResult={setAssignResult}
          />
        )}
      </div>
    </div>
  );
}

function AssignPanel({
  templateId, gymId, assignEmail, setAssignEmail,
  assigning, setAssigning, result, setResult,
}: {
  templateId: string; gymId: string;
  assignEmail: string; setAssignEmail: (v: string) => void;
  assigning: boolean; setAssigning: (v: boolean) => void;
  result: { ok: boolean; msg: string } | null;
  setResult: (v: { ok: boolean; msg: string } | null) => void;
}) {
  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (assigning) return;
    setAssigning(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/programs/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, gymId, email: assignEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, msg: `Assigned to ${assignEmail}` });
        setAssignEmail('');
      } else {
        setResult({ ok: false, msg: data.error ?? 'Assignment failed' });
      }
    } catch {
      setResult({ ok: false, msg: 'Network error' });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <form onSubmit={handleAssign} className="mt-3 flex gap-2 flex-wrap">
      <input
        type="email"
        value={assignEmail}
        onChange={e => setAssignEmail(e.target.value)}
        placeholder="member@email.com"
        required
        className="flex-1 min-w-[180px] h-9 rounded-lg border border-[#262626] bg-[#141414] px-3 text-sm text-[#e8e8e8] outline-none focus:border-[#3b82f6]"
      />
      <button type="submit" disabled={assigning} className="h-9 px-4 rounded-lg bg-[#262626] text-sm text-[#e8e8e8] font-medium disabled:opacity-50">
        {assigning ? 'Assigning…' : 'Assign'}
      </button>
      {result && (
        <p className={`w-full text-[13px] ${result.ok ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>{result.msg}</p>
      )}
    </form>
  );
}
