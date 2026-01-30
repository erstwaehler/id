# Frontend Telemetry Tutorial

This guide shows you how to use pyramid tracing in your frontend to get end-to-end visibility of user actions through your entire stack.

## Setup

### 1. Wrap Your App with TelemetryProvider

In your `__root.tsx` or main app component:

```tsx
import { TelemetryProvider } from '@/lib/telemery/provider'

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        <TelemetryProvider
          serviceName="ewf-id-frontend"
          serviceVersion="1.0.0"
          autoInstrumentFetch={true}
        >
          <Header />
          {children}
          <Scripts />
        </TelemetryProvider>
      </body>
    </html>
  )
}
```

### 2. Configure Environment Variables

Make sure your backend has the Axiom credentials:

```env
# .env
AXIOM_TOKEN=your-axiom-token-here
AXIOM_DATASET=ewf-id
```

**Important:** The frontend does NOT need the Axiom token! It sends data through the `/api/telemetry` proxy which protects your token.

### 3. Verify Setup

Check that telemetry is working:

```tsx
import { isTelemetryInitialized } from '@/lib/telemery/provider'

useEffect(() => {
  console.log('Telemetry ready:', isTelemetryInitialized())
}, [])
```

Or visit `/api/telemetry` (GET) to check proxy health.

## What is Pyramid Tracing?

Traditional logging logs each step separately. Pyramid tracing wraps the entire user interaction in a single span that encompasses all server operations:

```
Client Span: "user.checkout.flow" START
├─ Event: user clicked checkout button
├─ Server Function Span: "server.checkout" (child)
│  ├─ Server validation
│  └─ Effect Span: "effect.payment.process" (grandchild)
│     ├─ Database query
│     └─ Stripe API call
├─ Event: response received
├─ Event: UI updated
└─ Client Span END
```

Result: One beautiful trace graph in Axiom showing the complete user journey.

## Quick Start

### 1. Basic Usage

```tsx
import { useTrace } from '@/lib/telemery/frontend'

function CheckoutButton() {
  const { startTrace } = useTrace()

  const handleCheckout = async () => {
    // Start a pyramid span
    const trace = startTrace('user.checkout.complete')

    try {
      // Add events to mark what's happening
      trace.addEvent('button_clicked', {
        'cart.items': 3,
        'user.subscription': 'premium'
      })

      // Make your server call with trace headers
      const result = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          ...trace.getHeaders(), // <-- This is the magic!
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cartId: 'cart_123' })
      })

      const data = await result.json()

      trace.addEvent('response_received', {
        'order.id': data.orderId,
        'order.total': data.total
      })

      // Update UI
      showConfirmation(data)

      // End successfully with final attributes (wide event!)
      trace.end({
        'outcome': 'success',
        'order.id': data.orderId,
        'order.total_cents': data.total,
        'user.saw_confirmation': true
      })

    } catch (error) {
      // Automatically record exception and mark as failed
      trace.error(error)
    }
  }

  return <button onClick={handleCheckout}>Checkout</button>
}
```

### 2. Helper for Headers

Instead of spreading headers manually, use `withTraceHeaders`:

```tsx
import { useTrace, withTraceHeaders } from '@/lib/telemery/frontend'

const trace = startTrace('api.call')

await fetch('/api/data', {
  headers: withTraceHeaders(trace, {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  })
})

trace.end()
```

### 3. Automatic Async Tracing

For simpler cases, use `traceAsync` which handles lifecycle automatically:

```tsx
const { traceAsync } = useTrace()

const data = await traceAsync('fetch.user.data', async (trace) => {
  trace.addEvent('fetch_started')
  
  const response = await fetch('/api/user')
  const data = await response.json()
  
  trace.setAttribute('records.count', data.length)
  
  return data
  // trace.end() is called automatically
})
```

### 4. Sync Operations

For synchronous operations:

