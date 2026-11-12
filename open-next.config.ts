import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Minimal Cloudflare config (no R2 incremental cache required for CRM launch).
export default defineCloudflareConfig({});
