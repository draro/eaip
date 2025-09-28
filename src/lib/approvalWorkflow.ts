import { IAIPDocument, IUser } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Document Approval Workflow for Aviation Compliance
export class ApprovalWorkflowService {

  // Workflow states according to aviation standards
  private static readonly WORKFLOW_STATES = {
    DRAFT: 'draft',
    TECHNICAL_REVIEW: 'technical_review',
    OPERATIONAL_REVIEW: 'operational_review',
    AUTHORITY_APPROVAL: 'authority_approval',
    FINAL_REVIEW: 'final_review',
    APPROVED: 'approved',
    PUBLISHED: 'published',
    REJECTED: 'rejected',
    WITHDRAWN: 'withdrawn'
  } as const;

  // Required approvals for different document types
  private static readonly APPROVAL_REQUIREMENTS = {
    CRITICAL: ['technical_review', 'operational_review', 'authority_approval', 'final_review'],
    ESSENTIAL: ['technical_review', 'operational_review', 'authority_approval'],
    ROUTINE: ['technical_review', 'operational_review']
  };

  public static async initiateApproval(
    document: IAIPDocument,
    initiatedBy: string,
    approvalType: 'CRITICAL' | 'ESSENTIAL' | 'ROUTINE' = 'ESSENTIAL'
  ): Promise<ApprovalWorkflow> {
    const workflow: ApprovalWorkflow = {
      id: uuidv4(),
      documentId: document._id.toString(),
      documentTitle: document.title,
      workflowType: approvalType,
      currentState: this.WORKFLOW_STATES.TECHNICAL_REVIEW,
      requiredApprovals: this.APPROVAL_REQUIREMENTS[approvalType],
      approvals: [],
      initiatedBy,
      initiatedAt: new Date(),
      targetCompletionDate: this.calculateTargetDate(document.effectiveDate),
      priority: this.determinePriority(document, approvalType),
      compliance: {
        icaoCompliant: false,
        eurocontrolCompliant: false,
        dataQualityVerified: false,
        securityCleared: false
      },
      digitalSignatures: [],
      auditTrail: [{
        action: 'workflow_initiated',
        performedBy: initiatedBy,
        timestamp: new Date(),
        state: this.WORKFLOW_STATES.TECHNICAL_REVIEW,
        comment: `${approvalType} approval workflow initiated`
      }]
    };

    return workflow;
  }

  public static async processApproval(
    workflow: ApprovalWorkflow,
    approval: ApprovalAction
  ): Promise<ApprovalWorkflow> {
    // Validate approval authority
    if (!this.validateApprovalAuthority(approval)) {
      throw new Error('Insufficient authority for this approval level');
    }

    // Add approval to workflow
    workflow.approvals.push({
      ...approval,
      id: uuidv4(),
      timestamp: new Date(),
      digitalSignature: await this.createDigitalSignature(approval, workflow.documentId)
    });

    // Update audit trail
    workflow.auditTrail.push({
      action: approval.decision === 'approve' ? 'approved' : 'rejected',
      performedBy: approval.approvedBy,
      timestamp: new Date(),
      state: workflow.currentState,
      comment: approval.comment || ''
    });

    // Process state transition
    if (approval.decision === 'approve') {
      workflow.currentState = this.getNextState(workflow);
    } else if (approval.decision === 'reject') {
      workflow.currentState = this.WORKFLOW_STATES.REJECTED;
    } else if (approval.decision === 'request_changes') {
      workflow.currentState = this.WORKFLOW_STATES.DRAFT;
    }

    // Check if workflow is complete
    if (this.isWorkflowComplete(workflow)) {
      workflow.currentState = this.WORKFLOW_STATES.APPROVED;
      workflow.completedAt = new Date();
    }

    return workflow;
  }

  private static getNextState(workflow: ApprovalWorkflow): string {
    const currentIndex = workflow.requiredApprovals.indexOf(workflow.currentState);
    if (currentIndex < workflow.requiredApprovals.length - 1) {
      return workflow.requiredApprovals[currentIndex + 1];
    }
    return this.WORKFLOW_STATES.APPROVED;
  }

  private static isWorkflowComplete(workflow: ApprovalWorkflow): boolean {
    const requiredApprovals = new Set(workflow.requiredApprovals);
    const completedApprovals = new Set(
      workflow.approvals
        .filter(a => a.decision === 'approve')
        .map(a => a.approvalLevel)
    );

    return workflow.requiredApprovals.every(level =>
      completedApprovals.has(level)
    );
  }

