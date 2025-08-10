import React from "react";
import { Input } from "./input";

export type FileInputProps = {
  id?: string;
  accept?: string;
  multiple?: boolean;
  onChange?: (file: File | null) => void;
  className?: string;
};

const FileInput: React.FC<FileInputProps> = ({ id, accept, multiple = false, onChange, className }) => {
  return (
    <Input
      id={id}
      type="file"
      accept={accept}
      multiple={multiple}
      className={className}
      onChange={(e) => {
        const input = e.target as HTMLInputElement;
        const file = input.files && input.files.length > 0 ? input.files[0] : null;
        onChange?.(file);
      }}
    />
  );
};

export { FileInput };
export default FileInput;