```tsx
const { traceSync } = useTrace()

const result = traceSync('calculation.expensive', (trace) => {
  trace.setAttribute('input.size', items.length)
  
  const result = expensiveCalculation(items)
  
  trace.setAttribute('result.value', result)
  
  return result
})
```

## Wide Events: What to Track

Following https://loggingsucks.com/, emit **one comprehensive event** with high-cardinality, high-dimensionality data:

### Essential Attributes

```tsx
trace.end({
  // Outcome
  'outcome': 'success' | 'error' | 'cancelled',
  
  // User Context (high-cardinality!)
  'user.id': 'user_123',
  'user.subscription': 'premium',
  'user.account_age_days': 847,
  
  // Business Context
  'order.id': 'ord_xyz',
  'order.total_cents': 15999,
  'cart.item_count': 3,
  'payment.method': 'card',
  
  // Performance
  'client.render_time_ms': 234,
  'client.interaction_time_ms': 1450,
  
  // Feature Flags
  'feature.new_checkout': true,
  'feature.express_payment': false,
  
  // Technical Details
  'http.status_code': 200,
  'api.endpoint': '/api/checkout',
})
```

### Events for Timeline

Use `addEvent` to mark points in time:

```tsx
trace.addEvent('button_clicked')
trace.addEvent('validation_started')
trace.addEvent('api_call_started')
trace.addEvent('response_received')
trace.addEvent('ui_updated')
```

## Best Practices

### ✅ DO: One Span Per User Action

```tsx
// ✅ Good: One span wraps the entire flow
const trace = startTrace('user.submit.form')
validateForm()
const result = await submitToServer()
showSuccess()
trace.end()
```

```tsx
// ❌ Bad: Multiple disconnected spans
const trace1 = startTrace('validate')
trace1.end()

const trace2 = startTrace('submit')
trace2.end()

const trace3 = startTrace('show')
trace3.end()
```

### ✅ DO: Add Business Context

```tsx
trace.end({
  'user.subscription': 'premium',      // ✅ Helps filter issues
  'cart.total_cents': 15999,           // ✅ Helps find revenue impact
  'feature.new_ui': true,              // ✅ Helps correlate with rollouts
})
```

```tsx
// ❌ Bad: Only technical details
trace.end({
  'http.status': 200,
  'duration_ms': 123
})
```

### ✅ DO: Handle Errors Properly

```tsx
try {
  const result = await riskyOperation()
  trace.end({ outcome: 'success' })
} catch (error) {
  trace.error(error, {
    'retry_attempted': true,
    'fallback_used': false
  })
  throw error // Re-throw after recording
}
```

### ✅ DO: Keep Spans Short-Lived

```tsx
// ✅ Good: Span lives during one user action
const handleClick = async () => {
  const trace = startTrace('action')
  await doWork()
  trace.end()
}
```

```tsx
// ❌ Bad: Span lives too long
const trace = startTrace('session') // Don't do this!
// ... span lives for 10 minutes ...
```

## Advanced: React Query Integration

```tsx
import { useTrace } from '@/lib/telemery/frontend'
import { useQuery } from '@tanstack/react-query'

function useTracedQuery() {
  const { startTrace } = useTrace()

  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const trace = startTrace('query.user.profile')
      
      try {
        trace.addEvent('fetch_started')
        
        const response = await fetch('/api/user/profile', {
          headers: trace.getHeaders()
        })
        
        const data = await response.json()
        
        trace.end({
          'user.id': data.id,
          'cache.hit': false
        })
        
        return data
      } catch (error) {
        trace.error(error)
        throw error
      }
    }
  })
}
```

## Advanced: Form Submission

