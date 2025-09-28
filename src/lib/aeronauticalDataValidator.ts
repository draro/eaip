// Aeronautical Data Validation according to ICAO and EUROCONTROL standards
export class AeronauticalDataValidator {

  // Coordinate validation patterns
  private static readonly COORDINATE_PATTERNS = {
    DMS: /^(\d{2,3})[°](\d{2})['](\d{2}(?:\.\d+)?)["]([NSEW])$/,
    DECIMAL_DEGREES: /^([+-]?\d{1,3}(?:\.\d+)?)$/,
    ICAO_FORMAT: /^(\d{2})(\d{2})(\d{2})([NS])(\d{3})(\d{2})(\d{2})([EW])$/
  };

  // Elevation validation (meters and feet)
  private static readonly ELEVATION_PATTERN = /^([+-]?\d+(?:\.\d+)?)\s*(m|ft|meter|metre|feet?)$/i;

  // Frequency validation (aviation frequencies)
  private static readonly FREQUENCY_PATTERNS = {
    VHF: /^1[0-3]\d\.\d{2,3}$/,  // 108.000 - 136.975 MHz
    UHF: /^[2-4]\d{2}\.\d{2,3}$/, // 225.000 - 399.975 MHz
    HF: /^[2-9]\d{3}(?:\.\d{1,2})?$/ // 2000 - 29999.99 kHz
  };

  // Runway designation validation
  private static readonly RUNWAY_PATTERN = /^(0[1-9]|[12]\d|3[0-6])[LCR]?$/;

  // ICAO airport/navaid identifier patterns
  private static readonly ICAO_IDENTIFIER_PATTERNS = {
    AIRPORT: /^[A-Z]{4}$/, // 4-letter ICAO code
    NAVAID: /^[A-Z]{2,3}$/, // 2-3 letter navaid identifier
    WAYPOINT: /^[A-Z0-9]{5}$/ // 5-character waypoint
  };

  public static validateCoordinates(coordinates: string, format?: 'DMS' | 'DECIMAL' | 'ICAO'): CoordinateValidation {
    const result: CoordinateValidation = {
      isValid: false,
      format: 'unknown',
      parsedValue: null,
      errors: [],
      warnings: []
    };

    const trimmed = coordinates.trim();

    // Try DMS format
    const dmsMatch = trimmed.match(this.COORDINATE_PATTERNS.DMS);
    if (dmsMatch) {
      result.format = 'DMS';
      const [, degrees, minutes, seconds, hemisphere] = dmsMatch;

      const deg = parseInt(degrees);
      const min = parseInt(minutes);
      const sec = parseFloat(seconds);

      // Validate ranges
      if (deg > (hemisphere === 'N' || hemisphere === 'S' ? 90 : 180)) {
        result.errors.push('Degrees value out of range');
      }
      if (min >= 60) {
        result.errors.push('Minutes value must be less than 60');
      }
      if (sec >= 60) {
        result.errors.push('Seconds value must be less than 60');
      }

      if (result.errors.length === 0) {
        result.isValid = true;
        result.parsedValue = this.dmsToDecimal(deg, min, sec, hemisphere);
      }
    }
    // Try decimal degrees
    else if (this.COORDINATE_PATTERNS.DECIMAL_DEGREES.test(trimmed)) {
      result.format = 'DECIMAL';
      const value = parseFloat(trimmed);

      if (Math.abs(value) > 180) {
        result.errors.push('Decimal degrees value out of range (-180 to 180)');
      } else {
        result.isValid = true;
        result.parsedValue = value;
      }
    }
    // Try ICAO format
    else if (this.COORDINATE_PATTERNS.ICAO_FORMAT.test(trimmed)) {
      result.format = 'ICAO';
      const match = trimmed.match(this.COORDINATE_PATTERNS.ICAO_FORMAT)!;
      const [, latDeg, latMin, latSec, latHem, lonDeg, lonMin, lonSec, lonHem] = match;

      const lat = this.dmsToDecimal(parseInt(latDeg), parseInt(latMin), parseInt(latSec), latHem);
      const lon = this.dmsToDecimal(parseInt(lonDeg), parseInt(lonMin), parseInt(lonSec), lonHem);

      result.isValid = true;
      result.parsedValue = { latitude: lat, longitude: lon };
    } else {
      result.errors.push('Coordinate format not recognized');
    }

    // Add precision warnings
    if (result.isValid && result.format === 'DECIMAL') {
      const precision = this.calculatePrecision(trimmed);
      if (precision < 5) {
        result.warnings.push('Coordinate precision may not meet ICAO requirements (±1m)');
      }
    }

    return result;
  }

  public static validateElevation(elevation: string): ElevationValidation {
    const result: ElevationValidation = {
      isValid: false,
      valueInMeters: null,
      originalValue: elevation,
      errors: [],
      warnings: []
    };

    const match = elevation.trim().match(this.ELEVATION_PATTERN);
    if (!match) {
      result.errors.push('Invalid elevation format. Expected: number followed by unit (m, ft, meter, feet)');
      return result;
    }

    const [, value, unit] = match;
    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
      result.errors.push('Invalid numeric value for elevation');
      return result;
    }

    // Convert to meters
    const unitLower = unit.toLowerCase();
    if (unitLower.startsWith('ft') || unitLower.startsWith('feet')) {
      result.valueInMeters = numValue * 0.3048; // feet to meters
    } else {
      result.valueInMeters = numValue;
    }

    // Validate realistic elevation ranges
    if (result.valueInMeters < -1000 || result.valueInMeters > 30000) {
      result.warnings.push('Elevation value outside typical aviation range (-1000m to 30000m)');
    }

    result.isValid = true;
    return result;
  }

