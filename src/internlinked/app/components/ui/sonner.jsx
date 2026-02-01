"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

// Removed the : ToasterProps type annotation
const Toaster = ({ ...props }) => {
    const { theme = "system" } = useTheme();

    return (
        <Sonner
            theme={theme} // Removed the 'as ToasterProps["theme"]' assertion
            className="toaster group"
            style={
                {
                    "--normal-bg": "var(--popover)",
                    "--normal-text": "var(--popover-foreground)",
                    "--normal-border": "var(--border)",
                } // Removed the 'as React.CSSProperties' assertion
            }
            {...props}
        />
    );
};

export { Toaster };