```tsx
function RegistrationForm() {
  const { startTrace } = useTrace()
  
  const handleSubmit = async (formData) => {
    const trace = startTrace('user.register')
    
    try {
      trace.setAttributes({
        'form.school': formData.school,
        'form.role': formData.role,
        'form.has_invitation': !!formData.inviteCode
      })
      
      trace.addEvent('form_validation_started')
      const validation = validateForm(formData)
      
      if (!validation.success) {
        trace.end({
          'outcome': 'validation_failed',
          'validation.errors': validation.errors.length
        })
        return
      }
      
      trace.addEvent('api_call_started')
      
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: withTraceHeaders(trace, {
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(formData)
      })
      
      trace.addEvent('api_call_completed', {
        'http.status': response.status
      })
      
      if (!response.ok) {
        const error = await response.json()
        trace.end({
          'outcome': 'api_error',
          'error.code': error.code,
          'http.status': response.status
        })
        return
      }
      
      const result = await response.json()
      
      trace.end({
        'outcome': 'success',
        'user.id': result.userId,
        'user.created': true,
        'redirect.to': '/dashboard'
      })
      
      router.push('/dashboard')
      
    } catch (error) {
      trace.error(error)
    }
  }
}
```

## How Server Receives the Trace

The magic happens with `trace.getHeaders()`:

1. **Client** creates a span with trace ID `abc123`
2. **Client** calls `trace.getHeaders()` which returns:
   ```json
   {
     "traceparent": "00-abc123def456-789ghi012jkl-01"
   }
   ```
3. **Server** extracts this header and creates a child span
4. All server spans have the same trace ID `abc123`
5. **Axiom** shows them as one connected trace graph

## Debugging

### Get Trace ID for Logs

```tsx
const trace = startTrace('operation')
const traceId = trace.getTraceId()

console.log('Trace ID:', traceId)
// Tell user: "Your trace ID is abc123. Include this in support tickets."

trace.end()
```

### Check if Tracing is Active

```tsx
import { trace } from '@opentelemetry/api'

const tracer = trace.getTracer('frontend')
const span = tracer.startSpan('test')

if (span.spanContext().traceId) {
  console.log('✅ Tracing is working!')
} else {
  console.log('❌ Tracing not initialized')
}

span.end()
```

## Common Patterns

### Pattern: Multi-Step Wizard

```tsx
function WizardFlow() {
  const [trace, setTrace] = useState<TraceControl | null>(null)
  const { startTrace } = useTrace()
  
  const handleStart = () => {
    const t = startTrace('wizard.complete')
    t.addEvent('wizard_started')
    setTrace(t)
  }
  
  const handleStep = (stepName: string) => {
    trace?.addEvent(`step_completed.${stepName}`)
  }
  
  const handleComplete = async () => {
    trace?.addEvent('submitting')
    const result = await submitWizard()
    trace?.end({ outcome: 'success', steps_completed: 5 })
  }
}
```

### Pattern: Retry Logic

```tsx
const trace = startTrace('api.call.with_retry')
let attempt = 0

while (attempt < 3) {
  attempt++
  trace.addEvent('attempt_started', { attempt })
  
  try {
    const result = await apiCall()
    trace.end({ 
      outcome: 'success',
      attempts: attempt 
    })
    return result
  } catch (error) {
    if (attempt === 3) {
      trace.error(error, { 
        total_attempts: attempt 
      })
      throw error
    }
    trace.addEvent('attempt_failed', { 
      attempt,
      error: error.message 
    })
  }
}
```

## Next Steps

- See `defective.ts` for server-side tracing (non-Effect)
- See `telemery.ts` for Effect.ts integration
- Read https://loggingsucks.com/ for wide events philosophy
- Check Axiom dashboard for your traces

## Questions?

Common issues:

**Q: My spans aren't showing up in Axiom**
A: Check the browser console for OTEL errors. Make sure the provider is initialized.

**Q: Server spans aren't children of client spans**
A: Ensure you're using `trace.getHeaders()` in your fetch calls.

**Q: Too many spans, high costs**
A: Implement sampling (not in this file yet). Sample 100% of errors, 5% of success.

**Q: Can I trace multiple parallel operations?**
A: Yes! Start multiple traces and they'll all be sent. Or start child spans manually.