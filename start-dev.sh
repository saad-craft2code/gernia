#!/bin/bash
# Persistent dev server launcher for AGUS SYSTEMS — survives parent shell exit.

# Trap nothing — we want to live forever.
trap '' HUP INT TERM

cd /home/z/my-project

export DATABASE_URL="postgresql://neondb_owner:npg_83vkoOlYHRQr@ep-billowing-surf-b5wlomcy-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require"
export NODE_ENV=development

# Detach stdio from parent
exec bun run dev > /home/z/my-project/dev.log 2>&1
