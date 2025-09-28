// NOTAM (Notice to Airmen) Management System
// Compliant with ICAO Annex 15 and NOTAM Code Format

export class NOTAMManager {

  // NOTAM categories according to ICAO standards
  private static readonly NOTAM_CATEGORIES = {
    A: 'Availability of facilities and services',
    C: 'Construction or work affecting movement area',
    D: 'Danger areas and air traffic advisory service',
    E: 'Equipment and services',
    F: 'Facilities and services',
    G: 'General',
    H: 'Helicopter operations',
    I: 'Instrument approach procedures',
    K: 'Miscellaneous',
    L: 'Lighting and marking systems',
    M: 'Maintenance',
    N: 'Navigation aids and systems',
    O: 'Obstacles',
    P: 'Personnel and training',
    R: 'Restricted areas and air traffic advisory service',
    S: 'Security',
    T: 'Temporary restrictions',
    U: 'Unserviceability',
    V: 'VFR flight restrictions',
    W: 'Weather information',
    X: 'Other',
  };

  // NOTAM scopes
  private static readonly NOTAM_SCOPES = {
    A: 'Aerodrome',
    E: 'En-route',
    W: 'Navigation warning',
  };

  public static createNOTAM(data: NOTAMCreationData): NOTAM {
    const notam: NOTAM = {
      id: this.generateNOTAMId(data),
      series: data.series || 'A',
      number: data.number,
      year: data.year || new Date().getFullYear(),
      type: data.type || 'N', // N=New, R=Replace, C=Cancel
      scope: data.scope,
      purpose: data.purpose,
      location: data.location,
      effectiveFrom: data.effectiveFrom,
      effectiveTo: data.effectiveTo,
      schedule: data.schedule,
      text: data.text,
      category: data.category,
      traffic: data.traffic || 'IV', // I=International, V=Domestic, K=Checklist
      lower: data.lower,
      upper: data.upper,
      coordinates: data.coordinates,
      radius: data.radius,
      status: 'active',
      createdAt: new Date(),
      createdBy: data.createdBy,
      lastModified: new Date(),
      relatedAIP: data.relatedAIP
    };

    // Validate NOTAM format
    const validation = this.validateNOTAM(notam);
    if (!validation.isValid) {
      throw new Error(`Invalid NOTAM: ${validation.errors.join(', ')}`);
    }

    return notam;
  }

  public static formatNOTAMText(notam: NOTAM): string {
    // Format according to ICAO NOTAM format
    const lines: string[] = [];

    // First line: NOTAM identification
    lines.push(`${notam.id}`);

    // Q-line: Traffic applicability, purpose, scope, lower/upper limits, coordinates, radius
    const qLine = this.buildQLine(notam);
    lines.push(`Q) ${qLine}`);

    // A-line: Location
    lines.push(`A) ${notam.location}`);

    // B-line: Effective from
    lines.push(`B) ${this.formatNOTAMDateTime(notam.effectiveFrom)}`);

    // C-line: Effective to (if applicable)
    if (notam.effectiveTo) {
      lines.push(`C) ${this.formatNOTAMDateTime(notam.effectiveTo)}`);
    } else {
      lines.push(`C) PERM`);
    }

    // D-line: Schedule (if applicable)
    if (notam.schedule) {
      lines.push(`D) ${notam.schedule}`);
    }

    // E-line: NOTAM text
    lines.push(`E) ${notam.text}`);

    // F-line: Lower limit
    if (notam.lower) {
      lines.push(`F) ${notam.lower}`);
    }

    // G-line: Upper limit
    if (notam.upper) {
      lines.push(`G) ${notam.upper}`);
    }

    return lines.join('\n');
  }

  private static buildQLine(notam: NOTAM): string {
    let qLine = notam.traffic; // Traffic applicability

    // Add purpose (3 characters)
    qLine += '/' + notam.purpose.padEnd(3, 'X');

    // Add scope (2 characters)
    qLine += '/' + notam.scope.padEnd(2, 'X');

    // Add aerodrome (4 characters)
    qLine += '/' + notam.location.padEnd(4, 'X');

    // Add lower/upper limits
    const lower = notam.lower || '000';
    const upper = notam.upper || '999';
    qLine += '/' + lower + '/' + upper;

    // Add coordinates and radius if applicable
    if (notam.coordinates) {
      qLine += '/' + this.formatCoordinatesForNOTAM(notam.coordinates);
      if (notam.radius) {
        qLine += notam.radius;
      }
    }

    return qLine;
  }

