'use client'

/**
 * ConnectorTestResult
 * Shows the live test result after credentials are submitted.
 * Displays preview rows, column names, success/error state.
 * Built in the next sub-step.
 */
export function ConnectorTestResult({ connector, result, onDone }: any) {
  return (
    <div className="p-8 text-center text-muted-foreground text-sm">
      Test result for {connector?.label} — built next
    </div>
  )
}
