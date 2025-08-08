import PenPal from "#penpal/core";

// File-level logger that can be imported by other files
export const ScanQueueLogger = PenPal.Utils.BuildLogger("ScanQueue");

class ScanQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.currentJob = null;
    this.keepAliveInterval = null;
    this.currentlyProcessingOperation = null; // Track what's currently being processed
    this.totalOperationsInCurrentJob = 0; // Track total operations for this job
    this.completedOperationsInCurrentJob = 0; // Track completed operations for this job
  }

  async add(asyncFunction, queueName = null) {
    ScanQueueLogger.log(
      `Adding function to scan queue. Queue length: ${this.queue.length + 1}`
    );

    // Generate a descriptive name for this scan operation
    const scanName = queueName || `Scan Operation ${Date.now()}`;

    this.queue.push({
      function: asyncFunction,
      name: scanName,
      addedAt: new Date().toISOString(),
    });

    // Only create job when there's actual queuing happening
    // (i.e., something is already processing and we're adding to the queue)
    if (this.isProcessing && !this.currentJob) {
      // First time creating a job during active processing
      // Include the currently processing operation + queued operations
      await this.createQueueJob();
    } else if (this.isProcessing && this.currentJob) {
      // Add a stage to existing job
      await this.addStageToJob();
    }

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  async createQueueJob() {
    ScanQueueLogger.log("Creating scan queue job with stages");

    // Create stages: currently processing operation + all queued operations
    const allOperations = [];

    // Add the currently processing operation as the first stage
    if (this.currentlyProcessingOperation) {
      allOperations.push(this.currentlyProcessingOperation);
    }

    // Add all queued operations
    allOperations.push(...this.queue);

    this.totalOperationsInCurrentJob = allOperations.length;
    this.completedOperationsInCurrentJob = 0;

    const stages = allOperations.map((item, index) => ({
      name: item.name,
      plugin: "ScanQueue",
      progress: index === 0 ? 100 : 0, // Only current stage (first) is busy, others are pending
      statusText: index === 0 ? "Processing..." : "Pending",
      status: index === 0 ? "running" : "pending",
      order: index,
    }));

    this.currentJob = await PenPal.Jobs.Create({
      name: `Scan Queue Processing (${this.totalOperationsInCurrentJob} operations)`,
      plugin: "ScanQueue",
      progress:
        Math.round(
          (this.completedOperationsInCurrentJob /
            this.totalOperationsInCurrentJob) *
            100
        ) || 1,
      statusText: "Processing scan operations sequentially...",
      status: "running",
      stages: stages,
    });

    ScanQueueLogger.log(`Created job ${this.currentJob.id} for scan queue`);

    // Start keep-alive updates
    this.startKeepAlive();
  }

  async addStageToJob() {
    if (!this.currentJob) return;

    const latestItem = this.queue[this.queue.length - 1];

    ScanQueueLogger.log(`Adding stage to existing job ${this.currentJob.id}`);

    await PenPal.Jobs.AddStage(this.currentJob.id, {
      name: latestItem.name,
      plugin: "ScanQueue",
      progress: 0, // New stages start with 0 progress
      statusText: "Pending",
      status: "pending",
      order: this.totalOperationsInCurrentJob, // Use the total count for the order
    });

    // Update job name and recalculate progress based on new total
    this.totalOperationsInCurrentJob++;
    const currentProgress = Math.round(
      (this.completedOperationsInCurrentJob /
        this.totalOperationsInCurrentJob) *
        100
    );

    // Get the updated job to get the correct stage count
    const updatedJob = await PenPal.Jobs.Get(this.currentJob.id);
    const actualStageCount = updatedJob.stages
      ? updatedJob.stages.length
      : this.totalOperationsInCurrentJob;

    await PenPal.Jobs.Update(this.currentJob.id, {
      name: `Scan Queue Processing (${actualStageCount} operations)`,
      progress: currentProgress,
      statusText: `Processing scan operations sequentially... (${this.completedOperationsInCurrentJob}/${this.totalOperationsInCurrentJob} completed)`,
    });

    ScanQueueLogger.log(
      `Added stage to job. Total operations: ${this.totalOperationsInCurrentJob}, Actual stages: ${actualStageCount}`
    );
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    ScanQueueLogger.log("Starting queue processing");

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      this.currentlyProcessingOperation = item;

      ScanQueueLogger.log(`Processing: ${item.name}`);

      // Update current stage to running status with busy progress
      if (this.currentJob) {
        const currentStageIndex = this.completedOperationsInCurrentJob;

        await PenPal.Jobs.UpdateStage(this.currentJob.id, currentStageIndex, {
          progress: 100, // Busy progress with stripes
          status: "running",
          statusText: "Processing...",
        });

        // Update overall job progress
        const overallProgress = Math.round(
          (this.completedOperationsInCurrentJob /
            this.totalOperationsInCurrentJob) *
            100
        );
        const statusText = `Processing scan operations sequentially... (${this.completedOperationsInCurrentJob}/${this.totalOperationsInCurrentJob} completed)`;

        await PenPal.Jobs.Update(this.currentJob.id, {
          progress: overallProgress,
          statusText: statusText,
        });
      }

      try {
        // Execute the queued function
        await item.function();

        // Mark current stage as completed
        if (this.currentJob) {
          const currentStageIndex = this.completedOperationsInCurrentJob;

          await PenPal.Jobs.UpdateStage(this.currentJob.id, currentStageIndex, {
            progress: 100,
            status: "done",
            statusText: "Completed",
          });
        }

        this.completedOperationsInCurrentJob++;
        ScanQueueLogger.log(`Completed: ${item.name}`);
      } catch (error) {
        ScanQueueLogger.error(`Failed to process ${item.name}:`, error);

        // Mark current stage as failed
        if (this.currentJob) {
          const currentStageIndex = this.completedOperationsInCurrentJob;

          await PenPal.Jobs.UpdateStage(this.currentJob.id, currentStageIndex, {
            progress: 100,
            status: "failed",
            statusText: `Failed: ${error.message}`,
          });
        }

        this.completedOperationsInCurrentJob++;
      }

      this.currentlyProcessingOperation = null;
    }

    // Complete the job if it exists
    if (this.currentJob) {
      await PenPal.Jobs.Update(this.currentJob.id, {
        progress: 100,
        status: "done",
        statusText: "All scan operations completed",
      });

      ScanQueueLogger.log(`Completed scan queue job ${this.currentJob.id}`);
      this.stopKeepAlive();
      this.currentJob = null;
      this.totalOperationsInCurrentJob = 0;
      this.completedOperationsInCurrentJob = 0;
    }

    this.isProcessing = false;
    ScanQueueLogger.log("Queue processing completed");
  }

  startKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }

    // Update job every 5 seconds to prevent idle cancellation
    this.keepAliveInterval = setInterval(async () => {
      if (this.currentJob) {
        try {
          const currentProgress = Math.round(
            (this.completedOperationsInCurrentJob /
              this.totalOperationsInCurrentJob) *
              100
          );
          await PenPal.Jobs.Update(this.currentJob.id, {
            progress: currentProgress,
            statusText: `Processing scan operations sequentially... (${this.completedOperationsInCurrentJob}/${this.totalOperationsInCurrentJob} completed)`,
          });
        } catch (error) {
          ScanQueueLogger.warn(
            `Failed to update keep-alive for job ${this.currentJob.id}: ${error.message}`
          );
        }
      }
    }, 5000);
  }

  stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  getQueueLength() {
    return this.queue.length;
  }

  isCurrentlyProcessing() {
    return this.isProcessing;
  }
}

// Create singleton instance
const scanQueueInstance = new ScanQueue();

const ScanQueuePlugin = {
  async loadPlugin() {
    // Register ScanQueue API
    PenPal.ScanQueue = {
      Add: (asyncFunction, queueName) =>
        scanQueueInstance.add(asyncFunction, queueName),
      GetQueueLength: scanQueueInstance.getQueueLength.bind(scanQueueInstance),
      IsProcessing:
        scanQueueInstance.isCurrentlyProcessing.bind(scanQueueInstance),
    };

    ScanQueueLogger.log("ScanQueue plugin loaded successfully");

    return {};
  },
};

export default ScanQueuePlugin;
