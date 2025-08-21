import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import Dashboard from "./Dashboard";
import { useDashboard } from "@/context/DashboardContext";
import { CalculatedFieldDialog } from "@/components/dashboard/calculated-field-dialog";
import { TransformFieldDialog } from "@/components/dashboard/transform-field-dialog";
import { DateTableDialog } from "@/components/dashboard/date-table-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ParameterDialog } from "@/components/dashboard/parameter-dialog";

export interface DashboardInfo {
  id: string;
  name: string;
}

const Index = () => {
  const {
    datasets,
    finalDatasets,
    visualizations,
    setVisualizations,
    selectedVizId,
    setSelectedVizId,
    canvasBackground,
    setCanvasBackground,
    activeFilters,
    handleFilterChange,
    allMeasureFields,
    isLocked,
    setIsLocked,
    hiddenVizIds,
    handleToggleVisibility,
    fieldsForDialogs,
    handleSaveCalculatedField,
    calculatedFieldDefinitions,
    handleSaveTransformedField,
    transformedFieldDefinitions,
    handleSaveDateTable,
    filteredDatasets,
    handleDeleteMeasure,
    staticMeasures,
    parameters,
    parameterValues,
    handleParameterValueChange,
    handleSaveParameter,
  } = useDashboard();

  const [isCalcFieldOpen, setIsCalcFieldOpen] = useState(false);
  const [isTransformFieldOpen, setIsTransformFieldOpen] = useState(false);
  const [isDateTableOpen, setIsDateTableOpen] = useState(false);
  const [measureToDelete, setMeasureToDelete] = useState<string | null>(null);
  const [isParameterDialogOpen, setIsParameterDialogOpen] = useState(false);

  const handleDeleteMeasureRequest = (measureName: string) => {
    setMeasureToDelete(measureName);
  };

  const confirmDeleteMeasure = () => {
    if (measureToDelete) {
      handleDeleteMeasure(measureToDelete);
      setMeasureToDelete(null);
    }
  };

  return (
    <>
      <DashboardLayout>
        <Dashboard
          datasets={datasets}
          finalDatasets={finalDatasets}
          filteredDatasets={filteredDatasets}
          visualizations={visualizations}
          setVisualizations={setVisualizations}
          selectedVizId={selectedVizId}
          setSelectedVizId={setSelectedVizId}
          canvasBackground={canvasBackground}
          setCanvasBackground={setCanvasBackground}
          activeFilters={activeFilters}
          handleFilterChange={handleFilterChange}
          onAddCalculatedField={() => setIsCalcFieldOpen(true)}
          onAddTransformedField={() => setIsTransformFieldOpen(true)}
          allMeasureFields={allMeasureFields}
          isLocked={isLocked}
          setIsLocked={setIsLocked}
          hiddenVizIds={hiddenVizIds}
          onToggleVisibility={handleToggleVisibility}
          allAvailableFields={fieldsForDialogs}
          onDeleteMeasure={handleDeleteMeasureRequest}
          staticMeasures={staticMeasures}
          onAddParameter={() => setIsParameterDialogOpen(true)}
          parameters={parameters}
          parameterValues={parameterValues}
          onParameterValueChange={handleParameterValueChange}
          calculatedFieldDefinitions={calculatedFieldDefinitions}
          transformedFieldDefinitions={transformedFieldDefinitions}
        />
      </DashboardLayout>
      <CalculatedFieldDialog
        open={isCalcFieldOpen}
        onOpenChange={setIsCalcFieldOpen}
        fields={fieldsForDialogs}
        parameters={parameters}
        onSave={handleSaveCalculatedField}
      />
      <TransformFieldDialog
        open={isTransformFieldOpen}
        onOpenChange={setIsTransformFieldOpen}
        allFields={fieldsForDialogs}
        datasets={datasets}
        measureFields={allMeasureFields}
        onSave={handleSaveTransformedField}
      />
      <DateTableDialog
        open={isDateTableOpen}
        onOpenChange={setIsDateTableOpen}
        datasets={datasets}
        onSave={handleSaveDateTable}
      />
      <ParameterDialog
        open={isParameterDialogOpen}
        onOpenChange={setIsParameterDialogOpen}
        onSave={handleSaveParameter}
        existingNames={parameters.map(p => p.name)}
      />
      <AlertDialog open={!!measureToDelete} onOpenChange={(open) => !open && setMeasureToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the measure "{measureToDelete}". Any visuals using this measure will be affected. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMeasure}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Index;