  private static validateApprovalAuthority(approval: ApprovalAction): boolean {
    // Implementation would check user roles and permissions
    // For now, basic validation
    const authorityLevels = {
      'technical_review': ['technical_reviewer', 'senior_technical_reviewer', 'authority_approver'],
      'operational_review': ['operational_reviewer', 'senior_operational_reviewer', 'authority_approver'],
      'authority_approval': ['authority_approver', 'senior_authority_approver'],
      'final_review': ['final_reviewer', 'authority_approver']
    };

    return authorityLevels[approval.approvalLevel]?.includes(approval.approverRole) || false;
  }

  private static async createDigitalSignature(
    approval: ApprovalAction,
    documentId: string
  ): Promise<DigitalSignature> {
    const dataToSign = JSON.stringify({
      documentId,
      approvalLevel: approval.approvalLevel,
      decision: approval.decision,
      approvedBy: approval.approvedBy,
      timestamp: new Date().toISOString()
    });

    // Create hash (in real implementation, would use proper PKI)
    const hash = crypto.createHash('sha256').update(dataToSign).digest('hex');

    return {
      algorithm: 'SHA256withRSA',
      signature: hash, // In real implementation, would be RSA signature
      certificate: `cert_${approval.approvedBy}`, // Certificate reference
      timestamp: new Date(),
      valid: true
    };
  }

  private static calculateTargetDate(effectiveDate: Date): Date {
    // Allow 28 days for approval process (one AIRAC cycle)
    const targetDate = new Date(effectiveDate.getTime() - (28 * 24 * 60 * 60 * 1000));
    return targetDate;
  }

  private static determinePriority(
    document: IAIPDocument,
    approvalType: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    const daysUntilEffective = (document.effectiveDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000);

    if (daysUntilEffective < 7) return 'critical';
    if (daysUntilEffective < 14) return 'high';
    if (daysUntilEffective < 28) return 'medium';
    return 'low';
  }

  // Compliance validation methods
  public static async validateCompliance(
    workflow: ApprovalWorkflow,
    document: IAIPDocument
  ): Promise<ComplianceValidation> {
    const validation: ComplianceValidation = {
      icaoCompliant: await this.validateICAOCompliance(document),
      eurocontrolCompliant: await this.validateEurocontrolCompliance(document),
      dataQualityVerified: await this.validateDataQuality(document),
      securityCleared: await this.validateSecurity(document),
      validationDate: new Date(),
      validatedBy: 'system',
      issues: []
    };

    // Update workflow compliance status
    workflow.compliance = validation;

    return validation;
  }

  private static async validateICAOCompliance(document: IAIPDocument): Promise<boolean> {
    // Import and use ICAO compliance service
    // const { ICAOComplianceService } = await import('./icaoCompliance');
    // const report = ICAOComplianceService.validateDocument(document);
    // return report.isCompliant;
    return true; // Simplified for now
  }

  private static async validateEurocontrolCompliance(document: IAIPDocument): Promise<boolean> {
    // Import and use EUROCONTROL compliance service
    // const { EurocontrolComplianceService } = await import('./eurocontrolCompliance');
    // const report = EurocontrolComplianceService.validateDocument(document);
    // return report.isCompliant;
    return true; // Simplified for now
  }

  private static async validateDataQuality(document: IAIPDocument): Promise<boolean> {
    // Check data completeness, accuracy, consistency
    const hasRequiredMetadata = !!(
      document.metadata.authority &&
      document.metadata.contact &&
      document.metadata.language
    );

    const hasValidSections = document.sections.length > 0 &&
      document.sections.every(section =>
        section.subsections.length > 0
      );

    return hasRequiredMetadata && hasValidSections;
  }

  private static async validateSecurity(document: IAIPDocument): Promise<boolean> {
    // Check for sensitive information that shouldn't be published
    const sensitivePatterns = [
      /classified/i,
      /restricted/i,
      /confidential/i,
      /security.?sensitive/i
    ];

    const documentText = JSON.stringify(document);
    return !sensitivePatterns.some(pattern => pattern.test(documentText));
  }

  // Notification system
  public static async sendApprovalNotification(
    workflow: ApprovalWorkflow,
    notificationType: 'approval_required' | 'approved' | 'rejected' | 'deadline_approaching'
  ): Promise<void> {
    const notification: ApprovalNotification = {
      type: notificationType,
      workflowId: workflow.id,
      documentTitle: workflow.documentTitle,
      currentState: workflow.currentState,
      priority: workflow.priority,
      targetDate: workflow.targetCompletionDate,
      message: this.getNotificationMessage(notificationType, workflow),
      timestamp: new Date()
    };

    // Send notification (implementation would integrate with email/SMS/Slack)
    console.log('Approval notification:', notification);
  }

