import React from 'react';
import { Cloud, FolderSync, Upload } from 'lucide-react';
import { MeetingRecord } from '../../types';

export const SOURCE_LABELS: Record<NonNullable<MeetingRecord['source']>, string> = {
  upload: 'Manual upload',
  crm: 'Salesforce CRM',
  drive: 'Google Drive'
};

const STYLES = {
  upload: { cls: 'bg-slate-100 text-slate-700 border-slate-200', Icon: Upload },
  crm: { cls: 'bg-sky-50 text-sky-700 border-sky-200', Icon: Cloud },
  drive: { cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: FolderSync }
} as const;

export const SourceBadge: React.FC<{ source?: MeetingRecord['source'] }> = ({ source = 'upload' }) => {
  const { cls, Icon } = STYLES[source];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium whitespace-nowrap ${cls}`}>
      <Icon className="w-3 h-3" />
      {SOURCE_LABELS[source]}
    </span>
  );
};
