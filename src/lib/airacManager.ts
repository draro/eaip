// AIRAC (Aeronautical Information Regulation and Control) Cycle Management
// AIRAC cycles are standardized 28-day periods for updating aeronautical information

export class AIRACManager {
  // AIRAC cycle 1 starts on January 5, 2023 (first Thursday after January 1)
  private static readonly AIRAC_EPOCH = new Date('2023-01-05T00:00:00Z');
  private static readonly CYCLE_DURATION_DAYS = 28;
  private static readonly CYCLE_DURATION_MS = 28 * 24 * 60 * 60 * 1000;

  // AIRAC cycle generation
  public static generateAIRACCycles(startYear: number, endYear: number): AIRACCycle[] {
    const cycles: AIRACCycle[] = [];

    for (let year = startYear; year <= endYear; year++) {
      const yearCycles = this.getAIRACCyclesForYear(year);
      cycles.push(...yearCycles);
    }

    return cycles.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime());
  }

  public static getAIRACCyclesForYear(year: number): AIRACCycle[] {
    const cycles: AIRACCycle[] = [];
    const yearStart = new Date(`${year}-01-01T00:00:00Z`);
    const yearEnd = new Date(`${year + 1}-01-01T00:00:00Z`);

    // Find first AIRAC cycle of the year
    let currentDate = this.getFirstAIRACOfYear(year);
    let cycleNumber = 1;

    while (currentDate < yearEnd) {
      if (currentDate >= yearStart) {
        const cycle = this.createAIRACCycle(currentDate, year, cycleNumber);
        cycles.push(cycle);
        cycleNumber++;
      }

      currentDate = new Date(currentDate.getTime() + this.CYCLE_DURATION_MS);
    }

    return cycles;
  }

  private static getFirstAIRACOfYear(year: number): Date {
    // Find the first Thursday of January that's >= January 1
    const jan1 = new Date(`${year}-01-01T00:00:00Z`);
    let firstThursday = new Date(jan1);

    // Find first Thursday
    while (firstThursday.getDay() !== 4) { // 4 = Thursday
      firstThursday.setDate(firstThursday.getDate() + 1);
    }

    // Calculate which AIRAC cycle this corresponds to
    const daysSinceEpoch = (firstThursday.getTime() - this.AIRAC_EPOCH.getTime()) / (24 * 60 * 60 * 1000);
    const cyclesSinceEpoch = Math.floor(daysSinceEpoch / this.CYCLE_DURATION_DAYS);

    // Return the actual AIRAC date
    return new Date(this.AIRAC_EPOCH.getTime() + (cyclesSinceEpoch * this.CYCLE_DURATION_MS));
  }

  private static createAIRACCycle(effectiveDate: Date, year: number, cycleNumber: number): AIRACCycle {
    const yearShort = year.toString().slice(-2);
    const cycleNumberPadded = cycleNumber.toString().padStart(2, '0');

    return {
      id: `${yearShort}${cycleNumberPadded}`,
      effectiveDate,
      publicationDate: new Date(effectiveDate.getTime() - (56 * 24 * 60 * 60 * 1000)), // 56 days before
      cycleNumber,
      year,
      isActive: this.isCurrentCycle(effectiveDate),
      nextCycle: new Date(effectiveDate.getTime() + this.CYCLE_DURATION_MS),
      previousCycle: new Date(effectiveDate.getTime() - this.CYCLE_DURATION_MS),
    };
  }

  public static getCurrentAIRACCycle(): AIRACCycle {
    const now = new Date();
    const daysSinceEpoch = (now.getTime() - this.AIRAC_EPOCH.getTime()) / (24 * 60 * 60 * 1000);
    const currentCycleIndex = Math.floor(daysSinceEpoch / this.CYCLE_DURATION_DAYS);

    const currentCycleStart = new Date(this.AIRAC_EPOCH.getTime() + (currentCycleIndex * this.CYCLE_DURATION_MS));

    return this.createAIRACCycleFromDate(currentCycleStart);
  }

  public static getNextAIRACCycle(): AIRACCycle {
    const current = this.getCurrentAIRACCycle();
    return this.createAIRACCycleFromDate(current.nextCycle);
  }

  public static getPreviousAIRACCycle(): AIRACCycle {
    const current = this.getCurrentAIRACCycle();
    return this.createAIRACCycleFromDate(current.previousCycle);
  }

  private static createAIRACCycleFromDate(effectiveDate: Date): AIRACCycle {
    const year = effectiveDate.getFullYear();
    const yearCycles = this.getAIRACCyclesForYear(year);
    const cycle = yearCycles.find(c =>
      Math.abs(c.effectiveDate.getTime() - effectiveDate.getTime()) < 24 * 60 * 60 * 1000
    );

    if (cycle) {
      return cycle;
    }

    // Fallback calculation
    const yearStart = new Date(`${year}-01-01T00:00:00Z`);
    const daysDiff = (effectiveDate.getTime() - yearStart.getTime()) / (24 * 60 * 60 * 1000);
    const cycleNumber = Math.floor(daysDiff / this.CYCLE_DURATION_DAYS) + 1;

    return this.createAIRACCycle(effectiveDate, year, cycleNumber);
  }

  private static isCurrentCycle(effectiveDate: Date): boolean {
    const now = new Date();
    const nextCycle = new Date(effectiveDate.getTime() + this.CYCLE_DURATION_MS);
    return now >= effectiveDate && now < nextCycle;
  }

  // Validation methods
  public static validateAIRACCycle(cycleId: string): AIRACValidationResult {
    const result: AIRACValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      cycle: null,
    };

    // Check format (YYMM or YYYYMM where MM is cycle number)
    let year: number;
    let cycleNum: number;

    if (/^\d{6}$/.test(cycleId)) {
      // YYYYMM format (e.g., 202501)
      year = parseInt(cycleId.substring(0, 4));
      cycleNum = parseInt(cycleId.substring(4, 6));
    } else if (/^\d{4}$/.test(cycleId)) {
      // YYMM format (e.g., 2501)
      year = 2000 + parseInt(cycleId.substring(0, 2));
      cycleNum = parseInt(cycleId.substring(2, 4));
    } else {
      result.isValid = false;
      result.errors.push('AIRAC cycle must be in YYMM format (e.g., 2501) or YYYYMM format (e.g., 202501)');
      return result;
    }

    // Validate year range
    const currentYear = new Date().getFullYear();
    if (year < currentYear - 1 || year > currentYear + 2) {
      result.warnings.push('AIRAC cycle year is outside typical range');
    }

    // Validate cycle number
    const yearCycles = this.getAIRACCyclesForYear(year);
    const cycle = yearCycles.find(c => c.cycleNumber === cycleNum);

    if (!cycle) {
      result.isValid = false;
      result.errors.push(`Invalid cycle number ${cycleNum} for year ${year}`);
      return result;
    }

    result.cycle = cycle;

    // Check if cycle is in the past
    if (cycle.effectiveDate < new Date()) {
      result.warnings.push('AIRAC cycle is in the past');
    }

    // Check if cycle is too far in the future
    const twoYearsAhead = new Date();
    twoYearsAhead.setFullYear(twoYearsAhead.getFullYear() + 2);
    if (cycle.effectiveDate > twoYearsAhead) {
      result.warnings.push('AIRAC cycle is more than 2 years in the future');
    }

    return result;
  }

  public static isValidAIRACDate(date: Date): boolean {
    // Check if date falls on an AIRAC effective date (Thursday)
    if (date.getDay() !== 4) return false;

    // Check if it aligns with AIRAC cycle
    const daysSinceEpoch = (date.getTime() - this.AIRAC_EPOCH.getTime()) / (24 * 60 * 60 * 1000);
    const remainder = daysSinceEpoch % this.CYCLE_DURATION_DAYS;

    return Math.abs(remainder) < 0.5; // Allow for small time differences
  }

  public static getAIRACCycleById(cycleId: string): AIRACCycle | null {
    const validation = this.validateAIRACCycle(cycleId);
    return validation.cycle;
  }

  public static formatAIRACDate(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  public static getPublicationSchedule(cycle: AIRACCycle): PublicationSchedule {
    const deadlines = {
      initialSubmission: new Date(cycle.publicationDate.getTime() - (21 * 24 * 60 * 60 * 1000)), // 21 days before pub
      finalSubmission: new Date(cycle.publicationDate.getTime() - (14 * 24 * 60 * 60 * 1000)), // 14 days before pub
      review: new Date(cycle.publicationDate.getTime() - (7 * 24 * 60 * 60 * 1000)), // 7 days before pub
      publication: cycle.publicationDate,
      effective: cycle.effectiveDate,
    };

    return {
      cycle,
      publicationDate: cycle.publicationDate,
      effectiveDate: cycle.effectiveDate,
      deadlines,
      status: this.calculatePublicationStatus(cycle, deadlines),
    };
  }

  private static calculatePublicationStatus(
    cycle: AIRACCycle,
    deadlines: {
      initialSubmission: Date;
      finalSubmission: Date;
      review: Date;
      publication: Date;
      effective: Date;
    }
  ): 'planning' | 'submission' | 'review' | 'published' | 'effective' | 'expired' {
    const now = new Date();

    if (now < deadlines.initialSubmission) return 'planning';
    if (now < deadlines.finalSubmission) return 'submission';
    if (now < deadlines.publication) return 'review';
    if (now < deadlines.effective) return 'published';
    if (now < cycle.nextCycle) return 'effective';
    return 'expired';
  }

  // Generate AIRAC amendment tracking
  public static createAmendment(
    baseCycle: AIRACCycle,
    amendmentNumber: number,
    effectiveDate: Date
  ): AIRACAmendment {
    return {
      id: `${baseCycle.id}-AMD${amendmentNumber}`,
      baseCycle: baseCycle.id,
      amendmentNumber,
      effectiveDate,
      publicationDate: new Date(effectiveDate.getTime() - (14 * 24 * 60 * 60 * 1000)), // 14 days notice
      type: 'amendment',
      urgency: effectiveDate.getTime() - Date.now() < 14 * 24 * 60 * 60 * 1000 ? 'urgent' : 'routine',
    };
  }
}

export interface AIRACCycle {
  id: string; // YYMM format
  effectiveDate: Date;
  publicationDate: Date;
  cycleNumber: number;
  year: number;
  isActive: boolean;
  nextCycle: Date;
  previousCycle: Date;
}

export interface AIRACValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  cycle: AIRACCycle | null;
}

export interface PublicationSchedule {
  cycle: AIRACCycle;
  publicationDate: Date;
  effectiveDate: Date;
  deadlines: {
    initialSubmission: Date;
    finalSubmission: Date;
    review: Date;
    publication: Date;
    effective: Date;
  };
  status: 'planning' | 'submission' | 'review' | 'published' | 'effective' | 'expired';
}

export interface AIRACAmendment {
  id: string;
  baseCycle: string;
  amendmentNumber: number;
  effectiveDate: Date;
  publicationDate: Date;
  type: 'amendment' | 'supplement' | 'correction';
  urgency: 'routine' | 'urgent' | 'immediate';
}