"use client";

import { CreatorTransaction } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<CreatorTransaction>[] = [
  {
    accessorKey: "type",
    header: () => <div className="text-left text-nerd-muted">Type</div>,
    cell: ({ row }) => {
      return (
        <div className="text-left capitalize text-white font-normal">
          {row.original.earningSource}
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: () => <div className="text-left text-nerd-muted">Description</div>,
    cell: ({ row }) => {
      return (
        <div className="text-left capitalize text-white font-normal">
          {row.original.description}
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-left text-nerd-muted">Amount</div>,
    cell: ({ row }) => {
      return (
        <div
          className={`text-left font-normal ${
            row.original.transactionType == "spend"
              ? "text-[#C52B2B]"
              : "text-[#25D448]"
          }`}
        >
          {row.original.transactionType == "spend" ? "-" : "+"}{" "}
          {Number(row.original.nwtAmount).toFixed(2)} NWT
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: () => <div className="text-left text-nerd-muted">Status</div>,
    cell: ({ row }) => {
      return (
        <div
          className={`text-left capitalize ${
            row.original.status == "completed"
              ? "text-[#25D448]"
              : "text-[#EC8F68]"
          } font-normal`}
        >
          {row.original.status}
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: () => <div className="text-left text-nerd-muted">Date</div>,
    cell: ({ row }) => {
      return (
        <div className="text-left text-white font-normal">
          {new Date(row.original.updatedAt).toLocaleDateString()}
        </div>
      );
    },
  },
];
