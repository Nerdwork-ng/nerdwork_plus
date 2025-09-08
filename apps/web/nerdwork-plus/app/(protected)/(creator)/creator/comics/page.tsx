import { Metadata } from "next";
import React from "react";
import ComicsHeader from "../../_components/comics/ComicsHeader";
import Comics from "../../_components/comics/Comics";

export const metadata: Metadata = {
  title: "Creator Dashboard",
  description: "...",
};

const MyComics = () => {
  return (
    <>
      <ComicsHeader />
      <Comics />
    </>
  );
};

export default MyComics;
