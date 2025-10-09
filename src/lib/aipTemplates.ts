/**
 * AIP Document Templates - ICAO Annex 15 & EUROCONTROL Spec 3.0 Compliant
 *
 * This file contains the mandatory structure for AIP documents according to:
 * - ICAO Annex 15 (Aeronautical Information Services)
 * - EUROCONTROL Specification for Pre-flight Information Bulletin (PIB)
 */

export interface SubsectionTemplate {
  code: string;
  title: string;
  content: string;
  isMandatory: boolean;
  order: number;
}

export interface SectionTemplate {
  type: string;
  title: string;
  description: string;
  isMandatory: boolean;
  subsections: SubsectionTemplate[];
}

/**
 * GEN - General (Mandatory for all AIPs)
 */
export const GEN_TEMPLATE: SectionTemplate[] = [
  {
    type: 'GEN',
    title: 'GEN - General',
    description: 'General information about the AIP and aeronautical information services',
    isMandatory: true,
    subsections: [
      {
        code: '0.1',
        title: 'Preface',
        content: '<h2>GEN 0.1 - Preface</h2><p>This section should contain:</p><ul><li>General information about the AIP</li><li>Publication authority</li><li>Applicable ICAO standards</li><li>Contact information for amendments</li></ul>',
        isMandatory: true,
        order: 0
      },
      {
        code: '0.2',
        title: 'Record of AIP Amendments',
        content: '<h2>GEN 0.2 - Record of AIP Amendments</h2><table><thead><tr><th>Amendment Number</th><th>Effective Date</th><th>AIRAC Date</th><th>Sections Affected</th></tr></thead><tbody><tr><td colspan="4">No amendments recorded yet</td></tr></tbody></table>',
        isMandatory: true,
        order: 1
      },
      {
        code: '0.3',
        title: 'Record of AIP Supplements',
        content: '<h2>GEN 0.3 - Record of AIP Supplements</h2><table><thead><tr><th>Supplement Number</th><th>Subject</th><th>Effective Date</th><th>Period of Validity</th></tr></thead><tbody><tr><td colspan="4">No supplements recorded yet</td></tr></tbody></table>',
        isMandatory: true,
        order: 2
      },
      {
        code: '0.4',
        title: 'Checklist of AIP Pages',
        content: '<h2>GEN 0.4 - Checklist of AIP Pages</h2><p>This checklist shows the currency status of all pages in the AIP.</p>',
        isMandatory: true,
        order: 3
      },
      {
        code: '0.5',
        title: 'List of Hand Amendments',
        content: '<h2>GEN 0.5 - List of Hand Amendments</h2><table><thead><tr><th>Page Number</th><th>Amendment Details</th><th>Date</th></tr></thead><tbody><tr><td colspan="3">No hand amendments recorded</td></tr></tbody></table>',
        isMandatory: true,
        order: 4
      },
      {
        code: '0.6',
        title: 'Table of Contents',
        content: '<h2>GEN 0.6 - Table of Contents</h2><p>This section will be automatically generated from the AIP structure.</p>',
        isMandatory: true,
        order: 5
      },
      {
        code: '1.1',
        title: 'Designated Authorities',
        content: '<h2>GEN 1.1 - Designated Authorities</h2><p>List of designated authorities responsible for air navigation services:</p><ul><li>Civil Aviation Authority</li><li>Air Traffic Services Provider</li><li>Meteorological Service Provider</li><li>AIS Provider</li></ul>',
        isMandatory: true,
        order: 6
      },
      {
        code: '1.2',
        title: 'Entry, Transit and Departure of Aircraft',
        content: '<h2>GEN 1.2 - Entry, Transit and Departure of Aircraft</h2><p>Regulations and procedures for:</p><ul><li>Entry requirements</li><li>Transit procedures</li><li>Departure formalities</li></ul>',
        isMandatory: true,
        order: 7
      },
      {
        code: '1.3',
        title: 'Entry and Departure of Passengers and Crew',
        content: '<h2>GEN 1.3 - Entry and Departure of Passengers and Crew</h2><p>Requirements for:</p><ul><li>Passports and visas</li><li>Health requirements</li><li>Customs and immigration</li></ul>',
        isMandatory: true,
        order: 8
      },
      {
        code: '1.4',
        title: 'Entry and Departure of Cargo',
        content: '<h2>GEN 1.4 - Entry and Departure of Cargo</h2><p>Customs and cargo handling procedures.</p>',
        isMandatory: true,
        order: 9
      },
      {
        code: '1.5',
        title: 'Aircraft Instruments, Equipment and Flight Documents',
        content: '<h2>GEN 1.5 - Aircraft Instruments, Equipment and Flight Documents</h2><p>Required instruments, equipment, and documentation.</p>',
        isMandatory: true,
        order: 10
      },
      {
        code: '1.6',
        title: 'Summary of National Regulations and International Agreements',
        content: '<h2>GEN 1.6 - Summary of National Regulations</h2><p>Overview of national regulations and international agreements.</p>',
        isMandatory: true,
        order: 11
      },
      {
        code: '1.7',
        title: 'Differences from ICAO Standards, Recommended Practices and Procedures',
        content: '<h2>GEN 1.7 - Differences from ICAO SARPs</h2><p>Documented differences from ICAO Annex provisions.</p>',
        isMandatory: true,
        order: 12
      },
      {
        code: '2.1',
        title: 'Measuring System, Aircraft Markings, Holidays',
        content: '<h2>GEN 2.1 - Measuring System, Aircraft Markings, Holidays</h2><ul><li>Units of measurement</li><li>Aircraft nationality and registration markings</li><li>Public holidays</li></ul>',
        isMandatory: true,
        order: 13
      },
      {
        code: '2.2',
        title: 'Abbreviations',
        content: '<h2>GEN 2.2 - Abbreviations</h2><p>List of abbreviations used in this AIP.</p>',
        isMandatory: true,
        order: 14
      },
      {
        code: '2.3',
        title: 'Chart Symbols',
        content: '<h2>GEN 2.3 - Chart Symbols</h2><p>Explanation of symbols used in aeronautical charts.</p>',
        isMandatory: true,
        order: 15
      },
      {
        code: '2.4',
        title: 'Location Indicators',
        content: '<h2>GEN 2.4 - Location Indicators</h2><p>ICAO four-letter location indicators for aeronautical fixed stations.</p>',
        isMandatory: true,
        order: 16
      },
      {
        code: '2.5',
        title: 'List of Radio Navigation Aids',
        content: '<h2>GEN 2.5 - List of Radio Navigation Aids</h2><p>Complete list of radio navigation aids and their characteristics.</p>',
        isMandatory: true,
        order: 17
      },
      {
        code: '2.6',
        title: 'Conversion Tables',
        content: '<h2>GEN 2.6 - Conversion Tables</h2><p>Tables for conversion between different units of measurement.</p>',
        isMandatory: true,
        order: 18
      },
      {
        code: '2.7',
        title: 'Sunrise/Sunset Tables',
        content: '<h2>GEN 2.7 - Sunrise/Sunset Tables</h2><p>Sunrise and sunset times for principal locations.</p>',
        isMandatory: true,
        order: 19
      },
      {
        code: '3.1',
        title: 'Aeronautical Information Services',
        content: '<h2>GEN 3.1 - Aeronautical Information Services</h2><p>Responsible service, contact details, and hours of service.</p>',
        isMandatory: true,
        order: 20
      },
      {
        code: '3.2',
        title: 'Aeronautical Charts',
        content: '<h2>GEN 3.2 - Aeronautical Charts</h2><p>List of available aeronautical charts and how to obtain them.</p>',
        isMandatory: true,
        order: 21
      },
      {
        code: '3.3',
        title: 'AIP Amendment Service',
        content: '<h2>GEN 3.3 - AIP Amendment Service</h2><p>Frequency and procedures for AIP amendments.</p>',
        isMandatory: true,
        order: 22
      },
      {
        code: '3.4',
        title: 'AIP Supplements',
        content: '<h2>GEN 3.4 - AIP Supplements</h2><p>Purpose and use of AIP supplements.</p>',
        isMandatory: true,
        order: 23
      },
      {
        code: '3.5',
        title: 'NOTAM and Pre-flight Information Bulletin (PIB)',
        content: '<h2>GEN 3.5 - NOTAM and PIB</h2><p>NOTAM system and PIB service information.</p>',
        isMandatory: true,
        order: 24
      },
      {
        code: '3.6',
        title: 'Electronic Terrain and Obstacle Data',
        content: '<h2>GEN 3.6 - Electronic Terrain and Obstacle Data</h2><p>Availability and access to electronic terrain and obstacle data.</p>',
        isMandatory: true,
        order: 25
      },
      {
        code: '4.1',
        title: 'Aerodromes/Heliports',
        content: '<h2>GEN 4.1 - Aerodromes/Heliports</h2><p>Availability of aerodromes and heliports for international use.</p>',
        isMandatory: true,
        order: 26
      },
      {
        code: '4.2',
        title: 'Air Traffic Services Airspace Classification',
        content: '<h2>GEN 4.2 - Air Traffic Services Airspace Classification</h2><p>Description of airspace classification system.</p>',
        isMandatory: true,
        order: 27
      },
      {
        code: '4.3',
        title: 'Noise Abatement Procedures',
        content: '<h2>GEN 4.3 - Noise Abatement Procedures</h2><p>General noise abatement procedures applicable.</p>',
        isMandatory: false,
        order: 28
      },
      {
        code: '4.4',
        title: 'Categories of Aircraft and Wake Turbulence',
        content: '<h2>GEN 4.4 - Categories of Aircraft and Wake Turbulence</h2><p>Aircraft categorization system and wake turbulence separation.</p>',
        isMandatory: true,
        order: 29
      }
    ]
  }
];

