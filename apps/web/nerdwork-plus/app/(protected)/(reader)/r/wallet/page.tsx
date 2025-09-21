"use client";
import Image from "next/image";
import React, { useMemo, useState } from "react";
import NWT from "@/assets/nwt.svg";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table";
import { columns } from "./columns";
import PurchaseTokenModal from "@/components/wallet/PurchaseTokenModal";
import { useUserSession } from "@/lib/api/queries";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getReaderTransactionHistory } from "@/actions/transaction.action";
import { ReaderTransaction } from "@/lib/types";
import LoaderScreen from "@/components/loading-screen";
import { toast } from "sonner";

const ReaderWalletPage = () => {
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("");
  const { profile } = useUserSession();
  const readerProfile = profile?.readerProfile;

  const usdPerNwt = 0.1;
  const calculateUSD = (amount: number) => amount * usdPerNwt;
  const usdEquivalent = calculateUSD(readerProfile?.walletBalance);

  const {
    data: transactions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["reader-transactions"],
    queryFn: getReaderTransactionHistory,
    placeholderData: keepPreviousData,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  if (error) toast.error(error?.message || "Error getting library details");

  const transactionData: ReaderTransaction[] =
    transactions?.data.transaction ?? [];

  const filteredAndSortedData = useMemo(() => {
    let filteredData = transactionData;

    if (typeFilter !== "all" && typeFilter !== "") {
      filteredData = filteredData.filter(
        (item) => item.transactionType === typeFilter
      );
    }
    if (statusFilter !== "all" && statusFilter !== "") {
      filteredData = filteredData.filter(
        (item) => item.status === statusFilter
      );
    }

    if (sort !== "all" && sort !== "") {
      filteredData = [...filteredData].sort((a, b) => {
        if (sort === "nwtAmount") {
          return b.nwtAmount - a.nwtAmount;
        }
        if (sort === "date") {
          // Assuming date is a string that can be compared or converted to a Date object
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        }
        if (sort === "type") {
          return a.transactionType.localeCompare(b.transactionType);
        }
        return 0;
      });
    }

    return filteredData;
  }, [transactionData, typeFilter, statusFilter, sort]);

  if (isLoading) return <LoaderScreen />;

  return (
    <main className="text-white font-inter pt-20">
      <section className="max-w-[1300px] mx-auto px-5 py-10 flex flex-col gap-5">
        <div className="flex max-md:flex-col gap-3 justify-between md:items-center">
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-[28px]">Wallet</h3>
            <p className="text-nerd-muted text-sm">
              Manage your tokens and expenses
            </p>
          </div>
          <div className="flex gap-2">
            <PurchaseTokenModal />
          </div>
        </div>

        <section className="flex max-md:flex-col gap-3">
          <div className="md:w-2/4 md:h-[225px] rounded-[12px] border-[0.5px] border-[#292A2E] bg-[#1D1E21] flex flex-col justify-between p-6">
            <div>
              <p className="text-sm mb-2">Available Balance</p>
              <p className="text-5xl md:text-[64px] text-[#09FFFF] flex items-center gap-3 font-bold">
                <Image
                  src={NWT}
                  width={64}
                  height={64}
                  alt=""
                  className="max-md:h-9 max-md:w-9"
                />
                {readerProfile?.walletBalance}
              </p>
            </div>
            <p className="text-right font-bold text-[#598EE2] opacity-55 text-4xl md:text-5xl">
              ≈ ${usdEquivalent.toFixed(2) ?? 0.0}
            </p>
          </div>

          <div className="md:w-1/4 md:h-[225px] rounded-[12px] border-[0.5px] border-[#292A2E] text-sm p-6 flex flex-col gap-4">
            <div>
              <p>Wallet Information</p>
              <p className="text-nerd-muted">Manage your internal wallet</p>
            </div>
            <div className="flex flex-col gap-5">
              <div>
                <p>NWT Internal Wallet</p>
                <p className="text-nerd-muted">{readerProfile?.walletId}</p>
              </div>
            </div>
          </div>

          <div className="md:w-1/4 md:h-[225px] rounded-[12px] border-[0.5px] border-[#292A2E] text-sm flex flex-col justify-between">
            <div className="p-6 h-[60%] flex flex-col justify-between">
              <div>
                <p>Exchange Rates</p>
                <p className="text-nerd-muted">
                  Rates are updated every 2 minutes
                </p>
              </div>
              <div className="font-medium">
                <p className="flex justify-between">
                  10 NWT <span>$1.00</span>
                </p>
                {/* <p className="flex justify-between">
                  1 SOL <span>$10.05</span>
                </p> */}
              </div>
            </div>
            <div>
              <hr className="!text-[#292A2E] h-0 border-t border-[#292A2E]" />
              <div className="p-6 text-xs text-nerd-muted flex flex-col gap-1">
                <p className="flex justify-between">
                  Fees: <span>1% on all transactions.</span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </section>

      <hr className="!text-[#292A2E] h-0 border-t border-[#292A2E]" />

      <section className="max-w-[1300px] mx-auto px-5 py-10">
        <p>Transaction History</p>
        <p className="text-nerd-muted text-sm">
          Your payout requests and their status
        </p>

        <div className="flex gap-3 py-5 border-b border-[#292A2E]">
          <Select onValueChange={setTypeFilter} value={typeFilter}>
            <SelectTrigger className="w-full max-w-[155px] bg-[#1D1E21] border-[#292A2E] text-white">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-[#1D1E21] border-none text-white">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="purchase">Purchase</SelectItem>
              <SelectItem value="spend">Spending</SelectItem>
              <SelectItem value="refund">Refund</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={setStatusFilter} value={statusFilter}>
            <SelectTrigger className="w-full max-w-[155px] bg-[#1D1E21] border-[#292A2E] text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#1D1E21] border-none text-white">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={setSort} value={sort}>
            <SelectTrigger className="w-full max-w-[155px] bg-[#1D1E21] border-[#292A2E] text-white">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent className="bg-[#1D1E21] border-none text-white">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="type">Type</SelectItem>
              <SelectItem value="nwtAmount">Amount</SelectItem>
              <SelectItem value="date">Date</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="container mx-auto py-10 text-white">
          <DataTable columns={columns} data={filteredAndSortedData} />
        </div>
      </section>
    </main>
  );
};

export default ReaderWalletPage;
