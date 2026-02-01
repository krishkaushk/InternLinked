import { ApplicationCard } from './ApplicationCard';
import { Plus } from 'lucide-react';
import { useState } from 'react';

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
    onSelectApplication,
    onOpenDrawer // Added prop to handle the Asset Vault
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
            // Check if status actually changed to prevent redundant updates
            const app = applications.find(a => a.id === draggedItem);
            if (app && app.status !== status) {
                onUpdateStatus(draggedItem, status);
            }
            setDraggedItem(null);
        }
    };

    const getApplicationsByStatus = (status) => {
        return (applications || []).filter((app) => app.status === status);
    };

    return (
        <div className="flex h-full overflow-x-auto gap-0">
            {columns.map((column) => {
                const columnApps = getApplicationsByStatus(column.status);
                return (
                    <div
                        key={column.status}
                        className="flex-1 min-w-[300px] flex flex-col border-r-2 border-zinc-900 last:border-r-0 bg-transparent"
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(column.status)}
                    >
                        {/* Column Header */}
                        <div className="p-4 flex items-center justify-between sticky top-0 bg-zinc-50 z-10 border-b-2 border-zinc-900">
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-zinc-900">
                                    {column.title}
                                </h3>
                                <div className="bg-zinc-900 text-[#EBBB49] px-2 py-0.5 text-[10px] font-black italic shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    {columnApps.length}
                                </div>
                            </div>
                            <button
                                onClick={() => onAddApplication?.(column.status)}
                                className="p-1 hover:bg-[#EBBB49] border-2 border-transparent hover:border-zinc-900 transition-all"
                                title="Quick Add"
                            >
                                <Plus className="size-4 stroke-[3px]" />
                            </button>
                        </div>

                        {/* Drop Zone / Content Area */}
                        <div className={`flex-1 px-3 py-4 space-y-4 overflow-y-auto pb-20 transition-colors ${draggedItem ? 'bg-[#EBBB49]/5' : ''}`}>
                            {columnApps.map((app) => (
                                <ApplicationCard
                                    key={app.id}
                                    application={app}
                                    onDragStart={() => handleDragStart(app.id)}
                                    onDragEnd={() => setDraggedItem(null)}
                                    onClick={() => onSelectApplication(app)}
                                    onOpenDrawer={onOpenDrawer} // Passing the drawer function to the card
                                />
                            ))}
                            
                            {columnApps.length === 0 && (
                                <div className="py-20 text-center border-2 border-dashed border-zinc-200 group">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-300 group-hover:text-zinc-400 transition-colors italic">
                                        Empty_Node
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}