'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../../../components/ui/Modal';
import { type CommunityRecord, type Gender } from '../../../lib/mockData';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (record: CommunityRecord) => void;
  adminGender: Gender;
  adminRole: 'main' | 'male' | 'female';
  existingRecord?: CommunityRecord;
}

type FormData = Omit<CommunityRecord, 'id' | 'visitCount' | 'lastVisitedDate'>;

export default function AddRecordModal({ open, onClose, onAdd, adminGender, adminRole, existingRecord }: Props) {
  const isEdit = !!existingRecord;
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm<FormData>({
    defaultValues: existingRecord
      ? {
          name: existingRecord.name,
          mobile: existingRecord.mobile,
          gender: existingRecord.gender,
          area: existingRecord.area,
          society: existingRecord.society,
          block: existingRecord.block,
          house_no: existingRecord.house_no,
          lat: existingRecord.lat,
          lng: existingRecord.lng,
          priority: existingRecord.priority,
          notes: existingRecord.notes,
        }
      : {
          gender: adminRole === 'main' ? 'Male' : adminGender,
          priority: 'medium',
          lat: 19.13,
          lng: 72.85,
        },
  });

  const onSubmit = handleSubmit(async (data) => {
    await new Promise((r) => setTimeout(r, 500));
    const record: CommunityRecord = {
      id: existingRecord?.id ?? `rec-${Date.now()}`,
      visitCount: existingRecord?.visitCount ?? 0,
      lastVisitedDate: existingRecord?.lastVisitedDate ?? null,
      ...data,
    };
    onAdd(record);
    reset();
  });

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); reset(); }}
      title={isEdit ? 'Edit Community Record' : 'Add Community Record'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={onSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-foreground mb-1 uppercase tracking-wide">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Abdul Karim Memon"
              {...register('name', { required: 'Name is required' })}
              className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.name && <p className="mt-0.5 text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1 uppercase tracking-wide">Mobile</label>
            <input
              type="tel"
              placeholder="10-digit number"
              {...register('mobile', { required: 'Mobile required', pattern: { value: /^[6-9]\d{9}$/, message: 'Invalid number' } })}
              className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.mobile && <p className="mt-0.5 text-xs text-destructive">{errors.mobile.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1 uppercase tracking-wide">Gender</label>
            <select
              {...register('gender', { required: true })}
              disabled={adminRole !== 'main'}
              className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            >
              {adminRole === 'main' && <option value="Male">Male</option>}
              {adminRole === 'main' && <option value="Female">Female</option>}
              {adminRole !== 'main' && <option value={adminGender}>{adminGender}</option>}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-semibold text-foreground mb-1 uppercase tracking-wide">Area</label>
            <input
              type="text"
              placeholder="e.g. Area A - Jogeshwari"
              {...register('area', { required: 'Area is required' })}
              className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.area && <p className="mt-0.5 text-xs text-destructive">{errors.area.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1 uppercase tracking-wide">Society</label>
            <input
              type="text"
              placeholder="Society name"
              {...register('society', { required: 'Society required' })}
              className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.society && <p className="mt-0.5 text-xs text-destructive">{errors.society.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1 uppercase tracking-wide">Block</label>
            <input
              type="text"
              placeholder="e.g. Block 3"
              {...register('block', { required: 'Block required' })}
              className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.block && <p className="mt-0.5 text-xs text-destructive">{errors.block.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1 uppercase tracking-wide">House Number</label>
            <input
              type="text"
              placeholder="House Number"
              {...register('house_no', { required: 'House Number required' })}
              className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.house_no && <p className="mt-0.5 text-xs text-destructive">{errors.house_no.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1 uppercase tracking-wide">Priority</label>
            <select
              {...register('priority')}
              className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1 uppercase tracking-wide">Latitude</label>
            <input
              type="number"
              step="0.0001"
              placeholder="19.1307"
              {...register('lat', { required: 'Required', valueAsNumber: true })}
              className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1 uppercase tracking-wide">Longitude</label>
            <input
              type="number"
              step="0.0001"
              placeholder="72.8497"
              {...register('lng', { required: 'Required', valueAsNumber: true })}
              className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-semibold text-foreground mb-1 uppercase tracking-wide">Notes</label>
            <textarea
              rows={2}
              placeholder="Any special notes about this person..."
              {...register('notes')}
              className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <><span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Saving...</>
            ) : (
              isEdit ? 'Save Changes' : 'Add Record'
            )}
          </button>
          <button
            type="button"
            onClick={() => { onClose(); reset(); }}
            className="px-4 py-2.5 bg-muted text-foreground rounded-xl text-sm font-semibold hover:bg-muted/70 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}