  public static validateFrequency(frequency: string, band?: 'VHF' | 'UHF' | 'HF'): FrequencyValidation {
    const result: FrequencyValidation = {
      isValid: false,
      band: 'unknown',
      frequencyMHz: null,
      errors: [],
      warnings: []
    };

    const trimmed = frequency.trim();
    const numValue = parseFloat(trimmed);

    if (isNaN(numValue)) {
      result.errors.push('Invalid frequency format');
      return result;
    }

    // Determine band and validate
    if (this.FREQUENCY_PATTERNS.VHF.test(trimmed)) {
      result.band = 'VHF';
      result.frequencyMHz = numValue;
      result.isValid = true;

      // Check VHF aviation band specifics
      if (numValue >= 108 && numValue < 118) {
        result.warnings.push('Frequency in NAV band (108-118 MHz)');
      } else if (numValue >= 118 && numValue <= 136.975) {
        // COM band - valid
      } else {
        result.warnings.push('Frequency outside standard aviation VHF bands');
      }
    } else if (this.FREQUENCY_PATTERNS.UHF.test(trimmed)) {
      result.band = 'UHF';
      result.frequencyMHz = numValue;
      result.isValid = true;
    } else if (this.FREQUENCY_PATTERNS.HF.test(trimmed)) {
      result.band = 'HF';
      result.frequencyMHz = numValue / 1000; // Convert kHz to MHz
      result.isValid = true;
    } else {
      result.errors.push('Frequency outside aviation bands or invalid format');
    }

    return result;
  }

  public static validateRunwayDesignation(runway: string): RunwayValidation {
    const result: RunwayValidation = {
      isValid: false,
      direction: null,
      parallel: null,
      errors: [],
      warnings: []
    };

    const match = runway.trim().toUpperCase().match(this.RUNWAY_PATTERN);
    if (!match) {
      result.errors.push('Invalid runway designation format. Expected: 01-36 optionally followed by L, C, or R');
      return result;
    }

    const [fullMatch] = match;
    const direction = parseInt(fullMatch.substring(0, 2));
    const parallel = fullMatch.length > 2 ? fullMatch.charAt(2) : null;

    result.direction = direction;
    result.parallel = parallel as 'L' | 'C' | 'R' | null;
    result.isValid = true;

    // Validate magnetic direction
    if (direction < 1 || direction > 36) {
      result.errors.push('Runway direction must be between 01 and 36');
      result.isValid = false;
    }

    return result;
  }

  public static validateICAOIdentifier(identifier: string, type: 'AIRPORT' | 'NAVAID' | 'WAYPOINT'): IdentifierValidation {
    const result: IdentifierValidation = {
      isValid: false,
      type,
      identifier: identifier.toUpperCase(),
      errors: [],
      warnings: []
    };

    const pattern = this.ICAO_IDENTIFIER_PATTERNS[type];
    if (!pattern.test(identifier)) {
      result.errors.push(`Invalid ${type} identifier format`);
      return result;
    }

    result.isValid = true;

    // Additional validation for airport codes
    if (type === 'AIRPORT') {
      const regionCode = identifier.substring(0, 1);
      const knownRegions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'Y', 'Z'];

      if (!knownRegions.includes(regionCode)) {
        result.warnings.push('Unknown ICAO region code');
      }
    }

