import { MiddlewareHandler } from 'hono'
import promClient from 'prom-client'

promClient.collectDefaultMetrics()

const labels = ['status_code', 'method', 'path']

const summary = new promClient.Summary({
  name: 'http_request_duration_seconds',
  help: 'duration summary of http responses labeled with: ' + labels.join(', '),
  percentiles: [0.5, 0.95, 0.99],
  maxAgeSeconds: 300,
  ageBuckets: 5,
  labelNames: labels,
})

export const metricsMiddleware = (): MiddlewareHandler => {
  return async (ctx, next) => {
    const { pathname } = new URL(ctx.req.url)

    if (
      pathname.includes('/service-worker') ||
      pathname.includes('/hono-nodejs') ||
      pathname.includes('/favicon') ||
      pathname.includes('/healthz') ||
      pathname.includes('/metrics')
    ) {
      return await next()
    }

    const endTimer = summary.startTimer({
      method: ctx.req.method,
      path: pathname,
    })

    await next()

    endTimer({ status_code: ctx.res.status })
  }
}
