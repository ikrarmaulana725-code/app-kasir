import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.qasirmodern.pos",
  appName: "Qasir Modern",
  webDir: "dist",
  server: {
    androidScheme: "https"
  }
};

export default config;
