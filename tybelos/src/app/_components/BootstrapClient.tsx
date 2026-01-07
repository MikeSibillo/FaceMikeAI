"use client";

import { useEffect } from "react";
import { seedDefaultConstraintsIfEmpty } from "@/lib/repository/constraintsRepo";

export function BootstrapClient() {
  useEffect(() => {
    void seedDefaultConstraintsIfEmpty();
  }, []);

  return null;
}

