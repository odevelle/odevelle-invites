import type { z } from "zod";
import type { BaseAppearance } from "@/invitation/schema/appearance";
import type { DesignDefinition } from "./types";

/** Identity helper that keeps a definition's precise option/appearance types. */
export function defineDesign<Options extends z.ZodType, Appearance extends z.ZodType<BaseAppearance>>(
  definition: DesignDefinition<Options, Appearance>,
): DesignDefinition<Options, Appearance> {
  return definition;
}