  private static formatCoordinatesForNOTAM(coordinates: string): string {
    // Convert coordinates to NOTAM format (DDMMSSN/DDDMMSSSW)
    // This is a simplified implementation
    return coordinates.replace(/[°'"]/g, '').replace(/\s+/g, '');
  }

  private static formatNOTAMDateTime(date: Date): string {
    // Format: YYMMDDHHMM
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');

    return year + month + day + hour + minute;
  }

  private static generateNOTAMId(data: NOTAMCreationData): string {
    const year = (data.year || new Date().getFullYear()).toString().slice(-2);
    const series = data.series || 'A';
    const number = data.number.toString().padStart(4, '0');

    return `${series}${number}/${year}`;
  }

  public static validateNOTAM(notam: NOTAM): NOTAMValidation {
    const validation: NOTAMValidation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validate required fields
    if (!notam.location) {
      validation.errors.push('Location is required');
      validation.isValid = false;
    }

    if (!notam.text) {
      validation.errors.push('NOTAM text is required');
      validation.isValid = false;
    }

    if (!notam.effectiveFrom) {
      validation.errors.push('Effective from date is required');
      validation.isValid = false;
    }

    // Validate location format (ICAO airport code)
    if (notam.location && !/^[A-Z]{4}$/.test(notam.location)) {
      validation.errors.push('Location must be a 4-letter ICAO airport code');
      validation.isValid = false;
    }

    // Validate category
    if (notam.category && !this.NOTAM_CATEGORIES[notam.category]) {
      validation.errors.push('Invalid NOTAM category');
      validation.isValid = false;
    }

    // Validate scope
    if (notam.scope && !this.NOTAM_SCOPES[notam.scope]) {
      validation.errors.push('Invalid NOTAM scope');
      validation.isValid = false;
    }

    // Validate date logic
    if (notam.effectiveFrom && notam.effectiveTo) {
      if (notam.effectiveTo <= notam.effectiveFrom) {
        validation.errors.push('Effective to date must be after effective from date');
        validation.isValid = false;
      }
    }

    // Validate altitude limits
    if (notam.lower && notam.upper) {
      const lower = this.parseAltitude(notam.lower);
      const upper = this.parseAltitude(notam.upper);

      if (lower !== null && upper !== null && upper <= lower) {
        validation.errors.push('Upper limit must be higher than lower limit');
        validation.isValid = false;
      }
    }

    // Warnings
    if (notam.text && notam.text.length > 1800) {
      validation.warnings.push('NOTAM text is very long (>1800 characters)');
    }

    if (notam.effectiveFrom && notam.effectiveFrom > new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) {
      validation.warnings.push('NOTAM effective date is more than one year in the future');
    }

    return validation;
  }

  private static parseAltitude(altitude: string): number | null {
    // Parse altitude strings like "FL100", "2000FT", "SFC"
    const flMatch = altitude.match(/^FL(\d+)$/);
    if (flMatch) {
      return parseInt(flMatch[1]) * 100; // Flight level to feet
    }

    const ftMatch = altitude.match(/^(\d+)FT$/);
    if (ftMatch) {
      return parseInt(ftMatch[1]);
    }

    if (altitude === 'SFC' || altitude === 'GND') {
      return 0;
    }

    if (altitude === 'UNL') {
      return 99999;
    }

    return null;
  }

  // NOTAM lifecycle management
  public static cancelNOTAM(notamId: string, cancelledBy: string, reason?: string): NOTAM {
    const cancelNOTAM: NOTAM = {
      id: notamId + 'C',
      series: 'A',
      number: 0, // Will be assigned by system
      year: new Date().getFullYear(),
      type: 'C', // Cancel
      scope: 'A',
      purpose: 'XX',
      location: '',
      effectiveFrom: new Date(),
      effectiveTo: null,
      schedule: null,
      text: `NOTAM ${notamId} CANCELLED${reason ? ': ' + reason : ''}`,
      category: 'K',
      traffic: 'IV',
      lower: null,
      upper: null,
      coordinates: null,
      radius: null,
      status: 'active',
      createdAt: new Date(),
      createdBy: cancelledBy,
      lastModified: new Date(),
      relatedAIP: null
    };

    return cancelNOTAM;
  }

  public static replaceNOTAM(originalId: string, newData: NOTAMCreationData): NOTAM {
    const replaceNOTAM = this.createNOTAM({
      ...newData,
      type: 'R', // Replace
      text: `REPLACES ${originalId}. ${newData.text}`
    });

    return replaceNOTAM;
  }

  // Integration with AIP documents
  public static generateNOTAMFromAIPChange(
    aipDocument: any,
    changeDescription: string,
    effectiveDate: Date,
    createdBy: string
  ): NOTAM {
    const location = aipDocument.airport || 'XXXX';
    const category = this.determineCategoryFromAIP(aipDocument, changeDescription);

    return this.createNOTAM({
      series: 'A',
      number: 1, // Will be assigned by system
      scope: 'A',
      purpose: category + 'XX',
      location,
      effectiveFrom: effectiveDate,
      effectiveTo: null, // Permanent change
      text: `AIP CHANGE: ${changeDescription}. REF AIP ${aipDocument.title}`,
      category,
      traffic: 'IV',
      createdBy,
      relatedAIP: aipDocument._id
    });
  }

  private static determineCategoryFromAIP(aipDocument: any, changeDescription: string): string {
    const text = (changeDescription + ' ' + JSON.stringify(aipDocument)).toLowerCase();

    if (text.includes('runway') || text.includes('taxiway')) return 'C';
    if (text.includes('navaid') || text.includes('navigation')) return 'N';
    if (text.includes('obstacle')) return 'O';
    if (text.includes('lighting') || text.includes('marking')) return 'L';
    if (text.includes('frequency') || text.includes('communication')) return 'E';
    if (text.includes('restricted') || text.includes('prohibited')) return 'R';
    if (text.includes('approach') || text.includes('procedure')) return 'I';

    return 'G'; // General
  }

  // NOTAM search and filtering
  public static searchNOTAMs(criteria: NOTAMSearchCriteria): NOTAM[] {
    // Implementation would query database
    // For now, return empty array
    return [];
  }

  public static getActiveNOTAMs(location?: string): NOTAM[] {
    // Implementation would query database for active NOTAMs
    return [];
  }

  public static getNOTAMHistory(location: string, days: number = 30): NOTAM[] {
    // Implementation would query database for historical NOTAMs
    return [];
  }

  // Integration with external NOTAM systems
  public static exportToICAOFormat(notam: NOTAM): string {
    return this.formatNOTAMText(notam);
  }

  public static importFromICAOFormat(notamText: string): NOTAM {
    // Parse ICAO NOTAM format text
    // This is a simplified implementation
    const lines = notamText.split('\n').map(line => line.trim());

    const notam: Partial<NOTAM> = {
      id: lines[0],
      status: 'active',
      createdAt: new Date(),
      lastModified: new Date()
    };

    // Parse each line
    lines.forEach(line => {
      if (line.startsWith('A)')) {
        notam.location = line.substring(2).trim();
      } else if (line.startsWith('B)')) {
        notam.effectiveFrom = this.parseNOTAMDateTime(line.substring(2).trim());
      } else if (line.startsWith('C)')) {
        const cValue = line.substring(2).trim();
        if (cValue !== 'PERM') {
          notam.effectiveTo = this.parseNOTAMDateTime(cValue);
        }
      } else if (line.startsWith('E)')) {
        notam.text = line.substring(2).trim();
      }
    });

    return notam as NOTAM;
  }

  private static parseNOTAMDateTime(dateStr: string): Date {
    // Parse YYMMDDHHMM format
    if (dateStr.length !== 10) {
      throw new Error('Invalid NOTAM date format');
    }

    const year = 2000 + parseInt(dateStr.substring(0, 2));
    const month = parseInt(dateStr.substring(2, 4)) - 1; // Month is 0-indexed
    const day = parseInt(dateStr.substring(4, 6));
    const hour = parseInt(dateStr.substring(6, 8));
    const minute = parseInt(dateStr.substring(8, 10));

    return new Date(year, month, day, hour, minute);
  }
}

// Type definitions
export interface NOTAM {
  id: string; // Format: A1234/23
  series: string; // A, B, C, etc.
  number: number;
  year: number;
  type: 'N' | 'R' | 'C'; // New, Replace, Cancel
  scope: string; // A=Aerodrome, E=En-route, W=Navigation warning
  purpose: string; // Purpose code
  location: string; // ICAO airport code
  effectiveFrom: Date;
  effectiveTo: Date | null;
  schedule: string | null; // Operating schedule
  text: string; // NOTAM text
  category: string; // A-X categories
  traffic: string; // I=International, V=Domestic, K=Checklist
  lower: string | null; // Lower altitude limit
  upper: string | null; // Upper altitude limit
  coordinates: string | null;
  radius: string | null;
  status: 'active' | 'cancelled' | 'expired';
  createdAt: Date;
  createdBy: string;
  lastModified: Date;
  relatedAIP: string | null; // Related AIP document ID
}

export interface NOTAMCreationData {
  series?: string;
  number: number;
  year?: number;
  type?: 'N' | 'R' | 'C';
  scope: string;
  purpose: string;
  location: string;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  schedule?: string | null;
  text: string;
  category: string;
  traffic?: string;
  lower?: string | null;
  upper?: string | null;
  coordinates?: string | null;
  radius?: string | null;
  createdBy: string;
  relatedAIP?: string | null;
}

export interface NOTAMValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface NOTAMSearchCriteria {
  location?: string;
  category?: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  status?: 'active' | 'cancelled' | 'expired';
  text?: string;
}