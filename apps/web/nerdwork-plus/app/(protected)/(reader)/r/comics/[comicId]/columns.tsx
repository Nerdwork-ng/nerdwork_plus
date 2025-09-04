"use client";

import { Chapter } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import ComicPaymentFlow from "../../../_components/ComicPaymentFlow";
import Link from "next/link";

export const columns: ColumnDef<Chapter>[] = [
  {
    accessorKey: "id",
    header: () => <div className="text-left text-nerd-muted hidden">id</div>,
    cell: ({ row }) => {
      return (
        <div className="text-left capitalize text-nerd-muted font-normal">
          # {row.original.id}
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
          <p>{row.original.description}</p>
          <p className="text-nerd-muted">{row.original.status}</p>
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
          {row.original.read ? (
            <Link
              className="cursor-pointer hover:opacity-75"
              href={`/r/comics/${row.original.id}/chapter/${row.original.id}`}
            >
              Read
            </Link>
          ) : (
            <ComicPaymentFlow chapter={row.original} />
          )}
        </div>
      );
    },
  },
];
