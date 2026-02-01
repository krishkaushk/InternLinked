"use client";

import * as React from "react";
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";

// Removed the : React.ComponentProps<typeof AspectRatioPrimitive.Root> annotation
function AspectRatio({ ...props }) {
    return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}

export { AspectRatio };