/**
 * ENR - En-route (Mandatory for all AIPs)
 */
export const ENR_TEMPLATE: SectionTemplate[] = [
  {
    type: 'ENR',
    title: 'ENR - En-route',
    description: 'En-route information including airways, airspace, and navigation services',
    isMandatory: true,
    subsections: [
      {
        code: '1.1',
        title: 'General Rules',
        content: '<h2>ENR 1.1 - General Rules</h2><p>Visual flight rules and instrument flight rules applicable.</p>',
        isMandatory: true,
        order: 0
      },
      {
        code: '1.2',
        title: 'Visual Flight Rules',
        content: '<h2>ENR 1.2 - Visual Flight Rules</h2><p>VFR flight level allocation, VMC minima, and airspace restrictions.</p>',
        isMandatory: true,
        order: 1
      },
      {
        code: '1.3',
        title: 'Instrument Flight Rules',
        content: '<h2>ENR 1.3 - Instrument Flight Rules</h2><p>IFR flight level allocation, altimeter setting procedures.</p>',
        isMandatory: true,
        order: 2
      },
      {
        code: '1.4',
        title: 'ATS Airspace Classification and Description',
        content: '<h2>ENR 1.4 - ATS Airspace Classification</h2><p>Classification and detailed description of ATS airspace.</p>',
        isMandatory: true,
        order: 3
      },
      {
        code: '1.5',
        title: 'Holding, Approach and Departure Procedures',
        content: '<h2>ENR 1.5 - Holding, Approach and Departure Procedures</h2><p>General procedures for holding, approaches, and departures.</p>',
        isMandatory: true,
        order: 4
      },
      {
        code: '1.6',
        title: 'ATS Surveillance Services and Procedures',
        content: '<h2>ENR 1.6 - ATS Surveillance Services</h2><p>Radar and ADS-B surveillance coverage and procedures.</p>',
        isMandatory: true,
        order: 5
      },
      {
        code: '1.7',
        title: 'Altimeter Setting Procedures',
        content: '<h2>ENR 1.7 - Altimeter Setting Procedures</h2><p>Transition altitude/level and QNH source information.</p>',
        isMandatory: true,
        order: 6
      },
      {
        code: '1.8',
        title: 'Regional Supplementary Procedures',
        content: '<h2>ENR 1.8 - Regional Supplementary Procedures</h2><p>ICAO Regional Supplementary Procedures (Doc 7030) applicable.</p>',
        isMandatory: true,
        order: 7
      },
      {
        code: '1.9',
        title: 'Air Traffic Flow Management',
        content: '<h2>ENR 1.9 - Air Traffic Flow Management</h2><p>ATFM procedures and slot allocation system.</p>',
        isMandatory: false,
        order: 8
      },
      {
        code: '1.10',
        title: 'Flight Planning',
        content: '<h2>ENR 1.10 - Flight Planning</h2><p>Flight plan submission procedures and requirements.</p>',
        isMandatory: true,
        order: 9
      },
      {
        code: '1.11',
        title: 'Addressing of Flight Plan Messages',
        content: '<h2>ENR 1.11 - Addressing of Flight Plan Messages</h2><p>AFTN addresses for flight plan messages.</p>',
        isMandatory: true,
        order: 10
      },
      {
        code: '1.12',
        title: 'Interception of Civil Aircraft',
        content: '<h2>ENR 1.12 - Interception of Civil Aircraft</h2><p>Procedures in case of interception of civil aircraft.</p>',
        isMandatory: true,
        order: 11
      },
      {
        code: '1.13',
        title: 'Unlawful Interference',
        content: '<h2>ENR 1.13 - Unlawful Interference</h2><p>Procedures for acts of unlawful interference.</p>',
        isMandatory: true,
        order: 12
      },
      {
        code: '1.14',
        title: 'Air Traffic Incidents',
        content: '<h2>ENR 1.14 - Air Traffic Incidents</h2><p>Reporting procedures for air traffic incidents.</p>',
        isMandatory: true,
        order: 13
      },
      {
        code: '2.1',
        title: 'FIR, UIR, TMA',
        content: '<h2>ENR 2.1 - FIR, UIR, TMA</h2><p>Flight Information Regions, Upper Information Regions, and Terminal Control Areas.</p>',
        isMandatory: true,
        order: 14
      },
      {
        code: '2.2',
        title: 'Other Regulated Airspace',
        content: '<h2>ENR 2.2 - Other Regulated Airspace</h2><p>Prohibited, restricted, and danger areas.</p>',
        isMandatory: true,
        order: 15
      },
      {
        code: '3.1',
        title: 'Lower ATS Routes',
        content: '<h2>ENR 3.1 - Lower ATS Routes</h2><p>Description of lower ATS routes and route segments.</p>',
        isMandatory: true,
        order: 16
      },
      {
        code: '3.2',
        title: 'Upper ATS Routes',
        content: '<h2>ENR 3.2 - Upper ATS Routes</h2><p>Description of upper ATS routes and route segments.</p>',
        isMandatory: true,
        order: 17
      },
      {
        code: '3.3',
        title: 'Area Navigation Routes',
        content: '<h2>ENR 3.3 - RNAV Routes</h2><p>RNAV route structure and requirements.</p>',
        isMandatory: false,
        order: 18
      },
      {
        code: '4.1',
        title: 'Radio Navigation Aids - En-route',
        content: '<h2>ENR 4.1 - Radio Navigation Aids - En-route</h2><p>VOR, DME, NDB and other navigation aids.</p>',
        isMandatory: true,
        order: 19
      },
      {
        code: '4.2',
        title: 'Special Navigation Systems',
        content: '<h2>ENR 4.2 - Special Navigation Systems</h2><p>GNSS, SBAS coverage and requirements.</p>',
        isMandatory: false,
        order: 20
      },
      {
        code: '4.3',
        title: 'Name-Code Designators for Significant Points',
        content: '<h2>ENR 4.3 - Significant Points</h2><p>List of significant points with name-code designators.</p>',
        isMandatory: true,
        order: 21
      },
      {
        code: '5.1',
        title: 'Prohibited, Restricted and Danger Areas',
        content: '<h2>ENR 5.1 - Prohibited, Restricted and Danger Areas</h2><p>Detailed description of special use airspace.</p>',
        isMandatory: true,
        order: 22
      },
      {
        code: '5.2',
        title: 'Military Exercise and Training Areas',
        content: '<h2>ENR 5.2 - Military Exercise and Training Areas</h2><p>Temporary segregated areas for military use.</p>',
        isMandatory: false,
        order: 23
      },
      {
        code: '5.3',
        title: 'Other Activities of a Dangerous Nature',
        content: '<h2>ENR 5.3 - Other Activities of Dangerous Nature</h2><p>Aerial sporting, parachuting, gliding areas.</p>',
        isMandatory: false,
        order: 24
      },
      {
        code: '5.4',
        title: 'Air Navigation Obstacles',
        content: '<h2>ENR 5.4 - Air Navigation Obstacles</h2><p>En-route obstacles exceeding specific heights.</p>',
        isMandatory: true,
        order: 25
      },
      {
        code: '5.5',
        title: 'Sports and Recreational Activities',
        content: '<h2>ENR 5.5 - Sports and Recreational Activities</h2><p>Areas where sports and recreational flying activities take place.</p>',
        isMandatory: false,
        order: 26
      },
      {
        code: '6.1',
        title: 'En-route Charts',
        content: '<h2>ENR 6.1 - En-route Charts</h2><p>Index to en-route chart coverage.</p>',
        isMandatory: true,
        order: 27
      }
    ]
  }
];

