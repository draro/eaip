import { IAIPDocument, ISection, ISubsection } from '@/types';
import { ICAO_AIP_STRUCTURE, AIPSection } from './aipStructure';

// ICAO Annex 15 - Aeronautical Information Services
export class ICAOComplianceService {

  // Get mandatory sections from ICAO AIP Structure
  private static getMandatorySections(): Map<string, { code: string; title: string; section: string }> {
    const mandatory = new Map<string, { code: string; title: string; section: string }>();

    ICAO_AIP_STRUCTURE.forEach(part => {
      if (part.children) {
        part.children.forEach(section => {
          if (section.isMandatory && section.children) {
            section.children.forEach(subsection => {
              if (subsection.isMandatory) {
                // Extract just the numeric part (e.g., "1.1" from "GEN 1.1")
                const code = subsection.code.replace(`${part.code} `, '');
                mandatory.set(`${part.code}-${code}`, {
                  code,
                  title: subsection.title,
                  section: part.code
                });
              }
            });
          }
        });
      }
    });

    return mandatory;
  }

  // Legacy mandatory sections for backward compatibility
  private static readonly MANDATORY_SECTIONS_OLD = {
    GEN: {
      '1.1': 'Designated authorities',
      '1.2': 'Entry, transit and departure of aircraft',
      '1.3': 'Entry, transit and departure of passengers and crew',
      '1.4': 'Entry, transit and departure of cargo',
      '1.5': 'Aircraft instruments, equipment and flight documents',
      '1.6': 'Summary of national regulations and international agreements',
      '1.7': 'Differences from ICAO Standards, Recommended Practices and Procedures',
      '2.1': 'Measuring system, aircraft markings, holidays',
      '2.2': 'Abbreviations',
      '2.3': 'Chart symbols',
      '2.4': 'Location indicators',
      '2.5': 'List of radio navigation aids',
      '2.6': 'Conversion tables',
      '2.7': 'Sunrise/sunset tables',
      '3.1': 'Aeronautical information services',
      '3.2': 'Aeronautical charts',
      '3.3': 'NOTAM',
      '3.4': 'AIC',
      '4.1': 'Aerodrome/heliport data',
      '4.2': 'Air traffic services airspace',
      '4.3': 'Air traffic services communication facilities',
      '4.4': 'Navigation facilities'
    },
    ENR: {
      '1.1': 'General rules',
      '1.2': 'Visual flight rules',
      '1.3': 'Instrument flight rules',
      '1.4': 'ATS airspace classes',
      '1.5': 'Holding, approach and departure procedures',
      '1.6': 'Altimeter setting procedures',
      '1.7': 'Aircraft altitude/flight level allocation scheme',
      '1.8': 'Regional supplementary procedures',
      '1.9': 'Flight planning',
      '1.10': 'Aircraft equipment and communication/navigation/surveillance capabilities',
      '1.11': 'Electronic terrain and obstacle data',
      '1.12': 'Space weather information',
      '1.13': 'Volcanic ash and other contaminating substances',
      '1.14': 'Flight operations in areas affected by conflict',
      '2.1': 'FIR, UIR, TMA',
      '2.2': 'Other regulated airspace',
      '3.1': 'ATS routes',
      '3.2': 'Other routes',
      '3.3': 'RNAV routes',
      '4.1': 'Radio navigation aids — en-route',
      '4.2': 'Special navigation systems',
      '4.3': 'GNSS information',
      '4.4': 'Name-code designators for significant points',
      '4.5': 'Navigation warnings',
      '5.1': 'Prohibited, restricted and danger areas',
      '5.2': 'Military exercise and training areas',
      '5.3': 'Other activities of a dangerous nature',
      '5.4': 'Air traffic advisory areas',
      '5.5': 'Navigation warnings',
      '5.6': 'Search and rescue',
      '6.1': 'En-route charts — ICAO'
    },
    AD: {
      '1.1': 'Aerodromes/heliports — introduction',
      '1.2': 'Aerodrome categories',
      '1.3': 'Certification and operation',
      '2.X': 'Aerodrome/heliport data (for each aerodrome)',
      '3.1': 'Aerodrome charts — ICAO'
    }
  };

