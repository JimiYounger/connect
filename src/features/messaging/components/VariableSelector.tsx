import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronDown, 
  Variable, 
  User, 
  Building, 
  Calendar, 
  Plus, 
  X, 
  Edit, 
  Save, 
  Trash 
} from 'lucide-react';

// Standard variables that can be inserted into messages
const STANDARD_VARIABLES = [
  { name: 'firstName', label: 'First Name', category: 'user', description: 'Recipient\'s first name' },
  { name: 'lastName', label: 'Last Name', category: 'user', description: 'Recipient\'s last name' },
  { name: 'fullName', label: 'Full Name', category: 'user', description: 'Recipient\'s full name' },
  { name: 'email', label: 'Email', category: 'user', description: 'Recipient\'s email address' },
  { name: 'phone', label: 'Phone', category: 'user', description: 'Recipient\'s phone number' },
  { name: 'roleType', label: 'Role Type', category: 'organization', description: 'Recipient\'s role type' },
  { name: 'team', label: 'Team', category: 'organization', description: 'Recipient\'s team' },
  { name: 'area', label: 'Area', category: 'organization', description: 'Recipient\'s area' },
  { name: 'region', label: 'Region', category: 'organization', description: 'Recipient\'s region' },
];

// Categories for organizing variables
const VARIABLE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'user', label: 'User', icon: User },
  { id: 'organization', label: 'Organization', icon: Building },
  { id: 'custom', label: 'Custom', icon: Edit },
];

interface VariableSelectorProps {
  onSelectVariable: (variable: string) => void;
  templateVariables?: Record<string, string>;
  onTemplateVariablesChange?: (variables: Record<string, string>) => void;
  disabled?: boolean;
}

