import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useDashboard } from "@/context/DashboardContext";
import { DataViewHeader } from "@/components/data-view/data-view-header";
import { DataTable } from "@/components/data-view/data-table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AddDateColumnsDialog } from "@/components/data-view/add-date-columns-dialog";
import { DateTableDialog } from "@/components/dashboard/date-table-dialog";
import { TableCreatorDialog } from "@/components/dashboard/table-creator-dialog";
import { ManageRelationshipsDialog } from "@/components/data-view/manage-relationships-dialog";
import { PivotDialog } from "@/components/data-view/pivot-dialog";
import { UnpivotDialog } from "@/components/data-view/unpivot-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, Pencil, Copy } from "lucide-react";
import { type Dataset } from "@/types/visualizations";
import { Input } from "@/components/ui/input";
import { MergeQueriesDialog } from "@/components/data-view/merge-queries-dialog";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { TransformFieldDialog } from "@/components/dashboard/transform-field-dialog";

export default function DataView() {
  const { 
    finalDatasets, 
    handleSaveDateColumns, 
    handleSaveDateTable, 
    datasets, 
    handleSaveNewTable,
    relationships,
    handleSaveRelationship,
    handleDeleteRelationship,
    handlePivot,
    handleUnpivot,
    lastAddedTableId,
    handleDeleteColumns,
    handleDeleteDataset,
    handleChangeColumnType,
    handleRenameDataset,
    handleMergeQueries,
    handleDeleteOtherColumns,
    handleRemoveDuplicates,
    handleDuplicateTable,
    fieldsForDialogs,
    allMeasureFields,
    handleSaveTransformedField,
  } = useDashboard();
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [isAddDateColumnsOpen, setIsAddDateColumnsOpen] = useState(false);
  const [isDateTableOpen, setIsDateTableOpen] = useState(false);
  const [isNewTableOpen, setIsNewTableOpen] = useState(false);
  const [isRelationshipsOpen, setIsRelationshipsOpen] = useState(false);
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [isPivotOpen, setIsPivotOpen] = useState(false);
  const [isUnpivotOpen, setIsUnpivotOpen] = useState(false);
  const [isNewMeasureOpen, setIsNewMeasureOpen] = useState(false);
  const [columnsForOperation, setColumnsForOperation] = useState<string[]>([]);
  const [unpivotType, setUnpivotType] = useState<'selected' | 'other'>('selected');
  const [datasetToDelete, setDatasetToDelete] = useState<Dataset | null>(null);
  const [columnsToDelete, setColumnsToDelete] = useState<string[] | null>(null);
  const [columnsToKeep, setColumnsToKeep] = useState<string[] | null>(null);
  const [editingDataset, setEditingDataset] = useState<{ id: string; name: string } | null>(null);
  const [columnForDuplicates, setColumnForDuplicates] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingDataset) {
      renameInputRef.current?.focus();
    }
  }, [editingDataset]);

  useEffect(() => {
    if (lastAddedTableId && finalDatasets.some(ds => ds.id === lastAddedTableId)) {
      setSelectedDatasetId(lastAddedTableId);
    } 
    else if ((!selectedDatasetId || !finalDatasets.some(ds => ds.id === selectedDatasetId)) && finalDatasets.length > 0) {
      setSelectedDatasetId(finalDatasets[0].id);
    }
    else if (finalDatasets.length === 0) {
      setSelectedDatasetId(null);
    }
  }, [finalDatasets, lastAddedTableId]);

  const selectedDataset = finalDatasets.find(ds => ds.id === selectedDatasetId);

  const handlePivotRequest = (columns: string[]) => { setColumnsForOperation(columns); setIsPivotOpen(true); };
  const handleUnpivotRequest = (columns: string[], type: 'selected' | 'other') => { setColumnsForOperation(columns); setUnpivotType(type); setIsUnpivotOpen(true); };
  const handleDeleteRequest = (columns: string[]) => { setColumnsToDelete(columns); };
  const handleDeleteOtherColumnsRequest = (columns: string[]) => { setColumnsToKeep(columns); };
  const handleRemoveDuplicatesRequest = (column: string) => { setColumnForDuplicates(column); };

  const confirmDeleteColumns = () => { if (selectedDatasetId && columnsToDelete) { handleDeleteColumns(selectedDatasetId, columnsToDelete); setColumnsToDelete(null); } };
  const confirmDeleteOtherColumns = () => { if (selectedDatasetId && columnsToKeep) { handleDeleteOtherColumns(selectedDatasetId, columnsToKeep); setColumnsToKeep(null); } };
  const confirmDeleteDataset = () => { if (datasetToDelete) { handleDeleteDataset(datasetToDelete.id); setDatasetToDelete(null); } };
  const confirmRemoveDuplicates = () => { if (selectedDatasetId && columnForDuplicates) { handleRemoveDuplicates(selectedDatasetId, columnForDuplicates); setColumnForDuplicates(null); } };

  const handleConfirmPivot = (rowField: string, columnField: string, valueField: string, newTableName: string) => { if (selectedDatasetId) { handlePivot(selectedDatasetId, rowField, columnField, valueField, newTableName); } };
  const handleConfirmUnpivot = (attributeCol: string, valueCol: string, newTableName: string) => {
    if (selectedDataset && selectedDatasetId) {
      const columnsToUnpivot = unpivotType === 'selected' ? columnsForOperation : selectedDataset.fields.filter(f => !columnsForOperation.includes(f));
      handleUnpivot(selectedDatasetId, columnsToUnpivot, attributeCol, valueCol, newTableName);
    }
  };

  const handleChangeTypeRequest = (column: string, newType: 'whole' | 'decimal' | 'text' | 'date') => { if (selectedDatasetId) { handleChangeColumnType(selectedDatasetId, column, newType); } };

  const handleRenameSubmit = () => {
    if (editingDataset && editingDataset.name.trim()) {
      handleRenameDataset(editingDataset.id, editingDataset.name.trim());
    }
    setEditingDataset(null);
  };

  return (
    <>
      <DashboardLayout>
        <div className="h-full flex flex-col">
          <DataViewHeader 
            onAddDateColumns={() => setIsAddDateColumnsOpen(true)}
            onAddDateTable={() => setIsDateTableOpen(true)}
            onAddNewTable={() => setIsNewTableOpen(true)}
            onManageRelationships={() => setIsRelationshipsOpen(true)}
            onMergeQueries={() => setIsMergeOpen(true)}
            onAddNewMeasure={() => setIsNewMeasureOpen(true)}
          />
          <div className="flex-1 flex overflow-hidden">
            <ResizablePanelGroup direction="horizontal" className="flex-1">
              <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                <aside className="h-full p-4">
                  <h2 className="text-lg font-semibold mb-4">Tables</h2>
                  <ScrollArea className="h-full">
                    <div className="space-y-2 pr-4">
                      {finalDatasets.map(ds => (
                        <div key={ds.id} className="flex items-center group">
                          {editingDataset?.id === ds.id ? (
                            <Input
                              ref={renameInputRef}
                              value={editingDataset.name}
                              onChange={(e) => setEditingDataset({ ...editingDataset, name: e.target.value })}
                              onBlur={handleRenameSubmit}
                              onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                              className="h-9"
                            />
                          ) : (
                            <Button
                              variant={selectedDatasetId === ds.id ? "secondary" : "ghost"}
                              className={cn("flex-1 justify-start truncate", selectedDatasetId === ds.id && "font-bold")}
                              onClick={() => setSelectedDatasetId(ds.id)}
                            >
                              {ds.name}
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 flex-shrink-0" onClick={() => handleDuplicateTable(ds.id)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 flex-shrink-0" onClick={() => setEditingDataset({ id: ds.id, name: ds.name })}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 flex-shrink-0" onClick={() => setDatasetToDelete(ds)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </aside>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={75}>
                <main className="h-full overflow-auto">
                  {selectedDataset ? (
                    <DataTable 
                      dataset={selectedDataset} 
                      onPivotRequest={handlePivotRequest}
                      onUnpivotRequest={handleUnpivotRequest}
                      onDeleteRequest={handleDeleteRequest}
                      onDeleteOtherColumnsRequest={handleDeleteOtherColumnsRequest}
                      onChangeTypeRequest={handleChangeTypeRequest}
                      onRemoveDuplicatesRequest={handleRemoveDuplicatesRequest}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>Select a table to view its data or create a new one.</p>
                    </div>
                  )}
                </main>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </DashboardLayout>
      <AddDateColumnsDialog open={isAddDateColumnsOpen} onOpenChange={setIsAddDateColumnsOpen} datasets={finalDatasets} onSave={handleSaveDateColumns} />
      <DateTableDialog open={isDateTableOpen} onOpenChange={setIsDateTableOpen} datasets={datasets} onSave={handleSaveDateTable} />
      <TableCreatorDialog open={isNewTableOpen} onOpenChange={setIsNewTableOpen} onSave={handleSaveNewTable} />
      <ManageRelationshipsDialog open={isRelationshipsOpen} onOpenChange={setIsRelationshipsOpen} datasets={datasets} relationships={relationships} onSave={handleSaveRelationship} onDelete={handleDeleteRelationship} />
      <MergeQueriesDialog open={isMergeOpen} onOpenChange={setIsMergeOpen} datasets={datasets} onConfirm={handleMergeQueries} />
      <TransformFieldDialog 
        open={isNewMeasureOpen}
        onOpenChange={setIsNewMeasureOpen}
        allFields={fieldsForDialogs}
        datasets={finalDatasets}
        onSave={handleSaveTransformedField}
        measureFields={allMeasureFields}
      />
      {selectedDataset && (
        <>
          <PivotDialog open={isPivotOpen} onOpenChange={setIsPivotOpen} columns={columnsForOperation} datasetName={selectedDataset.name} onConfirm={handleConfirmPivot} />
          <UnpivotDialog open={isUnpivotOpen} onOpenChange={setIsUnpivotOpen} columns={unpivotType === 'selected' ? columnsForOperation : selectedDataset.fields.filter(f => !columnsForOperation.includes(f))} datasetName={selectedDataset.name} onConfirm={handleConfirmUnpivot} />
        </>
      )}
      <AlertDialog open={!!datasetToDelete} onOpenChange={(open) => !open && setDatasetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the table "{datasetToDelete?.name}" and any visualizations that use it. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteDataset}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!columnsToDelete} onOpenChange={(open) => !open && setColumnsToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the selected column(s): {columnsToDelete?.join(', ')}. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteColumns}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!columnsToKeep} onOpenChange={(open) => !open && setColumnsToKeep(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete all columns except the selected one(s): {columnsToKeep?.join(', ')}. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteOtherColumns}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!columnForDuplicates} onOpenChange={(open) => !open && setColumnForDuplicates(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove Duplicates?</AlertDialogTitle><AlertDialogDescription>This will remove all rows where the value in the "{columnForDuplicates}" column has already appeared. The first occurrence of each value will be kept. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmRemoveDuplicates}>Remove</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}