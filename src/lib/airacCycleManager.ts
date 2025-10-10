import connectDB from './mongodb';
import AIPDocument from '@/models/AIPDocument';
import AIPVersion from '@/models/AIPVersion';

export class AIRACCycleManager {
  static async activateAIRACCycle(airacCycle: string): Promise<{
    success: boolean;
    publishedCount: number;
    archivedCount: number;
    errors: string[];
  }> {
    try {
      await connectDB();

      const errors: string[] = [];
      let publishedCount = 0;
      let archivedCount = 0;

      const version = await AIPVersion.findOne({ airacCycle });

      if (!version) {
        return {
          success: false,
          publishedCount: 0,
          archivedCount: 0,
          errors: [`AIRAC cycle ${airacCycle} not found`]
        };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const effectiveDate = new Date(version.effectiveDate);
      effectiveDate.setHours(0, 0, 0, 0);

      if (effectiveDate > today) {
        return {
          success: false,
          publishedCount: 0,
          archivedCount: 0,
          errors: [`AIRAC cycle ${airacCycle} is not yet effective. Effective date: ${effectiveDate.toISOString().split('T')[0]}`]
        };
      }

      const approvedDocuments = await AIPDocument.find({
        airacCycle,
        status: 'approved'
      }).populate('organization', 'name');

      for (const doc of approvedDocuments) {
        try {
          if (doc.parentDocument) {
            const parentDoc = await AIPDocument.findById(doc.parentDocument);
            if (parentDoc && parentDoc.status === 'published') {
              await AIPDocument.findByIdAndUpdate(parentDoc._id, {
                status: 'archived'
              });
              archivedCount++;
            }
          }

          await AIPDocument.findByIdAndUpdate(doc._id, {
            status: 'published',
            publishedAt: new Date()
          });
          publishedCount++;
        } catch (error) {
          errors.push(`Error publishing document ${doc._id}: ${(error as Error).message}`);
        }
      }

      if (version.status !== 'active') {
        await AIPVersion.findByIdAndUpdate(version._id, {
          status: 'active'
        });
      }

      const previousVersions = await AIPVersion.find({
        effectiveDate: { $lt: effectiveDate },
        status: 'active'
      });

      for (const prevVersion of previousVersions) {
        await AIPVersion.findByIdAndUpdate(prevVersion._id, {
          status: 'archived'
        });
      }

      return {
        success: errors.length === 0,
        publishedCount,
        archivedCount,
        errors
      };

    } catch (error) {
      return {
        success: false,
        publishedCount: 0,
        archivedCount: 0,
        errors: [`Fatal error: ${(error as Error).message}`]
      };
    }
  }

  static async checkAndActivatePendingCycles(): Promise<{
    activated: string[];
    errors: string[];
  }> {
    try {
      await connectDB();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const pendingVersions = await AIPVersion.find({
        effectiveDate: { $lte: today },
        status: { $in: ['draft', 'pending'] }
      });

      const activated: string[] = [];
      const errors: string[] = [];

      for (const version of pendingVersions) {
        const result = await this.activateAIRACCycle(version.airacCycle);
        if (result.success) {
          activated.push(version.airacCycle);
        } else {
          errors.push(...result.errors);
        }
      }

      return {
        activated,
        errors
      };

    } catch (error) {
      return {
        activated: [],
        errors: [`Fatal error checking pending cycles: ${(error as Error).message}`]
      };
    }
  }

  static async getUpcomingAIRACCycles(count: number = 3): Promise<{
    airacCycle: string;
    effectiveDate: Date;
    status: string;
    approvedDocumentsCount: number;
  }[]> {
    try {
      await connectDB();

      const today = new Date();
      const upcoming = [];

      for (let i = 0; i < count; i++) {
        const daysToAdd = i * 28;
        const targetDate = new Date(today.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

        const year = targetDate.getFullYear();
        const startOfYear = new Date(year, 0, 1);
        const dayOfYear = Math.floor((targetDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
        const cycleNumber = Math.floor(dayOfYear / 28) + 1;
        const airacCycle = `${year}-${String(cycleNumber).padStart(2, '0')}`;

        const version = await AIPVersion.findOne({ airacCycle });
        const approvedCount = await AIPDocument.countDocuments({
          airacCycle,
          status: 'approved'
        });

        upcoming.push({
          airacCycle,
          effectiveDate: version?.effectiveDate || targetDate,
          status: version?.status || 'not_created',
          approvedDocumentsCount: approvedCount
        });
      }

      return upcoming;

    } catch (error) {
      console.error('Error getting upcoming AIRAC cycles:', error);
      return [];
    }
  }
}
