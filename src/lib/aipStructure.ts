/**
 * ICAO Annex 15 Compliant AIP Structure
 * Based on standard eAIP format used by CAAM Malaysia and other civil aviation authorities
 */

export interface AIRACCycle {
  cycle: string; // Format: YYMM
  effectiveDate: string;
  amendments: Amendment[];
}

export interface Amendment {
  number: string; // e.g., "01/24"
  type: 'AIRAC' | 'Non-AIRAC' | 'Trigger';
  effectiveDate: string;
  description: string;
  affectedSections: string[];
  regulationReference?: string;
}

export interface RegulationReference {
  authority: string; // e.g., "ICAO", "EASA", "FAA"
  document: string; // e.g., "Annex 15", "Part-AIS"
  section: string;
  requirement: string;
  complianceStatus: 'compliant' | 'partial' | 'non-compliant' | 'not-applicable';
  lastReviewed: string;
  notes?: string;
}

export interface AIPSection {
  code: string; // e.g., "GEN", "GEN 1", "GEN 1.1"
  title: string;
  order: number;
  parent?: string; // Parent section code
  level: number; // 1=Part (GEN), 2=Section (GEN 1), 3=Subsection (GEN 1.1), 4=Item (GEN 1.1.1)
  isMandatory: boolean;
  icaoReference: string; // ICAO Annex 15 reference
  children?: AIPSection[];
  regulations?: RegulationReference[];
}

/**
 * Complete ICAO Annex 15 AIP Structure
 * Part 1: General (GEN)
 * Part 2: En-route (ENR)
 * Part 3: Aerodromes (AD)
 */
