# Backend Telemetry Tutorial

This guide shows you how to implement server-side tracing for non-Effect code (BetterAuth, API routes, server functions) with pyramid tracing and automatic context propagation to Effect.ts.

## Setup

### 1. OpenTelemetry Provider (Server)

You'll need to initialize OpenTelemetry on the server. This is typically done in your server entry point:

```ts
// src/server.ts or similar
import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { Resource } from '@opentelemetry/resources'
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import env from '#env'

// Only initialize in server context
if (typeof window === 'undefined' && env.AXIOM_TOKEN) {
  const sdk = new NodeSDK({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: 'ewf-id-backend',
    }),
    traceExporter: new OTLPTraceExporter({
      url: 'https://api.axiom.co/v1/traces',
      headers: {
        'Authorization': `Bearer ${env.AXIOM_TOKEN}`,
        'X-Axiom-Dataset': env.AXIOM_DATASET,
      },
    }),
  })

  sdk.start()

  process.on('SIGTERM', () => {
    sdk.shutdown().then(() => console.log('Tracing terminated'))
  })
}
```

### 2. Environment Variables

Make sure these are set:

```env
AXIOM_TOKEN=your-axiom-token
AXIOM_DATASET=ewf-id
```

## What is Server-Side Pyramid Tracing?

Server spans are **children** of client spans, creating a complete pyramid:

```
Client Span: "user.checkout"
└─ Server Span: "server.checkout" (child)
   └─ Effect Span: "effect.payment" (grandchild)
      ├─ DB Span: "db.query"
      └─ External API Span: "stripe.charge"
```

The server extracts the trace context from request headers and creates linked spans.

## Three Ways to Trace

### 1. Manual Control (Full Power)

```ts
import { useServerTrace } from '@/lib/telemery/defective'

export async function authHandler(request: Request) {
  const { startTrace } = useServerTrace()
  const trace = startTrace('auth.login')

  // Link to client span via headers
  trace.extractFromHeaders(request.headers)

  try {
    trace.setAttribute('auth.method', 'password')

    const user = await validateCredentials(email, password)
    
    trace.addEvent('credentials_validated')
    
    trace.setAttribute('user.id', user.id)
    trace.setAttribute('user.subscription', user.subscription)

    // Create session
    await createSession(user)

    trace.end({
      'outcome': 'success',
      'session.created': true
    })

    return { success: true, userId: user.id }

  } catch (error) {
    trace.error(error, {
      'auth.failure_reason': error.message
    })
    throw error
  }
}
```

### 2. Wrapper Functions (Convenience)

```ts
import { useServerTrace } from '@/lib/telemery/defective'

export async function authHandler(request: Request) {
  const { traceServerAsync } = useServerTrace()

  return traceServerAsync(
    'auth.login',
    async (trace) => {
      trace.setAttribute('auth.method', 'password')

      const user = await validateCredentials(email, password)
      
      trace.setAttribute('user.id', user.id)

      return { success: true, userId: user.id }
    },
    {
      headers: request.headers, // Auto-extracted!
    }
  )
}
```

### 3. TanStack Server Functions (Cleanest)

```ts
import { createServerFn } from '@tanstack/start'
import { createTracedServerFn } from '@/lib/telemery/defective'

// Define the traced function factory
const tracedCheckoutFn = createTracedServerFn({
  method: 'POST', // or ['GET', 'POST'] for multiple methods
  name: 'server.checkout',
  handler: async (data: CheckoutData, trace) => {
    // Headers automatically extracted!
    // Span automatically managed!

    trace.setAttributes({
      'cart.id': data.cartId,
      'user.id': data.userId,
    })

    trace.addEvent('validation_started')
    
    const validation = await validateCart(data.cartId)
    
    if (!validation.valid) {
      trace.end({
        'outcome': 'validation_failed',
        'validation.errors': validation.errors.length
      })
      throw new Error('Invalid cart')
    }

    trace.addEvent('payment_started')

    const result = await processPayment(data)

    trace.setAttributes({
      'order.id': result.orderId,
      'order.total_cents': result.total,
      'payment.method': result.paymentMethod,
    })

    return result
    // trace.end() called automatically!
  }
})

// Use it (need to pass createServerFn)
export const checkoutFn = await tracedCheckoutFn(createServerFn)
```

## Wide Events on the Server

Following https://loggingsucks.com/, capture high-cardinality, high-dimensionality data:

```ts
trace.end({
  // Outcome
  'outcome': 'success' | 'error' | 'validation_failed',
  
  // User Context
  'user.id': 'user_123',
  'user.subscription': 'premium',
  'user.account_age_days': 847,
  
  // Request Context
  'http.method': 'POST',
  'http.url': request.url,
  'http.status_code': 200,
  'http.user_agent': request.headers.get('user-agent'),
  
  // Business Context
  'order.id': 'ord_xyz',
  'order.total_cents': 15999,
  'payment.provider': 'stripe',
  'payment.method': 'card',
  
  // Performance
  'db.query_count': 3,
  'db.total_time_ms': 45,
  'external_api.calls': 2,
  
  // Feature Flags
  'feature.new_checkout': true,
  
  // Technical
  'cache.hit': false,
  'retry.attempts': 1,
})
```