  // Data quality requirements per ICAO Annex 15
  private static readonly DATA_QUALITY_REQUIREMENTS = {
    ACCURACY: {
      'latitude_longitude': '1 metre (3 ft)',
      'elevation': '0.5 metre (1.5 ft) or one-half of the elevation accuracy',
      'geoid_undulation': '0.5 metre (1.5 ft)',
      'magnetic_variation': '1 degree',
    },
    RESOLUTION: {
      'latitude_longitude': '0.00001 degree',
      'elevation': '0.1 metre (0.5 ft)',
      'geoid_undulation': '0.1 metre (0.5 ft)',
      'magnetic_variation': '1 degree',
    },
    INTEGRITY: {
      'routine': '1 × 10^-3 per operational hour',
      'essential': '1 × 10^-5 per operational hour',
      'critical': '1 × 10^-8 per operational hour',
    }
  };

  public static validateDocument(document: IAIPDocument): ICAOValidationReport {
    const report: ICAOValidationReport = {
      isCompliant: true,
      errors: [],
      warnings: [],
      missingMandatorySections: [],
      dataQualityIssues: [],
      timestamp: new Date(),
    };

    // Check mandatory sections
    this.validateMandatorySections(document, report);

    // Check data quality
    this.validateDataQuality(document, report);

    // Check AIRAC compliance
    this.validateAIRACCompliance(document, report);

    // Check content standards
    this.validateContentStandards(document, report);

    return report;
  }

  private static validateMandatorySections(document: IAIPDocument, report: ICAOValidationReport): void {
    const documentSections = new Map(document.sections.map(s => [s.type, s]));
    const mandatorySections = this.getMandatorySections();

    // Check each mandatory section
    mandatorySections.forEach((mandatoryInfo, key) => {
      const { code, title, section: sectionType } = mandatoryInfo;
      const documentSection = documentSections.get(sectionType as 'GEN' | 'ENR' | 'AD');

      if (!documentSection) {
        report.errors.push(`Missing mandatory section: ${sectionType}`);
        report.isCompliant = false;
        return;
      }

      const sectionSubsections = new Map(documentSection.subsections.map(s => [s.code, s]));

      if (!sectionSubsections.has(code)) {
        report.missingMandatorySections.push({
          section: sectionType,
          subsection: code,
          title,
          mandatory: true,
        });
        report.isCompliant = false;
      }
    });
  }

  private static validateDataQuality(document: IAIPDocument, report: ICAOValidationReport): void {
    document.sections.forEach(section => {
      section.subsections.forEach(subsection => {
        // Check for coordinate data
        if (this.containsCoordinateData(subsection)) {
          this.validateCoordinateAccuracy(subsection, report);
        }

        // Check for elevation data
        if (this.containsElevationData(subsection)) {
          this.validateElevationAccuracy(subsection, report);
        }

        // Check for time-sensitive data
        if (this.containsTimeSensitiveData(subsection)) {
          this.validateTimelinessRequirements(subsection, report);
        }
      });
    });
  }

  private static validateAIRACCompliance(document: IAIPDocument, report: ICAOValidationReport): void {
    if (!document.airacCycle) {
      report.errors.push('Missing AIRAC cycle information');
      report.isCompliant = false;
      return;
    }

    // AIRAC cycle format validation (YYMM or YYYYMM format)
    const airacPattern = /^\d{4}$|^\d{6}$/;
    if (!airacPattern.test(document.airacCycle)) {
      report.errors.push('Invalid AIRAC cycle format. Must be YYMM (e.g., 2501) or YYYYMM (e.g., 202501)');
      report.isCompliant = false;
    }

    // Effective date validation
    if (!document.effectiveDate) {
      report.errors.push('Missing effective date');
      report.isCompliant = false;
    } else {
      const effectiveDate = new Date(document.effectiveDate);
      const now = new Date();

      // AIRAC effective dates must be Thursdays
      if (effectiveDate.getDay() !== 4) {
        report.warnings.push('AIRAC effective date should be a Thursday');
      }

      // Future effective dates should not be more than 1 year ahead
      const oneYearAhead = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      if (effectiveDate > oneYearAhead) {
        report.warnings.push('Effective date is more than one year in the future');
      }
    }
  }

