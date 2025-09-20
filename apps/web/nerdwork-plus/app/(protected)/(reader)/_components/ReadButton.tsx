import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const ReadButton = ({ chapterCode }: { chapterCode: string }) => {
  const pathname = usePathname();
  return (
    <Link
      className="cursor-pointer hover:opacity-75"
      href={`${pathname}/chapter/${chapterCode}`}
    >
      Read
    </Link>
  );
};

export default ReadButton;
