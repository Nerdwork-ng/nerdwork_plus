"use client";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";
import ComicCon from "@/assets/events/comic-con.jpg";
import TechSummit from "@/assets/events/tech-summit.jpg";
import ArtsFair from "@/assets/events/arts-fair.jpg";
import Navbar from "../homepage/Navbar";
import { Button } from "../ui/button";
import Link from "next/link";

export default function EventsHero() {
  const slides = [
    {
      id: 1,
      src: ComicCon,
      alt: "Comic con",
      link: "",
      title: "Comic Con 2026",
      subtitle:
        "Discover one of the biggest comic conventions in Nigeria, where all geek culture collide.",
    },
    {
      id: 2,
      src: TechSummit,
      alt: "tech summit",
      link: "",
      title: "Tech Innovation Summit 2026",
      subtitle:
        "Join industry leaders to explore the latest in technology and innovation.",
    },
    {
      id: 3,
      src: ArtsFair,
      alt: "arts fair",
      link: "",
      title: "Arts & Crafts Fair 2026",
      subtitle:
        "Showcase your talents and discover new art at our annual fair!",
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const SLIDE_DURATION = 5000; // 5 seconds per slide

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    setProgress(0);

    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressPercent = (elapsed / SLIDE_DURATION) * 100;

      if (progressPercent >= 100) {
        nextSlide();
        return;
      }
      setProgress(progressPercent);
    }, 50);

    return () => clearInterval(timer);
  }, [currentSlide, isPlaying, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevSlide();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        nextSlide();
      }
      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [nextSlide, prevSlide, isPlaying]);

  return (
    <header data-testid="event-hero">
      <div
        className="relative h-[95vh] w-full overflow-hidden"
        data-testid="hero-slideshow"
      >
        {/* Background Images */}
        <div className="absolute inset-0">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                width={1600}
                height={1052}
                src={slide.src}
                alt={slide.alt}
                className="h-full w-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,13,13,0)_0%,#0D0D0D_63%)]" />
            </div>
          ))}
        </div>
        {/* Content Overlay */}
        <>
          <Navbar />
          <div className="relative z-10 flex h-full items-end -mt-24">
            <div className="container mx-auto flex flex-col items-center text-white md:text-center px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl flex flex-col gap-6 md:items-center max-md:items-start px-7">
                <p className="bg-nerd-blue text-white text-center max-md:text-[13px] rounded-[20px] px-5 py-1.5 font-medium">
                  {slides[currentSlide].title} is coming soon, Watch out!
                </p>
                <h1
                  className="md:text-[52px] max-md:text-[32px] font-obostar tracking-tight text-white animate-fade-in"
                  key={`title-${currentSlide}`}
                >
                  {slides[currentSlide].title}
                </h1>
                <p
                  className="animate-fade-in delay-200 max-md::text-sm font-semibold"
                  key={`subtitle-${currentSlide}`}
                >
                  {slides[currentSlide].subtitle}
                </p>
                <div className="flex gap-4 justify-center">
                  {slides[currentSlide].link == "" ? (
                    <Button
                      variant={"primary"}
                      disabled
                      className="disabled:cursor-not-allowed w-fit"
                    >
                      Coming Soon
                    </Button>
                  ) : (
                    <Link target="_blank" href={`${slides[currentSlide].link}`}>
                      <Button variant={"primary"}>Register</Button>
                    </Link>
                  )}
                  <Link href={"#events"}>
                    <Button>See all Events</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute max-sm:hidden left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Previous slide"
          data-testid="previous-slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute max-sm:hidden right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Next slide"
          data-testid="next-slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute max-sm:hidden bottom-20 left-4 z-20 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 sm:bottom-8"
          aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </button>
        {/* Progress Bars */}
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="group relative h-1 w-16 overflow-hidden rounded-full bg-white/30 transition-all hover:bg-white/40 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label={`Go to slide ${index + 1}`}
            >
              {/* Background bar */}
              <div className="absolute inset-0 bg-white/30" />
              {/* Progress bar */}
              <div
                className={`absolute left-0 top-0 h-full bg-white transition-all duration-75 ease-linear ${
                  index === currentSlide ? "opacity-100" : "opacity-60"
                }`}
                style={{
                  width:
                    index === currentSlide
                      ? `${progress}%`
                      : index < currentSlide
                      ? "100%"
                      : "0%",
                }}
              />
              {/* Hover effect */}
              <div className="absolute inset-0 scale-0 bg-white/20 transition-transform group-hover:scale-100" />
            </button>
          ))}
        </div>
        {/* Slide Indicators (dots) */}
        <div className="absolute max-md:hidden bottom-20 right-4 z-20 flex flex-col space-y-2 sm:bottom-8">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-3 w-3 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white/50 ${
                index === currentSlide
                  ? "bg-white scale-125"
                  : "bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </header>
  );
}
