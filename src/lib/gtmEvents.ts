/**
 * Google Tag Manager Event Tracking Library for eAIP Platform
 *
 * This library provides helper functions to track custom events in GTM.
 * All events are pushed to the dataLayer for GTM to process.
 *
 * Usage:
 * import { trackDocumentCreated, trackUserLogin } from '@/lib/gtmEvents';
 * trackDocumentCreated({ documentType: 'AIP', documentId: '123' });
 */

declare global {
  interface Window {
    dataLayer?: any[];
  }
}

/**
 * Base function to push events to GTM dataLayer
 */
function pushEvent(event: string, data?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event,
      ...data,
      timestamp: new Date().toISOString()
    });
  }
}

// ==================== USER EVENTS ====================

/**
 * Track user login
 */
export function trackUserLogin(data: {
  userId: string;
  userRole: string;
  organization: string;
  organizationType?: string;
}) {
  pushEvent('user_login', {
    user_id: data.userId,
    user_role: data.userRole,
    organization: data.organization,
    organization_type: data.organizationType
  });
}

/**
 * Track user logout
 */
export function trackUserLogout() {
  pushEvent('user_logout');
}

/**
 * Track user registration
 */
export function trackUserRegistration(data: {
  userId: string;
  userRole: string;
  organization: string;
  method?: 'email' | 'invite' | 'sso';
}) {
  pushEvent('user_registration', {
    user_id: data.userId,
    user_role: data.userRole,
    organization: data.organization,
    registration_method: data.method || 'email'
  });
}

// ==================== DOCUMENT EVENTS ====================

/**
 * Track document creation
 */
export function trackDocumentCreated(data: {
  documentId: string;
  documentType: 'AIP' | 'GEN' | 'ENR' | 'AD' | 'SUPPLEMENT' | 'NOTAM';
  section?: string;
  userId?: string;
}) {
  pushEvent('document_created', {
    document_id: data.documentId,
    document_type: data.documentType,
    document_section: data.section,
    user_id: data.userId
  });
}

/**
 * Track document editing
 */
export function trackDocumentEdited(data: {
  documentId: string;
  documentType: string;
  editDuration?: number; // in seconds
  userId?: string;
}) {
  pushEvent('document_edited', {
    document_id: data.documentId,
    document_type: data.documentType,
    edit_duration: data.editDuration,
    user_id: data.userId
  });
}

/**
 * Track document publish
 */
export function trackDocumentPublished(data: {
  documentId: string;
  documentType: string;
  airacCycle?: string;
  userId?: string;
}) {
  pushEvent('document_published', {
    document_id: data.documentId,
    document_type: data.documentType,
    airac_cycle: data.airacCycle,
    user_id: data.userId
  });
}

/**
 * Track document export
 */
export function trackDocumentExported(data: {
  documentId: string;
  documentType: string;
  exportFormat: 'PDF' | 'DOCX' | 'XML' | 'HTML';
  userId?: string;
}) {
  pushEvent('document_exported', {
    document_id: data.documentId,
    document_type: data.documentType,
    export_format: data.exportFormat,
    user_id: data.userId
  });
}

/**
 * Track document deletion
 */
export function trackDocumentDeleted(data: {
  documentId: string;
  documentType: string;
  userId?: string;
}) {
  pushEvent('document_deleted', {
    document_id: data.documentId,
    document_type: data.documentType,
    user_id: data.userId
  });
}

// ==================== NOTAM EVENTS ====================

/**
 * Track NOTAM creation
 */
export function trackNotamCreated(data: {
  notamId: string;
  notamCategory: string;
  notamSeries?: string;
  userId?: string;
}) {
  pushEvent('notam_created', {
    notam_id: data.notamId,
    notam_category: data.notamCategory,
    notam_series: data.notamSeries,
    user_id: data.userId
  });
}

/**
 * Track NOTAM published
 */
export function trackNotamPublished(data: {
  notamId: string;
  notamCategory: string;
  effectiveDate?: string;
  expiryDate?: string;
  userId?: string;
}) {
  pushEvent('notam_published', {
    notam_id: data.notamId,
    notam_category: data.notamCategory,
    effective_date: data.effectiveDate,
    expiry_date: data.expiryDate,
    user_id: data.userId
  });
}

// ==================== WORKFLOW EVENTS ====================

/**
 * Track workflow creation
 */
export function trackWorkflowCreated(data: {
  workflowId: string;
  workflowName: string;
  workflowType: 'document' | 'dms';
  stepsCount: number;
  userId?: string;
}) {
  pushEvent('workflow_created', {
    workflow_id: data.workflowId,
    workflow_name: data.workflowName,
    workflow_type: data.workflowType,
    steps_count: data.stepsCount,
    user_id: data.userId
  });
}

/**
 * Track workflow submission
 */
export function trackWorkflowSubmitted(data: {
  workflowId: string;
  workflowName: string;
  itemId: string; // Document or file ID
  itemType: 'document' | 'file';
  userId?: string;
}) {
  pushEvent('workflow_submitted', {
    workflow_id: data.workflowId,
    workflow_name: data.workflowName,
    item_id: data.itemId,
    item_type: data.itemType,
    user_id: data.userId
  });
}

/**
 * Track workflow approval
 */
export function trackWorkflowApproved(data: {
  workflowId: string;
  stepName: string;
  itemId: string;
  userId?: string;
}) {
  pushEvent('workflow_approved', {
    workflow_id: data.workflowId,
    step_name: data.stepName,
    item_id: data.itemId,
    user_id: data.userId
  });
}

/**
 * Track workflow rejection
 */