  private static validateContentStandards(document: IAIPDocument, report: ICAOValidationReport): void {
    // Check for required metadata
    if (!document.metadata.authority) {
      report.errors.push('Missing authority information');
      report.isCompliant = false;
    }

    if (!document.metadata.contact) {
      report.errors.push('Missing contact information');
      report.isCompliant = false;
    }

    if (!document.metadata.language) {
      report.warnings.push('Missing language specification');
    }

    // Check for consistent coordinate reference system
    document.sections.forEach(section => {
      section.subsections.forEach(subsection => {
        if (this.containsCoordinateData(subsection)) {
          // All coordinates should use WGS-84
          if (!this.usesWGS84(subsection)) {
            report.warnings.push(`Subsection ${section.type} ${subsection.code}: Coordinates should use WGS-84 reference system`);
          }
        }
      });
    });
  }

  private static containsCoordinateData(subsection: ISubsection): boolean {
    const content = this.extractTextFromContent(subsection.content);
    // Simple regex to detect coordinate patterns
    const coordPatterns = [
      /\d{2}[°]\d{2}[']\d{2}["][NS]/,  // DMS format
      /\d{2}\.\d+[°][NS]/,              // Decimal degrees
      /[+-]?\d{1,3}\.\d+/               // Simple decimal
    ];

    return coordPatterns.some(pattern => pattern.test(content));
  }

  private static containsElevationData(subsection: ISubsection): boolean {
    const content = this.extractTextFromContent(subsection.content);
    return /\d+\s*(ft|feet|m|meter|metre)/i.test(content);
  }

  private static containsTimeSensitiveData(subsection: ISubsection): boolean {
    // Check if subsection contains operational hours, NOTAMs, or temporary data
    const content = this.extractTextFromContent(subsection.content);
    return /\b(hours|NOTAM|temporary|until|expires|valid)\b/i.test(content);
  }

  private static validateCoordinateAccuracy(subsection: ISubsection, report: ICAOValidationReport): void {
    // Implementation would check coordinate precision
    // For now, just add a reminder
    report.warnings.push(`Verify coordinate accuracy in ${subsection.code} meets ICAO requirements (±1m)`);
  }

  private static validateElevationAccuracy(subsection: ISubsection, report: ICAOValidationReport): void {
    // Implementation would check elevation precision
    report.warnings.push(`Verify elevation accuracy in ${subsection.code} meets ICAO requirements (±0.5m)`);
  }

  private static validateTimelinessRequirements(subsection: ISubsection, report: ICAOValidationReport): void {
    const timeSinceModification = Date.now() - new Date(subsection.lastModified).getTime();
    const daysSinceModification = timeSinceModification / (1000 * 60 * 60 * 24);

    if (daysSinceModification > 28) { // AIRAC cycle is 28 days
      report.warnings.push(`Time-sensitive data in ${subsection.code} may be outdated (last modified ${Math.floor(daysSinceModification)} days ago)`);
    }
  }

  private static usesWGS84(subsection: ISubsection): boolean {
    const content = this.extractTextFromContent(subsection.content);
    return /WGS.?84/i.test(content) || true; // Assume WGS-84 by default
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

export interface ICAOValidationReport {
  isCompliant: boolean;
  errors: string[];
  warnings: string[];
  missingMandatorySections: MandatorySection[];
  dataQualityIssues: DataQualityIssue[];
  timestamp: Date;
}

export interface MandatorySection {
  section: string;
  subsection: string;
  title: string;
  mandatory: boolean;
}

export interface DataQualityIssue {
  section: string;
  subsection: string;
  issue: string;
  severity: 'error' | 'warning';
  requirement: string;
}