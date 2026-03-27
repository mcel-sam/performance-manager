FROM node:20-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app/apps/web
COPY apps/web/package.json apps/web/package-lock.json ./
COPY apps/web/prisma ./prisma
RUN npm ci
RUN npx prisma generate

FROM base AS builder
WORKDIR /app/apps/web
COPY --from=deps /app/apps/web/node_modules ./node_modules
COPY apps/web ./
RUN npm run build

FROM base AS runner
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs
WORKDIR /app/apps/web
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/package-lock.json ./package-lock.json
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/next.config.ts ./next.config.ts

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch(`http://127.0.0.1:${process.env.PORT || 3000}/api/health`).then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["./scripts/docker-entrypoint.sh"]