export function trackWorkflowRejected(data: {
  workflowId: string;
  stepName: string;
  itemId: string;
  rejectionReason?: string;
  userId?: string;
}) {
  pushEvent('workflow_rejected', {
    workflow_id: data.workflowId,
    step_name: data.stepName,
    item_id: data.itemId,
    rejection_reason: data.rejectionReason,
    user_id: data.userId
  });
}

/**
 * Track workflow completion
 */
export function trackWorkflowCompleted(data: {
  workflowId: string;
  workflowName: string;
  itemId: string;
  duration?: number; // in seconds
  userId?: string;
}) {
  pushEvent('workflow_completed', {
    workflow_id: data.workflowId,
    workflow_name: data.workflowName,
    item_id: data.itemId,
    workflow_duration: data.duration,
    user_id: data.userId
  });
}

// ==================== DMS (FILE) EVENTS ====================

/**
 * Track file upload
 */
export function trackFileUploaded(data: {
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number; // in bytes
  folderId?: string;
  userId?: string;
}) {
  pushEvent('file_uploaded', {
    file_id: data.fileId,
    file_name: data.fileName,
    file_type: data.fileType,
    file_size: data.fileSize,
    folder_id: data.folderId,
    user_id: data.userId
  });
}

/**
 * Track file download
 */
export function trackFileDownloaded(data: {
  fileId: string;
  fileName: string;
  fileType: string;
  userId?: string;
}) {
  pushEvent('file_downloaded', {
    file_id: data.fileId,
    file_name: data.fileName,
    file_type: data.fileType,
    user_id: data.userId
  });
}

/**
 * Track file version created
 */
export function trackFileVersionCreated(data: {
  fileId: string;
  fileName: string;
  versionNumber: number;
  changeNote?: string;
  userId?: string;
}) {
  pushEvent('file_version_created', {
    file_id: data.fileId,
    file_name: data.fileName,
    version_number: data.versionNumber,
    change_note: data.changeNote,
    user_id: data.userId
  });
}

/**
 * Track file version restored
 */
export function trackFileVersionRestored(data: {
  fileId: string;
  fileName: string;
  versionNumber: number;
  userId?: string;
}) {
  pushEvent('file_version_restored', {
    file_id: data.fileId,
    file_name: data.fileName,
    version_number: data.versionNumber,
    user_id: data.userId
  });
}

// ==================== COMPLIANCE EVENTS ====================

/**
 * Track compliance check run
 */
export function trackComplianceCheckRun(data: {
  documentId: string;
  checkType: 'ICAO_ANNEX_15' | 'EUROCONTROL_SPEC_3_0' | 'DATA_QUALITY';
  score?: number;
  issuesCount?: number;
  userId?: string;
}) {
  pushEvent('compliance_check_run', {
    document_id: data.documentId,
    check_type: data.checkType,
    compliance_score: data.score,
    issues_count: data.issuesCount,
    user_id: data.userId
  });
}

// ==================== SEARCH EVENTS ====================

/**
 * Track search query
 */
export function trackSearch(data: {
  searchQuery: string;
  searchCategory?: 'documents' | 'files' | 'users' | 'all';
  resultsCount?: number;
  userId?: string;
}) {
  pushEvent('search', {
    search_query: data.searchQuery,
    search_category: data.searchCategory || 'all',
    results_count: data.resultsCount,
    user_id: data.userId
  });
}

// ==================== FORM EVENTS ====================

/**
 * Track form submission (contact, demo request, etc.)
 */
export function trackFormSubmission(data: {
  formName: string;
  formType: 'contact' | 'demo_request' | 'support' | 'feedback' | 'other';
  success: boolean;
  errorMessage?: string;
}) {
  pushEvent('form_submission', {
    form_name: data.formName,
    form_type: data.formType,
    submission_success: data.success,
    error_message: data.errorMessage
  });
}

// ==================== ERROR EVENTS ====================

/**
 * Track application errors
 */
export function trackError(data: {
  errorMessage: string;
  errorType?: 'api' | 'client' | 'validation' | 'network';
  errorCode?: string | number;
  errorLocation?: string; // Component or page name
  userId?: string;
}) {
  pushEvent('app_error', {
    error_message: data.errorMessage,
    error_type: data.errorType || 'client',
    error_code: data.errorCode,
    error_location: data.errorLocation,
    user_id: data.userId
  });
}

// ==================== FEATURE USAGE EVENTS ====================

/**
 * Track feature usage
 */
export function trackFeatureUsed(data: {
  featureName: string;
  featureCategory?: 'document' | 'dms' | 'workflow' | 'compliance' | 'export' | 'other';
  userId?: string;
}) {
  pushEvent('feature_used', {
    feature_name: data.featureName,
    feature_category: data.featureCategory || 'other',
    user_id: data.userId
  });
}

// ==================== PAGE VIEW EVENTS ====================

/**
 * Track custom page view (GTM usually handles this automatically, but useful for SPAs)
 */
export function trackPageView(data: {
  pageTitle: string;
  pagePath: string;
  userId?: string;
}) {
  pushEvent('page_view', {
    page_title: data.pageTitle,
    page_path: data.pagePath,
    user_id: data.userId
  });
}

// ==================== CONVERSION EVENTS ====================

/**
 * Track conversion events (demo booked, trial started, etc.)
 */
export function trackConversion(data: {
  conversionType: 'demo_booked' | 'trial_started' | 'subscription_created' | 'onboarding_completed';
  conversionValue?: number;
  userId?: string;
}) {
  pushEvent('conversion', {
    conversion_type: data.conversionType,
    conversion_value: data.conversionValue,
    user_id: data.userId
  });
}
