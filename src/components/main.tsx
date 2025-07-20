"use client";

import { ImageUpload } from "@/components/image-upload";
import { useState } from "react";

export function Main() {
  const [stage, setStage] = useState<"upload" | "generating" | "results">(
    "upload",
  );
  const [files, setFiles] = useState<File[] | undefined>();

  return (
    <main className="size-full gap-2 flex-col flex justify-center items-center">
      {stage === "upload" && (
        <ImageUpload
          files={files}
          setFiles={setFiles}
          nextStage={() => {
            setStage("generating");
          }}
        />
      )}
    </main>
  );
}