## Propagating to Effect.ts

The magic happens with `withContext` or `withEffect`:

### Option 1: withContextAsync

```ts
const trace = startTrace('server.operation')
trace.extractFromHeaders(request.headers)

// Effect will inherit the trace context!
const result = await trace.withContextAsync(() =>
  Effect.runPromise(
    myEffect.pipe(
      Effect.withSpan('effect.my_operation')
    )
  )
)

trace.end()
```

### Option 2: withEffect

```ts
const trace = startTrace('server.operation')
trace.extractFromHeaders(request.headers)

const tracedEffect = trace.withEffect(
  myEffect.pipe(
    Effect.withSpan('effect.my_operation')
  )
)

const result = await Effect.runPromise(tracedEffect)

trace.end()
```

## BetterAuth Integration

Use `withServerTrace` for wrapping handlers:

```ts
import { withServerTrace } from '@/lib/telemery/defective'

export const loginHandler = withServerTrace(
  'auth.login',
  async (request: Request, trace) => {
    const body = await request.json()
    
    trace.setAttributes({
      'auth.method': 'password',
      'auth.email': body.email, // Be careful with PII!
    })

    const user = await validateUser(body.email, body.password)

    if (!user) {
      trace.end({
        'outcome': 'invalid_credentials',
        'auth.failed': true
      })
      return new Response('Invalid credentials', { status: 401 })
    }

    trace.setAttribute('user.id', user.id)

    const session = await createSession(user)

    trace.end({
      'outcome': 'success',
      'session.id': session.id,
      'user.subscription': user.subscription,
    })

    return new Response(JSON.stringify({ success: true }))
  },
  {
    // Automatically extract headers from first argument
    extractHeaders: (args) => args[0].headers,
  }
)
```

## API Routes

For TanStack Start API routes:

```ts
import { createFileRoute } from '@tanstack/react-router'
import { useServerTrace } from '@/lib/telemery/defective'

export const Route = createFileRoute('/api/users/$userId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { startTrace } = useServerTrace()
        const trace = startTrace('api.users.get')

        trace.extractFromHeaders(request.headers)

        try {
          trace.setAttributes({
            'user.id': params.userId,
            'http.method': 'GET',
            'http.path': request.url,
          })

          const user = await fetchUser(params.userId)

          if (!user) {
            trace.end({
              'outcome': 'not_found',
              'http.status': 404
            })
            return new Response('Not found', { status: 404 })
          }

          trace.end({
            'outcome': 'success',
            'http.status': 200,
            'user.subscription': user.subscription,
          })

          return Response.json(user)

        } catch (error) {
          trace.error(error)
          return new Response('Internal error', { status: 500 })
        }
      },

      PATCH: async ({ request, params }) => {
        const { traceServerAsync } = useServerTrace()

        return traceServerAsync(
          'api.users.update',
          async (trace) => {
            const body = await request.json()

            trace.setAttributes({
              'user.id': params.userId,
              'update.fields': Object.keys(body).join(','),
            })

            const updated = await updateUser(params.userId, body)

            return Response.json(updated)
          },
          { headers: request.headers }
        )
      }
    }
  }
})
```

## Downstream Service Calls

When calling external APIs, propagate the trace:

```ts
import { withTraceHeaders } from '@/lib/telemery/defective'

const trace = startTrace('server.call_stripe')
trace.extractFromHeaders(request.headers)

trace.addEvent('stripe_api_call_started')

const stripeResponse = await fetch('https://api.stripe.com/v1/charges', {
  method: 'POST',
  headers: withTraceHeaders(trace, {
    'Authorization': `Bearer ${stripeKey}`,
    'Content-Type': 'application/json',
  }),
  body: JSON.stringify(chargeData)
})

trace.addEvent('stripe_api_call_completed', {
  'stripe.status': stripeResponse.status
})

trace.end()
```

## Error Handling Patterns

### Pattern 1: Try-Catch

```ts
const trace = startTrace('operation')

try {
  const result = await riskyOperation()
  trace.end({ outcome: 'success' })
  return result
} catch (error) {
  trace.error(error, {
    'error.recoverable': false,
    'retry.attempted': false
  })
  throw error
}
```

### Pattern 2: Validation Errors

```ts
const trace = startTrace('api.create_user')
trace.extractFromHeaders(request.headers)

const validation = validateInput(body)

if (!validation.valid) {
  // Not an error, just invalid input
  trace.end({
    'outcome': 'validation_failed',
    'validation.errors': validation.errors.length,
    'http.status': 400
  })
  return new Response('Validation failed', { status: 400 })
}

// ... continue
```

### Pattern 3: Retry Logic

