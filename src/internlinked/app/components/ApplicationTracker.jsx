import { useState } from 'react';
// Removed: import { Application, ApplicationStatus } from '@/types';
import { KanbanBoard } from './KanbanBoard';
import { ApplicationTable } from './ApplicationTable';
import { AddApplicationDialog } from './AddApplicationDialog';
import { ApplicationDetail } from './ApplicationDetail';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Plus, LayoutGrid, Table as TableIcon } from 'lucide-react';

export function ApplicationTracker({ applications, onUpdateApplications }) {
    const [view, setView] = useState('kanban');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [addDialogStatus, setAddDialogStatus] = useState('saved');
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const handleUpdateStatus = (applicationId, newStatus) => {
        const updatedApps = applications.map((app) =>
            app.id === applicationId ? { ...app, status: newStatus } : app
        );
        onUpdateApplications(updatedApps);
    };

    const handleAddApplication = (newApp) => {
        const application = {
            ...newApp,
            id: `app-${Date.now()}`,
        };
        onUpdateApplications([...applications, application]);
    };

    const handleDeleteApplication = (applicationId) => {
        const updatedApps = applications.filter((app) => app.id !== applicationId);
        onUpdateApplications(updatedApps);
    };

    const handleOpenAddDialog = (status = 'saved') => {
        setAddDialogStatus(status);
        setIsAddDialogOpen(true);
    };

    const handleSelectApplication = (application) => {
        setSelectedApplication(application);
        setIsDetailOpen(true);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
                    <p className="text-gray-600 mt-1">
                        Track and manage your internship applications
                    </p>
                </div>
                <Button onClick={() => handleOpenAddDialog()}>
                    <Plus className="size-4 mr-2" />
                    Add Application
                </Button>
            </div>

            {/* View Toggle */}
            <div className="mb-4">
                <Tabs value={view} onValueChange={(v) => setView(v)}>
                    <TabsList>
                        <TabsTrigger value="kanban">
                            <LayoutGrid className="size-4 mr-2" />
                            Kanban
                        </TabsTrigger>
                        <TabsTrigger value="table">
                            <TableIcon className="size-4 mr-2" />
                            Table
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {view === 'kanban' ? (
                    <KanbanBoard
                        applications={applications}
                        onUpdateStatus={handleUpdateStatus}
                        onAddApplication={handleOpenAddDialog}
                        onSelectApplication={handleSelectApplication}
                    />
                ) : (
                    <ApplicationTable
                        applications={applications}
                        onSelectApplication={handleSelectApplication}
                    />
                )}
            </div>

            {/* Dialogs */}
            <AddApplicationDialog
                open={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                onAdd={handleAddApplication}
                initialStatus={addDialogStatus}
            />

            <ApplicationDetail
                application={selectedApplication}
                open={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                onUpdateStatus={handleUpdateStatus}
                onDelete={handleDeleteApplication}
            />
        </div>
    );
}