export const ICAO_AIP_STRUCTURE: AIPSection[] = [
  {
    code: 'GEN',
    title: 'General (GEN)',
    order: 1,
    level: 1,
    isMandatory: true,
    icaoReference: 'Annex 15, Part 2',
    children: [
      {
        code: 'GEN 0',
        title: 'GEN 0 - Preface',
        order: 0,
        parent: 'GEN',
        level: 2,
        isMandatory: true,
        icaoReference: 'Annex 15, 3.2.2',
        children: [
          {
            code: 'GEN 0.1',
            title: 'GEN 0.1 - Applicable AIRAC system',
            order: 1,
            parent: 'GEN 0',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.2.1'
          },
          {
            code: 'GEN 0.2',
            title: 'GEN 0.2 - Record of AIP Amendments',
            order: 2,
            parent: 'GEN 0',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.2.2'
          },
          {
            code: 'GEN 0.3',
            title: 'GEN 0.3 - Record of AIP Supplements',
            order: 3,
            parent: 'GEN 0',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.2.3'
          },
          {
            code: 'GEN 0.4',
            title: 'GEN 0.4 - Checklist of AIP pages',
            order: 4,
            parent: 'GEN 0',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.2.4'
          },
          {
            code: 'GEN 0.5',
            title: 'GEN 0.5 - List of hand amendments to the AIP',
            order: 5,
            parent: 'GEN 0',
            level: 3,
            isMandatory: false,
            icaoReference: 'Annex 15, 3.2.2.5'
          },
          {
            code: 'GEN 0.6',
            title: 'GEN 0.6 - Table of contents to Part 1',
            order: 6,
            parent: 'GEN 0',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.2.6'
          }
        ]
      },
      {
        code: 'GEN 1',
        title: 'GEN 1 - National Regulations and Requirements',
        order: 1,
        parent: 'GEN',
        level: 2,
        isMandatory: true,
        icaoReference: 'Annex 15, 3.2.3',
        children: [
          {
            code: 'GEN 1.1',
            title: 'GEN 1.1 - Designated authorities',
            order: 1,
            parent: 'GEN 1',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.3.1'
          },
          {
            code: 'GEN 1.2',
            title: 'GEN 1.2 - Entry, transit and departure of aircraft',
            order: 2,
            parent: 'GEN 1',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.3.2'
          },
          {
            code: 'GEN 1.3',
            title: 'GEN 1.3 - Entry, transit and departure of passengers',
            order: 3,
            parent: 'GEN 1',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.3.3'
          },
          {
            code: 'GEN 1.4',
            title: 'GEN 1.4 - Entry, transit and departure of crew',
            order: 4,
            parent: 'GEN 1',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.3.4'
          },
          {
            code: 'GEN 1.5',
            title: 'GEN 1.5 - Aircraft instruments, equipment and flight documents',
            order: 5,
            parent: 'GEN 1',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.3.5'
          },
          {
            code: 'GEN 1.6',
            title: 'GEN 1.6 - Summary of national regulations and requirements',
            order: 6,
            parent: 'GEN 1',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.3.6'
          },
          {
            code: 'GEN 1.7',
            title: 'GEN 1.7 - Differences from ICAO Standards, Recommended Practices and Procedures',
            order: 7,
            parent: 'GEN 1',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.3.7'
          }
        ]
      },
      {
        code: 'GEN 2',
        title: 'GEN 2 - Tables and Codes',
        order: 2,
        parent: 'GEN',
        level: 2,
        isMandatory: true,
        icaoReference: 'Annex 15, 3.2.4',
        children: [
          {
            code: 'GEN 2.1',
            title: 'GEN 2.1 - Measuring system, aircraft markings, holidays',
            order: 1,
            parent: 'GEN 2',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.4.1'
          },
          {
            code: 'GEN 2.2',
            title: 'GEN 2.2 - Abbreviations',
            order: 2,
            parent: 'GEN 2',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.4.2'
          },
          {
            code: 'GEN 2.3',
            title: 'GEN 2.3 - Chart symbols',
            order: 3,
            parent: 'GEN 2',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.4.3'
          },
          {
            code: 'GEN 2.4',
            title: 'GEN 2.4 - Location indicators',
            order: 4,
            parent: 'GEN 2',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.4.4'
          },
          {
            code: 'GEN 2.5',
            title: 'GEN 2.5 - List of radio navigation aids',
            order: 5,
            parent: 'GEN 2',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.4.5'
          },
          {
            code: 'GEN 2.6',
            title: 'GEN 2.6 - Conversion tables',
            order: 6,
            parent: 'GEN 2',
            level: 3,
            isMandatory: false,
            icaoReference: 'Annex 15, 3.2.4.6'
          },
          {
            code: 'GEN 2.7',
            title: 'GEN 2.7 - Sunrise/sunset tables',
            order: 7,
            parent: 'GEN 2',
            level: 3,
            isMandatory: false,
            icaoReference: 'Annex 15, 3.2.4.7'
          }
        ]
      },
      {
        code: 'GEN 3',
        title: 'GEN 3 - Services',
        order: 3,
        parent: 'GEN',
        level: 2,
        isMandatory: true,
        icaoReference: 'Annex 15, 3.2.5',
        children: [
          {
            code: 'GEN 3.1',
            title: 'GEN 3.1 - Aeronautical information services',
            order: 1,
            parent: 'GEN 3',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.5.1'
          },
          {
            code: 'GEN 3.2',
            title: 'GEN 3.2 - Aeronautical charts',
            order: 2,
            parent: 'GEN 3',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.5.2'
          },
          {
            code: 'GEN 3.3',
            title: 'GEN 3.3 - Air traffic services',
            order: 3,
            parent: 'GEN 3',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.5.3'
          },
          {
            code: 'GEN 3.4',
            title: 'GEN 3.4 - Communication services',
            order: 4,
            parent: 'GEN 3',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.5.4'
          },
          {
            code: 'GEN 3.5',
            title: 'GEN 3.5 - Meteorological services',
            order: 5,
            parent: 'GEN 3',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.5.5'
          },
          {
            code: 'GEN 3.6',
            title: 'GEN 3.6 - Search and rescue',
            order: 6,
            parent: 'GEN 3',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.5.6'
          }
        ]
      },
      {
        code: 'GEN 4',
        title: 'GEN 4 - Charges for aerodromes/heliports and air navigation services',
        order: 4,
        parent: 'GEN',
        level: 2,
        isMandatory: true,
        icaoReference: 'Annex 15, 3.2.6',
        children: [
          {
            code: 'GEN 4.1',
            title: 'GEN 4.1 - Aerodrome/heliport charges',
            order: 1,
            parent: 'GEN 4',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.6.1'
          },
          {
            code: 'GEN 4.2',
            title: 'GEN 4.2 - Air navigation services charges',
            order: 2,
            parent: 'GEN 4',
            level: 3,
            isMandatory: true,
            icaoReference: 'Annex 15, 3.2.6.2'
          }
        ]
      }
    ]
  },
  {
    code: 'ENR',
    title: 'En-route (ENR)',
    order: 2,
    level: 1,
    isMandatory: true,
    icaoReference: 'Annex 15, Part 2',
    children: [
      {
        code: 'ENR 1',
        title: 'ENR 1 - General rules and procedures',
        order: 1,
        parent: 'ENR',
        level: 2,
        isMandatory: true,
        icaoReference: 'Annex 15, 3.3.2'
      },
      {
        code: 'ENR 2',
        title: 'ENR 2 - Air traffic services airspace',
        order: 2,
        parent: 'ENR',
        level: 2,
        isMandatory: true,
        icaoReference: 'Annex 15, 3.3.3'
      },
      {
        code: 'ENR 3',
        title: 'ENR 3 - ATS routes',
        order: 3,
        parent: 'ENR',
        level: 2,
        isMandatory: true,
        icaoReference: 'Annex 15, 3.3.4'
      },
      {
        code: 'ENR 4',
        title: 'ENR 4 - Radio navigation aids/systems',
        order: 4,
        parent: 'ENR',
        level: 2,
        isMandatory: true,
        icaoReference: 'Annex 15, 3.3.5'
      },
      {
        code: 'ENR 5',
        title: 'ENR 5 - Navigation warnings',
        order: 5,
        parent: 'ENR',
        level: 2,
        isMandatory: true,
        icaoReference: 'Annex 15, 3.3.6'
      },
      {
        code: 'ENR 6',
        title: 'ENR 6 - En-route charts',
        order: 6,
        parent: 'ENR',
        level: 2,
        isMandatory: true,
        icaoReference: 'Annex 15, 3.3.7'
      }
    ]
  },
  {
    code: 'AD',
    title: 'Aerodromes (AD)',
    order: 3,
    level: 1,
    isMandatory: true,
    icaoReference: 'Annex 15, Part 3',
    children: [
      {
        code: 'AD 1',
        title: 'AD 1 - Aerodromes - Introduction',
        order: 1,
        parent: 'AD',
        level: 2,
        isMandatory: true,
        icaoReference: 'Annex 15, 3.4.2'
      },
      {
        code: 'AD 2',
        title: 'AD 2 - Aerodromes',
        order: 2,
        parent: 'AD',
        level: 2,
        isMandatory: true,
        icaoReference: 'Annex 15, 3.4.3'
      },
      {
        code: 'AD 3',
        title: 'AD 3 - Heliports',
        order: 3,
        parent: 'AD',
        level: 2,
        isMandatory: false,
        icaoReference: 'Annex 15, 3.4.4'
      }
    ]
  }
];

/**
 * Get flattened list of all sections with their full hierarchy
 */
export function getFlattenedAIPStructure(): AIPSection[] {
  const result: AIPSection[] = [];

  function traverse(section: AIPSection) {
    result.push(section);
    if (section.children) {
      section.children.forEach(child => traverse(child));
    }
  }

  ICAO_AIP_STRUCTURE.forEach(part => traverse(part));
  return result;
}

/**
 * Get section by code
 */
export function getAIPSection(code: string): AIPSection | undefined {
  const flattened = getFlattenedAIPStructure();
  return flattened.find(s => s.code === code);
}

/**
 * Get children of a section
 */
export function getAIPSectionChildren(code: string): AIPSection[] {
  const section = getAIPSection(code);
  return section?.children || [];
}

/**
 * Get breadcrumb path for a section
 */
export function getAIPSectionPath(code: string): AIPSection[] {
  const path: AIPSection[] = [];
  const flattened = getFlattenedAIPStructure();

  let current = flattened.find(s => s.code === code);
  while (current) {
    path.unshift(current);
    if (current.parent) {
      current = flattened.find(s => s.code === current!.parent);
    } else {
      current = undefined;
    }
  }

  return path;
}
