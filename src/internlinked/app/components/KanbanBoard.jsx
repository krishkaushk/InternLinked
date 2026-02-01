import { ApplicationCard } from './ApplicationCard';
import { Plus } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';

const columns = [
    { status: 'saved', title: '01_SAVED' },
    { status: 'applied', title: '02_APPLIED' },
    { status: 'interview', title: '03_INTERVIEW' },
    { status: 'offer', title: '04_OFFER' },
    { status: 'rejected', title: '05_REJECTED' },
];

export function KanbanBoard({
    applications,
    onUpdateStatus,
    onAddApplication,
    onSelectApplication
}) {
    const [draggedItem, setDraggedItem] = useState(null);

    const handleDragStart = (applicationId) => {
        setDraggedItem(applicationId);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (status) => {
        if (draggedItem) {
            onUpdateStatus(draggedItem, status);
            setDraggedItem(null);
        }
    };

    const getApplicationsByStatus = (status) => {
        return (applications || []).filter((app) => app.status === status);
    };

    return (
        <div className="flex h-full overflow-x-auto">
            {columns.map((column, index) => {
                const columnApps = getApplicationsByStatus(column.status);
                return (
                    <div
                        key={column.status}
                        className={`flex-1 min-w-[280px] flex flex-col border-r border-zinc-200 last:border-r-0`}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(column.status)}
                    >
                        {/* Minimal Header */}
                        <div className="p-4 flex items-center justify-between sticky top-0 bg-zinc-50/80 backdrop-blur-sm z-10">
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-[10px] uppercase tracking-widest text-zinc-400">
                                    {column.title}
                                </h3>
                                <span className="text-[9px] font-black text-zinc-900 px-1 border-b-2 border-zinc-900">
                                    {columnApps.length}
                                </span>
                            </div>
                            <button
                                onClick={() => onAddApplication(column.status)}
                                className="text-zinc-400 hover:text-zinc-900 transition-colors"
                            >
                                <Plus className="size-4" />
                            </button>
                        </div>

                        {/* Minimal Scrollable Area */}
                        <div className="flex-1 px-3 space-y-3 overflow-y-auto pb-10">
                            {columnApps.map((app) => (
                                <ApplicationCard
                                    key={app.id}
                                    application={app}
                                    onDragStart={() => handleDragStart(app.id)}
                                    onDragEnd={() => setDraggedItem(null)}
                                    onClick={() => onSelectApplication(app)}
                                />
                            ))}
                            
                            {columnApps.length === 0 && (
                                <div className="py-10 text-center opacity-20 grayscale">
                                    <p className="text-[9px] font-black uppercase tracking-tighter">Empty_Slot</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}