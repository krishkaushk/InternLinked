import { ApplicationCard } from './ApplicationCard';
import { Plus } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useState } from 'react';

// Removed: import { Application, ApplicationStatus } from '@/types';
// Removed: interface KanbanBoardProps

const columns = [
    { status: 'saved', title: 'Saved', color: 'bg-gray-50 border-gray-200' },
    { status: 'applied', title: 'Applied', color: 'bg-blue-50 border-blue-200' },
    { status: 'interview', title: 'Interview', color: 'bg-purple-50 border-purple-200' },
    { status: 'offer', title: 'Offer', color: 'bg-green-50 border-green-200' },
    { status: 'rejected', title: 'Rejected', color: 'bg-red-50 border-red-200' },
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
        <div className="flex gap-4 h-full overflow-x-auto pb-4">
            {columns.map((column) => {
                const columnApps = getApplicationsByStatus(column.status);
                return (
                    <div
                        key={column.status}
                        className={`flex-1 min-w-[300px] ${column.color} rounded-lg border-2 p-4`}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(column.status)}
                    >
                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                                <span className="text-sm text-gray-500 bg-white px-2 py-0.5 rounded-full">
                  {columnApps.length}
                </span>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onAddApplication(column.status)}
                                className="h-8 w-8 p-0"
                            >
                            </Button>
                        </div>

                        {/* Cards */}
                        <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
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
                                <div className="text-center py-8 text-gray-400 text-sm">
                                    No applications yet
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}