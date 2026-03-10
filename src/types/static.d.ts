declare module "*.csv?raw" {
  const content: string;
  export default content;
}

declare module "*.jsx" {
  import type { ComponentType } from "react";

  const component: ComponentType;
  export default component;
}
