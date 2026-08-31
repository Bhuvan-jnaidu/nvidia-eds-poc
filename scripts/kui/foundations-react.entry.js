// Build entry for the KUI bundle. Run `npm run build:kui` to regenerate
// foundations-react.bundle.js + foundations-react.bundle.css.
//
// Keep this limited to KUI components used by the EDS blocks. Importing from
// the package root here pulls CSS side effects for every KUI component.
//
// CSS = generic KUI design tokens (variables = 4px spacing scale + color
// primitives), dark/light semantic theme tokens, followed by component styles.
// Keep theme-light after theme-dark so the page default stays light while
// scoped .nv-dark components, such as the hero, can resolve dark tokens.
import "@kui/foundations-css/dist/base/variables.css";
import "@kui/foundations-css/dist/base/icons.css";
import "@kui/foundations-css/dist/base/theme-dark.css";
import "@kui/foundations-css/dist/base/theme-light.css";
import "@kui/foundations-css/dist/components/primitive.css";
import "@kui/foundations-css/dist/components/hero.css";
import "@kui/foundations-css/dist/components/grid.css";
import "@kui/foundations-css/dist/components/flex.css";
import "@kui/foundations-css/dist/components/card.css";
import "@kui/foundations-css/dist/components/carousel.css";
import "@kui/foundations-css/dist/components/segmented-control.css";
import "@kui/foundations-css/dist/components/progress-bar.css";
import "@kui/foundations-css/dist/components/text.css";
import "@kui/foundations-css/dist/components/button.css";
import "@kui/foundations-css/dist/components/accordion.css";
import "@kui/foundations-css/dist/components/tabs.css";
import "@kui/foundations-css/dist/components/input-shell.css";
import "@kui/foundations-css/dist/components/badge.css";

// React is now bundled in (self-hosted, no esm.sh). Re-export it here so blocks
// import React/createRoot/flushSync from this same bundle — guaranteeing ONE
// React instance shared with the KUI components (avoids the "two Reacts" bug).
export { default as React } from "react";
export { flushSync } from "react-dom";
export { createRoot } from "react-dom/client";

// Matches block imports such as:
// import { Badge, Button, Card, Carousel, CarouselArrowButton, CarouselControls, Flex, Grid, Hero, ProgressBar, SegmentedControl, Text } from "@kui/foundations-react";
export { Button } from "@kui/foundations-react/Button";
export { Card } from "@kui/foundations-react/Card";
export {
  Carousel,
  CarouselArrowButton,
  CarouselControls,
  useCarouselContext,
} from "@kui/foundations-react/Carousel";
export { Flex } from "@kui/foundations-react/Flex";
export { Grid } from "@kui/foundations-react/Grid";
export { Hero } from "@kui/foundations-react/Hero";
export { ProgressBar } from "@kui/foundations-react/ProgressBar";
export { SegmentedControl } from "@kui/foundations-react/SegmentedControl";
export { Text } from "@kui/foundations-react/Text";
export { Accordion } from "@kui/foundations-react/Accordion";
export { Tabs } from "@kui/foundations-react/Tabs";
export { InputShell, InputDismissButton } from "@kui/foundations-react/InputShell";
export { Badge } from "@kui/foundations-react/Badge";
export {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "@nv-brand-assets/react-icons-inline";