export function VariableSelector({
  onSelectVariable,
  templateVariables = {},
  onTemplateVariablesChange,
  disabled = false
}: VariableSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [newVariableName, setNewVariableName] = useState('');
  const [newVariableValue, setNewVariableValue] = useState('');
  const [editingVariable, setEditingVariable] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  
  // Filter variables based on active category
  const filteredVariables = STANDARD_VARIABLES.filter(variable => 
    activeCategory === 'all' || variable.category === activeCategory
  );
  
  // Get custom variables from templateVariables
  const customVariables = Object.entries(templateVariables || {}).map(([name, value]) => ({
    name,
    value,
    label: name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1'),
    category: 'custom',
    description: 'Custom variable'
  }));
  
  // Handle inserting a variable
  const handleInsertVariable = (variableName: string) => {
    onSelectVariable(`{{${variableName}}}`);
    setIsOpen(false);
  };
  
  // Handle adding a new custom variable
  const handleAddCustomVariable = () => {
    if (!newVariableName.trim() || !onTemplateVariablesChange) return;
    
    // Format the variable name to camelCase
    const formattedName = newVariableName
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map((word, index) => 
        index === 0 
          ? word.toLowerCase() 
          : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join('');
    
    // Update template variables
    onTemplateVariablesChange({
      ...templateVariables,
      [formattedName]: newVariableValue
    });
    
    // Reset form
    setNewVariableName('');
    setNewVariableValue('');
  };
  
  // Handle updating a custom variable
  const handleUpdateCustomVariable = () => {
    if (!editingVariable || !onTemplateVariablesChange) return;
    
    const updatedVariables = { ...templateVariables };
    updatedVariables[editingVariable] = editValue;
    
    onTemplateVariablesChange(updatedVariables);
    setEditingVariable(null);
  };
  
  // Handle deleting a custom variable
  const handleDeleteCustomVariable = (name: string) => {
    if (!onTemplateVariablesChange) return;
    
    const updatedVariables = { ...templateVariables };
    delete updatedVariables[name];
    
    onTemplateVariablesChange(updatedVariables);
    
    if (editingVariable === name) {
      setEditingVariable(null);
    }
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          disabled={disabled}
        >
          <Variable className="h-4 w-4" />
          Insert Variable
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
          <div className="flex items-center justify-between px-4 pt-4">
            <h4 className="font-medium">Insert Variable</h4>
            <TabsList className="grid grid-cols-4 h-8">
              {VARIABLE_CATEGORIES.map(category => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="text-xs px-2"
                >
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          <TabsContent value="all" className="mt-0">
            <VariableList 
              variables={[...filteredVariables, ...customVariables]} 
              onSelectVariable={handleInsertVariable}
              onEditVariable={setEditingVariable}
              onDeleteVariable={handleDeleteCustomVariable}
              editingVariable={editingVariable}
              editValue={editValue}
              setEditValue={setEditValue}
              onUpdateVariable={handleUpdateCustomVariable}
              showCategory
            />
          </TabsContent>
          
          <TabsContent value="user" className="mt-0">
            <VariableList 
              variables={filteredVariables} 
              onSelectVariable={handleInsertVariable}
            />
          </TabsContent>
          
          <TabsContent value="organization" className="mt-0">
            <VariableList 
              variables={filteredVariables} 
              onSelectVariable={handleInsertVariable}
            />
          </TabsContent>
          
          <TabsContent value="custom" className="mt-0">
            <Card className="border-0 shadow-none">
              <CardHeader className="px-4 py-2">
                <CardTitle className="text-sm">Custom Variables</CardTitle>
                <CardDescription className="text-xs">
                  Create your own variables for this message
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 py-2 space-y-4">
                {customVariables.length > 0 ? (
                  <VariableList 
                    variables={customVariables} 
                    onSelectVariable={handleInsertVariable}
                    onEditVariable={setEditingVariable}
                    onDeleteVariable={handleDeleteCustomVariable}
                    editingVariable={editingVariable}
                    editValue={editValue}
                    setEditValue={setEditValue}
                    onUpdateVariable={handleUpdateCustomVariable}
                  />
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No custom variables yet
                  </div>
                )}
                
                <Separator />
                
                <div className="space-y-2">
                  <Label htmlFor="variableName" className="text-xs">New Variable</Label>
                  <div className="flex gap-2">
                    <Input
                      id="variableName"
                      placeholder="Variable name"
                      value={newVariableName}
                      onChange={(e) => setNewVariableName(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 px-2"
                      onClick={handleAddCustomVariable}
                      disabled={!newVariableName.trim() || !newVariableValue.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Variable value"
                    value={newVariableValue}
                    onChange={(e) => setNewVariableValue(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

// Helper component for rendering variable lists
interface VariableListProps {
  variables: Array<{
    name: string;
    label: string;
    category?: string;
    description?: string;
    value?: string;
  }>;
  onSelectVariable: (name: string) => void;
  onEditVariable?: (name: string | null) => void;
  onDeleteVariable?: (name: string) => void;
  editingVariable?: string | null;
  editValue?: string;
  setEditValue?: (value: string) => void;
  onUpdateVariable?: () => void;
  showCategory?: boolean;
}

function VariableList({
  variables,
  onSelectVariable,
  onEditVariable,
  onDeleteVariable,
  editingVariable,
  editValue,
  setEditValue,
  onUpdateVariable,
  showCategory = false
}: VariableListProps) {
  if (variables.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        No variables available
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-[300px]">
      <div className="p-4 space-y-2">
        {variables.map((variable) => (
          <div 
            key={variable.name}
            className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium text-left hover:bg-transparent hover:underline"
                  onClick={() => onSelectVariable(variable.name)}
                >
                  {variable.label}
                </Button>
                
                {showCategory && variable.category && (
                  <Badge variant="outline" className="text-xs">
                    {variable.category}
                  </Badge>
                )}
              </div>
              
              {variable.description && (
                <p className="text-xs text-muted-foreground truncate">
                  {variable.description}
                </p>
              )}
              
              {variable.category === 'custom' && variable.name === editingVariable && setEditValue && onUpdateVariable ? (
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="h-7 text-xs"
                    autoFocus
                  />
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7"
                    onClick={onUpdateVariable}
                  >
                    <Save className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7"
                    onClick={() => onEditVariable && onEditVariable(null)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                variable.category === 'custom' && variable.value && (
                  <p className="text-xs truncate">
                    Value: <span className="font-mono">{variable.value}</span>
                  </p>
                )
              )}
            </div>
            
            {variable.category === 'custom' && onEditVariable && onDeleteVariable && (
              <div className="flex items-center gap-1 ml-2">
                {variable.name !== editingVariable && (
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7"
                    onClick={() => {
                      onEditVariable(variable.name);
                      setEditValue && setEditValue(variable.value || '');
                    }}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDeleteVariable(variable.name)}
                >
                  <Trash className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
} 