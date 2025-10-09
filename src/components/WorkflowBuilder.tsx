'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ArrowRight, Settings2, Users, GitBranch, FileEdit, CheckCircle, Eye, Send, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  requiredRole: string;
  requiredWorkflowRole?: string;
  assignedUsers: string[];
  allowedTransitions: string[];
  requiresComment: boolean;
  position: { x: number; y: number };
}

interface WorkflowBuilderProps {
  steps: WorkflowStep[];
  users: any[];
  onStepsChange: (steps: WorkflowStep[]) => void;
}

// Icon mapping for different step types
const getStepIcon = (stepName: string) => {
  const name = stepName.toLowerCase();
  if (name.includes('draft')) return FileEdit;
  if (name.includes('review')) return Eye;
  if (name.includes('approv')) return CheckCircle;
  if (name.includes('publish')) return Send;
  return GitBranch;
};

export default function WorkflowBuilder({ steps, users, onStepsChange }: WorkflowBuilderProps) {
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const availableRoles = ['viewer', 'editor', 'org_admin', 'super_admin'];
  const availableWorkflowRoles = ['reviewer', 'approver'];

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      name: 'New Step',
      description: '',
      requiredRole: 'editor',
      requiredWorkflowRole: undefined,
      assignedUsers: [],
      allowedTransitions: [],
      requiresComment: false,
      position: { x: steps.length * 320 + 50, y: 100 }
    };
    onStepsChange([...steps, newStep]);
    setSelectedStep(newStep.id);
  };

  const removeStep = (stepId: string) => {
    if (steps.length <= 1) {
      alert('Workflow must have at least one step');
      return;
    }
    const newSteps = steps.filter(s => s.id !== stepId);
    // Remove from transitions
    newSteps.forEach(step => {
      step.allowedTransitions = step.allowedTransitions.filter(t => t !== stepId);
    });
    onStepsChange(newSteps);
    if (selectedStep === stepId) {
      setSelectedStep(null);
    }
  };

  const updateStep = (stepId: string, field: keyof WorkflowStep, value: any) => {
    const newSteps = steps.map(step =>
      step.id === stepId ? { ...step, [field]: value } : step
    );
    onStepsChange(newSteps);
  };

  const toggleTransition = (fromId: string, toId: string) => {
    const newSteps = steps.map(step => {
      if (step.id === fromId) {
        const transitions = step.allowedTransitions.includes(toId)
          ? step.allowedTransitions.filter(t => t !== toId)
          : [...step.allowedTransitions, toId];
        return { ...step, allowedTransitions: transitions };
      }
      return step;
    });
    onStepsChange(newSteps);
  };

  const toggleUserAssignment = (stepId: string, userId: string) => {
    const newSteps = steps.map(step => {
      if (step.id === stepId) {
        const assigned = step.assignedUsers.includes(userId)
          ? step.assignedUsers.filter(u => u !== userId)
          : [...step.assignedUsers, userId];
        return { ...step, assignedUsers: assigned };
      }
      return step;
    });
    onStepsChange(newSteps);
  };

  const selectedStepData = steps.find(s => s.id === selectedStep);
  const editingStepData = steps.find(s => s.id === editingStep);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDoubleClick = (stepId: string) => {
    setEditingStep(stepId);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingStep(null);
  };

  // Draw connections between steps
  const renderConnections = () => {
    const connections: JSX.Element[] = [];

    steps.forEach((step) => {
      step.allowedTransitions.forEach((transitionId) => {
        const targetStep = steps.find(s => s.id === transitionId);
        if (targetStep) {
          // Calculate connection line positions
          const startX = step.position.x + 128; // center of 256px wide card
          const startY = step.position.y + 60; // approximate middle
          const endX = targetStep.position.x + 128;
          const endY = targetStep.position.y + 60;

          // Simple straight line
          connections.push(
            <svg
              key={`${step.id}-${transitionId}`}
              className="absolute pointer-events-none"
              style={{
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                zIndex: 0
              }}
            >
              <defs>
                <marker
                  id={`arrowhead-${step.id}-${transitionId}`}
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#94a3b8" />
                </marker>
              </defs>
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke="#94a3b8"
                strokeWidth="2"
                markerEnd={`url(#arrowhead-${step.id}-${transitionId})`}
              />
            </svg>
          );
        }
      });
    });

    return connections;
  };

  return (
    <div className="space-y-6">
      {/* Canvas - Full Width */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 overflow-x-auto overflow-y-hidden" ref={canvasRef}>
        <div className="relative flex items-center gap-8 pb-6" style={{ minHeight: '280px', minWidth: 'max-content' }}>
          {/* Connection lines */}
          {renderConnections()}

          {/* Steps in horizontal layout */}
          {steps.map((step, index) => {
            const StepIcon = getStepIcon(step.name);
            return (
              <div key={step.id} className="flex items-center gap-4">
                <div className="relative">
                  <div
                    className={`flex flex-col items-center cursor-pointer transition-all group ${
                      selectedStep === step.id ? 'scale-105' : ''
                    }`}
                    onClick={() => setSelectedStep(step.id)}
                    onDoubleClick={() => handleDoubleClick(step.id)}
                  >
                    {/* Icon Node */}
                    <div
                      className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all shadow-md ${
                        selectedStep === step.id
                          ? 'bg-blue-600 ring-4 ring-blue-200'
                          : 'bg-white border-2 border-gray-300 hover:border-blue-400 hover:shadow-lg'
                      }`}
                    >
                      <StepIcon
                        className={`w-9 h-9 ${
                          selectedStep === step.id ? 'text-white' : 'text-blue-600'
                        }`}
                      />
                    </div>

                    {/* Step Label */}
                    <div className="mt-3 text-center max-w-[140px]">
                      <p className={`text-sm font-semibold truncate ${
                        selectedStep === step.id ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {step.name || 'New Step'}
                      </p>
                      {step.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{step.description}</p>
                      )}

                      {/* Mini badges */}
                      <div className="flex items-center justify-center gap-1 mt-2">
                        {step.requiredWorkflowRole && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" title={step.requiredWorkflowRole}></div>
                        )}
                        {step.assignedUsers.length > 0 && (
                          <div className="flex items-center gap-0.5">
                            <Users className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-green-600">{step.assignedUsers.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delete button on hover */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStep(step.id);
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Arrow between steps */}
                {index < steps.length - 1 && (
                  <ArrowRight className="w-6 h-6 text-gray-400 flex-shrink-0 -mt-8" />
                )}
              </div>
            );
          })}

          {/* Add Step Button */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <button
              onClick={addStep}
              className="w-20 h-20 rounded-2xl border-2 border-dashed border-blue-400 bg-blue-50 hover:bg-blue-100 hover:border-blue-500 flex items-center justify-center transition-all group shadow-sm"
            >
              <Plus className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform" />
            </button>
            <p className="text-sm text-blue-600 font-medium mt-3">Add Step</p>
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      {selectedStepData ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Settings2 className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-gray-900">Step Properties</h3>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="step-name" className="text-sm font-medium text-gray-700">Step Name *</Label>
                <Input
                  id="step-name"
                  value={selectedStepData.name}
                  onChange={(e) => updateStep(selectedStep!, 'name', e.target.value)}
                  placeholder="e.g., Review, Approval"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="step-desc" className="text-sm font-medium text-gray-700">Description</Label>
                <Input
                  id="step-desc"
                  value={selectedStepData.description}
                  onChange={(e) => updateStep(selectedStep!, 'description', e.target.value)}
                  placeholder="Describe this step..."
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Required Role</Label>
                <Select
                  value={selectedStepData.requiredRole}
                  onValueChange={(value) => updateStep(selectedStep!, 'requiredRole', value)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Workflow Role (Optional)</Label>
                <Select
                  value={selectedStepData.requiredWorkflowRole || 'none'}
                  onValueChange={(value) => updateStep(selectedStep!, 'requiredWorkflowRole', value === 'none' ? undefined : value)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableWorkflowRoles.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 py-2">
                <input
                  type="checkbox"
                  id="requires-comment"
                  checked={selectedStepData.requiresComment}
                  onChange={(e) => updateStep(selectedStep!, 'requiresComment', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="requires-comment" className="cursor-pointer text-sm font-medium text-gray-700">
                  Require comment
                </Label>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">Allowed Transitions</Label>
                <div className="space-y-2 border rounded-lg p-3 max-h-48 overflow-y-auto">
                  {steps.filter(s => s.id !== selectedStep).length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Add more steps to create transitions</p>
                  ) : (
                    steps.filter(s => s.id !== selectedStep).map(step => (
                      <div key={step.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          id={`transition-${step.id}`}
                          checked={selectedStepData.allowedTransitions.includes(step.id)}
                          onChange={() => toggleTransition(selectedStep!, step.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor={`transition-${step.id}`} className="cursor-pointer flex-1 text-sm">
                          {step.name || 'Unnamed step'}
                        </Label>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {users.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Assigned Users (Optional)
                    <span className="block text-xs font-normal text-gray-500 mt-1">Users from your organization</span>
                  </Label>
                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    {users.map(user => (
                      <div key={user._id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 border-b last:border-b-0">
                        <input
                          type="checkbox"
                          id={`user-${user._id}`}
                          checked={selectedStepData.assignedUsers.includes(user._id)}
                          onChange={() => toggleUserAssignment(selectedStep!, user._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor={`user-${user._id}`} className="cursor-pointer flex-1">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">
                            {user.email}
                            {user.organization && (
                              <span className="ml-2 text-blue-600">• {user.organization.name}</span>
                            )}
                          </div>
                        </Label>
                        <Badge variant="outline" className="text-xs bg-gray-50">{user.role}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Settings2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">No step selected</h3>
          <p className="text-sm text-gray-500">Click on a step to view details, or double-click to edit</p>
        </div>
      )}

      {/* Edit Dialog Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-blue-600" />
              Edit Step Properties
            </DialogTitle>
            <DialogDescription>
              Configure the workflow step settings and permissions
            </DialogDescription>
          </DialogHeader>

          {editingStepData && (
            <div className="grid grid-cols-2 gap-6 py-4">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dialog-step-name" className="text-sm font-medium text-gray-700">Step Name *</Label>
                  <Input
                    id="dialog-step-name"
                    value={editingStepData.name}
                    onChange={(e) => updateStep(editingStep!, 'name', e.target.value)}
                    placeholder="e.g., Review, Approval"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="dialog-step-desc" className="text-sm font-medium text-gray-700">Description</Label>
                  <Input
                    id="dialog-step-desc"
                    value={editingStepData.description}
                    onChange={(e) => updateStep(editingStep!, 'description', e.target.value)}
                    placeholder="Describe this step..."
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Required Role</Label>
                  <Select
                    value={editingStepData.requiredRole}
                    onValueChange={(value) => updateStep(editingStep!, 'requiredRole', value)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Workflow Role (Optional)</Label>
                  <Select
                    value={editingStepData.requiredWorkflowRole || 'none'}
                    onValueChange={(value) => updateStep(editingStep!, 'requiredWorkflowRole', value === 'none' ? undefined : value)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {availableWorkflowRoles.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 py-2">
                  <input
                    type="checkbox"
                    id="dialog-requires-comment"
                    checked={editingStepData.requiresComment}
                    onChange={(e) => updateStep(editingStep!, 'requiresComment', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="dialog-requires-comment" className="cursor-pointer text-sm font-medium text-gray-700">
                    Require comment
                  </Label>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Allowed Transitions</Label>
                  <div className="space-y-2 border rounded-lg p-3 max-h-48 overflow-y-auto">
                    {steps.filter(s => s.id !== editingStep).length === 0 ? (
                      <p className="text-sm text-gray-500 italic">Add more steps to create transitions</p>
                    ) : (
                      steps.filter(s => s.id !== editingStep).map(step => (
                        <div key={step.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            id={`dialog-transition-${step.id}`}
                            checked={editingStepData.allowedTransitions.includes(step.id)}
                            onChange={() => toggleTransition(editingStep!, step.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Label htmlFor={`dialog-transition-${step.id}`} className="cursor-pointer flex-1 text-sm">
                            {step.name || 'Unnamed step'}
                          </Label>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {users.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      Assigned Users (Optional)
                      <span className="block text-xs font-normal text-gray-500 mt-1">Users from your organization</span>
                    </Label>
                    <div className="border rounded-lg max-h-64 overflow-y-auto">
                      {users.map(user => (
                        <div key={user._id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 border-b last:border-b-0">
                          <input
                            type="checkbox"
                            id={`dialog-user-${user._id}`}
                            checked={editingStepData.assignedUsers.includes(user._id)}
                            onChange={() => toggleUserAssignment(editingStep!, user._id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Label htmlFor={`dialog-user-${user._id}`} className="cursor-pointer flex-1">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500">
                              {user.email}
                              {user.organization && (
                                <span className="ml-2 text-blue-600">• {user.organization.name}</span>
                              )}
                            </div>
                          </Label>
                          <Badge variant="outline" className="text-xs bg-gray-50">{user.role}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>
              Close
            </Button>
            <Button onClick={handleDialogClose} className="bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
