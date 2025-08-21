import { Button } from "@/components/ui/button";
import { CalendarPlus, Table, PlusSquare, Link, Combine, Sigma } from "lucide-react";

interface DataViewHeaderProps {
  onAddDateColumns: () => void;
  onAddDateTable: () => void;
  onAddNewTable: () => void;
  onManageRelationships: () => void;
  onMergeQueries: () => void;
  onAddNewMeasure: () => void;
}

export function DataViewHeader({ onAddDateColumns, onAddDateTable, onAddNewTable, onManageRelationships, onMergeQueries, onAddNewMeasure }: DataViewHeaderProps) {
  return (
    <header className="h-16 border-b border-border flex-shrink-0 px-6 flex items-center justify-between">
      <h1 className="text-xl font-bold">Data Model</h1>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={onAddNewMeasure}>
          <Sigma className="w-4 h-4 mr-2" />
          New Measure
        </Button>
        <Button variant="outline" size="sm" onClick={onMergeQueries}>
          <Combine className="w-4 h-4 mr-2" />
          Merge Queries
        </Button>
        <Button variant="outline" size="sm" onClick={onManageRelationships}>
          <Link className="w-4 h-4 mr-2" />
          Manage Relationships
        </Button>
        <Button variant="outline" size="sm" onClick={onAddNewTable}>
          <PlusSquare className="w-4 h-4 mr-2" />
          New Table
        </Button>
        <Button variant="outline" size="sm" onClick={onAddDateTable}>
          <Table className="w-4 h-4 mr-2" />
          New Date Table
        </Button>
        <Button variant="outline" size="sm" onClick={onAddDateColumns}>
          <CalendarPlus className="w-4 h-4 mr-2" />
          Add Date Columns
        </Button>
      </div>
    </header>
  );
}