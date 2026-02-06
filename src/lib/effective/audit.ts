// import { AuditError } from "'defective/audit";
// import { annotateThis } from "'defective/o11y";
// import { AuditService } from "'services/audit";
// import { Crypto } from "'services/betterauth";
// import { Effect, Layer } from "effect";
// import type { AuditLogOptions } from "../audit";
// import { db } from "../auth-db";

// /**
//  * Live implementation of AuditService
//  */
// export const AuditServiceLive = Layer.effect(
//   AuditService,
//   Effect.gen(function* () {
//     const crypto = yield* Crypto;
//     return {
//       log: Effect.fn("service.audit.log")(function* (
//         options: AuditLogOptions,
//         request?: Request,
//       ) {
//         const rawIp = request
//           ? request.headers.get("x-forwarded-for") ||
//             request.headers.get("x-real-ip") ||
//             "unknown"
//           : "system";

//         // Hash IP safely
//         const ipAddressHash = yield* crypto.hash(rawIp).pipe(
//           Effect.mapError(
//             (error) =>
//               new AuditError({
//                 message: "Failed to hash IP address",
//                 reason: "HashingError",
//                 cause: error,
//               }),
//           ),
//           annotateThis,
//         );

//         const userAgent = request
//           ? request.headers.get("user-agent") || "unknown"
//           : "system";

//         const id = yield* crypto.randomUUID().pipe(
//           Effect.mapError(
//             (error) =>
//               new AuditError({
//                 message: "Failed to generate audit log ID",
//                 reason: "HashingError",
//                 cause: error,
//               }),
//           ),
//           annotateThis,
//         );

//         // Perform DB insertion
//         yield* Effect.tryPromise({
//           try: async () => {
//             await db.insert(auditLog).values({
//               id,
//               userId: options.userId,
//               action: options.action,
//               resource: options.resource,
//               resourceId: options.resourceId ?? null,
//               metadata: options.metadata ?? {},
//               ipAddressHash,
//               userAgent,
//               traceId: options.traceId ?? null,
//               spanId: options.spanId ?? null,
//               result: options.result ?? "success",
//               errorMessage: options.errorMessage ?? null,
//               duration: options.duration ?? null,
//             });
//           },
//           catch: (error) =>
//             new AuditError({
//               message: "Failed to insert audit log",
//               reason: "DatabaseError",
//               cause: error,
//             }),
//         }).pipe(annotateThis);
//       }),
//     };
//   }),
// );
