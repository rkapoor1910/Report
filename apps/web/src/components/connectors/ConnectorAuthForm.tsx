'use client'

/**
 * ConnectorAuthForm
 * Dynamically renders the correct credential fields for each connector type.
 * Fields are defined in the API's CONNECTOR_DEFINITIONS — fetched on mount.
 * This component is built in the next sub-step.
 */
export function ConnectorAuthForm({ connector, onBack, onSuccess }: any) {
  return (
    <div className="p-8 text-center text-muted-foreground text-sm">
      Auth form for {connector?.label} — built next
    </div>
  )
}
