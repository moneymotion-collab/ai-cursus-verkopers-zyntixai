import React from "react";

// Vitest node environment uses the classic JSX runtime for TSX tests.
(globalThis as typeof globalThis & { React: typeof React }).React = React;
