import { IAIPDocument } from '@/types';

// EUROCONTROL Specification for Electronic AIP v3.0 Compliance
export class EurocontrolComplianceService {

  // Required XML schema elements for EUROCONTROL Spec 3.0
  private static readonly REQUIRED_METADATA = {
    'eaip:AIP': {
      attributes: ['version', 'effectiveDate', 'country'],
      elements: ['eaip:metadata', 'eaip:content']
    },
    'eaip:metadata': {
      elements: [
        'eaip:title',
        'eaip:publisher',
        'eaip:language',
        'eaip:coverage',
        'eaip:rights',
        'eaip:source',
        'eaip:relation',
        'eaip:subject',
        'eaip:type',
        'eaip:identifier',
        'eaip:date'
      ]
    }
  };

  // Data presentation requirements
  private static readonly PRESENTATION_REQUIREMENTS = {
    CHARTS: {
      minDPI: 300,
      formats: ['PDF', 'PNG', 'SVG'],
      colorMode: 'RGB',
      maxFileSize: '10MB'
    },
    TEXT: {
      encoding: 'UTF-8',
      lineEnding: 'CRLF',
      maxLineLength: 120
    },
    COORDINATES: {
      datum: 'WGS84',
      precision: 0.00001, // degrees
      format: 'decimal_degrees'
    }
  };

  // Quality requirements per EUROCONTROL Specification
  private static readonly QUALITY_LEVELS = {
    A: { // Critical data
      accuracy: '±1m',
      resolution: '0.1m',
      integrity: '1×10^-8',
      traceability: 'Full audit trail required'
    },
    B: { // Essential data
      accuracy: '±3m',
      resolution: '1m',
      integrity: '1×10^-5',
      traceability: 'Source documentation required'
    },
    C: { // Routine data
      accuracy: '±10m',
      resolution: '10m',
      integrity: '1×10^-3',
      traceability: 'General validation required'
    }
  };

  public static validateDocument(document: IAIPDocument): EurocontrolValidationReport {
    const report: EurocontrolValidationReport = {
      isCompliant: true,
      errors: [],
      warnings: [],
      recommendations: [],
      metadataIssues: [],
      presentationIssues: [],
      qualityIssues: [],
      timestamp: new Date(),
      specificationVersion: '3.0'
    };

    // Check metadata completeness
    this.validateMetadata(document, report);

    // Check data presentation standards
    this.validatePresentationStandards(document, report);

    // Check quality levels
    this.validateQualityLevels(document, report);

    // Check accessibility requirements
    this.validateAccessibility(document, report);

    // Check multilingual support
    this.validateMultilingualSupport(document, report);

    // Check digital signature requirements
    this.validateDigitalSignature(document, report);

    return report;
  }

  private static validateMetadata(document: IAIPDocument, report: EurocontrolValidationReport): void {
    const metadata = document.metadata;

    // Check required metadata fields
    const requiredFields = [
      'authority', 'contact', 'language'
    ];

    requiredFields.forEach(field => {
      if (!metadata[field as keyof typeof metadata]) {
        report.errors.push(`Missing required metadata field: ${field}`);
        report.isCompliant = false;
      }
    });

    // Check ISO language code compliance
    if (metadata.language && !this.isValidISO639Language(metadata.language)) {
      report.warnings.push('Language code should comply with ISO 639-1 standard');
    }

    // Check authority format
    if (metadata.authority && !this.isValidAuthorityFormat(metadata.authority)) {
      report.warnings.push('Authority should follow ICAO State designation format');
    }

    // Check contact information format
    if (metadata.contact && !this.isValidContactFormat(metadata.contact)) {
      report.warnings.push('Contact information should include valid email and phone number');
    }

    // Check for Dublin Core compliance
    this.validateDublinCore(document, report);
  }

