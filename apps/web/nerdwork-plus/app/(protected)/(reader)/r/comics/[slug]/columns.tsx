"use client";

import { Chapter } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import ComicPaymentFlow from "../../../_components/ComicPaymentFlow";
import ReadButton from "../../../_components/ReadButton";

export const columns: ColumnDef<Chapter>[] = [
  {
    accessorKey: "id",
    header: () => <div className="text-left text-nerd-muted hidden">id</div>,
    cell: ({ row }) => {
      return (
        <div className="text-left capitalize text-nerd-muted font-normal">
          # {row.original.serialNo ?? 1}
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: () => (
      <div className="text-left text-nerd-muted hidden">Description</div>
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left text-sm flex flex-col gap-3 capitalize text-white font-normal">
          <p className="font-semibold text-base">{row.original.title}</p>
          <p>{row.original.summary}</p>
          {/* <p className="text-nerd-muted">{row.original.chapterStatus}</p> */}
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: () => <div className="text-left text-nerd-muted hidden">Date</div>,
    cell: ({ row }) => {
      return (
        <div className="text-left text-nerd-muted font-normal">
          {row.original.date}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: () => (
      <div className="text-left text-nerd-muted hidden">Status</div>
    ),
    cell: ({ row }) => {
      return (
        <div className="text-center">
          {row.original.chapterType == "free" ? (
            <ReadButton chapterCode={row.original.uniqueCode ?? ""} />
          ) : (
            <ComicPaymentFlow chapter={row.original} />
          )}
        </div>
      );
    },
  },
];