/**
 * AD - Aerodromes (Mandatory for each aerodrome)
 */
export const AD_TEMPLATE: SectionTemplate[] = [
  {
    type: 'AD',
    title: 'AD - Aerodromes',
    description: 'Aerodrome information including facilities, procedures, and charts',
    isMandatory: true,
    subsections: [
      {
        code: '1.1',
        title: 'Aerodromes - Introduction',
        content: '<h2>AD 1.1 - Introduction</h2><p>General information about aerodromes available for international use.</p>',
        isMandatory: true,
        order: 0
      },
      {
        code: '1.2',
        title: 'Rescue and Fire Fighting Services',
        content: '<h2>AD 1.2 - Rescue and Fire Fighting Services</h2><p>Aerodrome categories for rescue and fire fighting services.</p>',
        isMandatory: true,
        order: 1
      },
      {
        code: '1.3',
        title: 'Index to Aerodromes',
        content: '<h2>AD 1.3 - Index to Aerodromes</h2><p>Alphabetical list of aerodromes.</p>',
        isMandatory: true,
        order: 2
      },
      {
        code: '1.4',
        title: 'Grouping of Aerodromes',
        content: '<h2>AD 1.4 - Grouping of Aerodromes</h2><p>Geographical or functional grouping of aerodromes.</p>',
        isMandatory: false,
        order: 3
      },
      {
        code: '2.1',
        title: 'Aerodrome Location Indicator and Name',
        content: '<h2>AD 2.1 - Aerodrome Location Indicator and Name</h2><p>ICAO location indicator and aerodrome name.</p>',
        isMandatory: true,
        order: 4
      },
      {
        code: '2.2',
        title: 'Aerodrome Geographical and Administrative Data',
        content: '<h2>AD 2.2 - Geographical and Administrative Data</h2><p>ARP coordinates, elevation, operating authority, contact details.</p>',
        isMandatory: true,
        order: 5
      },
      {
        code: '2.3',
        title: 'Operational Hours',
        content: '<h2>AD 2.3 - Operational Hours</h2><p>Hours of operation for aerodrome and services.</p>',
        isMandatory: true,
        order: 6
      },
      {
        code: '2.4',
        title: 'Handling Services and Facilities',
        content: '<h2>AD 2.4 - Handling Services and Facilities</h2><p>Available services: fuel, oxygen, hangarage, etc.</p>',
        isMandatory: true,
        order: 7
      },
      {
        code: '2.5',
        title: 'Passenger Facilities',
        content: '<h2>AD 2.5 - Passenger Facilities</h2><p>Hotels, restaurants, banks, post office, medical facilities.</p>',
        isMandatory: true,
        order: 8
      },
      {
        code: '2.6',
        title: 'Rescue and Fire Fighting Services',
        content: '<h2>AD 2.6 - Rescue and Fire Fighting Services</h2><p>Level of protection provided and equipment available.</p>',
        isMandatory: true,
        order: 9
      },
      {
        code: '2.7',
        title: 'Seasonal Availability and Clearance',
        content: '<h2>AD 2.7 - Seasonal Availability</h2><p>Snow clearance capability and seasonal limitations.</p>',
        isMandatory: true,
        order: 10
      },
      {
        code: '2.8',
        title: 'Apron, Taxiways and Check Locations/Positions',
        content: '<h2>AD 2.8 - Apron, Taxiways</h2><p>Apron and taxiway data, holding positions.</p>',
        isMandatory: true,
        order: 11
      },
      {
        code: '2.9',
        title: 'Surface Movement Guidance and Control System and Markings',
        content: '<h2>AD 2.9 - Surface Movement Guidance</h2><p>Lighting, signs, and marking systems.</p>',
        isMandatory: true,
        order: 12
      },
      {
        code: '2.10',
        title: 'Aerodrome Obstacles',
        content: '<h2>AD 2.10 - Aerodrome Obstacles</h2><p>Obstacles in take-off and approach areas.</p>',
        isMandatory: true,
        order: 13
      },
      {
        code: '2.11',
        title: 'Meteorological Information',
        content: '<h2>AD 2.11 - Meteorological Information</h2><p>MET services provided and briefing facilities.</p>',
        isMandatory: true,
        order: 14
      },
      {
        code: '2.12',
        title: 'Runway Physical Characteristics',
        content: '<h2>AD 2.12 - Runway Physical Characteristics</h2><p>Designations, dimensions, surface type, strength.</p>',
        isMandatory: true,
        order: 15
      },
      {
        code: '2.13',
        title: 'Declared Distances',
        content: '<h2>AD 2.13 - Declared Distances</h2><p>TORA, TODA, ASDA, LDA for each runway.</p>',
        isMandatory: true,
        order: 16
      },
      {
        code: '2.14',
        title: 'Approach and Runway Lighting',
        content: '<h2>AD 2.14 - Approach and Runway Lighting</h2><p>Type and intensity of approach and runway lighting.</p>',
        isMandatory: true,
        order: 17
      },
      {
        code: '2.15',
        title: 'Other Lighting, Secondary Power Supply',
        content: '<h2>AD 2.15 - Other Lighting</h2><p>Beacon, taxiway lighting, emergency power supply.</p>',
        isMandatory: true,
        order: 18
      },
      {
        code: '2.16',
        title: 'Helicopter Landing Area',
        content: '<h2>AD 2.16 - Helicopter Landing Area</h2><p>Helicopter facilities if available.</p>',
        isMandatory: false,
        order: 19
      },
      {
        code: '2.17',
        title: 'ATS Airspace',
        content: '<h2>AD 2.17 - ATS Airspace</h2><p>Description of CTR, ATZ, and other local airspace.</p>',
        isMandatory: true,
        order: 20
      },
      {
        code: '2.18',
        title: 'ATS Communication Facilities',
        content: '<h2>AD 2.18 - ATS Communication Facilities</h2><p>Radio frequencies for TWR, APP, ATIS, etc.</p>',
        isMandatory: true,
        order: 21
      },
      {
        code: '2.19',
        title: 'Radio Navigation and Landing Aids',
        content: '<h2>AD 2.19 - Radio Navigation and Landing Aids</h2><p>ILS, VOR/DME, NDB and other aids.</p>',
        isMandatory: true,
        order: 22
      },
      {
        code: '2.20',
        title: 'Local Traffic Regulations',
        content: '<h2>AD 2.20 - Local Traffic Regulations</h2><p>Noise abatement, traffic patterns, slot restrictions.</p>',
        isMandatory: true,
        order: 23
      },
      {
        code: '2.21',
        title: 'Noise Abatement Procedures',
        content: '<h2>AD 2.21 - Noise Abatement Procedures</h2><p>Specific noise abatement procedures.</p>',
        isMandatory: false,
        order: 24
      },
      {
        code: '2.22',
        title: 'Flight Procedures',
        content: '<h2>AD 2.22 - Flight Procedures</h2><p>SIDs, STARs, approach procedures.</p>',
        isMandatory: true,
        order: 25
      },
      {
        code: '2.23',
        title: 'Additional Information',
        content: '<h2>AD 2.23 - Additional Information</h2><p>Any other relevant aerodrome information.</p>',
        isMandatory: false,
        order: 26
      },
      {
        code: '2.24',
        title: 'Charts Related to an Aerodrome',
        content: '<h2>AD 2.24 - Aerodrome Charts</h2><p>Index to aerodrome charts: aerodrome chart, parking/docking chart, etc.</p>',
        isMandatory: true,
        order: 27
      }
    ]
  }
];