```ts
const trace = startTrace('external.api.call')
let attempt = 0
const maxAttempts = 3

while (attempt < maxAttempts) {
  attempt++
  trace.addEvent('attempt_started', { attempt })

  try {
    const result = await externalApi()
    trace.end({
      'outcome': 'success',
      'retry.attempts': attempt,
      'retry.needed': attempt > 1
    })
    return result
  } catch (error) {
    if (attempt === maxAttempts) {
      trace.error(error, {
        'retry.attempts': attempt,
        'retry.exhausted': true
      })
      throw error
    }

    trace.addEvent('attempt_failed', {
      attempt,
      error: error.message
    })

    await sleep(Math.pow(2, attempt) * 100) // Exponential backoff
  }
}
```

## Best Practices

### ✅ DO: Extract Headers Early

```ts
const trace = startTrace('operation')
trace.extractFromHeaders(request.headers) // ✅ Right away!

// Now all operations are linked to client
```

### ✅ DO: Add Business Context

```ts
trace.end({
  'user.subscription': 'premium',  // ✅ Helps prioritize
  'order.value_cents': 15999,       // ✅ Revenue impact
  'feature.rollout': true,          // ✅ Correlate issues
})
```

### ✅ DO: Use Events for Timeline

```ts
trace.addEvent('validation_started')
trace.addEvent('db_query_started')
trace.addEvent('payment_api_called')
trace.addEvent('email_queued')
// Beautiful timeline in Axiom!
```

### ❌ DON'T: Forget to End Spans

```ts
// ❌ Bad: Span never ends (memory leak!)
const trace = startTrace('operation')
await doWork()
// Missing: trace.end()

// ✅ Good: Always end in finally
try {
  await doWork()
  trace.end()
} catch (error) {
  trace.error(error)
}
```

### ❌ DON'T: Log PII Carelessly

```ts
// ❌ Bad: PII in traces
trace.setAttribute('user.password', password)
trace.setAttribute('user.ssn', ssn)

// ✅ Good: Hash or omit
trace.setAttribute('user.id', userId) // OK
trace.setAttribute('user.email_hash', hash(email)) // OK
```

## Debugging

### Get Trace ID for Correlation

```ts
const trace = startTrace('operation')
const traceId = trace.getTraceId()

console.log(`Trace ID: ${traceId}`)
// Log to external systems for correlation
logger.info('Operation started', { traceId })

trace.end()
```

### Check Context Propagation

```ts
import { trace, context } from '@opentelemetry/api'

const span = trace.getActiveSpan()
if (span) {
  console.log('✅ Context is active:', span.spanContext().traceId)
} else {
  console.log('❌ No active span')
}
```

## Integration with Effect.ts

See `telemery.ts` for Effect-specific tracing, but here's how they connect:

```ts
// defective.ts (server)
const trace = startTrace('server.checkout')
trace.extractFromHeaders(request.headers)

// Pass context to Effect
const result = await trace.withContextAsync(() =>
  Effect.runPromise(
    // Effect automatically creates child spans!
    processCheckoutEffect(data).pipe(
      Effect.withSpan('effect.checkout')
    )
  )
)

trace.end()
```

Result in Axiom:
```
Trace: abc123
├─ Client: user.checkout (from browser)
├─ Server: server.checkout (from defective.ts)
└─ Effect: effect.checkout (from telemery.ts)
   ├─ DB: db.query
   └─ Stripe: stripe.charge
```

Perfect pyramid! 🎉

## Common Patterns

### Pattern: Multi-Step Operation

```ts
const trace = startTrace('user.registration')
trace.extractFromHeaders(request.headers)

trace.addEvent('validation_started')
const validation = await validateInput(body)

trace.addEvent('user_creation_started')
const user = await createUser(body)

trace.addEvent('email_verification_sent')
await sendVerificationEmail(user.email)

trace.addEvent('session_created')
const session = await createSession(user)

trace.end({
  'outcome': 'success',
  'user.id': user.id,
  'steps_completed': 4
})
```

### Pattern: Conditional Logic

```ts
const trace = startTrace('payment.process')
trace.extractFromHeaders(request.headers)

trace.setAttribute('payment.method', paymentMethod)

if (paymentMethod === 'card') {
  trace.addEvent('stripe_flow')
  result = await processStripe()
} else if (paymentMethod === 'paypal') {
  trace.addEvent('paypal_flow')
  result = await processPaypal()
}

trace.setAttribute('payment.provider', result.provider)
trace.end({ outcome: 'success' })
```

## Next Steps

- See `frontend.ts` for client-side tracing
- See `telemery.ts` for Effect.ts integration
- Read https://loggingsucks.com/ for wide events philosophy
- Check Axiom for your complete trace graphs

## Troubleshooting

**Q: Server spans aren't linked to client spans**
A: Make sure you call `trace.extractFromHeaders(request.headers)` before any operations.

**Q: Context not propagating to Effect**
A: Use `trace.withContextAsync()` or `trace.withEffect()` when running Effect operations.

**Q: Spans not appearing in Axiom**
A: Check that `AXIOM_TOKEN` is set and the NodeSDK is initialized on server startup.

**Q: Too many spans, high costs**
A: Implement sampling in the NodeSDK configuration (sample 100% of errors, 5% of success).