    return result;
  }

  public static validateMagneticVariation(variation: string): MagneticVariationValidation {
    const result: MagneticVariationValidation = {
      isValid: false,
      variation: null,
      direction: null,
      errors: [],
      warnings: []
    };

    const match = variation.trim().match(/^(\d{1,2}(?:\.\d+)?)[°]?\s*([EW])$/i);
    if (!match) {
      result.errors.push('Invalid magnetic variation format. Expected: degrees followed by E or W');
      return result;
    }

    const [, degrees, direction] = match;
    const numValue = parseFloat(degrees);

    if (numValue > 180) {
      result.errors.push('Magnetic variation cannot exceed 180 degrees');
      return result;
    }

    result.variation = numValue;
    result.direction = direction.toUpperCase() as 'E' | 'W';
    result.isValid = true;

    // Warnings for unusual variations
    if (numValue > 30) {
      result.warnings.push('Magnetic variation greater than 30° is unusual');
    }

    return result;
  }

  // Helper methods
  private static dmsToDecimal(degrees: number, minutes: number, seconds: number, hemisphere: string): number {
    let decimal = degrees + (minutes / 60) + (seconds / 3600);

    if (hemisphere === 'S' || hemisphere === 'W') {
      decimal = -decimal;
    }

    return decimal;
  }

  private static calculatePrecision(value: string): number {
    const decimalIndex = value.indexOf('.');
    if (decimalIndex === -1) return 0;
    return value.length - decimalIndex - 1;
  }

  // Comprehensive validation for aerodrome data
  public static validateAerodromeData(data: AerodromeData): AerodromeValidation {
    const result: AerodromeValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      validatedFields: {}
    };

    // Validate ICAO code
    if (data.icaoCode) {
      const icaoValidation = this.validateICAOIdentifier(data.icaoCode, 'AIRPORT');
      result.validatedFields.icaoCode = icaoValidation;
      if (!icaoValidation.isValid) {
        result.isValid = false;
        result.errors.push(...icaoValidation.errors);
      }
    }

    // Validate coordinates
    if (data.coordinates) {
      const coordValidation = this.validateCoordinates(data.coordinates);
      result.validatedFields.coordinates = coordValidation;
      if (!coordValidation.isValid) {
        result.isValid = false;
        result.errors.push(...coordValidation.errors);
      }
    }

    // Validate elevation
    if (data.elevation) {
      const elevValidation = this.validateElevation(data.elevation);
      result.validatedFields.elevation = elevValidation;
      if (!elevValidation.isValid) {
        result.isValid = false;
        result.errors.push(...elevValidation.errors);
      }
    }

    // Validate runways
    if (data.runways) {
      data.runways.forEach((runway, index) => {
        const runwayValidation = this.validateRunwayDesignation(runway);
        if (!runwayValidation.isValid) {
          result.isValid = false;
          result.errors.push(`Runway ${index + 1}: ${runwayValidation.errors.join(', ')}`);
        }
      });
    }

    // Validate communication frequencies
    if (data.frequencies) {
      data.frequencies.forEach((freq, index) => {
        const freqValidation = this.validateFrequency(freq);
        if (!freqValidation.isValid) {
          result.isValid = false;
          result.errors.push(`Frequency ${index + 1}: ${freqValidation.errors.join(', ')}`);
        }
      });
    }

    // Validate magnetic variation
    if (data.magneticVariation) {
      const magVarValidation = this.validateMagneticVariation(data.magneticVariation);
      result.validatedFields.magneticVariation = magVarValidation;
      if (!magVarValidation.isValid) {
        result.isValid = false;
        result.errors.push(...magVarValidation.errors);
      }
    }

    return result;
  }
}

// Type definitions
export interface CoordinateValidation {
  isValid: boolean;
  format: 'DMS' | 'DECIMAL' | 'ICAO' | 'unknown';
  parsedValue: number | { latitude: number; longitude: number } | null;
  errors: string[];
  warnings: string[];
}

export interface ElevationValidation {
  isValid: boolean;
  valueInMeters: number | null;
  originalValue: string;
  errors: string[];
  warnings: string[];
}

export interface FrequencyValidation {
  isValid: boolean;
  band: 'VHF' | 'UHF' | 'HF' | 'unknown';
  frequencyMHz: number | null;
  errors: string[];
  warnings: string[];
}

export interface RunwayValidation {
  isValid: boolean;
  direction: number | null;
  parallel: 'L' | 'C' | 'R' | null;
  errors: string[];
  warnings: string[];
}

export interface IdentifierValidation {
  isValid: boolean;
  type: 'AIRPORT' | 'NAVAID' | 'WAYPOINT';
  identifier: string;
  errors: string[];
  warnings: string[];
}

export interface MagneticVariationValidation {
  isValid: boolean;
  variation: number | null;
  direction: 'E' | 'W' | null;
  errors: string[];
  warnings: string[];
}

export interface AerodromeData {
  icaoCode?: string;
  coordinates?: string;
  elevation?: string;
  runways?: string[];
  frequencies?: string[];
  magneticVariation?: string;
}

export interface AerodromeValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validatedFields: {
    icaoCode?: IdentifierValidation;
    coordinates?: CoordinateValidation;
    elevation?: ElevationValidation;
    magneticVariation?: MagneticVariationValidation;
  };
}