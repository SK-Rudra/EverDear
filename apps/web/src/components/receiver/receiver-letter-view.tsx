"use client";

import {
  Heart,
  House,
  Quote,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import type {
  Letter,
  LetterAttachment,
} from "@/lib/everdear-api";
import {
  ReceiverMediaGallery,
  type ReceiverVariant,
} from "./receiver-media-gallery";

type ReceiverLetterViewProps = {
  letter: Letter;
  attachments: LetterAttachment[];
  getContentUrl: (
    attachment: LetterAttachment,
  ) => string;
};

type ThemeViewProps = ReceiverLetterViewProps & {
  variant: ReceiverVariant;
};

function LovedLetter({
  letter,
  attachments,
  getContentUrl,
}: ThemeViewProps) {
  return (
    <section className="relative mx-auto w-full max-w-5xl">
      <div
        aria-hidden="true"
        className="absolute inset-5 -rotate-[1.5deg] rounded-[3rem] border border-[#bd6878]/15 bg-[#f4ccd2]/55 shadow-xl"
      />

      <div
        aria-hidden="true"
        className="absolute -left-5 top-32 hidden h-20 w-20 rotate-[-14deg] place-items-center rounded-full border border-[#a85161]/15 bg-[#fff8f5]/85 text-[#a85161] shadow-xl backdrop-blur-md sm:grid"
      >
        <Heart className="h-7 w-7 fill-current" />
      </div>

      <div
        aria-hidden="true"
        className="absolute -right-3 bottom-36 hidden h-14 w-14 rotate-12 place-items-center rounded-full bg-[#a85161] text-white shadow-[0_15px_40px_rgba(168,81,97,0.3)] sm:grid"
      >
        <Sparkles className="h-5 w-5" />
      </div>

      <article className="relative overflow-hidden rounded-[3rem] border border-[#d9adb5] bg-[linear-gradient(145deg,#fffdf9_0%,#fff7f5_48%,#fdf0f1_100%)] shadow-[0_45px_140px_rgba(113,58,71,0.24)]">
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-[#efbbc4] via-[#a85161] to-[#efbbc4]" />

        <div
          aria-hidden="true"
          className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[38px] border-[#d98998]/[0.07]"
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#d98998]/[0.06]"
        />

        <div className="relative px-6 py-12 sm:px-14 sm:py-16 lg:px-20 lg:py-20">
          <header className="text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-[#a85161]/20 bg-[#a85161] text-white shadow-[0_15px_45px_rgba(168,81,97,0.3)]">
              <Heart className="h-8 w-8 fill-current" />
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.3em] text-[#a85161]/65">
              A love letter for
            </p>

            <p
              className="mt-3 text-4xl text-[#a85161] sm:text-5xl"
              style={{
                fontFamily:
                  '"Segoe Script", "Brush Script MT", cursive',
              }}
            >
              {letter.recipientName}
            </p>

            <h1 className="mx-auto mt-7 max-w-4xl font-display text-5xl font-bold italic tracking-[-0.05em] text-[#4b2731] sm:text-7xl lg:text-[5.5rem] lg:leading-[0.95]">
              {letter.title ||
                "All the words my heart kept"}
            </h1>

            <div className="mx-auto mt-9 flex max-w-md items-center gap-4">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#a85161]/35" />

              <div className="flex items-center gap-1.5 text-[#a85161]">
                <Sparkles className="h-3.5 w-3.5" />
                <Heart className="h-4 w-4 fill-current" />
                <Sparkles className="h-3.5 w-3.5" />
              </div>

              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#a85161]/35" />
            </div>

            <p
              className="mx-auto mt-7 max-w-xl text-2xl leading-9 text-[#a85161]/75"
              style={{
                fontFamily:
                  '"Segoe Script", "Brush Script MT", cursive',
              }}
            >
              Every word here found its way to you.
            </p>
          </header>

          <div className="relative mx-auto mt-12 max-w-3xl rounded-[2rem] border border-[#a85161]/15 bg-white/55 px-6 py-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_18px_60px_rgba(120,63,76,0.08)] backdrop-blur-sm sm:px-10 sm:py-12">
            <Heart
              aria-hidden="true"
              className="absolute -left-3 -top-3 h-7 w-7 rotate-[-12deg] fill-[#d98998] text-[#d98998]"
            />

            <div className="whitespace-pre-wrap font-display text-xl leading-10 text-[#4b2731]/90 first-letter:float-left first-letter:mr-3 first-letter:mt-2 first-letter:text-7xl first-letter:font-bold first-letter:leading-[0.75] first-letter:text-[#a85161] sm:text-[1.4rem] sm:leading-[2.8rem]">
              {letter.content.body ||
                "This letter is waiting for its words."}
            </div>

            <Heart
              aria-hidden="true"
              className="ml-auto mt-8 h-4 w-4 fill-[#a85161] text-[#a85161] opacity-40"
            />
          </div>

          {attachments.length > 0 && (
            <section className="mt-16 border-t border-[#a85161]/15 pt-11">
              <div className="mb-7 text-center">
                <p
                  className="text-3xl text-[#a85161]"
                  style={{
                    fontFamily:
                      '"Segoe Script", "Brush Script MT", cursive',
                  }}
                >
                  Moments of us
                </p>

                <p className="mt-2 text-xs font-bold uppercase tracking-[0.22em] text-[#a85161]/45">
                  Memories held close to this letter
                </p>
              </div>

              <ReceiverMediaGallery
                attachments={attachments}
                variant="loved"
                getContentUrl={getContentUrl}
              />
            </section>
          )}

          <footer className="mt-16 text-center">
            <p
              className="text-2xl text-[#4b2731]/55"
              style={{
                fontFamily:
                  '"Segoe Script", "Brush Script MT", cursive',
              }}
            >
              Yours, with all my heart
            </p>

            <p
              className="mt-3 text-5xl text-[#a85161] sm:text-6xl"
              style={{
                fontFamily:
                  '"Segoe Script", "Brush Script MT", cursive',
              }}
            >
              {letter.senderName}
            </p>

            <span className="mx-auto mt-6 grid h-10 w-10 place-items-center rounded-full border border-[#a85161]/20 text-[#a85161]">
              <Heart className="h-4 w-4 fill-current" />
            </span>
          </footer>
        </div>
      </article>
    </section>
  );
}

function FriendLetter({
  letter,
  attachments,
  getContentUrl,
}: ThemeViewProps) {
  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="relative overflow-hidden rounded-[2rem] bg-[#315f78] px-6 py-10 text-white shadow-[0_25px_80px_rgba(36,80,103,0.25)] sm:px-10">
        <Star className="absolute -right-5 -top-6 h-32 w-32 rotate-12 fill-[#ef9a72] text-[#ef9a72] opacity-90" />

        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em]">
            <Users className="h-3.5 w-3.5" />
            Friendship delivery
          </span>

          <h1 className="mt-5 text-4xl font-black tracking-[-0.045em] sm:text-6xl">
            Hey, {letter.recipientName}!
          </h1>

          <p className="mt-3 max-w-xl text-base leading-7 text-white/70">
            Someone saved more than a quick text
            for you.
          </p>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="relative overflow-hidden rounded-[2rem] border border-[#315f78]/15 bg-[#f4a27c] p-7 text-[#263d49] shadow-xl lg:rotate-[-1.5deg]">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full border-[12px] border-[#fff7dc]/40" />

          <p className="text-xs font-black uppercase tracking-[0.2em] opacity-55">
            A note titled
          </p>

          <h2 className="mt-4 font-display text-4xl font-bold leading-tight">
            {letter.title ||
              "For one of my favourite people"}
          </h2>

          <div className="mt-8 rounded-2xl bg-[#fff7dc]/55 p-5">
            <Quote className="h-6 w-6 opacity-40" />

            <p className="mt-3 text-sm font-bold leading-7">
              The best friendships turn ordinary
              moments into stories worth retelling.
            </p>
          </div>
        </aside>

        <article className="relative rounded-[2rem] border border-[#315f78]/15 bg-[#fffdf6] p-7 text-[#203d4c] shadow-[0_28px_80px_rgba(42,74,91,0.14)] sm:p-11">
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-0 h-6 w-32 -translate-x-1/2 -translate-y-1/2 rotate-[-2deg] bg-[#f2cc77]/65"
          />

          <p className="text-sm font-black text-[#e47f59]">
            DEAR {letter.recipientName.toUpperCase()},
          </p>

          <div className="mt-7 whitespace-pre-wrap text-base leading-8 text-[#203d4c]/85 sm:text-lg sm:leading-9">
            {letter.content.body ||
              "This letter is waiting for its words."}
          </div>

          <footer className="mt-10 flex justify-end">
            <div className="rotate-[-2deg] rounded-2xl border-2 border-dashed border-[#315f78]/30 bg-[#e6f1f5] px-6 py-4 text-right">
              <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-50">
                From your friend
              </p>

              <p className="mt-1 font-display text-3xl font-bold">
                {letter.senderName}
              </p>
            </div>
          </footer>
        </article>
      </div>

      {attachments.length > 0 && (
        <section className="mt-8 rounded-[2rem] border border-[#315f78]/15 bg-[#fffdf6]/75 p-6 text-[#203d4c] shadow-xl sm:p-9">
          <div className="mb-7 flex items-center gap-3">
            <Star className="h-5 w-5 fill-[#ef9a72] text-[#ef9a72]" />

            <h2 className="text-xl font-black">
              Proof that we have great stories
            </h2>
          </div>

          <ReceiverMediaGallery
            attachments={attachments}
            variant="friend"
            getContentUrl={getContentUrl}
          />
        </section>
      )}
    </section>
  );
}

function FamilyLetter({
  letter,
  attachments,
  getContentUrl,
}: ThemeViewProps) {
  return (
    <section className="mx-auto w-full max-w-6xl">
      <article className="overflow-hidden rounded-[1.5rem] border border-[#81957a]/35 bg-[#fffaf0] text-[#304031] shadow-[0_35px_100px_rgba(52,67,48,0.16)]">
        <header className="border-b border-[#81957a]/20 bg-[#dde6d5] px-6 py-8 sm:px-12">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-full border border-[#60755d]/25 bg-[#fffaf0] text-[#60755d] shadow-sm">
                <House className="h-6 w-6" />
              </span>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#60755d]/65">
                  From our family story
                </p>

                <h1 className="mt-1 font-display text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
                  For {letter.recipientName}
                </h1>
              </div>
            </div>

            <span className="rounded-full border border-[#60755d]/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#60755d]/65">
              Made to be kept
            </span>
          </div>
        </header>

        <div className="grid lg:grid-cols-[0.36fr_0.64fr]">
          <aside className="border-b border-[#81957a]/20 bg-[#f3eedf] p-7 lg:border-b-0 lg:border-r lg:p-10">
            <Quote className="h-9 w-9 text-[#bd8e5c]/55" />

            <h2 className="mt-6 font-display text-3xl font-bold leading-tight">
              {letter.title ||
                "The words that feel like home"}
            </h2>

            <p className="mt-6 text-sm leading-7 text-[#304031]/55">
              Family memories live in stories,
              familiar voices, photographs, and the
              things we remember together.
            </p>

            <div className="mt-10 border-t border-[#81957a]/20 pt-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-45">
                Written with love by
              </p>

              <p className="mt-2 font-display text-3xl font-bold text-[#60755d]">
                {letter.senderName}
              </p>
            </div>
          </aside>

          <div className="p-7 sm:p-11 lg:p-14">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#bd8e5c]">
              Dear {letter.recipientName},
            </p>

            <div className="mt-7 whitespace-pre-wrap font-display text-lg leading-9 text-[#304031]/85 sm:text-xl sm:leading-10">
              {letter.content.body ||
                "This letter is waiting for its words."}
            </div>
          </div>
        </div>

        {attachments.length > 0 && (
          <section className="border-t border-[#81957a]/20 bg-[#eef1e8] px-6 py-9 sm:px-12">
            <div className="mb-7 flex items-center justify-between gap-4">
              <h2 className="font-display text-3xl font-bold">
                Our family album
              </h2>

              <House className="h-5 w-5 text-[#60755d]/45" />
            </div>

            <ReceiverMediaGallery
              attachments={attachments}
              variant="family"
              getContentUrl={getContentUrl}
            />
          </section>
        )}
      </article>
    </section>
  );
}

export function ReceiverLetterView(
  props: ReceiverLetterViewProps,
) {
  switch (props.letter.type) {
    case "LOVED":
      return (
        <LovedLetter
          {...props}
          variant="loved"
        />
      );

    case "FRIEND":
      return (
        <FriendLetter
          {...props}
          variant="friend"
        />
      );

    case "FAMILY":
      return (
        <FamilyLetter
          {...props}
          variant="family"
        />
      );
  }
}