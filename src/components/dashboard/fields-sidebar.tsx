import { FieldsPanel } from "./fields-panel";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, FunctionSquare, Wand2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { type Dataset, type Parameter } from "@/types/visualizations";

interface FieldsSidebarProps {
  datasets: Dataset[];
  isExpanded: boolean;
  onToggle: () => void;
  onAddCalculatedField: () => void;
  onAddTransformedField: () => void;
  calculatedFields: string[];
  onDeleteMeasure?: (measureName: string) => void;
  parameters?: Parameter[];
}

export function FieldsSidebar({ datasets, isExpanded, onToggle, onAddCalculatedField, onAddTransformedField, calculatedFields, onDeleteMeasure, parameters }: FieldsSidebarProps) {
  const assignedMeasures = new Set(
    datasets.flatMap(ds => ds.fields).filter(field => calculatedFields.includes(field))
  );
  const unassignedMeasures = calculatedFields.filter(field => !assignedMeasures.has(field));
  const parameterList = parameters ?? [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {isExpanded ? (
        <>
          <div className="p-4 pb-2 flex items-center justify-between flex-shrink-0">
            <h2 className="text-lg font-semibold tracking-tight">Data</h2>
            <div>
              <Button variant="ghost" size="icon" onClick={onAddTransformedField} className="h-8 w-8">
                <Wand2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onAddCalculatedField} className="h-8 w-8">
                <FunctionSquare className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 pt-0">
            <Accordion type="multiple" defaultValue={['columns', 'measures', 'parameters']} className="w-full">
              <AccordionItem value="columns">
                <AccordionTrigger className="py-2 text-sm">Tables</AccordionTrigger>
                <AccordionContent className="pt-2">
                  <Accordion type="multiple" className="w-full space-y-1">
                    {datasets.map(dataset => (
                      <AccordionItem key={dataset.id} value={dataset.id}>
                        <AccordionTrigger className="py-2 text-xs bg-muted/30 px-2 rounded-md hover:bg-muted/50">
                          <span className="truncate">{dataset.name}</span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pl-2">
                          <FieldsPanel 
                            fields={dataset.fields} 
                            datasetId={dataset.id} 
                            deletableFields={calculatedFields}
                            onDelete={onDeleteMeasure}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
              {unassignedMeasures.length > 0 && (
                <AccordionItem value="measures">
                  <AccordionTrigger className="py-2 text-sm">Measures (Cross-Table)</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <FieldsPanel 
                      fields={unassignedMeasures} 
                      datasetId="calculated" 
                      onDelete={onDeleteMeasure} 
                      deletableFields={unassignedMeasures}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}
              {parameterList.length > 0 && (
                <AccordionItem value="parameters">
                  <AccordionTrigger className="py-2 text-sm">Parameters</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <FieldsPanel 
                      fields={parameterList.map(p => p.name)} 
                      datasetId="parameters"
                    />
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center h-full py-4">
          <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8 mb-4 flex-shrink-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div 
            className="flex-1 flex items-center justify-center cursor-pointer w-full"
            onClick={onToggle}
          >
            <h2 
              className="text-sm font-semibold tracking-tight whitespace-nowrap"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              Data
            </h2>
          </div>
        </div>
      )}
    </div>
  );
}