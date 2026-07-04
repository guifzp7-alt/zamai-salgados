import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "br.com.zamai.salgados",
  appName: "Zamai Salgados",
  webDir: "apps/web/out",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https"
  }
};

export default config;