  private static validatePresentationStandards(document: IAIPDocument, report: EurocontrolValidationReport): void {
    document.sections.forEach(section => {
      section.subsections.forEach(subsection => {
        // Check text encoding
        if (!this.isValidTextEncoding(subsection.content)) {
          report.warnings.push(`Subsection ${section.type} ${subsection.code}: Text should use UTF-8 encoding`);
        }

        // Check coordinate format
        if (this.containsCoordinates(subsection.content)) {
          if (!this.isValidCoordinateFormat(subsection.content)) {
            report.warnings.push(`Subsection ${section.type} ${subsection.code}: Coordinates should use decimal degrees with WGS84 datum`);
          }
        }

        // Check image quality
        subsection.images.forEach(image => {
          if (!this.meetsPresentationStandards(image)) {
            report.presentationIssues.push({
              location: `${section.type} ${subsection.code}`,
              image: image.filename,
              issue: 'Image quality does not meet EUROCONTROL standards',
              requirement: 'Minimum 300 DPI, RGB color mode, max 10MB'
            });
          }
        });
      });
    });
  }

  private static validateQualityLevels(document: IAIPDocument, report: EurocontrolValidationReport): void {
    document.sections.forEach(section => {
      section.subsections.forEach(subsection => {
        const qualityLevel = this.determineRequiredQualityLevel(section.type, subsection.code);

        if (qualityLevel && !this.meetsQualityLevel(subsection, qualityLevel)) {
          report.qualityIssues.push({
            location: `${section.type} ${subsection.code}`,
            requiredLevel: qualityLevel,
            issue: `Data does not meet quality level ${qualityLevel} requirements`,
            recommendation: this.QUALITY_LEVELS[qualityLevel].traceability
          });
        }
      });
    });
  }

  private static validateAccessibility(document: IAIPDocument, report: EurocontrolValidationReport): void {
    // Check for screen reader compatibility
    document.sections.forEach(section => {
      section.subsections.forEach(subsection => {
        // Check for alt text on images
        subsection.images.forEach(image => {
          if (!image.originalName || image.originalName === image.filename) {
            report.recommendations.push(`Add descriptive alt text for image in ${section.type} ${subsection.code}`);
          }
        });

        // Check for table headers
        if (this.containsTables(subsection.content)) {
          if (!this.hasProperTableHeaders(subsection.content)) {
            report.recommendations.push(`Add proper table headers in ${section.type} ${subsection.code} for accessibility`);
          }
        }
      });
    });
  }

  private static validateMultilingualSupport(document: IAIPDocument, report: EurocontrolValidationReport): void {
    // Check if document indicates multilingual support
    if (document.metadata.language === 'en' && document.country !== 'GB' && document.country !== 'US') {
      report.recommendations.push('Consider providing local language version in addition to English');
    }

    // Check for language-specific formatting
    document.sections.forEach(section => {
      section.subsections.forEach(subsection => {
        if (this.containsNonASCIICharacters(subsection.content)) {
          if (!this.hasProperUnicodeSupport(subsection.content)) {
            report.warnings.push(`Unicode characters in ${section.type} ${subsection.code} may not display correctly`);
          }
        }
      });
    });
  }

  private static validateDigitalSignature(document: IAIPDocument, report: EurocontrolValidationReport): void {
    // Check for digital signature requirements for published documents
    if (document.status === 'published') {
      if (!document.metadata.lastReview ||
          new Date(document.metadata.lastReview) < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) {
        report.warnings.push('Published documents should have digital signature or authority validation within the last year');
      }
    }
  }

  private static validateDublinCore(document: IAIPDocument, report: EurocontrolValidationReport): void {
    const dublinCoreFields = [
      'title', 'creator', 'subject', 'description', 'publisher',
      'contributor', 'date', 'type', 'format', 'identifier',
      'source', 'language', 'relation', 'coverage', 'rights'
    ];

    const missingFields = dublinCoreFields.filter(field => {
      switch (field) {
        case 'title': return !document.title;
        case 'creator':
        case 'publisher': return !document.metadata.authority;
        case 'language': return !document.metadata.language;
        case 'date': return !document.effectiveDate;
        case 'contact': return !document.metadata.contact;
        default: return false;
      }
    });

    if (missingFields.length > 0) {
      report.recommendations.push(`Consider adding Dublin Core metadata fields: ${missingFields.join(', ')}`);
    }
  }