/**
 * SUPPLEMENT Template
 */
export const SUPPLEMENT_TEMPLATE: SectionTemplate[] = [
  {
    type: 'SUPPLEMENT',
    title: 'AIP Supplement',
    description: 'Temporary changes of long duration (3 months or more) to AIP information',
    isMandatory: true,
    subsections: [
      {
        code: '1',
        title: 'General Information',
        content: '<h2>General Information</h2><p>Purpose and scope of this supplement.</p>',
        isMandatory: true,
        order: 0
      },
      {
        code: '2',
        title: 'Affected Sections',
        content: '<h2>Affected Sections</h2><p>List of AIP sections affected by this supplement.</p>',
        isMandatory: true,
        order: 1
      },
      {
        code: '3',
        title: 'Details',
        content: '<h2>Details</h2><p>Detailed information about the changes.</p>',
        isMandatory: true,
        order: 2
      },
      {
        code: '4',
        title: 'Effective Dates',
        content: '<h2>Effective Dates</h2><p>Effective date and period of validity.</p>',
        isMandatory: true,
        order: 3
      }
    ]
  }
];

/**
 * NOTAM Template
 */
export const NOTAM_TEMPLATE: SectionTemplate[] = [
  {
    type: 'NOTAM',
    title: 'Notice to Airmen (NOTAM)',
    description: 'Time-critical aeronautical information of a temporary nature or not sufficiently known in advance',
    isMandatory: true,
    subsections: [
      {
        code: 'Q',
        title: 'NOTAM Code',
        content: '<h2>NOTAM Code (Q-Line)</h2><p>FIR, NOTAM Code, Traffic, Purpose, Scope, Lower/Upper Limits, Coordinates, Radius.</p>',
        isMandatory: true,
        order: 0
      },
      {
        code: 'A',
        title: 'Location Indicator',
        content: '<h2>A) Location Indicator</h2><p>ICAO four-letter location indicator.</p>',
        isMandatory: true,
        order: 1
      },
      {
        code: 'B',
        title: 'Start Date/Time',
        content: '<h2>B) Start Date/Time</h2><p>Effective start date and time (UTC).</p>',
        isMandatory: true,
        order: 2
      },
      {
        code: 'C',
        title: 'End Date/Time',
        content: '<h2>C) End Date/Time</h2><p>Effective end date and time (UTC), or PERM for permanent.</p>',
        isMandatory: true,
        order: 3
      },
      {
        code: 'D',
        title: 'Schedule',
        content: '<h2>D) Schedule</h2><p>Daily schedule if applicable (e.g., 0800-1600).</p>',
        isMandatory: false,
        order: 4
      },
      {
        code: 'E',
        title: 'Details',
        content: '<h2>E) Details</h2><p>Plain language description of the condition, activity, or event.</p>',
        isMandatory: true,
        order: 5
      },
      {
        code: 'F',
        title: 'Lower Limit',
        content: '<h2>F) Lower Limit</h2><p>Lower limit of affected airspace.</p>',
        isMandatory: false,
        order: 6
      },
      {
        code: 'G',
        title: 'Upper Limit',
        content: '<h2>G) Upper Limit</h2><p>Upper limit of affected airspace.</p>',
        isMandatory: false,
        order: 7
      }
    ]
  }
];

