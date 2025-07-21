"use client";

import type { HTMLProps } from "react";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "./ui/dropzone";
import { Button } from "./ui/button";

export function ImageUpload({
  files,
  setFiles,
  nextStage,
  ...props
}: {
  files: File[] | undefined;
  setFiles: (files: File[] | undefined) => void;
  nextStage: () => void;
} & HTMLProps<HTMLDivElement>) {
  return (
    <div className="w-xs flex justify-center items-center gap-4 flex-col terminal-animate-in">
      <Dropzone
        {...props}
        accept={{ "image/*": [] }}
        onDrop={setFiles}
        onError={console.error}
        src={files}
        className="terminal-glow hover:border-primary transition-colors"
      >
        <DropzoneEmptyState />
        <DropzoneContent />
      </Dropzone>
      <Button
        className="w-full terminal-glow"
        disabled={(files?.length ?? 0) <= 0}
        onClick={nextStage}
      >
        Submit
      </Button>
    </div>
  );
}