  private static getNotificationMessage(
    type: string,
    workflow: ApprovalWorkflow
  ): string {
    switch (type) {
      case 'approval_required':
        return `Document "${workflow.documentTitle}" requires ${workflow.currentState} approval`;
      case 'approved':
        return `Document "${workflow.documentTitle}" has been approved and is ready for publication`;
      case 'rejected':
        return `Document "${workflow.documentTitle}" has been rejected and requires revision`;
      case 'deadline_approaching':
        return `Document "${workflow.documentTitle}" approval deadline is approaching`;
      default:
        return `Update on document "${workflow.documentTitle}" approval process`;
    }
  }

  // Reporting and metrics
  public static generateApprovalReport(workflows: ApprovalWorkflow[]): ApprovalReport {
    const totalWorkflows = workflows.length;
    const completedWorkflows = workflows.filter(w => w.completedAt).length;
    const averageProcessingTime = this.calculateAverageProcessingTime(workflows);
    const bottlenecks = this.identifyBottlenecks(workflows);

    return {
      totalWorkflows,
      completedWorkflows,
      pendingWorkflows: totalWorkflows - completedWorkflows,
      averageProcessingTimeHours: averageProcessingTime,
      completionRate: (completedWorkflows / totalWorkflows) * 100,
      bottlenecks,
      complianceRate: this.calculateComplianceRate(workflows),
      generatedAt: new Date()
    };
  }

  private static calculateAverageProcessingTime(workflows: ApprovalWorkflow[]): number {
    const completed = workflows.filter(w => w.completedAt && w.initiatedAt);
    if (completed.length === 0) return 0;

    const totalTime = completed.reduce((sum, w) => {
      return sum + (w.completedAt!.getTime() - w.initiatedAt.getTime());
    }, 0);

    return totalTime / (completed.length * 60 * 60 * 1000); // Convert to hours
  }

  private static identifyBottlenecks(workflows: ApprovalWorkflow[]): string[] {
    const stateCount = workflows.reduce((acc, w) => {
      acc[w.currentState] = (acc[w.currentState] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(stateCount)
      .filter(([_, count]) => count > workflows.length * 0.2) // More than 20% stuck in one state
      .map(([state, _]) => state);
  }

  private static calculateComplianceRate(workflows: ApprovalWorkflow[]): number {
    const compliantWorkflows = workflows.filter(w =>
      w.compliance.icaoCompliant &&
      w.compliance.eurocontrolCompliant &&
      w.compliance.dataQualityVerified
    ).length;

    return workflows.length > 0 ? (compliantWorkflows / workflows.length) * 100 : 100;
  }
}

// Type definitions
export interface ApprovalWorkflow {
  id: string;
  documentId: string;
  documentTitle: string;
  workflowType: 'CRITICAL' | 'ESSENTIAL' | 'ROUTINE';
  currentState: string;
  requiredApprovals: string[];
  approvals: DocumentApproval[];
  initiatedBy: string;
  initiatedAt: Date;
  completedAt?: Date;
  targetCompletionDate: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  compliance: ComplianceValidation;
  digitalSignatures: DigitalSignature[];
  auditTrail: AuditTrailEntry[];
}

export interface DocumentApproval {
  id: string;
  approvalLevel: string;
  approvedBy: string;
  approverRole: string;
  decision: 'approve' | 'reject' | 'request_changes';
  comment?: string;
  timestamp: Date;
  digitalSignature: DigitalSignature;
}

export interface ApprovalAction {
  approvalLevel: string;
  approvedBy: string;
  approverRole: string;
  decision: 'approve' | 'reject' | 'request_changes';
  comment?: string;
}

export interface DigitalSignature {
  algorithm: string;
  signature: string;
  certificate: string;
  timestamp: Date;
  valid: boolean;
}

export interface ComplianceValidation {
  icaoCompliant: boolean;
  eurocontrolCompliant: boolean;
  dataQualityVerified: boolean;
  securityCleared: boolean;
  validationDate: Date;
  validatedBy: string;
  issues: string[];
}

export interface AuditTrailEntry {
  action: string;
  performedBy: string;
  timestamp: Date;
  state: string;
  comment: string;
}

export interface ApprovalNotification {
  type: 'approval_required' | 'approved' | 'rejected' | 'deadline_approaching';
  workflowId: string;
  documentTitle: string;
  currentState: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  targetDate: Date;
  message: string;
  timestamp: Date;
}

export interface ApprovalReport {
  totalWorkflows: number;
  completedWorkflows: number;
  pendingWorkflows: number;
  averageProcessingTimeHours: number;
  completionRate: number;
  bottlenecks: string[];
  complianceRate: number;
  generatedAt: Date;
}