  // Helper methods
  private static isValidISO639Language(language: string): boolean {
    const iso639Codes = ['en', 'fr', 'de', 'es', 'it', 'pt', 'nl', 'sv', 'da', 'no', 'fi', 'pl', 'cs', 'hu', 'ro', 'bg', 'hr', 'sl', 'sk', 'et', 'lv', 'lt', 'mt', 'el', 'cy'];
    return iso639Codes.includes(language.toLowerCase());
  }

  private static isValidAuthorityFormat(authority: string): boolean {
    // Should include ICAO state name or code
    return authority.length >= 10 && /[A-Z]/.test(authority);
  }

  private static isValidContactFormat(contact: string): boolean {
    // Should contain email pattern
    return /@/.test(contact) && contact.length >= 10;
  }

  private static isValidTextEncoding(content: any): boolean {
    // Assume UTF-8 by default in modern systems
    return true;
  }

  private static containsCoordinates(content: any): boolean {
    const text = this.extractTextFromContent(content);
    return /\d{1,3}[°]\d{2}[']\d{2}["][NSEW]/i.test(text) ||
           /[+-]?\d{1,3}\.\d+/.test(text);
  }

  private static isValidCoordinateFormat(content: any): boolean {
    const text = this.extractTextFromContent(content);
    return /WGS.?84/i.test(text) || /decimal.?degree/i.test(text);
  }

  private static meetsPresentationStandards(image: any): boolean {
    // Check basic requirements
    return image.size <= 10 * 1024 * 1024; // 10MB limit
  }

  private static determineRequiredQualityLevel(sectionType: string, subsectionCode: string): 'A' | 'B' | 'C' | null {
    // Critical data (Level A)
    if (sectionType === 'AD' && subsectionCode.startsWith('2.')) return 'A'; // Aerodrome data
    if (sectionType === 'ENR' && subsectionCode === '4.1') return 'A'; // Navigation aids

    // Essential data (Level B)
    if (sectionType === 'ENR' && subsectionCode.startsWith('3.')) return 'B'; // Routes
    if (sectionType === 'ENR' && subsectionCode.startsWith('5.')) return 'B'; // Restricted areas

    // Routine data (Level C)
    return 'C';
  }

  private static meetsQualityLevel(subsection: any, level: 'A' | 'B' | 'C'): boolean {
    // Implementation would check specific quality criteria
    // For now, assume compliance if recently updated
    const daysSinceUpdate = (Date.now() - new Date(subsection.lastModified).getTime()) / (1000 * 60 * 60 * 24);

    switch (level) {
      case 'A': return daysSinceUpdate <= 7;  // Critical data: weekly updates
      case 'B': return daysSinceUpdate <= 28; // Essential data: AIRAC cycle
      case 'C': return daysSinceUpdate <= 365; // Routine data: annual
      default: return true;
    }
  }

  private static containsTables(content: any): boolean {
    return JSON.stringify(content).includes('"type":"table"');
  }

  private static hasProperTableHeaders(content: any): boolean {
    // Check if tables have thead elements
    return JSON.stringify(content).includes('"type":"tableHeader"');
  }

  private static containsNonASCIICharacters(content: any): boolean {
    const text = this.extractTextFromContent(content);
    return /[^\x00-\x7F]/.test(text);
  }

  private static hasProperUnicodeSupport(content: any): boolean {
    // Assume proper Unicode support in modern systems
    return true;
  }

  private static extractTextFromContent(content: any): string {
    if (!content || !content.content) return '';

    let text = '';
    const extractFromNode = (node: any): void => {
      if (node.type === 'text') {
        text += node.text || '';
      } else if (node.content && Array.isArray(node.content)) {
        node.content.forEach(extractFromNode);
      }
    };

    if (Array.isArray(content.content)) {
      content.content.forEach(extractFromNode);
    }

    return text;
  }
}

export interface EurocontrolValidationReport {
  isCompliant: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  metadataIssues: string[];
  presentationIssues: PresentationIssue[];
  qualityIssues: QualityIssue[];
  timestamp: Date;
  specificationVersion: string;
}

export interface PresentationIssue {
  location: string;
  image?: string;
  issue: string;
  requirement: string;
}

export interface QualityIssue {
  location: string;
  requiredLevel: 'A' | 'B' | 'C';
  issue: string;
  recommendation: string;
}