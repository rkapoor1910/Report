import { Worker, Queue, Job } from 'bullmq'
import { Redis } from 'ioredis'
import axios from 'axios'

// ─── Queue setup ─────────────────────────────────────────────────────────────

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

export const analysisQueue = new Queue('analysis', { connection })

// ─── Job payload type ─────────────────────────────────────────────────────────

export interface AnalysisJobPayload {
  reportId:       string
  reportName:     string
  reportType:     string
  connectorId:    string
  connectorType:  string
  orgId:          string
  orgName:        string
  sourceRef:      string
  schema:         Record<string, unknown>
  thresholds:     Record<string, number>
  syncFrequency:  string
  recipientRoles: string[]   // ['owner', 'sales_head'] etc.
}

// ─── Worker ──────────────────────────────────────────────────────────────────

export function startAnalysisWorker() {
  const worker = new Worker<AnalysisJobPayload>(
    'analysis',
    async (job: Job<AnalysisJobPayload>) => {
      const { reportId, orgName, recipientRoles } = job.data

      console.log(`[AnalysisWorker] Starting job for report ${reportId}`)
      await job.updateProgress(10)

      // ── 1. Fetch current data from connector ─────────────────────────────
      const rawData = await fetchCurrentData(job.data)
      await job.updateProgress(30)

      // ── 2. Fetch historical snapshots from DB ────────────────────────────
      const historicalData = await fetchHistoricalData(reportId)
      await job.updateProgress(50)

      // ── 3. For each recipient role — run analysis + deliver ───────────────
      const alerts = []
      for (const role of recipientRoles) {
        await job.updateProgress(60)

        // Call Python analysis worker
        const analysisRes = await axios.post(
          `${process.env.WORKERS_URL || 'http://localhost:8000'}/analyse`,
          {
            raw_data:        rawData,
            historical_data: historicalData,
            report_config: {
              id:            reportId,
              name:          job.data.reportName,
              type:          job.data.reportType,
              connectorType: job.data.connectorType,
              sourceRef:     job.data.sourceRef,
              schema:        job.data.schema,
              thresholds:    job.data.thresholds,
            },
            org_name:       orgName,
            recipient_role: role,
          },
          { timeout: 60_000 }
        )

        const alert = analysisRes.data
        alerts.push({ role, alert })

        await job.updateProgress(80)

        // ── 4. Save alert to DB ───────────────────────────────────────────
        await saveAlert(reportId, job.data.orgId, alert)

        // ── 5. Queue delivery jobs for this role's subscribers ────────────
        await queueDelivery(reportId, job.data.orgId, role, alert)
      }

      await job.updateProgress(100)
      console.log(`[AnalysisWorker] Completed job for report ${reportId}`)
      return { reportId, alertCount: alerts.length }
    },
    {
      connection,
      concurrency:  5,
      limiter:      { max: 10, duration: 1000 },
    }
  )

  worker.on('completed', (job, result) => {
    console.log(`[AnalysisWorker] Job ${job.id} done:`, result)
  })

  worker.on('failed', (job, err) => {
    console.error(`[AnalysisWorker] Job ${job?.id} failed:`, err.message)
  })

  console.log('🔄 Analysis worker started')
  return worker
}

// ─── Scheduler — enqueue jobs based on report frequency ──────────────────────

export async function scheduleReportJobs() {
  // This runs on startup and re-queues any reports that are due
  // In production: driven by pg-cron + DB query for due reports
  // TODO: fetch due reports from DB and enqueue
  console.log('📅 Report scheduler initialised')
}

// ─── Stub functions — replaced with real DB/connector calls ──────────────────

async function fetchCurrentData(jobData: AnalysisJobPayload): Promise<Record<string, unknown>[]> {
  // TODO: call the appropriate connector worker (Python) to fetch live data
  // e.g. POST /connectors/{connectorType}/fetch with credentials + sourceRef
  return []
}

async function fetchHistoricalData(reportId: string): Promise<Record<string, unknown>[][]> {
  // TODO: query report_snapshots table for last 3 periods
  // SELECT data FROM report_snapshots WHERE report_id = reportId ORDER BY time DESC LIMIT 3
  return []
}

async function saveAlert(reportId: string, orgId: string, alert: Record<string, unknown>): Promise<void> {
  // TODO: INSERT into alerts table
}

async function queueDelivery(
  reportId: string,
  orgId:    string,
  role:     string,
  alert:    Record<string, unknown>
): Promise<void> {
  // TODO: fetch subscribers for this report+role from alert_subscriptions
  // then push to deliveryQueue
}