/**
 * Get templates for a specific document type
 */
export function getTemplatesByType(documentType: string): SectionTemplate[] {
  const type = documentType.toUpperCase();

  switch (type) {
    case 'GEN':
      return GEN_TEMPLATE;
    case 'ENR':
      return ENR_TEMPLATE;
    case 'AD':
      return AD_TEMPLATE;
    case 'AIP':
      // Full AIP includes all three mandatory parts: GEN, ENR, and AD
      return [...GEN_TEMPLATE, ...ENR_TEMPLATE, ...AD_TEMPLATE];
    case 'SUPPLEMENT':
      return SUPPLEMENT_TEMPLATE;
    case 'NOTAM':
      return NOTAM_TEMPLATE;
    default:
      return [];
  }
}

/**
 * Get all mandatory sections for a document type
 */
export function getMandatorySections(documentType: string): SectionTemplate[] {
  const templates = getTemplatesByType(documentType);
  return templates.map(section => ({
    ...section,
    subsections: section.subsections.filter(sub => sub.isMandatory)
  }));
}

/**
 * Generate compliance report
 */
export function generateComplianceReport(
  documentType: string,
  existingSections: any[]
): {
  isCompliant: boolean;
  missingSections: string[];
  missingSubsections: string[];
  compliancePercentage: number;
} {
  const mandatoryTemplates = getMandatorySections(documentType);
  const missingSections: string[] = [];
  const missingSubsections: string[] = [];

  let totalMandatory = 0;
  let foundMandatory = 0;

  mandatoryTemplates.forEach(template => {
    const existingSection = existingSections.find(s => s.type === template.type);

    template.subsections.forEach(subsection => {
      if (subsection.isMandatory) {
        totalMandatory++;

        const found = existingSection?.subsections?.find(
          (s: any) => s.code === subsection.code
        );

        if (found) {
          foundMandatory++;
        } else {
          missingSubsections.push(`${subsection.code} - ${subsection.title}`);
        }
      }
    });

    if (!existingSection) {
      missingSections.push(`${template.type} - ${template.title}`);
    }
  });

  const compliancePercentage = totalMandatory > 0
    ? Math.round((foundMandatory / totalMandatory) * 100)
    : 100;

  return {
    isCompliant: missingSections.length === 0 && missingSubsections.length === 0,
    missingSections,
    missingSubsections,
    compliancePercentage
  };
}
