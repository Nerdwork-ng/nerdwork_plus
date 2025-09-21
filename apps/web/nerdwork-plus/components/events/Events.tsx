import React from "react";
import { Button } from "../ui/button";
import ComicCon from "@/assets/events/comic-con.jpg";
import TechSummit from "@/assets/events/tech-summit.jpg";
import ArtsFair from "@/assets/events/arts-fair.jpg";
import Image from "next/image";

const events = [
  {
    id: 1,
    src: ComicCon,
    alt: "Comic con",
    link: "https://www.straqa.events/nerdworkcomiccon",
    date: "September 6, 2025",
    title: "Comic Con 2025",
    subtitle:
      "Experience a day of creativity and connection at our annual community event! ",
  },
  {
    id: 2,
    src: TechSummit,
    alt: "tech summit",
    link: "",
    date: "---",
    title: "Tech Innovation Summit 2025",
    subtitle:
      "Join industry leaders to explore the latest in technology and innovation.",
  },
  {
    id: 3,
    src: ArtsFair,
    alt: "arts fair",
    link: "",
    date: "---",
    title: "Arts & Crafts Fair 2025",
    subtitle: "Showcase your talents and discover new art at our annual fair!",
  },
];

export default function EventLists() {
  return (
    <section
      data-testid="events-list"
      className="max-w-[1130px] w-full font-inter mx-auto text-white my-20 md:py-10 px-7"
    >
      <div className="flex justify-between mb-10">
        <h3 id="events" className="font-obostar text-[28px] max-md:text-lg">
          Upcoming Events
        </h3>
        <Button className="max-md:hidden">See all Events</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {events.map((event) => (
          <div key={event.id} className="flex flex-col gap-3 justify-between">
            <Image
              src={event.src}
              width={350}
              height={325}
              alt="Event image"
              className="rounded-[12px]"
            />
            <div className="flex flex-col gap-3 max-md:text-sm">
              <p className="font-semibold uppercase">{event.title}</p>
              <p className="text-sm max-md:text-xs text-[#FFFFFF80] font-medium">
                {event.date}
              </p>
              <p className="text-[#FFFFFFCC]">{event.subtitle}</p>
            </div>
            <Button disabled className="disabled:cursor-not-allowed w-fit">
              Not Available
            </Button>
          </div>
        ))}
      </div>
      <Button className="md:hidden mt-8">See all Events</Button>
    </section>
  );
}
