import React, { useEffect, useMemo, useState } from "react";

const heroSlides = [
  {
    title: "Cape Town",
    image:
      "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1800&q=85",
  },
  {
    title: "Johannesburg",
    image:
      "https://images.unsplash.com/photo-1576485290814-1c72aa4bbb8e?auto=format&fit=crop&w=1800&q=85",
  },
  {
    title: "Durban",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=85",
  },
  {
    title: "Drakensberg",
    image:
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1800&q=85",
  },
  {
    title: "Port Elizabeth",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85",
  },
  {
    title: "Marloth Park",
    image:
      "https://images.unsplash.com/photo-1547970810-dc1eac37d174?auto=format&fit=crop&w=1800&q=85",
  },
];

const destinations = [
  {
    name: "KaapStad",
    slogan: "Mooi genoeg om jou ex jealous te maak",
    image:
      "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Johannesburg",
    slogan: "More than gold More than business",
    image:
      "https://images.unsplash.com/photo-1576485290814-1c72aa4bbb8e?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Pretoria",
    slogan: "Come for the Jacarandas, stay for the braai!",
    image:
      "https://images.unsplash.com/photo-1523430410476-0185cb1f6ff9?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Durban",
    slogan: "Beach, bunny chow en repeat!",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Drakensberg",
    slogan: "Leave the city for the Berg",
    image:
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Port Elizabeth",
    slogan: "Sea breeze and easy living",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85",
  },

];

function Logo() {
  return (
    <div className="flex items-end gap-2 leading-none">
      <span className="text-[74px] md:text-[120px] font-black tracking-[-0.08em] text-black">
        BLY
      </span>
      <span className="mb-4 md:mb-7 h-5 w-5 md:h-7 md:w-7 rounded-full bg-[#ef4056]" />
    </div>
  );
}

function DestinationCard({ destination }) {
  return (
    <article className="group relative h-[310px] overflow-hidden rounded-3xl bg-black shadow-xl">
      <img
        src={destination.image}
        alt={destination.name}
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
        <h3 className="text-2xl font-black tracking-[-0.04em]">
          {destination.name}
        </h3>
        <p className="mt-1 text-sm leading-snug text-white/90">
          {destination.slogan}
        </p>
      </div>
    </article>
  );
}

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);

  const slide = useMemo(() => heroSlides[activeSlide], [activeSlide]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-[#F8F7F5] text-black">
      <section className="relative min-h-[760px] border-b border-black/10">
        <div className="absolute inset-0 overflow-hidden">
          <img
            key={slide.image}
            src={slide.image}
            alt={slide.title}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-[#F8F7F5]/95 via-[#F8F7F5]/55 to-transparent" />

        <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between px-8 py-7 md:px-14">
          <Logo />

          <nav className="hidden items-center gap-10 pt-3 text-base font-bold md:flex">
            <a href="#stays">Stays</a>
            <a href="#search">Search</a>
            <button className="rounded-full border border-black px-7 py-3 font-bold">
              Sign in
            </button>
            <button className="rounded-full bg-black px-7 py-3 font-bold text-white">
              Book now
            </button>
          </nav>
        </div>

        <div className="relative z-10 mx-auto flex min-h-[760px] max-w-7xl items-center px-8 pt-40 md:px-14">
          <div className="max-w-2xl">
            <h1 className="text-6xl font-black leading-[0.92] tracking-[-0.07em] md:text-8xl">
              Bly waar
              <br />
              dit saak maak<span className="text-[#ef4056]">.</span>
            </h1>
          </div>
        </div>

        <button
          onClick={() =>
            setActiveSlide((activeSlide + 1) % heroSlides.length)
          }
          className="absolute right-7 top-1/2 z-30 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white text-3xl text-black shadow-xl"
        >
          →
        </button>

        <div className="absolute bottom-28 left-1/2 z-20 flex -translate-x-1/2 gap-4">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveSlide(index)}
              className={`h-3 w-3 rounded-full ${
                activeSlide === index ? "bg-[#ef4056]" : "bg-white/80"
              }`}
            />
          ))}
        </div>

        <div
          id="search"
          className="absolute -bottom-10 left-1/2 z-30 w-[90%] max-w-6xl -translate-x-1/2"
        >
          <div className="grid items-center gap-2 rounded-full bg-white p-4 shadow-2xl md:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
            <div className="flex items-center gap-4 border-black/10 px-4 md:border-r">
              <span></span>
              <span className="text-black/70">Where are you going?</span>
            </div>

            <div className="flex items-center gap-4 border-black/10 px-4 md:border-r">
              <span></span>
              <span className="text-black/70">Check-in</span>
            </div>

            <div className="flex items-center gap-4 border-black/10 px-4 md:border-r">
              <span></span>
              <span className="text-black/70">Check-out</span>
            </div>

            <div className="flex items-center gap-4 px-4">
              <span></span>
              <span className="text-black/70">Guests</span>
            </div>

            <button className="flex items-center justify-center gap-3 rounded-full bg-black px-8 py-4 font-bold text-white">
              🔍 Search
            </button>
          </div>
        </div>
      </section>

      <section id="stays" className="mx-auto max-w-7xl px-8 pb-14 pt-24 md:px-14">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#ef4056]">
          Destinations
        </p>

        <h2 className="mt-3 text-4xl font-black tracking-[-0.06em] md:text-5xl">
          Where will you bly<span className="text-[#ef4056]">?</span>
        </h2>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {destinations.slice(0, 6).map((destination) => (
            <DestinationCard key={destination.name} destination={destination} />
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:px-32">
          {destinations.slice(6).map((destination) => (
            <DestinationCard key={destination.name} destination={destination} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-8 py-8 md:px-14">
        <div className="rounded-[2rem] bg-white/75 p-10 text-center shadow-sm md:p-14">
          <div className="mb-5 text-6xl">🏨</div>

          <h2 className="text-4xl font-black tracking-[-0.06em] md:text-5xl">
            Own a stay? Get seen.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-lg text-black/60">
            List your property on BLY. and reach a new generation of South
            African travellers.
          </p>

          <a href="/list-hotel" className="mt-7 inline-block rounded-full bg-[#ef4056] px-10 py-4 text-lg font-black text-white shadow-lg">
            List your property
          </a>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-8 pb-16 pt-8 md:grid-cols-3 md:px-14">
        <div className="flex items-center gap-5 rounded-3xl bg-white/60 p-7">
          <div className="text-4xl">🏷️</div>
          <div>
            <h3 className="text-xl font-black">Better rates</h3>
            <p className="text-black/60">Book direct. Save more.</p>
          </div>
        </div>

        <div className="flex items-center gap-5 rounded-3xl bg-white/60 p-7">
          <div className="text-4xl">❤️</div>
          <div>
            <h3 className="text-xl font-black">Local stays</h3>
            <p className="text-black/60">Support local. Stay local.</p>
          </div>
        </div>

        <div className="flex items-center gap-5 rounded-3xl bg-white/60 p-7">
          <div className="text-4xl">🛡️</div>
          <div>
            <h3 className="text-xl font-black">Secure & simple</h3>
            <p className="text-black/60">Safe booking. Zero hassle.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
