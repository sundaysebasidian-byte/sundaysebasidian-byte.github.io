import { settleSurface } from "./calm-motion.ts";
// State is already committed; this small release never delays or claims a write.
export function confirmControl(element: HTMLElement) {
  settleSurface(element, { scale: ".99" }, 180);
}
